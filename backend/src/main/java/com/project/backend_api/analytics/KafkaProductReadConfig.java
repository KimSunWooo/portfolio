package com.project.backend_api.analytics;

import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.apache.kafka.common.serialization.StringSerializer;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.backend_api.messaging.MessagingJsonConfig;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaProducerFactory;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.listener.ConcurrentMessageListenerContainer;
import org.springframework.kafka.listener.ContainerProperties;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.util.backoff.FixedBackOff;

import java.util.HashMap;
import java.util.Map;

@Configuration
@ConditionalOnProperty(name = "app.analytics.product-detail-read.enabled", havingValue = "true")
public class KafkaProductReadConfig {

    @Bean
    KafkaTemplate<String, String> productDetailReadTemplate(
            @Value("${app.kafka.bootstrap-servers}") String bootstrapServers
    ) {
        Map<String, Object> props = new HashMap<>();
        props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class);
        props.put(ProducerConfig.ACKS_CONFIG, "1");
        props.put(ProducerConfig.RETRIES_CONFIG, 1);
        props.put(ProducerConfig.MAX_BLOCK_MS_CONFIG, 200);
        props.put(ProducerConfig.REQUEST_TIMEOUT_MS_CONFIG, 500);
        props.put(ProducerConfig.DELIVERY_TIMEOUT_MS_CONFIG, 1_000);
        props.put(ProducerConfig.LINGER_MS_CONFIG, 0);
        return new KafkaTemplate<>(new DefaultKafkaProducerFactory<>(props));
    }

    @Bean
    ProductDetailReadPublisher productDetailReadPublisher(
            KafkaTemplate<String, String> productDetailReadTemplate,
            @Value("${app.analytics.product-detail-read.topic}") String topic
    ) {
        return new ProductDetailReadPublisher(productDetailReadTemplate, topic);
    }

    @Bean
    ProductDetailReadStore productDetailReadStore(
            JdbcTemplate jdbc,
            PlatformTransactionManager transactions,
            @Qualifier(MessagingJsonConfig.MESSAGING_OBJECT_MAPPER) ObjectMapper messagingObjectMapper
    ) {
        return new ProductDetailReadStore(jdbc, transactions, messagingObjectMapper);
    }

    @Bean
    ProductDetailReadListener productDetailReadListener(ProductDetailReadStore productDetailReadStore) {
        return new ProductDetailReadListener(productDetailReadStore);
    }

    @Bean
    ConcurrentMessageListenerContainer<String, String> productDetailReadContainer(
            @Value("${app.kafka.bootstrap-servers}") String bootstrapServers,
            @Value("${app.analytics.product-detail-read.topic}") String topic,
            @Value("${app.analytics.product-detail-read.group}") String group,
            ProductDetailReadListener productDetailReadListener
    ) {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapServers);
        props.put(ConsumerConfig.GROUP_ID_CONFIG, group);
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG, false);
        props.put(ConsumerConfig.AUTO_OFFSET_RESET_CONFIG, "earliest");
        props.put(ConsumerConfig.MAX_POLL_INTERVAL_MS_CONFIG, 30_000);
        ConsumerFactory<String, String> factory = new DefaultKafkaConsumerFactory<>(props);
        ContainerProperties containerProperties = new ContainerProperties(topic);
        containerProperties.setAckMode(ContainerProperties.AckMode.MANUAL_IMMEDIATE);
        containerProperties.setMessageListener((org.springframework.kafka.listener.AcknowledgingMessageListener<String, String>) (record, acknowledgment) -> {
            try {
                productDetailReadListener.onRecord(record, acknowledgment);
            } catch (Exception exception) {
                throw new IllegalStateException(exception);
            }
        });
        ConcurrentMessageListenerContainer<String, String> container =
                new ConcurrentMessageListenerContainer<>(factory, containerProperties);
        container.setConcurrency(1);
        container.setCommonErrorHandler(new DefaultErrorHandler(new FixedBackOff(500, 3)));
        return container;
    }
}
