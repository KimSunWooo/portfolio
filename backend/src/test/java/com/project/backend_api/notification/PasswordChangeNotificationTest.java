package com.project.backend_api.notification;

import com.project.backend_api.domain.user.User;
import com.project.backend_api.domain.user.UserRole;
import com.project.backend_api.repository.UserRepository;
import com.project.backend_api.security.SessionRevokeFault;
import com.project.backend_api.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.DirectExchange;
import org.springframework.amqp.core.MessageBuilder;
import org.springframework.amqp.core.MessageDeliveryMode;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.rabbit.core.RabbitAdmin;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.MailSendException;
import org.springframework.mail.MailSender;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.mysql.MySQLContainer;
import org.testcontainers.rabbitmq.RabbitMQContainer;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.fail;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("test")
@Import(PasswordChangeNotificationTest.IsolatedMail.class)
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
        "app.notification.password-changed.enabled=true",
        "app.notification.password-changed.poll-delay=200",
        "app.analytics.product-detail-read.enabled=false",
        "app.purchase-analytics.source=NONE"
})
class PasswordChangeNotificationTest {

    static final MySQLContainer MYSQL = new MySQLContainer("mysql:8.4");
    static final GenericContainer<?> REDIS = new GenericContainer<>("redis:7-alpine").withExposedPorts(6379);
    static final RabbitMQContainer RABBIT = new RabbitMQContainer("rabbitmq:4.1-management");

    static {
        MYSQL.start();
        REDIS.start();
        RABBIT.start();
    }

