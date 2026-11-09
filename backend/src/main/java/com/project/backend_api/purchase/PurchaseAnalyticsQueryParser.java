package com.project.backend_api.purchase;

import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class PurchaseAnalyticsQueryParser {

    private static final Pattern RANGE = Pattern.compile("(\\d{4}-\\d{2}-\\d{2}).{0,12}(\\d{4}-\\d{2}-\\d{2})");
    private static final Pattern MONTH = Pattern.compile("(20\\d{2})년\\s*(\\d{1,2})월");

    public ParseResult parse(String text, boolean demoOnly) {
        String source = text == null ? "" : text.trim();
        if (source.isBlank()) {
            return ParseResult.failed("질문을 입력해 주세요.");
        }
        LocalDate from = null;
        LocalDate to = null;
        Matcher range = RANGE.matcher(source);
        if (range.find()) {
            from = LocalDate.parse(range.group(1));
            to = LocalDate.parse(range.group(2));
        } else {
            Matcher month = MONTH.matcher(source);
            if (month.find()) {
                int year = Integer.parseInt(month.group(1));
                int monthValue = Integer.parseInt(month.group(2));
                from = LocalDate.of(year, monthValue, 1);
                to = from.withDayOfMonth(from.lengthOfMonth());
            }
        }
        if (from == null || to == null) {
            return ParseResult.failed("기간을 인식하지 못했습니다. 예: 2026년 10월 또는 2026-10-01~2026-10-31");
        }

        String metric = "SALES_AMOUNT";
        String lower = source.toLowerCase(Locale.ROOT);
        if (source.contains("수량") || lower.contains("quantity")) {
            metric = "QUANTITY";
        } else if (source.contains("주문") && (source.contains("건") || source.contains("수"))) {
            metric = "ORDER_COUNT";
        }

        String grain = "DAY";
        if (source.contains("주간") || source.contains("주별")) {
            grain = "WEEK";
        } else if (source.contains("월간") || source.contains("월별")) {
            grain = "MONTH";
        }

        List<String> categories = new ArrayList<>();
        for (String candidate : List.of("LIP", "Cheek", "FOundation", "미분류")) {
            if (source.contains(candidate) || source.toLowerCase(Locale.ROOT).contains(candidate.toLowerCase(Locale.ROOT))) {
                categories.add(candidate);
            }
        }

        Map<String, Object> filters = new LinkedHashMap<>();
        filters.put("from", from.toString());
        filters.put("to", to.toString());
        filters.put("grain", grain);
        filters.put("metric", metric);
        filters.put("topN", 5);
        filters.put("recordSource", demoOnly ? "DEMO" : "ALL");
        filters.put("category", categories);
        filters.put("product", List.of());
        filters.put("ageBand", List.of());
        return ParseResult.ok(filters);
    }

    public record ParseResult(boolean ok, String message, Map<String, Object> filters) {
        static ParseResult ok(Map<String, Object> filters) {
            return new ParseResult(true, null, filters);
        }

        static ParseResult failed(String message) {
            return new ParseResult(false, message, Map.of());
        }
    }
}
