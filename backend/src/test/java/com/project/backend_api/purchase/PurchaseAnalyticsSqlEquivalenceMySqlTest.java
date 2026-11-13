package com.project.backend_api.purchase;

import com.project.backend_api.purchase.PurchaseAnalyticsService.Aggregate;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Random;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Randomised cross-check: SQL aggregation must return exactly (record equality, including list
 * order) what the previous load-everything-and-sum-in-Java implementation returned on the same
 * MySQL data. The legacy implementation is kept in test scope as {@link LegacyJavaPurchaseAnalytics};
 * its own arithmetic is pinned to hand counts by {@link PurchaseAnalyticsMathTest}, and the SQL side
 * is pinned independently by {@link PurchaseAnalyticsSqlMySqlTest}.
 * <p>
 * The data is deterministic (fixed seed) and deliberately nasty: boundary instants, case and
 * trailing-space product variants, NULL/blank categories, blank/mismatched stored age bands, NULL
 * ages, an unknown line status, DEMO and LIVE.
 */
class PurchaseAnalyticsSqlEquivalenceMySqlTest {

    static final int ORDERS = 4_000;
    static PurchaseAnalyticsTestDb db;
    static JdbcTemplate jdbc;
    static PurchaseAnalyticsService service;

    static final List<String> PRODUCTS = List.of(
            "Shade", "shade", "Shade ", "Lip Tint", "Lip tint", "Fact A", "Fact B", "Eye Pencil", "Eye pencil ",
            "Skin Toner", "Skin Serum", "Cream 50ml", "Cream 30ml", "Ünï Brow", "Uni Brow", "O'Neil's Gloss",
            "한글 상품", "한글 상품 ", "Blush", "Highlighter", "Primer", "Mascara", "Eyeliner", "Cleanser", "Mist",
            "Sunscreen", "Lip Balm", "Nail", "Brush", "Sponge");
    static final List<String> CATEGORIES = Arrays.asList(
            "LIP", "lip", "팩트", "아이", "스킨케어", "Skin", "기타", null, "", "   ", "립 ");

