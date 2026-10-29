package com.project.backend_api.purchase;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.testcontainers.mysql.MySQLContainer;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PurchaseAnalyticsMySqlTest {

    static final MySQLContainer MYSQL = new MySQLContainer("mysql:8.4");
    static PurchaseAnalyticsService service;

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
        JdbcTemplate jdbc = new JdbcTemplate(new DriverManagerDataSource(url, MYSQL.getUsername(), MYSQL.getPassword()));
        new MockPurchaseSeed(jdbc).seedIfEmpty();
        new MockPurchaseSeed(jdbc).seedIfEmpty();
        service = new PurchaseAnalyticsService(jdbc, "MOCK");
    }

    @Test
    void storedFixtureKeepsTheOctoberBoundary() {
        PurchaseAnalyticsResponse october = service.query(range("2026-10-01", "2026-10-31"));
        assertEquals("MOCK", october.source());
        assertTrue(october.available());
        assertEquals("MOCK 데이터 / 시연용 구매 통계", october.sourceLabel());
        assertEquals(4, october.summary().orderCount());
        assertEquals(6, october.summary().quantity());
        assertEquals(65_000, october.summary().salesAmount());
        assertEquals("2026-10-01", october.rangeStartInclusive());
        assertEquals("2026-11-01", october.rangeEndExclusive());

        PurchaseAnalyticsResponse before = service.query(range("2026-09-30", "2026-09-30"));
        assertEquals(1, before.summary().orderCount());
        assertEquals(10_000, before.summary().salesAmount());

        PurchaseAnalyticsResponse after = service.query(range("2026-11-01", "2026-11-01"));
        assertEquals(1, after.summary().orderCount());
        assertEquals(72_000, after.summary().salesAmount());

        PurchaseAnalyticsResponse emptyDay = service.query(range("2026-10-02", "2026-10-02"));
        assertEquals(0, emptyDay.summary().orderCount());
        assertFalse(emptyDay.trend().isEmpty());
    }

    @Test
    void conflictingFiltersAreEmptyRatherThanAnError() {
        PurchaseAnalyticsResponse response = service.query(new PurchaseAnalyticsQuery(
                LocalDate.parse("2026-10-01"),
                LocalDate.parse("2026-10-31"),
                "DAY",
                "SALES_AMOUNT",
                5,
                List.of("Lip B"),
                List.of("팩트"),
                List.of()));
        assertTrue(response.available());
        assertEquals(0, response.summary().orderCount());
        assertEquals(0, response.summary().salesAmount());
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
                List.of());
    }
}
