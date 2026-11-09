package com.project.backend_api.purchase;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PurchaseAnalyticsQueryParserTest {

    private final PurchaseAnalyticsQueryParser parser = new PurchaseAnalyticsQueryParser();

    @Test
    void parsesMonthMetricAndForcesDemoSource() {
        PurchaseAnalyticsQueryParser.ParseResult result =
                parser.parse("2026년 10월 LIP 매출 보여줘", true);
        assertTrue(result.ok());
        assertEquals("2026-10-01", result.filters().get("from"));
        assertEquals("2026-10-31", result.filters().get("to"));
        assertEquals("SALES_AMOUNT", result.filters().get("metric"));
        assertEquals("DEMO", result.filters().get("recordSource"));
    }

    @Test
    void failsWithoutPeriodSoUiCanContinue() {
        PurchaseAnalyticsQueryParser.ParseResult result = parser.parse("매출 알려줘", false);
        assertFalse(result.ok());
        assertTrue(result.message().contains("기간"));
    }
}
