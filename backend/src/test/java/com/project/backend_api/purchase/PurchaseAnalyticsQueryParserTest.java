package com.project.backend_api.purchase;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PurchaseAnalyticsQueryParserTest {

    private final PurchaseAnalyticsQueryParser parser = new PurchaseAnalyticsQueryParser();

    @Test
    void parsesMonthMetricAndForcesDemoSource() {
        PurchaseAnalyticsQueryParser.ParseResult result =
                parser.parse("2026년 10월 LIP 매출 보여줘", true, List.of("LIP"));
        assertTrue(result.ok());
        assertEquals("2026-10-01", result.filters().get("from"));
        assertEquals("2026-10-31", result.filters().get("to"));
        assertEquals("SALES_AMOUNT", result.filters().get("metric"));
        assertEquals("DEMO", result.filters().get("recordSource"));
        assertEquals(List.of("LIP"), result.filters().get("category"));
    }

    @Test
    void failsWithoutPeriodSoUiCanContinue() {
        PurchaseAnalyticsQueryParser.ParseResult result = parser.parse("매출 알려줘", false, List.of());
        assertFalse(result.ok());
        assertTrue(result.message().contains("기간"));
    }

    @Test
    void ageAndCategoryAreBothApplied() {
        var result = parser.parse("2026년 10월 20대 cheek 매출", false, List.of("Cheek"));
        assertTrue(result.ok());
        assertEquals(List.of("20대"), result.filters().get("ageBand"));
        assertEquals(List.of("Cheek"), result.filters().get("category"));
        assertEquals(List.of(), result.filters().get("product"));
    }

    @Test
    void unsupportedConditionsNeverBecomeSuccessfulBroaderQueries() {
        for (String text : List.of("2026년 10월 20대 남성 매출", "2026년 10월 60대 매출",
                "2026년 10월 없는상품 매출", "2026년 10월 20대 이상 매출")) {
            assertFalse(parser.parse(text, false, List.of("Cheek")).ok(), text);
        }
    }

    @Test
    void invalidDatesAndAmbiguousMetricsAreRejected() {
        assertFalse(parser.parse("2026년 13월 매출", false, List.of()).ok());
        assertFalse(parser.parse("2026-11-01~2026-10-01 매출", false, List.of()).ok());
        assertFalse(parser.parse("2026년 10월 매출 수량", false, List.of()).ok());
    }

    @Test
    void fullRangeResetsOptionalFiltersAndDemoCannotRequestLive() {
        var result = parser.parse("2026년 10월 전체 매출", false, List.of());
        assertTrue(result.ok());
        assertEquals(List.of(), result.filters().get("ageBand"));
        assertEquals(List.of(), result.filters().get("category"));
        assertEquals("ALL", result.filters().get("recordSource"));
        assertFalse(parser.parse("2026년 10월 LIVE 매출", true, List.of()).ok());
        assertEquals(List.of("50대 이상"),
                parser.parse("2026년 10월 50대 이상 매출", false, List.of()).filters().get("ageBand"));
    }
}
