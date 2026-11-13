package com.project.backend_api.purchase;

import com.project.backend_api.purchase.PurchaseAnalyticsService.Aggregate;
import com.project.backend_api.purchase.PurchaseAnalyticsService.CrossCell;
import com.project.backend_api.purchase.PurchaseAnalyticsService.NamedMetric;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.support.TransactionOperations;

import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * SQL aggregation against hand-counted expectations on a small fixture that hits the edge cases:
 * half-open range ends, Sunday 23:59:59.999999 / Monday 00:00:00 week boundary, CANCELLED and REFUNDED
 * lines, DEMO vs LIVE, NULL/blank category, blank stored age band (derived from age), NULL age,
 * names that differ only by case or a trailing space, and quote characters in filter values.
 * <p>
 * Expected values are written from the fixture table below, not produced by the service or the
 * legacy Java aggregator.
 *
 * <pre>
 * order  purchased_at                  age  band      source  line (product / category / qty x price = amount / status)
 * O1     2026-10-01 00:00:00           28   20대      DEMO    L1 Shade/LIP 3x12000=36000 PAID
 *                                                             L2 Fact A/팩트 2x14000=28000 CANCELLED
 * O2     2026-10-04 23:59:59.999999    41   40대      DEMO    L3 Shade/LIP 1x12000=12000 PAID
 *                                                             L4 Lip B/LIP 2x8500=17000 PAID
 * O3     2026-10-05 00:00:00           NULL 미상      LIVE    L5 Shade/LIP 2x12000=24000 PAID
 *                                                             L6 Skin/스킨케어 1x20000 REFUNDED
 * O4     2026-10-31 23:59:59           52   '' (blank) DEMO   L7 Eye/NULL 1x5000 PAID
 *                                                             L8 shade/'  ' 1x1000 PAID
 * O5     2026-11-01 00:00:00           35   30대      DEMO    L9 Shade/LIP 9x12000=108000 PAID  (outside October)
 * O6     2026-09-30 23:59:59           30   30대      DEMO    L10 Shade/LIP 1x12000 PAID        (outside October)
 * O7     2026-10-15 15:00:00           17   10대 이하 DEMO    L11 Shade/LIP 1x12000 PAID
 *                                                             L12 'Shade '/LIP 1x500 PAID
 * O8     2026-11-10 09:00:00           45   40대      DEMO    L13 O'Brien; DROP/LIP 1x777 PAID
 * </pre>
 */
class PurchaseAnalyticsSqlMySqlTest {

    static PurchaseAnalyticsTestDb db;
    static JdbcTemplate jdbc;
    static PurchaseAnalyticsService service;

    @BeforeAll
    static void seed() {
        db = PurchaseAnalyticsTestDb.start();
        jdbc = db.jdbc;
        service = new PurchaseAnalyticsService(jdbc);

        order("O1", "2026-10-01 00:00:00", 28, "20대", "DEMO");
        line("O1", "Shade", "LIP", 12000, 3, 36000, "PAID");
        line("O1", "Fact A", "팩트", 14000, 2, 28000, "CANCELLED");

        order("O2", "2026-10-04 23:59:59.999999", 41, "40대", "DEMO");
        line("O2", "Shade", "LIP", 12000, 1, 12000, "PAID");
        line("O2", "Lip B", "LIP", 8500, 2, 17000, "PAID");

        order("O3", "2026-10-05 00:00:00", null, "미상", "LIVE");
        line("O3", "Shade", "LIP", 12000, 2, 24000, "PAID");
        line("O3", "Skin", "스킨케어", 20000, 1, 20000, "REFUNDED");

        order("O4", "2026-10-31 23:59:59", 52, "", "DEMO");
        line("O4", "Eye", null, 5000, 1, 5000, "PAID");
        line("O4", "shade", "  ", 1000, 1, 1000, "PAID");

        order("O5", "2026-11-01 00:00:00", 35, "30대", "DEMO");
        line("O5", "Shade", "LIP", 12000, 9, 108000, "PAID");

        order("O6", "2026-09-30 23:59:59", 30, "30대", "DEMO");
        line("O6", "Shade", "LIP", 12000, 1, 12000, "PAID");

        order("O7", "2026-10-15 15:00:00", 17, "10대 이하", "DEMO");
        line("O7", "Shade", "LIP", 12000, 1, 12000, "PAID");
        line("O7", "Shade ", "LIP", 500, 1, 500, "PAID");

        order("O8", "2026-11-10 09:00:00", 45, "40대", "DEMO");
        line("O8", "O'Brien; DROP", "LIP", 777, 1, 777, "PAID");
    }

