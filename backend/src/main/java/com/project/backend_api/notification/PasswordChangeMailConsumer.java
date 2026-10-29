package com.project.backend_api.notification;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessageBuilder;
import org.springframework.amqp.core.MessageDeliveryMode;
import org.springframework.amqp.core.MessageProperties;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.MailSender;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Acks only after the delivery row is stored. Mail acceptance followed by a
 * crash before that insert can send the same notice again. The delivery row
 * suppresses a later copy when the insert succeeded.
 */
public class PasswordChangeMailConsumer {

    static final int MAX_ATTEMPTS = 3;
    private static final Logger log = LoggerFactory.getLogger(PasswordChangeMailConsumer.class);
    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");

    private final JdbcTemplate jdbc;
    private final MailSender mailSender;
    private final RabbitTemplate rabbitTemplate;
    private final ObjectMapper objectMapper;
    private final String exchange;
    private final String routingKey;
    private final AtomicBoolean crashAfterMailAccept = new AtomicBoolean();

    public PasswordChangeMailConsumer(
            JdbcTemplate jdbc,
            MailSender mailSender,
            RabbitTemplate rabbitTemplate,
            ObjectMapper objectMapper,
            String exchange,
            String routingKey
    ) {
        this.jdbc = jdbc;
        this.mailSender = mailSender;
        this.rabbitTemplate = rabbitTemplate;
        this.objectMapper = objectMapper;
        this.exchange = exchange;
        this.routingKey = routingKey;
    }

    public void crashAfterNextAccept() {
        crashAfterMailAccept.set(true);
    }

    public void handle(Message message) throws Exception {
        int attempt = attempt(message);
        JsonNode body;
        try {
            body = objectMapper.readTree(message.getBody());
        } catch (Exception exception) {
            throw new PermanentDeliveryException("unreadable");
        }
        String eventId = text(body, "eventId");
        String eventType = text(body, "eventType");
        int schemaVersion = body.path("schemaVersion").asInt(0);
        String recipient = text(body, "recipientEmail");
        String changedAt = text(body, "changedAt");
        if (eventId == null || !"PasswordChanged".equals(eventType) || schemaVersion != 1 || recipient == null) {
            throw new PermanentDeliveryException("rejected");
        }
        String status = jdbc.query("""
                SELECT status FROM password_change_mail_delivery WHERE event_id = ?
                """, rs -> rs.next() ? rs.getString(1) : null, eventId);
        if ("SENT".equals(status)) {
            return;
        }
        try {
            SimpleMailMessage mail = new SimpleMailMessage();
            mail.setTo(recipient);
            mail.setSubject("비밀번호가 변경되었습니다");
            mail.setText("비밀번호가 변경되었습니다. 직접 변경하지 않았다면 비밀번호 재설정을 다시 진행해 주세요.\n변경 시각: " + changedAt);
            mailSender.send(mail);
            if (crashAfterMailAccept.compareAndSet(true, false)) {
                throw new MailSendException("accepted then interrupted before the delivery row");
            }
            jdbc.update("""
                    INSERT INTO password_change_mail_delivery (event_id, status, attempt_count, processed_at)
                    VALUES (?, 'SENT', ?, ?)
                    """, eventId, attempt, LocalDateTime.now(SEOUL));
        } catch (Exception exception) {
            if (attempt >= MAX_ATTEMPTS) {
                jdbc.update("""
                        INSERT INTO password_change_mail_delivery (event_id, status, attempt_count, processed_at)
                        VALUES (?, 'FAILED', ?, ?)
                        ON DUPLICATE KEY UPDATE status = 'FAILED', attempt_count = VALUES(attempt_count), processed_at = VALUES(processed_at)
                        """, eventId, attempt, LocalDateTime.now(SEOUL));
                throw new PermanentDeliveryException("failed");
            }
            Message retry = MessageBuilder.withBody(message.getBody())
                    .setContentType(MessageProperties.CONTENT_TYPE_JSON)
                    .setDeliveryMode(MessageDeliveryMode.PERSISTENT)
                    .setHeader("x-delivery-attempt", attempt + 1)
                    .build();
            rabbitTemplate.send(exchange, routingKey, retry);
            log.warn("password change mail will be retried. eventId={} attempt={}", eventId, attempt);
        }
    }

    private static int attempt(Message message) {
        Object value = message.getMessageProperties().getHeaders().get("x-delivery-attempt");
        if (value instanceof Number number) {
            return number.intValue();
        }
        if (value != null) {
            try {
                return Integer.parseInt(value.toString());
            } catch (NumberFormatException ignored) {
                return MAX_ATTEMPTS;
            }
        }
        return 1;
    }

    private static String text(JsonNode body, String field) {
        JsonNode node = body.get(field);
        if (node == null || node.isNull()) {
            return null;
        }
        String value = node.asText();
        return value.isBlank() ? null : value;
    }

    static final class PermanentDeliveryException extends Exception {
        PermanentDeliveryException(String message) {
            super(message);
        }
    }
}
