package com.project.backend_api.service;

import org.springframework.dao.DuplicateKeyException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Repository
public class JdbcPaymentClaimStore implements PaymentClaimStore {

    private final JdbcTemplate jdbc;

    public JdbcPaymentClaimStore(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public Claim tryBegin(String paymentKey, String orderId, String userEmail) {
        LocalDateTime now = LocalDateTime.now();
        try {
            jdbc.update("""
                    INSERT INTO test_payment_claims
                    (payment_key, order_id, user_email, state, provider_status, updated_at)
                    VALUES (?, ?, ?, ?, NULL, ?)
                    """, paymentKey, orderId, userEmail, State.PROCESSING.name(), Timestamp.valueOf(now));
            return new Claim(paymentKey, orderId, userEmail, State.PROCESSING, null, now);
        } catch (DuplicateKeyException ignored) {
            return findForUpdate(paymentKey).orElseThrow(() ->
                    new IllegalStateException("payment claim missing after duplicate key: " + paymentKey));
        }
    }

    @Override
    public Optional<Claim> findForUpdate(String paymentKey) {
        List<Map<String, Object>> rows = jdbc.queryForList("""
                SELECT payment_key, order_id, user_email, state, provider_status, updated_at
                FROM test_payment_claims
                WHERE payment_key = ?
                FOR UPDATE
                """, paymentKey);
        if (rows.isEmpty()) {
            return Optional.empty();
        }
        return Optional.of(map(rows.getFirst()));
    }

    @Override
    public void update(String paymentKey, State state, String providerStatus) {
        int updated = jdbc.update("""
                UPDATE test_payment_claims
                SET state = ?, provider_status = ?, updated_at = ?
                WHERE payment_key = ?
                """, state.name(), providerStatus, Timestamp.valueOf(LocalDateTime.now()), paymentKey);
        if (updated != 1) {
            throw new IllegalStateException("payment claim update missed: " + paymentKey);
        }
    }

    private static Claim map(Map<String, Object> row) {
        Object updated = row.get("updated_at");
        LocalDateTime at = updated instanceof Timestamp timestamp
                ? timestamp.toLocalDateTime()
                : updated instanceof LocalDateTime local ? local : LocalDateTime.now();
        return new Claim(
                String.valueOf(row.get("payment_key")),
                String.valueOf(row.get("order_id")),
                String.valueOf(row.get("user_email")),
                State.valueOf(String.valueOf(row.get("state"))),
                row.get("provider_status") == null ? null : String.valueOf(row.get("provider_status")),
                at
        );
    }
}