    // ---- unfiltered October, all sources -------------------------------------------------

    @Test
    void octoberSummaryAndCancelRefundTotals() {
        Aggregate a = service.aggregate(q("2026-10-01", "2026-10-31", "WEEK", "SALES_AMOUNT", 2, "ALL"));
        assertEquals(5, a.orderCount());
        assertEquals(12, a.quantity());
        assertEquals(107_500, a.salesAmount());
        assertEquals(2, a.cancelledQuantity());
        assertEquals(28_000, a.cancelledAmount());
        assertEquals(1, a.refundedQuantity());
        assertEquals(20_000, a.refundedAmount());
    }

    @Test
    void topNKeepsFullRowsAndSumsTheOmittedTail() {
        Aggregate a = service.aggregate(q("2026-10-01", "2026-10-31", "WEEK", "SALES_AMOUNT", 2, "ALL"));
        assertEquals(List.of(m("Shade", 4, 7, 84_000), m("Lip B", 1, 2, 17_000)), a.shownProducts());
        assertEquals(3, a.omittedProductCount());
        assertEquals(6_500, a.omittedSalesAmount());
        assertEquals(3, a.omittedQuantity());
        // `rows` is the complete ordered product list. 'shade' and 'Shade ' are separate products.
        assertEquals(List.of(
                m("Shade", 4, 7, 84_000), m("Lip B", 1, 2, 17_000), m("Eye", 1, 1, 5_000),
                m("shade", 1, 1, 1_000), m("Shade ", 1, 1, 500)), a.rows());
    }

    @Test
    void topNLargerThanProductCountOmitsNothing() {
        Aggregate a = service.aggregate(q("2026-10-01", "2026-10-31", "MONTH", "SALES_AMOUNT", 20, "ALL"));
        assertEquals(5, a.shownProducts().size());
        assertEquals(0, a.omittedProductCount());
        assertEquals(0, a.omittedSalesAmount());
        assertEquals(0, a.omittedQuantity());
    }

    @Test
    void orderCountMetricSortsByOrdersThenName() {
        Aggregate a = service.aggregate(q("2026-10-01", "2026-10-31", "MONTH", "ORDER_COUNT", 20, "ALL"));
        assertEquals(List.of("Shade", "Eye", "Lip B", "Shade ", "shade"),
                a.rows().stream().map(NamedMetric::name).toList());
        Aggregate quantity = service.aggregate(q("2026-10-01", "2026-10-31", "MONTH", "QUANTITY", 20, "ALL"));
        assertEquals(List.of("Shade", "Lip B", "Eye", "Shade ", "shade"),
                quantity.rows().stream().map(NamedMetric::name).toList());
    }

    @Test
    void categoriesIncludeStatusOnlyCategoriesSortedByCodeUnitOrder() {
        Aggregate a = service.aggregate(q("2026-10-01", "2026-10-31", "MONTH", "SALES_AMOUNT", 5, "ALL"));
        // 팩트 only has a cancelled line and 스킨케어 only a refunded line: present with zero paid metrics.
        // NULL and blank categories collapse into 미분류. Order is String.compareTo: LIP < 미 < 스 < 팩.
        assertEquals(List.of(
                m("LIP", 4, 10, 101_500), m("미분류", 1, 2, 6_000), m("스킨케어", 0, 0, 0), m("팩트", 0, 0, 0)),
                a.categories());
    }

    @Test
    void ageBandsAreZeroFilledAndUseDerivedBandWhenStoredBandIsBlank() {
        Aggregate a = service.aggregate(q("2026-10-01", "2026-10-31", "MONTH", "SALES_AMOUNT", 5, "ALL"));
        assertEquals(List.of(
                m("10대 이하", 1, 2, 12_500), m("20대", 1, 3, 36_000), m("30대", 0, 0, 0),
                m("40대", 1, 3, 29_000), m("50대 이상", 1, 2, 6_000), m("미상", 1, 2, 24_000)), a.ages());
    }