    @BeforeAll
    static void seed() {
        db = PurchaseAnalyticsTestDb.start();
        jdbc = db.jdbc;
        service = new PurchaseAnalyticsService(jdbc);

        Random random = new Random(20261113L);
        List<Object[]> orders = new ArrayList<>();
        List<Object[]> lines = new ArrayList<>();
        LocalDateTime base = LocalDateTime.of(2026, 8, 15, 0, 0, 0);
        for (int i = 0; i < ORDERS; i++) {
            String key = "eq-" + i;
            LocalDateTime at = base.plusSeconds(random.nextInt(153 * 24 * 3600));
            switch (random.nextInt(10)) {
                case 0 -> at = at.toLocalDate().atStartOfDay();
                case 1 -> at = at.toLocalDate().atTime(23, 59, 59);
                case 2 -> at = at.toLocalDate().atTime(23, 59, 59, 999_999_000);
                default -> {
                }
            }
            Integer age = random.nextInt(10) == 0 ? null : 8 + random.nextInt(63);
            String band;
            switch (random.nextInt(10)) {
                case 0 -> band = "";
                case 1 -> band = PurchaseAnalyticsService.AGE_BANDS.get(random.nextInt(6));
                case 2 -> band = "미상";
                default -> band = PurchaseAnalyticsService.ageBand(age);
            }
            String source = random.nextInt(10) < 6 ? "DEMO" : "LIVE";
            orders.add(new Object[]{key, at.toString().replace('T', ' '), age, band, source});

            int lineCount = 1 + random.nextInt(4);
            List<Integer> picked = new ArrayList<>();
            while (picked.size() < lineCount) {
                int p = random.nextInt(PRODUCTS.size());
                if (!picked.contains(p)) {
                    picked.add(p);
                }
            }
            for (int p : picked) {
                int price = 1000 * (1 + random.nextInt(30));
                int quantity = 1 + random.nextInt(5);
                int discount = random.nextInt(3) == 0 ? random.nextInt(price / 5 + 1) : 0;
                int roll = random.nextInt(100);
                String status = roll < 80 ? "PAID" : roll < 90 ? "CANCELLED" : roll < 98 ? "REFUNDED" : "PENDING";
                // Category is mostly a function of the product, with some noise (NULL, blank, other case).
                String category = random.nextInt(4) == 0
                        ? CATEGORIES.get(random.nextInt(CATEGORIES.size()))
                        : CATEGORIES.get(p % 5);
                lines.add(new Object[]{key, PRODUCTS.get(p), category, price, quantity, discount,
                        price * quantity - discount, status});
            }
        }
        jdbc.batchUpdate("""
                INSERT INTO purchase_orders (order_key, purchased_at, age_at_purchase, age_band, record_source, created_at)
                VALUES (?, ?, ?, ?, ?, NOW(6))
                """, orders);
        jdbc.batchUpdate("""
                INSERT INTO purchase_lines (order_key, product_name, category_name, unit_price, quantity, line_discount, line_amount, line_status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, lines);
        assertEquals(ORDERS, jdbc.queryForObject("SELECT COUNT(*) FROM purchase_orders", Integer.class));
    }

    @Test
    void sqlAggregationEqualsTheLegacyJavaAggregationForRandomQueries() {
        Random random = new Random(7L);
        List<String> grains = List.of("DAY", "WEEK", "MONTH");
        List<String> metrics = List.of("SALES_AMOUNT", "QUANTITY", "ORDER_COUNT");
        List<String> sources = PurchaseAnalyticsService.RECORD_SOURCES;
        List<String> categoryChoices = new ArrayList<>(Arrays.asList("LIP", "lip", "팩트", "아이", "스킨케어", "Skin", "기타", "미분류", "립 ", "없는분류"));
        List<String> productChoices = new ArrayList<>(PRODUCTS);
        productChoices.add("not-a-product");

        int nonEmpty = 0;
        int withCancelled = 0;
        int withRefunded = 0;
        int withOmission = 0;
        for (int i = 0; i < 400; i++) {
            LocalDate from = LocalDate.of(2026, 8, 10).plusDays(random.nextInt(150));
            LocalDate to = from.plusDays(random.nextInt(i % 5 == 0 ? 120 : 40));
            PurchaseAnalyticsQuery query = new PurchaseAnalyticsQuery(
                    from, to,
                    grains.get(random.nextInt(3)),
                    metrics.get(random.nextInt(3)),
                    1 + random.nextInt(20),
                    pick(random, productChoices, 3),
                    pick(random, categoryChoices, 3),
                    pick(random, PurchaseAnalyticsService.AGE_BANDS, 3),
                    sources.get(random.nextInt(3)));
            Aggregate expected = LegacyJavaPurchaseAnalytics.aggregate(jdbc, query);
            Aggregate actual = service.aggregate(query);
            assertEquals(expected, actual, "query #" + i + " " + query);
            nonEmpty += expected.orderCount() > 0 ? 1 : 0;
            withCancelled += expected.cancelledAmount() > 0 ? 1 : 0;
            withRefunded += expected.refundedAmount() > 0 ? 1 : 0;
            withOmission += expected.omittedProductCount() > 0 ? 1 : 0;
        }
        // The comparison is only meaningful if the random queries actually hit data.
        assertTrue(nonEmpty > 100, "non-empty results: " + nonEmpty);
        assertTrue(withCancelled > 50, "queries with cancelled lines: " + withCancelled);
        assertTrue(withRefunded > 50, "queries with refunded lines: " + withRefunded);
        assertTrue(withOmission > 20, "queries with an omitted product tail: " + withOmission);
    }

    @Test
    void unfilteredFullYearQueriesMatchForEverySourceGrainAndMetric() {
        for (String source : PurchaseAnalyticsService.RECORD_SOURCES) {
            for (String grain : List.of("DAY", "WEEK", "MONTH")) {
                for (String metric : List.of("SALES_AMOUNT", "QUANTITY", "ORDER_COUNT")) {
                    PurchaseAnalyticsQuery query = new PurchaseAnalyticsQuery(
                            LocalDate.of(2026, 8, 1), LocalDate.of(2027, 7, 31), grain, metric, 5,
                            List.of(), List.of(), List.of(), source);
                    assertEquals(LegacyJavaPurchaseAnalytics.aggregate(jdbc, query), service.aggregate(query),
                            source + "/" + grain + "/" + metric);
                }
            }
        }
    }

    private static List<String> pick(Random random, List<String> choices, int max) {
        if (random.nextInt(5) < 3) {
            return List.of();
        }
        int count = 1 + random.nextInt(max);
        List<String> picked = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            picked.add(choices.get(random.nextInt(choices.size())));
        }
        return picked;
    }
}
