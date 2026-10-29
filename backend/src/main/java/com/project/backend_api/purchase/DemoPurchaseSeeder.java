package com.project.backend_api.purchase;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDateTime;
import java.time.ZoneId;

/**
 * Explicit DEMO purchase inserts. Not started by the application.
 * Order keys are fixed so re-runs skip existing rows.
 */
public class DemoPurchaseSeeder {

    public static final String SOURCE = "DEMO";
    public static final String KEY_PREFIX = "demo-purchase-";
    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");

    private final JdbcTemplate jdbc;
    private final TransactionTemplate transactions;

    public DemoPurchaseSeeder(JdbcTemplate jdbc, TransactionTemplate transactions) {
        this.jdbc = jdbc;
        this.transactions = transactions;
    }

    public SeedResult seed() {
        return transactions.execute(status -> {
            int ordersBefore = count("SELECT COUNT(*) FROM purchase_orders WHERE record_source = ?", SOURCE);
            int linesBefore = count("""
                    SELECT COUNT(*) FROM purchase_lines l
                    JOIN purchase_orders o ON o.order_key = l.order_key
                    WHERE o.record_source = ?
                    """, SOURCE);

            order(KEY_PREFIX + "20250930-1", "2025-09-30 23:30:00", 25, "20대");
            line(KEY_PREFIX + "20250930-1", 1, "Verify Shade", "LIP", 12000, 1, 0, "PAID");

            order(KEY_PREFIX + "20251001-1", "2025-10-01 00:00:00", 25, "20대");
            line(KEY_PREFIX + "20251001-1", 1, "Verify Shade", "LIP", 10000, 2, 1000, "PAID");
            line(KEY_PREFIX + "20251001-1", null, "Demo Lip B", "립", 8000, 1, 0, "PAID");

            order(KEY_PREFIX + "20251015-1", "2025-10-15 12:00:00", null, "미상");
            line(KEY_PREFIX + "20251015-1", 1, "Verify Shade", "LIP", 15000, 1, 0, "PAID");

            order(KEY_PREFIX + "20251020-1", "2025-10-20 10:00:00", 17, "10대 이하");
            line(KEY_PREFIX + "20251020-1", null, "Demo Mystery", null, 3000, 1, 0, "PAID");

            order(KEY_PREFIX + "20251021-1", "2025-10-21 10:00:00", 33, "30대");
            line(KEY_PREFIX + "20251021-1", null, "Demo Lip B", "립", 8000, 1, 0, "REFUNDED");

            order(KEY_PREFIX + "20251031-1", "2025-10-31 23:59:00", 52, "50대 이상");
            line(KEY_PREFIX + "20251031-1", null, "Demo Skin C", "스킨케어", 20000, 1, 0, "PAID");
            line(KEY_PREFIX + "20251031-1", null, "Demo Eye D", "아이", 5000, 1, 0, "CANCELLED");

            order(KEY_PREFIX + "20251101-1", "2025-11-01 00:00:00", 25, "20대");
            line(KEY_PREFIX + "20251101-1", null, "Demo Lip B", "립", 8000, 9, 0, "PAID");

            order(KEY_PREFIX + "20260115-1", "2026-01-15 11:00:00", 22, "20대");
            line(KEY_PREFIX + "20260115-1", 1, "Verify Shade", "LIP", 11000, 1, 0, "PAID");
            line(KEY_PREFIX + "20260115-1", null, "Demo Lip B", "립", 9000, 2, 0, "PAID");

            order(KEY_PREFIX + "20260201-1", "2026-02-01 00:00:00", null, "미상");
            line(KEY_PREFIX + "20260201-1", null, "Demo Skin C", "스킨케어", 18000, 1, 0, "PAID");

            order(KEY_PREFIX + "20260331-1", "2026-03-31 23:00:00", 61, "50대 이상");
            line(KEY_PREFIX + "20260331-1", null, "Demo Eye D", "아이", 7000, 1, 0, "PAID");

            order(KEY_PREFIX + "20261001-1", "2026-10-01 10:00:00", 28, "20대");
            line(KEY_PREFIX + "20261001-1", 1, "Verify Shade", "LIP", 12000, 3, 0, "PAID");

            order(KEY_PREFIX + "20261015-1", "2026-10-15 15:00:00", 41, "40대");
            line(KEY_PREFIX + "20261015-1", null, "Demo Fact A", "팩트", 14000, 2, 0, "PAID");
            line(KEY_PREFIX + "20261015-1", null, "Demo Lip B", "립", 8500, 1, 0, "PAID");

            int ordersAfter = count("SELECT COUNT(*) FROM purchase_orders WHERE record_source = ?", SOURCE);
            int linesAfter = count("""
                    SELECT COUNT(*) FROM purchase_lines l
                    JOIN purchase_orders o ON o.order_key = l.order_key
                    WHERE o.record_source = ?
                    """, SOURCE);
            return new SeedResult(ordersBefore, ordersAfter, linesBefore, linesAfter);
        });
    }

    public int clearDemo() {
        return transactions.execute(status -> {
            int deletedLines = jdbc.update("""
                    DELETE l FROM purchase_lines l
                    JOIN purchase_orders o ON o.order_key = l.order_key
                    WHERE o.record_source = ? OR o.order_key LIKE ?
                    """, SOURCE, KEY_PREFIX + "%");
            int deletedOrders = jdbc.update(
                    "DELETE FROM purchase_orders WHERE record_source = ? OR order_key LIKE ?",
                    SOURCE, KEY_PREFIX + "%");
            return deletedOrders + deletedLines;
        });
    }

    private void order(String key, String purchasedAt, Integer age, String band) {
        Integer existing = jdbc.queryForObject(
                "SELECT COUNT(*) FROM purchase_orders WHERE order_key = ?", Integer.class, key);
        if (existing != null && existing > 0) {
            return;
        }
        jdbc.update("""
                INSERT INTO purchase_orders
                    (order_key, purchased_at, age_at_purchase, age_band, record_source, created_at)
                VALUES (?, ?, ?, ?, ?, ?)
                """, key, purchasedAt, age, band, SOURCE, LocalDateTime.now(SEOUL));
    }

    private void line(
            String orderKey,
            Integer productId,
            String productName,
            String category,
            int unitPrice,
            int quantity,
            int discount,
            String status
    ) {
        Integer existing = jdbc.queryForObject("""
                SELECT COUNT(*) FROM purchase_lines
                WHERE order_key = ? AND product_name = ? AND line_status = ? AND quantity = ?
                """, Integer.class, orderKey, productName, status, quantity);
        if (existing != null && existing > 0) {
            return;
        }
        int amount = unitPrice * quantity - discount;
        jdbc.update("""
                INSERT INTO purchase_lines
                    (order_key, product_id, product_name, category_name, unit_price, quantity, line_discount, line_amount, line_status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, orderKey, productId, productName, category, unitPrice, quantity, discount, amount, status);
    }

    private int count(String sql, Object... args) {
        Integer value = jdbc.queryForObject(sql, Integer.class, args);
        return value == null ? 0 : value;
    }

    public record SeedResult(int ordersBefore, int ordersAfter, int linesBefore, int linesAfter) {
    }
}