    @Test
    void crossCellsAreAgeByCategoryOrderedByCombinedKey() {
        Aggregate a = service.aggregate(q("2026-10-01", "2026-10-31", "MONTH", "SALES_AMOUNT", 5, "ALL"));
        assertEquals(List.of(
                cell("10대 이하", "LIP", 1, 2, 12_500),
                cell("20대", "LIP", 1, 3, 36_000),
                cell("40대", "LIP", 1, 3, 29_000),
                cell("50대 이상", "미분류", 1, 2, 6_000),
                cell("미상", "LIP", 1, 2, 24_000)), a.cross());
    }

    @Test
    void weekBucketsStartOnMondayAndRespectTheSundayMondayBoundary() {
        Aggregate a = service.aggregate(q("2026-10-01", "2026-10-31", "WEEK", "SALES_AMOUNT", 5, "ALL"));
        // 2026-10-04 23:59:59.999999 is Sunday -> week of 09-28; 2026-10-05 00:00:00 is Monday -> week of 10-05.
        assertEquals(List.of(
                m("2026-09-28", 2, 6, 65_000),
                m("2026-10-05", 1, 2, 24_000),
                m("2026-10-12", 1, 2, 12_500),
                m("2026-10-19", 0, 0, 0),
                m("2026-10-26", 1, 2, 6_000)), a.trend());
    }

    @Test
    void monthAndDayBuckets() {
        assertEquals(List.of(m("2026-10", 5, 12, 107_500)),
                service.aggregate(q("2026-10-01", "2026-10-31", "MONTH", "SALES_AMOUNT", 5, "ALL")).trend());

        List<NamedMetric> days = service.aggregate(q("2026-10-01", "2026-10-31", "DAY", "SALES_AMOUNT", 5, "ALL")).trend();
        assertEquals(31, days.size());
        assertEquals(m("2026-10-01", 1, 3, 36_000), days.get(0));
        assertEquals(m("2026-10-02", 0, 0, 0), days.get(1));
        assertEquals(m("2026-10-04", 1, 3, 29_000), days.get(3));
        assertEquals(m("2026-10-05", 1, 2, 24_000), days.get(4));
        assertEquals(m("2026-10-31", 1, 2, 6_000), days.get(30));
        assertEquals(107_500, days.stream().mapToLong(NamedMetric::salesAmount).sum());
    }

    @Test
    void rangeIsHalfOpenAtMidnightSeoul() {
        // 2026-10-31 to 11-01 00:00:00 exclusive: O4 (10-31 23:59:59) in, O5 (11-01 00:00:00) out.
        Aggregate a = service.aggregate(q("2026-10-31", "2026-10-31", "DAY", "SALES_AMOUNT", 5, "ALL"));
        assertEquals(1, a.orderCount());
        assertEquals(6_000, a.salesAmount());
        // 09-30 23:59:59 belongs to September only.
        Aggregate september = service.aggregate(q("2026-09-01", "2026-09-30", "MONTH", "SALES_AMOUNT", 5, "ALL"));
        assertEquals(1, september.orderCount());
        assertEquals(12_000, september.salesAmount());
        Aggregate november = service.aggregate(q("2026-11-01", "2026-11-30", "MONTH", "SALES_AMOUNT", 5, "ALL"));
        assertEquals(2, november.orderCount());
        assertEquals(10, november.quantity());
        assertEquals(108_777, november.salesAmount());
    }

    @Test
    void resultDoesNotDependOnTheDriverServerTimeZone() {
        PurchaseAnalyticsQuery query = q("2026-10-01", "2026-10-31", "DAY", "SALES_AMOUNT", 5, "ALL");
        Aggregate seoul = service.aggregate(query);
        for (String zone : List.of("UTC", "America/Los_Angeles")) {
            PurchaseAnalyticsService other = new PurchaseAnalyticsService(db.jdbcWithTimeZone(zone));
            assertEquals(seoul, other.aggregate(query), "serverTimezone=" + zone);
        }
    }

    // ---- DEMO vs LIVE ----------------------------------------------------------------------

