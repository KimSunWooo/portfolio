package com.project.backend_api.purchase;

import org.springframework.jdbc.core.JdbcTemplate;

/**
 * Fixed mock purchases. The fx- rows are the hand-checked October 2026 fixture.
 * The demo- rows only give the chart a wider shape and are not the expected totals.
 */
public class MockPurchaseSeed {

    private final JdbcTemplate jdbc;

    public MockPurchaseSeed(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void seedIfEmpty() {
        Integer existing = jdbc.queryForObject(
                "SELECT COUNT(*) FROM mock_purchase_orders WHERE order_key = 'fx-2'",
                Integer.class);
        if (existing != null && existing > 0) {
            return;
        }
        order("fx-1", "2026-09-30 23:30:00", 25);
        line("fx-1", "fact-a", "Fact A", "팩트", 10000, 1, 0, "PAID");
        order("fx-2", "2026-10-01 00:00:00", 25);
        line("fx-2", "fact-a", "Fact A", "팩트", 10000, 2, 1000, "PAID");
        line("fx-2", "lip-b", "Lip B", "립", 8000, 1, 0, "PAID");
        order("fx-3", "2026-10-15 12:00:00", null);
        line("fx-3", "fact-a", "Fact A", "팩트", 15000, 1, 0, "PAID");
        order("fx-4", "2026-10-31 23:59:00", 52);
        line("fx-4", "skin-c", "Skin C", "스킨케어", 20000, 1, 0, "PAID");
        line("fx-4", "eye-d", "Eye D", "아이", 5000, 1, 0, "CANCELLED");
        order("fx-5", "2026-11-01 00:00:00", 25);
        line("fx-5", "lip-b", "Lip B", "립", 8000, 9, 0, "PAID");
        order("fx-6", "2026-10-20 10:00:00", 17);
        line("fx-6", "mystery", "Mystery", null, 3000, 1, 0, "PAID");
        order("fx-7", "2026-10-21 10:00:00", 33);
        line("fx-7", "lip-b", "Lip B", "립", 8000, 1, 0, "REFUNDED");

        order("demo-1", "2025-01-15 11:00:00", 22);
        line("demo-1", "fact-a", "Fact A", "팩트", 11000, 1, 0, "PAID");
        line("demo-1", "lip-b", "Lip B", "립", 9000, 2, 0, "PAID");
        order("demo-2", "2025-02-01 00:00:00", null);
        line("demo-2", "skin-c", "Skin C", "스킨케어", 18000, 1, 0, "PAID");
        order("demo-3", "2025-03-31 23:00:00", 61);
        line("demo-3", "eye-d", "Eye D", "아이", 7000, 1, 0, "PAID");
    }

    private void order(String key, String purchasedAt, Integer age) {
        jdbc.update(
                "INSERT INTO mock_purchase_orders (order_key, purchased_at, age_at_purchase) VALUES (?, ?, ?)",
                key, purchasedAt, age);
    }

    private void line(
            String orderKey,
            String productKey,
            String productName,
            String category,
            int unitPrice,
            int quantity,
            int discount,
            String status
    ) {
        jdbc.update("""
                INSERT INTO mock_purchase_lines
                    (order_key, product_key, product_name, category_name, unit_price, quantity, line_discount, line_status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, orderKey, productKey, productName, category, unitPrice, quantity, discount, status);
    }
}
