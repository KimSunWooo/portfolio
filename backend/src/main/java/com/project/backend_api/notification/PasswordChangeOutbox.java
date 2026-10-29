package com.project.backend_api.notification;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Writes the notification intent in the caller's transaction.
 * A failure here rolls back the password change. That is separate from a Redis
 * cleanup failure, which happens only after this transaction commits.
 */
public class PasswordChangeOutbox {

    static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");

    private final JdbcTemplate jdbc;
    private final AtomicBoolean failNextRecord = new AtomicBoolean();

    public PasswordChangeOutbox(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void failNextRecord() {
        failNextRecord.set(true);
    }

    public void record(String recipientEmail) {
        if (failNextRecord.compareAndSet(true, false)) {
            throw new DataIntegrityViolationException("password change outbox record failed");
        }
        jdbc.update("""
                INSERT INTO password_change_outbox
                    (event_id, event_type, schema_version, recipient_email, changed_at, status, publish_attempts, created_at)
                VALUES (?, 'PasswordChanged', 1, ?, ?, 'PENDING', 0, ?)
                """,
                UUID.randomUUID().toString(),
                recipientEmail,
                LocalDateTime.now(SEOUL),
                LocalDateTime.now(SEOUL));
    }
}