    @Test
    void demoOnlyExcludesLiveOrders() {
        Aggregate a = service.aggregate(q("2026-10-01", "2026-10-31", "MONTH", "SALES_AMOUNT", 5, "DEMO"));
        assertEquals(4, a.orderCount());
        assertEquals(10, a.quantity());
        assertEquals(83_500, a.salesAmount());
        assertEquals(2, a.cancelledQuantity());
        assertEquals(28_000, a.cancelledAmount());
        assertEquals(0, a.refundedQuantity());
        assertEquals(0, a.refundedAmount());
        assertEquals(List.of(m("LIP", 3, 8, 77_500), m("미분류", 1, 2, 6_000), m("팩트", 0, 0, 0)), a.categories());
        assertEquals(m("미상", 0, 0, 0), a.ages().get(5));
    }

    @Test
    void liveOnlyReturnsOnlyLiveOrdersAndIsNotLabelledDemo() {
        PurchaseAnalyticsQuery live = q("2026-10-01", "2026-10-31", "MONTH", "SALES_AMOUNT", 5, "LIVE");
        Aggregate a = service.aggregate(live);
        assertEquals(1, a.orderCount());
        assertEquals(2, a.quantity());
        assertEquals(24_000, a.salesAmount());
        assertEquals(1, a.refundedQuantity());
        assertEquals(20_000, a.refundedAmount());
        PurchaseAnalyticsResponse response = service.query(live);
        assertFalse(response.includesDemoRecords());
        assertTrue(service.query(q("2026-10-01", "2026-10-31", "MONTH", "SALES_AMOUNT", 5, "DEMO")).includesDemoRecords());
        assertTrue(service.query(q("2026-10-01", "2026-10-31", "MONTH", "SALES_AMOUNT", 5, "ALL")).includesDemoRecords());
        assertEquals("DATABASE", response.dataBasis());
        assertEquals("Asia/Seoul", response.timezone());
        assertEquals("2026-11-01", response.rangeEndExclusive());
    }

    // ---- filters ---------------------------------------------------------------------------

    @Test
    void productFilterIsExactCaseAndTrailingSpaceSensitive() {
        Aggregate a = service.aggregate(filtered(List.of("Shade"), List.of(), List.of()));
        assertEquals(4, a.orderCount());
        assertEquals(7, a.quantity());
        assertEquals(84_000, a.salesAmount());
        assertEquals(0, a.cancelledQuantity());
        assertEquals(0, a.refundedQuantity());
        assertEquals(List.of(m("Shade", 4, 7, 84_000)), a.rows());
        assertEquals(List.of(m("LIP", 4, 7, 84_000)), a.categories());

        Aggregate lower = service.aggregate(filtered(List.of("shade"), List.of(), List.of()));
        assertEquals(List.of(m("shade", 1, 1, 1_000)), lower.rows());
        Aggregate padded = service.aggregate(filtered(List.of("Shade "), List.of(), List.of()));
        assertEquals(List.of(m("Shade ", 1, 1, 500)), padded.rows());
    }

    @Test
    void categoryFilterMatchesBlankAndNullAsUnclassified() {
        Aggregate a = service.aggregate(filtered(List.of(), List.of("미분류"), List.of()));
        assertEquals(1, a.orderCount());
        assertEquals(2, a.quantity());
        assertEquals(6_000, a.salesAmount());
        assertEquals(List.of(m("미분류", 1, 2, 6_000)), a.categories());
    }

    @Test
    void categoryFilterKeepsCancelledOnlyLinesVisible() {
        Aggregate a = service.aggregate(filtered(List.of(), List.of("팩트"), List.of()));
        assertEquals(0, a.orderCount());
        assertEquals(0, a.salesAmount());
        assertEquals(2, a.cancelledQuantity());
        assertEquals(28_000, a.cancelledAmount());
        assertEquals(List.of(m("팩트", 0, 0, 0)), a.categories());
        assertTrue(a.rows().isEmpty());
        assertTrue(a.cross().isEmpty());
    }

