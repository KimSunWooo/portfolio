package com.project.backend_api.analytics;

import com.project.backend_api.domain.product.Product;
import com.project.backend_api.dto.product.ProductRequest;
import com.project.backend_api.repository.ProductRepository;
import com.project.backend_api.service.ProductService;
import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.consumer.ConsumerRecords;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.listener.ConcurrentMessageListenerContainer;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestPropertySource;
import org.springframework.web.server.ResponseStatusException;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.kafka.KafkaContainer;
import org.testcontainers.mysql.MySQLContainer;
import org.testcontainers.utility.DockerImageName;

import java.time.Duration;
import java.util.List;
import java.util.Properties;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.fail;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("test")
@TestPropertySource(properties = {
        "server.port=0",
        "jwt.secret=test-secret-test-secret-test-secret-test",
        "toss.secret-key=test",
        "cloud.aws.credentials.access-key=test",
        "cloud.aws.credentials.secret-key=test",
        "cloud.aws.s3.bucket=test",
        "cloud.aws.region.static=ap-northeast-2",
        "spring.mail.host=127.0.0.1",
        "spring.mail.port=2525",
        "spring.mail.username=test",
        "spring.mail.password=test",
        "spring.jpa.hibernate.ddl-auto=validate",
        "spring.flyway.enabled=true",
        "spring.flyway.locations=classpath:db/migration",
        "spring.flyway.baseline-on-migrate=true",
        "spring.flyway.baseline-version=0",
        "app.notification.password-changed.enabled=false",
        "app.analytics.product-detail-read.enabled=true",
        "app.purchase-analytics.source=NONE"
})
class ProductDetailReadKafkaTest {

    static final MySQLContainer MYSQL = new MySQLContainer("mysql:8.4");
    static final GenericContainer<?> REDIS = new GenericContainer<>("redis:7-alpine").withExposedPorts(6379);
    static final KafkaContainer KAFKA = new KafkaContainer(DockerImageName.parse("apache/kafka:4.1.0"));

    static {
        MYSQL.start();
        REDIS.start();
        KAFKA.start();
    }

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> MYSQL.getJdbcUrl() + "?serverTimezone=Asia/Seoul");
        registry.add("spring.datasource.username", MYSQL::getUsername);
        registry.add("spring.datasource.password", MYSQL::getPassword);
        registry.add("spring.data.redis.host", REDIS::getHost);
        registry.add("spring.data.redis.port", () -> REDIS.getMappedPort(6379));
        registry.add("app.kafka.bootstrap-servers", KAFKA::getBootstrapServers);
    }

    @Autowired
    private ProductService productService;
    @Autowired
    private ProductRepository products;
    @Autowired
    private ProductDetailReadStore store;
    @Autowired
    private KafkaTemplate<String, String> kafkaTemplate;
    @Autowired
    private ConcurrentMessageListenerContainer<String, String> container;
    @Autowired
    private JdbcTemplate jdbc;

    @Test
    void successfulReadIsCountedAndFailuresAreNot() throws Exception {
        Product product = products.save(Product.create(new ProductRequest(
                "Read Shade", null, "detail", "립", 12000, null, null, false, false, 3, "SALE", null)));
        productService.getProduct(product.getId());
        waitUntil(() -> store.count(product.getId()) == 1);

        assertThrows(ResponseStatusException.class, () -> productService.getProduct(Integer.MAX_VALUE));
        Thread.sleep(500);
        assertEquals(0, store.count(Integer.MAX_VALUE));
        assertEquals(1, store.count(product.getId()));

        String payload = """
                {"eventId":"%s","schemaVersion":1,"eventType":"ProductDetailRead","productId":%d,"occurredAt":"2026-10-29T12:00:00"}
                """.formatted(UUID.randomUUID(), product.getId()).trim();
        store.apply(payload);
        store.apply(payload);
        assertEquals(2, store.count(product.getId()));
    }

    @Test
    void redeliveryAfterTheDatabaseCommitDoesNotDoubleCount() throws Exception {
        container.stop();
        String eventId = UUID.randomUUID().toString();
        int productId = 4242;
        String payload = """
                {"eventId":"%s","schemaVersion":1,"eventType":"ProductDetailRead","productId":%d,"occurredAt":"2026-10-29T12:00:00"}
                """.formatted(eventId, productId).trim();
        try {
            kafkaTemplate.send("portfolio.product-detail-read", Integer.toString(productId), payload).get();
            readWithoutCommitting(payload);
            readWithoutCommitting(payload);
        } finally {
            container.start();
        }
        assertEquals(1, store.count(productId));
        assertTrue(storedInKafka(eventId));
    }

    @Test
    void productReadSucceedsWhenTheBrokerIsPaused() throws Exception {
        Product product = products.save(Product.create(new ProductRequest(
                "Paused Shade", null, "detail", "립", 9000, null, null, false, false, 3, "SALE", null)));
        productService.getProduct(product.getId());
        waitUntil(() -> store.count(product.getId()) == 1);
        KAFKA.getDockerClient().pauseContainerCmd(KAFKA.getContainerId()).exec();
        try {
            assertEquals("Paused Shade", productService.getProduct(product.getId()).name());
            Thread.sleep(500);
            assertEquals(1, store.count(product.getId()));
        } finally {
            KAFKA.getDockerClient().unpauseContainerCmd(KAFKA.getContainerId()).exec();
        }
    }

    private void readWithoutCommitting(String expected) throws Exception {
        try (KafkaConsumer<String, String> consumer = consumer("portfolio-product-detail-read-gap")) {
            consumer.subscribe(List.of("portfolio.product-detail-read"));
            long started = System.nanoTime();
            while (System.nanoTime() - started < Duration.ofSeconds(15).toNanos()) {
                ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(300));
                for (ConsumerRecord<String, String> record : records) {
                    if (expected.equals(record.value())) {
                        store.apply(record.value());
                        return;
                    }
                }
            }
        }
        fail("stored event was not read again");
    }

    private boolean storedInKafka(String eventId) {
        try (KafkaConsumer<String, String> consumer = consumer("portfolio-product-detail-read-replay-" + eventId)) {
            consumer.subscribe(List.of("portfolio.product-detail-read"));
            long started = System.nanoTime();
            while (System.nanoTime() - started < Duration.ofSeconds(15).toNanos()) {
                ConsumerRecords<String, String> records = consumer.poll(Duration.ofMillis(300));
                for (ConsumerRecord<String, String> record : records) {
                    if (record.value() != null && record.value().contains(eventId)) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    private KafkaConsumer<String, String> consumer(String group) {
        Properties properties = new Properties();
        properties.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, KAFKA.getBootstrapServers());
        properties.put(ConsumerConfig.GROUP_ID_CONFIG, group);
        properties.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);
        properties.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        properties.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());
        properties.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class.getName());
        return new KafkaConsumer<>(properties);
    }

    private static void waitUntil(Check check) throws Exception {
        long started = System.nanoTime();
        while (System.nanoTime() - started < Duration.ofSeconds(20).toNanos()) {
            if (check.ready()) {
                return;
            }
            Thread.sleep(200);
        }
        fail("condition was not met");
    }

    @FunctionalInterface
    private interface Check {
        boolean ready();
    }
}
