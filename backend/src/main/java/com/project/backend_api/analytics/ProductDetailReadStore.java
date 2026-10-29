package com.project.backend_api.analytics;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDateTime;
import java.time.ZoneId;

/**
 * The event row and the count change commit together. A duplicate event id
 * inserts nothing and does not change the count. The history is global, not
 * per consumer group: a new group can read the same Kafka records, but those
 * event ids do not increment the count again. Clearing the history would be
 * required before a replay could rebuild the count.
 */
public class ProductDetailReadStore {

    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");

    private final JdbcTemplate jdbc;
    private final TransactionTemplate transactions;
    private final ObjectMapper objectMapper;

    public ProductDetailReadStore(JdbcTemplate jdbc, PlatformTransactionManager transactions, ObjectMapper objectMapper) {
        this.jdbc = jdbc;
        this.transactions = new TransactionTemplate(transactions);
        this.objectMapper = objectMapper;
    }

    public void apply(String payload) throws Exception {
        JsonNode body = objectMapper.readTree(payload);
        if (!"ProductDetailRead".equals(body.path("eventType").asText()) || body.path("schemaVersion").asInt() != 1) {
            return;
        }
        String eventId = body.path("eventId").asText(null);
        int productId = body.path("productId").asInt(-1);
        if (eventId == null || eventId.isBlank() || productId < 0) {
            return;
        }
        transactions.executeWithoutResult(status -> {
            int inserted = jdbc.update("""
                    INSERT IGNORE INTO product_detail_read_events (event_id, product_id, occurred_at, processed_at)
                    VALUES (?, ?, ?, ?)
                    """, eventId, productId, LocalDateTime.now(SEOUL), LocalDateTime.now(SEOUL));
            if (inserted == 0) {
                return;
            }
            jdbc.update("""
                    INSERT INTO product_detail_read_counts (product_id, success_count)
                    VALUES (?, 1)
                    ON DUPLICATE KEY UPDATE success_count = success_count + 1
                    """, productId);
        });
    }

    public long count(int productId) {
        Long value = jdbc.query("""
                SELECT success_count FROM product_detail_read_counts WHERE product_id = ?
                """, rs -> rs.next() ? rs.getLong(1) : 0L, productId);
        return value == null ? 0L : value;
    }
}
