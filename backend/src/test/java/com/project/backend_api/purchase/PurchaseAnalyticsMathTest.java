package com.project.backend_api.purchase;

import org.junit.jupiter.api.Test;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

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
                List.of());
        PurchaseAnalyticsService.Aggregate aggregate = PurchaseAnalyticsService.aggregate(octoberLines(), query);

        assertEquals(4, aggregate.orderCount());
        assertEquals(6, aggregate.quantity());
        assertEquals(65_000, aggregate.salesAmount());
        assertEquals(1, aggregate.cancelledQuantity());
        assertEquals(5_000, aggregate.cancelledAmount());
        assertEquals(1, aggregate.refundedQuantity());
        assertEquals(8_000, aggregate.refundedAmount());
        assertEquals(65_000, aggregate.shownProducts().stream().mapToLong(PurchaseAnalyticsService.NamedMetric::salesAmount).sum()
                + aggregate.omittedSalesAmount());
        assertEquals("Fact A", aggregate.shownProducts().get(0).name());
        assertEquals(34_000, aggregate.shownProducts().get(0).salesAmount());
        assertEquals(2, aggregate.omittedProductCount());
        assertEquals(11_000, aggregate.omittedSalesAmount());
        long categoryOrders = aggregate.categories().stream().mapToLong(PurchaseAnalyticsService.NamedMetric::orderCount).sum();
        assertTrue(categoryOrders > aggregate.orderCount());
        assertEquals(1, age(aggregate, "미상").orderCount());
        assertEquals(0, age(aggregate, "30대").orderCount());
        assertEquals(0, trend(aggregate, "2026-10-02").orderCount());
        assertEquals(27_000, trend(aggregate, "2026-10-01").salesAmount());
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
                List.of("Fact A"),
                List.of("팩트"),
                List.of("20대"));
        List<PurchaseAnalyticsService.PurchaseLine> filtered = octoberLines().stream()
                .filter(line -> line.productName().equals("Fact A"))
                .filter(line -> line.categoryLabel().equals("팩트"))
                .filter(line -> line.ageBand().equals("20대"))
                .toList();
        PurchaseAnalyticsService.Aggregate aggregate = PurchaseAnalyticsService.aggregate(filtered, query);
        assertEquals(1, aggregate.orderCount());
        assertEquals(2, aggregate.quantity());
        assertEquals(19_000, aggregate.salesAmount());
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
                List.of())));
        assertThrows(IllegalArgumentException.class, () -> PurchaseAnalyticsService.validate(new PurchaseAnalyticsQuery(
                LocalDate.parse("2026-10-01"),
                LocalDate.parse("2026-10-31"),
                "DAY",
                "SALES_AMOUNT",
                5,
                List.of(),
                List.of(),
                List.of("청소년"))));
    }

    @Test
    void realAndUnsetSourcesDoNotInventZeros() {
        PurchaseAnalyticsQuery query = octoberQuery();
        PurchaseAnalyticsResponse real = new PurchaseAnalyticsService(null, "REAL").query(query);
        PurchaseAnalyticsResponse unset = new PurchaseAnalyticsService(null, "NONE").query(query);
        assertEquals("REAL", real.source());
        assertEquals(false, real.available());
        assertTrue(real.message().contains("payment_histories"));
        assertEquals(null, real.summary());
        assertEquals("NONE", unset.source());
        assertEquals(false, unset.available());
    }

    private static PurchaseAnalyticsQuery octoberQuery() {
        return new PurchaseAnalyticsQuery(
                LocalDate.parse("2026-10-01"),
                LocalDate.parse("2026-10-31"),
                "DAY",
                "SALES_AMOUNT",
                5,
                List.of(),
                List.of(),
                List.of());
    }

    private static PurchaseAnalyticsService.NamedMetric age(PurchaseAnalyticsService.Aggregate aggregate, String band) {
        return aggregate.ages().stream().filter(item -> item.name().equals(band)).findFirst().orElseThrow();
    }

    private static PurchaseAnalyticsService.NamedMetric trend(PurchaseAnalyticsService.Aggregate aggregate, String bucket) {
        return aggregate.trend().stream().filter(item -> item.name().equals(bucket)).findFirst().orElseThrow();
    }

    private static List<PurchaseAnalyticsService.PurchaseLine> octoberLines() {
        return List.of(
                line("fx-2", "2026-10-01T00:00:00", 25, "Fact A", "팩트", 10000, 2, 1000, "PAID"),
                line("fx-2", "2026-10-01T00:00:00", 25, "Lip B", "립", 8000, 1, 0, "PAID"),
                line("fx-3", "2026-10-15T12:00:00", null, "Fact A", "팩트", 15000, 1, 0, "PAID"),
                line("fx-4", "2026-10-31T23:59:00", 52, "Skin C", "스킨케어", 20000, 1, 0, "PAID"),
                line("fx-4", "2026-10-31T23:59:00", 52, "Eye D", "아이", 5000, 1, 0, "CANCELLED"),
                line("fx-6", "2026-10-20T10:00:00", 17, "Mystery", null, 3000, 1, 0, "PAID"),
                line("fx-7", "2026-10-21T10:00:00", 33, "Lip B", "립", 8000, 1, 0, "REFUNDED"));
    }

    private static PurchaseAnalyticsService.PurchaseLine line(
            String order,
            String at,
            Integer age,
            String product,
            String category,
            int price,
            int quantity,
            int discount,
            String status
    ) {
        return new PurchaseAnalyticsService.PurchaseLine(
                order, LocalDateTime.parse(at), age, product, category, price, quantity, discount, status);
    }
}
