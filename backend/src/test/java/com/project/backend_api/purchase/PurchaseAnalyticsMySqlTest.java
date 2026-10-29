package com.project.backend_api.purchase;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.mysql.MySQLContainer;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PurchaseAnalyticsMySqlTest {

    static final MySQLContainer MYSQL = new MySQLContainer("mysql:8.4");
    static PurchaseAnalyticsService service;
    static DemoPurchaseSeeder seeder;
    static JdbcTemplate jdbc;

    @BeforeAll
    static void migrate() {
        MYSQL.start();
        String url = MYSQL.getJdbcUrl() + "?serverTimezone=Asia/Seoul";
        Flyway.configure()
                .dataSource(url, MYSQL.getUsername(), MYSQL.getPassword())
                .locations("classpath:db/migration")
                .baselineOnMigrate(true)
                .baselineVersion("0")
                .load()
                .migrate();
        DriverManagerDataSource dataSource = new DriverManagerDataSource(url, MYSQL.getUsername(), MYSQL.getPassword());
        jdbc = new JdbcTemplate(dataSource);
        seeder = new DemoPurchaseSeeder(jdbc, new TransactionTemplate(new DataSourceTransactionManager(dataSource)));
        DemoPurchaseSeeder.SeedResult first = seeder.seed();
        DemoPurchaseSeeder.SeedResult second = seeder.seed();
        assertEquals(first.ordersAfter(), second.ordersAfter());
        assertEquals(first.linesAfter(), second.linesAfter());
        assertEquals(12, first.ordersAfter());
        service = new PurchaseAnalyticsService(jdbc);
    }

    @Test
    void seedHasTwelveDemoOrdersButOctoberWindowIsTwo() {
        // purchase_orders DEMO rows (including refunded-only 20251021-1) = 12.
        // PAID distinct orders across the seed = 11. (API max range is 366 days, so use SQL here.)
        Integer storedOrders = jdbc.queryForObject(
                "SELECT COUNT(*) FROM purchase_orders WHERE record_source = 'DEMO'", Integer.class);
        assertEquals(12, storedOrders);
        Integer paidOrders = jdbc.queryForObject("""
                SELECT COUNT(DISTINCT o.order_key)
                FROM purchase_orders o
                JOIN purchase_lines l ON l.order_key = o.order_key
                WHERE o.record_source = 'DEMO' AND l.line_status = 'PAID'
                """, Integer.class);
        assertEquals(11, paidOrders);

        PurchaseAnalyticsResponse october = service.query(range("2026-10-01", "2026-10-31"));
        assertEquals("DATABASE", october.dataBasis());
        assertTrue(october.available());
        assertTrue(october.includesDemoRecords());
        assertTrue(october.sourceLabel().contains("시연용"));
        // Seed October PAID only:
        //   20261001-1 Verify Shade 36_000 (qty 3)
        //   20261015-1 Demo Fact A  28_000 (qty 2) + Demo Lip B 8_500 (qty 1)
        // → 2 orders, qty 6, sales 72_500  (fx-* lines from MathTest are not in the seed)
        assertEquals(2, october.summary().orderCount());
        assertEquals(6, october.summary().quantity());
        assertEquals(72_500, october.summary().salesAmount());
        assertEquals("2026-10-01", october.rangeStartInclusive());
        assertEquals("2026-11-01", october.rangeEndExclusive());

        PurchaseAnalyticsResponse emptyDay = service.query(range("2026-10-02", "2026-10-02"));
        assertEquals(0, emptyDay.summary().orderCount());
        assertEquals(0, emptyDay.summary().salesAmount());
        assertEquals(1, emptyDay.trend().size());
    }

    @Test
    void conflictingFiltersAreEmptyRatherThanAnError() {
        PurchaseAnalyticsResponse response = service.query(new PurchaseAnalyticsQuery(
                LocalDate.parse("2026-10-01"),
                LocalDate.parse("2026-10-31"),
                "DAY",
                "SALES_AMOUNT",
                5,
                List.of("Demo Lip B"),
                List.of("팩트"),
                List.of(),
                "DEMO"));
        assertTrue(response.available());
        assertEquals(0, response.summary().orderCount());
        assertEquals(0, response.summary().salesAmount());
    }

    @Test
    void liveFilterDoesNotReturnDemoRows() {
        PurchaseAnalyticsResponse live = service.query(new PurchaseAnalyticsQuery(
                LocalDate.parse("2026-10-01"),
                LocalDate.parse("2026-10-31"),
                "MONTH",
                "SALES_AMOUNT",
                5,
                List.of(),
                List.of(),
                List.of(),
                "LIVE"));
        assertEquals(0, live.summary().orderCount());
    }

    private static PurchaseAnalyticsQuery range(String from, String to) {
        return new PurchaseAnalyticsQuery(
                LocalDate.parse(from),
                LocalDate.parse(to),
                "DAY",
                "SALES_AMOUNT",
                5,
                List.of(),
                List.of(),
                List.of(),
                "DEMO");
    }
}