    @Test
    void ageFilterUsesDerivedBandAndKeepsRefundedLines() {
        Aggregate blankStoredBand = service.aggregate(filtered(List.of(), List.of(), List.of("50대 이상")));
        assertEquals(1, blankStoredBand.orderCount());
        assertEquals(6_000, blankStoredBand.salesAmount());

        Aggregate unknown = service.aggregate(filtered(List.of(), List.of(), List.of("미상")));
        assertEquals(1, unknown.orderCount());
        assertEquals(24_000, unknown.salesAmount());
        assertEquals(1, unknown.refundedQuantity());
        assertEquals(20_000, unknown.refundedAmount());
        assertEquals(List.of(m("LIP", 1, 2, 24_000), m("스킨케어", 0, 0, 0)), unknown.categories());

        Aggregate two = service.aggregate(filtered(List.of(), List.of(), List.of("20대", "40대")));
        assertEquals(2, two.orderCount());
        assertEquals(65_000, two.salesAmount());
    }

    @Test
    void combinedFiltersIntersect() {
        Aggregate a = service.aggregate(new PurchaseAnalyticsQuery(
                LocalDate.parse("2026-10-01"), LocalDate.parse("2026-10-31"), "WEEK", "SALES_AMOUNT", 5,
                List.of("Shade", "Lip B"), List.of("LIP"), List.of("40대", "10대 이하"), "DEMO"));
        // O2: Shade 12000 + Lip B 17000 (40대); O7: Shade 12000 (10대 이하). 'Shade ' is not selected.
        assertEquals(2, a.orderCount());
        assertEquals(4, a.quantity());
        assertEquals(41_000, a.salesAmount());
    }

    @Test
    void conflictingFiltersYieldAnEmptyButFullyShapedResult() {
        Aggregate a = service.aggregate(new PurchaseAnalyticsQuery(
                LocalDate.parse("2026-10-01"), LocalDate.parse("2026-10-31"), "WEEK", "SALES_AMOUNT", 5,
                List.of("Lip B"), List.of("팩트"), List.of(), "DEMO"));
        assertEquals(0, a.orderCount());
        assertEquals(0, a.cancelledAmount());
        assertTrue(a.rows().isEmpty());
        assertTrue(a.categories().isEmpty());
        assertEquals(6, a.ages().size());
        assertEquals(5, a.trend().size());
    }

    @Test
    void emptyPeriodStillReturnsZeroFilledBucketsAndBands() {
        Aggregate a = service.aggregate(q("2026-12-01", "2026-12-07", "DAY", "SALES_AMOUNT", 5, "ALL"));
        assertEquals(0, a.orderCount());
        assertEquals(0, a.quantity());
        assertEquals(0, a.salesAmount());
        assertEquals(7, a.trend().size());
        assertEquals(m("2026-12-01", 0, 0, 0), a.trend().get(0));
        assertTrue(a.trend().stream().allMatch(t -> t.orderCount() == 0 && t.salesAmount() == 0));
        assertEquals(6, a.ages().size());
        assertTrue(a.ages().stream().allMatch(t -> t.orderCount() == 0));
        assertTrue(a.rows().isEmpty());
        assertEquals(0, a.omittedProductCount());
        assertEquals(List.of("2026-12-01", "2026-12-02", "2026-12-03", "2026-12-04", "2026-12-05", "2026-12-06", "2026-12-07"),
                a.trend().stream().map(NamedMetric::name).toList());

        Aggregate monthly = service.aggregate(q("2026-12-01", "2026-12-07", "MONTH", "SALES_AMOUNT", 5, "ALL"));
        assertEquals(List.of(m("2026-12", 0, 0, 0)), monthly.trend());
    }

    // ---- bound parameters ------------------------------------------------------------------

    @Test
    void filterValuesAreBoundNotConcatenated() {
        Aggregate quoted = service.aggregate(new PurchaseAnalyticsQuery(
                LocalDate.parse("2026-11-01"), LocalDate.parse("2026-11-30"), "MONTH", "SALES_AMOUNT", 5,
                List.of("O'Brien; DROP"), List.of(), List.of(), "ALL"));
        assertEquals(1, quoted.orderCount());
        assertEquals(777, quoted.salesAmount());

        Aggregate injection = service.aggregate(new PurchaseAnalyticsQuery(
                LocalDate.parse("2026-10-01"), LocalDate.parse("2026-10-31"), "MONTH", "SALES_AMOUNT", 5,
                List.of("x' OR '1'='1"), List.of("') OR 1=1 -- "), List.of(), "ALL"));
        assertEquals(0, injection.orderCount());
        assertEquals(0, injection.cancelledAmount());
        assertEquals(Integer.valueOf(8), jdbc.queryForObject("SELECT COUNT(*) FROM purchase_orders", Integer.class));
    }

