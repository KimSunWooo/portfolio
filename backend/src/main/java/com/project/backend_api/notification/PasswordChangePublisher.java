package com.project.backend_api.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageBuilder;
import org.springframework.amqp.core.MessageDeliveryMode;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.amqp.rabbit.connection.CorrelationData;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

/**
 * Moves committed outbox rows to RabbitMQ. Publisher confirm marks the row
 * PUBLISHED. That status is not mail delivery.
 */
public class PasswordChangePublisher {

    private static final Logger log = LoggerFactory.getLogger(PasswordChangePublisher.class);
    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");

    private final JdbcTemplate jdbc;
    private final RabbitTemplate rabbitTemplate;
    private final RabbitNotificationConfig.Topology topology;
    private final String exchange;
    private final String routingKey;

    public PasswordChangePublisher(
            JdbcTemplate jdbc,
            RabbitTemplate rabbitTemplate,
            RabbitNotificationConfig.Topology topology,
            String exchange,
            String routingKey
    ) {
        this.jdbc = jdbc;
        this.rabbitTemplate = rabbitTemplate;
        this.topology = topology;
        this.exchange = exchange;
        this.routingKey = routingKey;
    }

    @Scheduled(fixedDelayString = "${app.notification.password-changed.poll-delay:1000}")
    public void publishPending() {
        if (!topology.ensureDeclared()) {
            return;
        }
        List<OutboxRow> rows = jdbc.query("""
                SELECT id, event_id, recipient_email, changed_at
                FROM password_change_outbox
                WHERE status = 'PENDING'
                ORDER BY id
                LIMIT 20
                """, (rs, row) -> new OutboxRow(
                rs.getLong("id"),
                rs.getString("event_id"),
                rs.getString("recipient_email"),
                rs.getTimestamp("changed_at").toLocalDateTime()));
        for (OutboxRow row : rows) {
            publishOne(row);
        }
    }

    private void publishOne(OutboxRow row) {
        String body = """
                {"eventId":"%s","eventType":"PasswordChanged","schemaVersion":1,"changedAt":"%s","recipientEmail":"%s"}
                """.formatted(row.eventId(), row.changedAt(), jsonEscape(row.recipientEmail())).replace("\n", "");
        Message message = MessageBuilder.withBody(body.getBytes(StandardCharsets.UTF_8))
                .setContentType(MessageProperties.CONTENT_TYPE_JSON)
                .setDeliveryMode(MessageDeliveryMode.PERSISTENT)
                .setHeader("x-delivery-attempt", 1)
                .build();
        CorrelationData correlation = new CorrelationData(row.eventId());
        try {
            rabbitTemplate.send(exchange, routingKey, message, correlation);
            CorrelationData.Confirm confirm = correlation.getFuture().get(2, TimeUnit.SECONDS);
            boolean returned = correlation.getReturned() != null;
            if (confirm != null && confirm.ack() && !returned) {
                jdbc.update("""
                        UPDATE password_change_outbox
                        SET status = 'PUBLISHED', published_at = ?
                        WHERE id = ? AND status = 'PENDING'
                        """, LocalDateTime.now(SEOUL), row.id());
                return;
            }
            markUnroutable(row.id());
        } catch (TimeoutException | ExecutionException | InterruptedException | RuntimeException exception) {
            if (exception instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            log.warn("password change event was not confirmed. eventId={}", row.eventId());
        }
    }

    private void markUnroutable(long id) {
        jdbc.update("""
                UPDATE password_change_outbox
                SET status = 'PUBLISH_FAILED', publish_attempts = publish_attempts + 1
                WHERE id = ? AND status = 'PENDING'
                """, id);
        log.warn("password change event was not routed. outboxId={}", id);
    }

    private static String jsonEscape(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private record OutboxRow(long id, String eventId, String recipientEmail, LocalDateTime changedAt) {
    }
}
