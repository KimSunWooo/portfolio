package com.project.backend_api.analytics;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.core.KafkaTemplate;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * Publishes a successful backend product-detail read. There is no outbox.
 * A broker outage, a full buffer, or a process exit before the broker stores
 * the record drops the event. Producer retries are not a durability guarantee.
 */
public class ProductDetailReadPublisher {

    private static final Logger log = LoggerFactory.getLogger(ProductDetailReadPublisher.class);
    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final String topic;

    public ProductDetailReadPublisher(KafkaTemplate<String, String> kafkaTemplate, String topic) {
        this.kafkaTemplate = kafkaTemplate;
        this.topic = topic;
    }

    public void publish(int productId) {
        String eventId = UUID.randomUUID().toString();
        String body = """
                {"eventId":"%s","schemaVersion":1,"eventType":"ProductDetailRead","productId":%d,"occurredAt":"%s"}
                """.formatted(eventId, productId, LocalDateTime.now(SEOUL)).replace("\n", "");
        try {
            kafkaTemplate.send(topic, Integer.toString(productId), body).get(1, TimeUnit.SECONDS);
        } catch (Exception exception) {
            if (exception instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            log.warn("product detail read event was not stored. productId={}", productId);
        }
    }
}