    @Test
    void invalidRecordSourceIsRejectedBeforeAnySql() {
        assertThrows(IllegalArgumentException.class,
                () -> service.aggregate(q("2026-10-01", "2026-10-31", "DAY", "SALES_AMOUNT", 5, "DEMO' OR '1'='1")));
    }

    // ---- response shape --------------------------------------------------------------------

    @Test
    void responseShapeIsUnchanged() {
        PurchaseAnalyticsResponse r = service.query(q("2026-10-01", "2026-10-31", "WEEK", "SALES_AMOUNT", 2, "ALL"));
        assertTrue(r.available());
        assertEquals(5, r.summary().orderCount());
        assertEquals(107_500, r.summary().salesAmount());
        assertEquals(3, r.productsOmitted().productCount());
        assertEquals(6_500, r.productsOmitted().salesAmount());
        assertEquals(3, r.productsOmitted().quantity());
        assertEquals(2, r.products().size());
        assertEquals(5, r.rows().size());
        assertTrue(r.categoryOrderCountsMayOverlap());
        assertEquals("2026-10-01", r.rangeStartInclusive());
        assertEquals(5, r.trend().size());
    }

    // ---- snapshot consistency --------------------------------------------------------------

    @Test
    void aggregateIsASingleStatementSoItsPartsCannotTear() {
        HookedJdbc counting = new HookedJdbc(db, () -> { });
        PurchaseAnalyticsService counted = new PurchaseAnalyticsService(counting,
                PurchaseAnalyticsService.snapshotOperations(new DataSourceTransactionManager(counting.getDataSource())));
        Aggregate a = counted.aggregate(q("2026-10-01", "2026-10-31", "WEEK", "SALES_AMOUNT", 5, "ALL"));
        assertEquals(1, counting.queryCalls.get(), "summary, products, categories, ages, trend and cross come from one statement");
        assertEquals(107_500, a.salesAmount());
        assertInternallyConsistent(a);
    }

    @Test
    void filterOptionsReadOneSnapshotAcrossItsTwoStatements() {
        try {
            // Products are read first, then a concurrent order adds a product and a category, then
            // categories are read. In the REPEATABLE READ transaction the second read must not see it.
            HookedJdbc hooked = new HookedJdbc(db, () -> commitNewCatalogEntry("SNAP"));
            PurchaseAnalyticsService snapshotService = new PurchaseAnalyticsService(hooked,
                    PurchaseAnalyticsService.snapshotOperations(new DataSourceTransactionManager(hooked.getDataSource())));
            PurchaseAnalyticsService.FilterOptions consistent = snapshotService.filterOptions();
            assertEquals(1, hooked.hooksFired.get(), "the concurrent commit must have happened between the two reads");
            assertFalse(consistent.products().contains("snap-product"));
            assertFalse(consistent.categories().contains("snap-category"));
            assertTrue(service.filterOptions().products().contains("snap-product"), "a later request sees the commit");

            // Control: without the transaction the second read takes a new snapshot and the lists disagree,
            // which proves the interleaving above really happens and the transaction is what prevents it.
            cleanup("SNAP");
            HookedJdbc unhooked = new HookedJdbc(db, () -> commitNewCatalogEntry("SNAP"));
            PurchaseAnalyticsService noTransaction = new PurchaseAnalyticsService(unhooked, TransactionOperations.withoutTransaction());
            PurchaseAnalyticsService.FilterOptions torn = noTransaction.filterOptions();
            assertFalse(torn.products().contains("snap-product"));
            assertTrue(torn.categories().contains("snap-category"));
        } finally {
            cleanup("SNAP");
        }
    }

    @Test
    void analyticsTransactionIsReadOnly() {
        TransactionOperations ops = PurchaseAnalyticsService.snapshotOperations(new DataSourceTransactionManager(db.dataSource));
        assertThrows(RuntimeException.class, () -> ops.execute(status ->
                new JdbcTemplate(db.dataSource).update("UPDATE purchase_orders SET age_band = age_band WHERE order_key = 'O1'")));
    }

    // ---- helpers ---------------------------------------------------------------------------