    @DynamicPropertySource
    static void properties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> MYSQL.getJdbcUrl() + "?serverTimezone=Asia/Seoul");
        registry.add("spring.datasource.username", MYSQL::getUsername);
        registry.add("spring.datasource.password", MYSQL::getPassword);
        registry.add("spring.data.redis.host", REDIS::getHost);
        registry.add("spring.data.redis.port", () -> REDIS.getMappedPort(6379));
        registry.add("app.rabbitmq.host", RABBIT::getHost);
        registry.add("app.rabbitmq.port", RABBIT::getAmqpPort);
        registry.add("app.rabbitmq.username", RABBIT::getAdminUsername);
        registry.add("app.rabbitmq.password", RABBIT::getAdminPassword);
    }

    @Autowired
    private UserService userService;
    @Autowired
    private UserRepository users;
    @Autowired
    private PasswordEncoder passwordEncoder;
    @Autowired
    private StringRedisTemplate redis;
    @Autowired
    private JdbcTemplate jdbc;
    @Autowired
    private PasswordChangeOutbox outbox;
    @Autowired
    private PasswordChangeMailConsumer consumer;
    @Autowired
    private RabbitTemplate rabbitTemplate;
    @Autowired
    private MutableRevokeFault revokeFault;

    @Test
    void rolledBackPasswordChangeLeavesNoOutboxOrMail() {
        String email = "rollback@example.test";
        User user = saveUser(email);
        String previous = user.getPassword();
        outbox.failNextRecord();
        code(email);
        assertThrows(Exception.class, () -> userService.resetPassword(email, "654321", "not-stored"));
        assertEquals(previous, users.findByEmail(email).orElseThrow().getPassword());
        assertEquals(0, users.findByEmail(email).orElseThrow().getSessionEpoch());
        assertEquals(0, count("SELECT COUNT(*) FROM password_change_outbox WHERE recipient_email = ?", email));
        assertEquals(0, mails(email));
    }

    @Test
    void committedChangeIsPublishedAndMailedSeparately() throws Exception {
        String email = "committed@example.test";
        saveUser(email);
        code(email);
        assertEquals(UserService.PasswordResetStatus.COMPLETE, userService.resetPassword(email, "654321", "changed-secret"));
        waitUntil(() -> "PUBLISHED".equals(status(email)) && "SENT".equals(delivery(email)) && mails(email) == 1);
        String text = IsolatedMail.SENDER.textFor(email);
        assertTrue(text.contains("비밀번호가 변경되었습니다"));
        assertTrue(!text.contains("changed-secret"));
        assertEquals(1, users.findByEmail(email).orElseThrow().getSessionEpoch());

        String eventId = jdbc.queryForObject(
                "SELECT event_id FROM password_change_outbox WHERE recipient_email = ?",
                String.class,
                email);
        rabbitTemplate.send(
                "portfolio.password-changed",
                "password-changed",
                MessageBuilder.withBody(payload(eventId, email).getBytes(StandardCharsets.UTF_8))
                        .setContentType(MessageProperties.CONTENT_TYPE_JSON)
                        .setDeliveryMode(MessageDeliveryMode.PERSISTENT)
                        .setHeader("x-delivery-attempt", 1)
                        .build());
        long started = System.nanoTime();
        while (System.nanoTime() - started < Duration.ofSeconds(2).toNanos()) {
            assertEquals(1, mails(email));
            Thread.sleep(200);
        }
        assertEquals(1, count("SELECT COUNT(*) FROM password_change_mail_delivery WHERE event_id = ?", eventId));
    }

    @Test
    void redisCleanupFailureStillNotifies() throws Exception {
        String email = "cleanup@example.test";
        saveUser(email);
        code(email);
        revokeFault.fail = true;
        try {
            assertEquals(
                    UserService.PasswordResetStatus.CLEANUP_INCOMPLETE,
                    userService.resetPassword(email, "654321", "changed-secret"));
        } finally {
            revokeFault.fail = false;
        }
        assertNotEquals("stored-password", users.findByEmail(email).orElseThrow().getPassword());
        waitUntil(() -> "SENT".equals(delivery(email)));
    }

    @Test
    void brokerOutageKeepsTheCommittedOutboxUntilRabbitReturns() throws Exception {
        String email = "outage@example.test";
        saveUser(email);
        RABBIT.execInContainer("rabbitmqctl", "stop_app");
        try {
            code(email);
            assertEquals(UserService.PasswordResetStatus.COMPLETE, userService.resetPassword(email, "654321", "changed-secret"));
            Thread.sleep(1500);
            assertEquals("PENDING", status(email));
            assertEquals(0, mails(email));
            assertEquals(1, users.findByEmail(email).orElseThrow().getSessionEpoch());
        } finally {
            RABBIT.execInContainer("rabbitmqctl", "start_app");
        }
        waitUntil(() -> "PUBLISHED".equals(status(email)) && "SENT".equals(delivery(email)));
    }

    @Test
    void unroutablePublishIsNotMarkedAsDelivered() throws Exception {
        String email = "unrouted@example.test";
        saveUser(email);
        RabbitAdmin admin = new RabbitAdmin(rabbitTemplate);
        DirectExchange exchange = new DirectExchange("portfolio.password-changed");
        Queue queue = new Queue("portfolio.password-changed", true);
        var binding = BindingBuilder.bind(queue).to(exchange).with("password-changed");
        admin.removeBinding(binding);
        try {
            code(email);
            userService.resetPassword(email, "654321", "changed-secret");
            waitUntil(() -> "PUBLISH_FAILED".equals(status(email)));
            assertEquals(0, mails(email));
            assertNull(delivery(email));
        } finally {
            admin.declareBinding(binding);
        }
    }

    @Test
    void mailFailureReachesTheDeadLetterQueue() throws Exception {
        String email = "failed-mail@example.test";
        saveUser(email);
        IsolatedMail.SENDER.fail = true;
        try {
            code(email);
            userService.resetPassword(email, "654321", "changed-secret");
            waitUntil(() -> "FAILED".equals(delivery(email)));
            waitUntil(() -> queueDepth("portfolio.password-changed.dlq") >= 1);
            assertEquals(0, mails(email));
        } finally {
            IsolatedMail.SENDER.fail = false;
        }
    }

    @Test
    void acceptedMailWithoutADeliveryRowCanBeSentAgain() throws Exception {
        String email = "crash-window@example.test";
        saveUser(email);
        code(email);
        consumer.crashAfterNextAccept();
        userService.resetPassword(email, "654321", "changed-secret");
        waitUntil(() -> mails(email) >= 2 && "SENT".equals(delivery(email)));
    }

    private User saveUser(String email) {
        return users.save(User.builder()
                .email(email)
                .password(passwordEncoder.encode("stored-password"))
                .name("알림검증")
                .role(UserRole.ROLE_USER)
                .build());
    }

    private void code(String email) {
        redis.opsForValue().set("AUTH_CODE:" + email, "654321", Duration.ofMinutes(3));
    }

    private String status(String email) {
        return jdbc.query(
                "SELECT status FROM password_change_outbox WHERE recipient_email = ?",
                rs -> rs.next() ? rs.getString(1) : null,
                email);
    }

    private String delivery(String email) {
        return jdbc.query("""
                SELECT d.status
                FROM password_change_mail_delivery d
                JOIN password_change_outbox o ON o.event_id = d.event_id
                WHERE o.recipient_email = ?
                """, rs -> rs.next() ? rs.getString(1) : null, email);
    }

    private int count(String sql, Object... args) {
        Integer value = jdbc.queryForObject(sql, Integer.class, args);
        return value == null ? 0 : value;
    }

    private int queueDepth(String name) {
        Integer depth = rabbitTemplate.execute(channel -> channel.queueDeclarePassive(name).getMessageCount());
        return depth == null ? 0 : depth;
    }

    private static int mails(String email) {
        return IsolatedMail.SENDER.count(email);
    }

    private static String payload(String eventId, String email) {
        return """
                {"eventId":"%s","eventType":"PasswordChanged","schemaVersion":1,"changedAt":"2026-10-29T12:00:00","recipientEmail":"%s"}
                """.formatted(eventId, email).trim();
    }

    private static void waitUntil(Check check) throws Exception {
        long started = System.nanoTime();
        while (System.nanoTime() - started < Duration.ofSeconds(25).toNanos()) {
            if (check.ready()) {
                return;
            }
            Thread.sleep(200);
        }
        fail("condition was not met");
    }

    @FunctionalInterface
    private interface Check {
        boolean ready() throws Exception;
    }

    static final class MutableRevokeFault implements SessionRevokeFault {
        volatile boolean fail;

        @Override
        public void beforeRevoke() {
            if (fail) {
                throw new IllegalStateException("redis cleanup failed");
            }
        }
    }

    static final class RecordingMailSender implements MailSender {
        private final List<SimpleMailMessage> sent = new CopyOnWriteArrayList<>();
        volatile boolean fail;

        @Override
        public void send(SimpleMailMessage simpleMessage) {
            if (fail) {
                throw new MailSendException("isolated mailbox rejected the notice");
            }
            sent.add(simpleMessage);
        }

        @Override
        public void send(SimpleMailMessage... simpleMessages) {
            for (SimpleMailMessage message : simpleMessages) {
                send(message);
            }
        }

        int count(String email) {
            int count = 0;
            for (SimpleMailMessage message : sent) {
                String[] recipients = message.getTo();
                if (recipients != null) {
                    for (String recipient : recipients) {
                        if (email.equals(recipient)) {
                            count++;
                        }
                    }
                }
            }
            return count;
        }

        String textFor(String email) {
            for (SimpleMailMessage message : sent) {
                String[] recipients = message.getTo();
                if (recipients != null) {
                    for (String recipient : recipients) {
                        if (email.equals(recipient)) {
                            return message.getText() == null ? "" : message.getText();
                        }
                    }
                }
            }
            return "";
        }
    }

    @TestConfiguration
    static class IsolatedMail {
        static final RecordingMailSender SENDER = new RecordingMailSender();

        @Bean
        @Primary
        MailSender mailSender() {
            return SENDER;
        }

        @Bean
        MutableRevokeFault mutableRevokeFault() {
            return new MutableRevokeFault();
        }
    }
}
