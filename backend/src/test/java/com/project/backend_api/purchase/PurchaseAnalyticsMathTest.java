package com.project.backend_api.purchase;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Hand-counted expectations for a small in-memory fixture.
 * This fixture is NOT the verify DB seed: seed October PAID totals are 2 orders / 6 qty / 72_500
 * (demo-purchase-20261001-1 + 20261015-1 only). The lines below add fx-paid / fx-cancel so
 * cancelled metrics and multi-order edge cases can be asserted without reading the DB.
 *
 * Independent hand count for PAID lines only:
 * <pre>
 *   order demo-purchase-20261001-1  Verify Shade  12_000×3 = 36_000
 *   order demo-purchase-20261015-1  Demo Fact A   14_000×2 = 28_000
 *   order demo-purchase-20261015-1  Demo Lip B     8_500×1 =  8_500
 *   order fx-paid                   Demo Skin C   20_000×1 = 20_000
 *   order fx-cancel                 Demo Eye D     CANCELLED → excluded from sales
 *   → distinct paid orders = 3
 *   → quantity = 3+2+1+1 = 7
 *   → salesAmount = 36_000+28_000+8_500+20_000 = 92_500
 *   → cancelled quantity/amount = 1 / 5_000
 * </pre>
 * Verify DB October SQL uses the same PAID filter and date half-open range but only seed rows,
 * so it yields 72_500 (= 36_000+28_000+8_500), not 92_500.
 */
class PurchaseAnalyticsMathTest {

    @Test
    void octoberFixtureMatchesTheHandCount() {
        PurchaseAnalyticsQuery query = new PurchaseAnalyticsQuery(
                LocalDate.parse("2026-10-01"),
                LocalDate.parse("2026-10-31"),
                "DAY",
                "SALES_AMOUNT",
                2,
                List.of(),
                List.of(),
                List.of(),
                "ALL");
        PurchaseAnalyticsService.Aggregate aggregate = PurchaseAnalyticsService.aggregate(octoberLines(), query);

        // Expected values were written from the table in the class javadoc, not from Aggregate.
        assertEquals(3, aggregate.orderCount());
        assertEquals(7, aggregate.quantity());
        assertEquals(92_500, aggregate.salesAmount());
        assertEquals(1, aggregate.cancelledQuantity());
        assertEquals(5_000, aggregate.cancelledAmount());
        assertEquals(0, aggregate.refundedQuantity());
        assertEquals("Verify Shade", aggregate.shownProducts().get(0).name());
        assertEquals(36_000, aggregate.shownProducts().get(0).salesAmount());
        long categoryOrders = aggregate.categories().stream().mapToLong(PurchaseAnalyticsService.NamedMetric::orderCount).sum();
        assertTrue(categoryOrders >= aggregate.orderCount());
        assertEquals(0, trend(aggregate, "2026-10-02").orderCount());
        assertEquals("2026-09-28", PurchaseAnalyticsService.bucket(LocalDate.parse("2026-10-01"), "WEEK"));
    }

    @Test
    void categoryAndProductFiltersUseTheSamePaidLines() {
        PurchaseAnalyticsQuery query = new PurchaseAnalyticsQuery(
                LocalDate.parse("2026-10-01"),
                LocalDate.parse("2026-10-31"),
                "MONTH",
                "ORDER_COUNT",
                5,
                List.of("Verify Shade"),
                List.of("LIP"),
                List.of("20대"),
                "DEMO");
        List<PurchaseAnalyticsService.PurchaseLine> filtered = octoberLines().stream()
                .filter(line -> line.productName().equals("Verify Shade"))
                .filter(line -> line.categoryLabel().equals("LIP"))
                .filter(line -> line.ageBand().equals("20대"))
                .toList();
        PurchaseAnalyticsService.Aggregate aggregate = PurchaseAnalyticsService.aggregate(filtered, query);
        // Hand: one PAID line 12_000×3 → 1 order, qty 3, sales 36_000
        assertEquals(1, aggregate.orderCount());
        assertEquals(3, aggregate.quantity());
        assertEquals(36_000, aggregate.salesAmount());
        assertEquals("2026-10", aggregate.trend().get(0).name());
    }

    @Test
    void rejectsAnOpenEndedRangeAndUnknownAge() {
        assertThrows(IllegalArgumentException.class, () -> PurchaseAnalyticsService.validate(new PurchaseAnalyticsQuery(
                LocalDate.parse("2026-01-01"),
                LocalDate.parse("2027-01-02"),
                "DAY",
                "SALES_AMOUNT",
                5,
                List.of(),
                List.of(),
                List.of(),
                "ALL")));
        assertThrows(IllegalArgumentException.class, () -> PurchaseAnalyticsService.validate(new PurchaseAnalyticsQuery(
                LocalDate.parse("2026-10-01"),
                LocalDate.parse("2026-10-31"),
                "DAY",
                "SALES_AMOUNT",
                5,
                List.of(),
                List.of(),
                List.of("청소년"),
                "ALL")));
    }

    private static PurchaseAnalyticsService.NamedMetric trend(PurchaseAnalyticsService.Aggregate aggregate, String bucket) {
        return aggregate.trend().stream().filter(item -> item.name().equals(bucket)).findFirst().orElseThrow();
    }

    private static List<PurchaseAnalyticsService.PurchaseLine> octoberLines() {
        return List.of(
                line("demo-purchase-20261001-1", "2026-10-01T10:00:00", 28, "20대", "Verify Shade", "LIP", 12000, 3, 0, 36000, "PAID"),
                line("demo-purchase-20261015-1", "2026-10-15T15:00:00", 41, "40대", "Demo Fact A", "팩트", 14000, 2, 0, 28000, "PAID"),
                line("demo-purchase-20261015-1", "2026-10-15T15:00:00", 41, "40대", "Demo Lip B", "립", 8500, 1, 0, 8500, "PAID"),
                line("fx-cancel", "2026-10-31T23:59:00", 52, "50대 이상", "Demo Eye D", "아이", 5000, 1, 0, 5000, "CANCELLED"),
                line("fx-paid", "2026-10-31T23:59:00", 52, "50대 이상", "Demo Skin C", "스킨케어", 20000, 1, 0, 20000, "PAID"));
    }

    private static PurchaseAnalyticsService.PurchaseLine line(
            String order,
            String at,
            Integer age,
            String band,
            String product,
            String category,
            int price,
            int quantity,
            int discount,
            int amount,
            String status
    ) {
        return new PurchaseAnalyticsService.PurchaseLine(
                order, LocalDateTime.parse(at), age, band, "DEMO", product, category, price, quantity, discount, amount, status);
    }
}