    private static void assertInternallyConsistent(Aggregate a) {
        assertEquals(a.salesAmount(), a.rows().stream().mapToLong(NamedMetric::salesAmount).sum());
        assertEquals(a.salesAmount(), a.trend().stream().mapToLong(NamedMetric::salesAmount).sum());
        assertEquals(a.salesAmount(), a.ages().stream().mapToLong(NamedMetric::salesAmount).sum());
        assertEquals(a.quantity(), a.rows().stream().mapToLong(NamedMetric::quantity).sum());
        assertEquals(a.salesAmount(), a.cross().stream().mapToLong(c -> c.metric().salesAmount()).sum());
    }

    /** JdbcTemplate that counts aggregate statements and fires {@code hook} once, after the first filter-option read. */
    static final class HookedJdbc extends JdbcTemplate {
        final AtomicInteger queryCalls = new AtomicInteger();
        final AtomicInteger hooksFired = new AtomicInteger();
        private final Runnable hook;

        HookedJdbc(PurchaseAnalyticsTestDb db, Runnable hook) {
            super(db.dataSource);
            this.hook = hook;
        }

        @Override
        public <T> List<T> query(String sql, RowMapper<T> rowMapper, Object... args) {
            queryCalls.incrementAndGet();
            return super.query(sql, rowMapper, args);
        }

        @Override
        public <T> List<T> queryForList(String sql, Class<T> elementType) {
            List<T> result = super.queryForList(sql, elementType);
            if (hooksFired.get() == 0) {
                hooksFired.incrementAndGet();
                hook.run();
            }
            return result;
        }
    }

    private static void commitNewCatalogEntry(String key) {
        // Own DataSource instance => own auto-commit connection, not the one bound to the request's
        // transaction (same thread): this is another request committing a demo order.
        JdbcTemplate other = new JdbcTemplate(db.dataSource(db.url));
        order(other, key, "2026-12-10 10:00:00", 30, "30대", "DEMO");
        line(other, key, "snap-product", "snap-category", 5000, 1, 5000, "PAID");
    }

    private static void cleanup(String key) {
        jdbc.update("DELETE FROM purchase_lines WHERE order_key = ?", key);
        jdbc.update("DELETE FROM purchase_orders WHERE order_key = ?", key);
    }

    private static PurchaseAnalyticsQuery filtered(List<String> products, List<String> categories, List<String> ages) {
        return new PurchaseAnalyticsQuery(
                LocalDate.parse("2026-10-01"), LocalDate.parse("2026-10-31"), "MONTH", "SALES_AMOUNT", 5,
                products, categories, ages, "ALL");
    }

    private static PurchaseAnalyticsQuery q(String from, String to, String grain, String metric, int topN, String source) {
        return new PurchaseAnalyticsQuery(LocalDate.parse(from), LocalDate.parse(to), grain, metric, topN,
                List.of(), List.of(), List.of(), source);
    }

    private static NamedMetric m(String name, long orders, long quantity, long sales) {
        return new NamedMetric(name, orders, quantity, sales);
    }

    private static CrossCell cell(String age, String category, long orders, long quantity, long sales) {
        return new CrossCell(age, category, m(category, orders, quantity, sales));
    }

    private static void order(String key, String at, Integer age, String band, String source) {
        order(jdbc, key, at, age, band, source);
    }

    private static void order(JdbcTemplate jdbc, String key, String at, Integer age, String band, String source) {
        jdbc.update("""
                INSERT INTO purchase_orders (order_key, purchased_at, age_at_purchase, age_band, record_source, created_at)
                VALUES (?, ?, ?, ?, ?, NOW(6))
                """, key, at, age, band, source);
    }

    private static void line(String key, String product, String category, int price, int quantity, int amount, String status) {
        line(jdbc, key, product, category, price, quantity, amount, status);
    }

    private static void line(JdbcTemplate jdbc, String key, String product, String category, int price, int quantity,
                             int amount, String status) {
        jdbc.update("""
                INSERT INTO purchase_lines (order_key, product_name, category_name, unit_price, quantity, line_discount, line_amount, line_status)
                VALUES (?, ?, ?, ?, ?, 0, ?, ?)
                """, key, product, category, price, quantity, amount, status);
    }
}
