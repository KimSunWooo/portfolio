package com.project.backend_api.purchase;

import org.springframework.stereotype.Component;

import java.time.DateTimeException;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class PurchaseAnalyticsQueryParser {
    private static final Pattern RANGE = Pattern.compile(
            "(\\d{4}-\\d{2}-\\d{2})\\s*(?:~|부터|–|—|to)\\s*(\\d{4}-\\d{2}-\\d{2})(?:까지)?",
            Pattern.CASE_INSENSITIVE);
    private static final Pattern MONTH = Pattern.compile("(20\\d{2})년\\s*(\\d{1,2})월");
    private static final List<String> AGE_BANDS = List.of("10대 이하", "20대", "30대", "40대", "50대 이상", "미상");
    private static final String HELP = "지원 형식: 2026년 10월 20대 매출 또는 2026-10-01~2026-10-31 매출";

    public ParseResult parse(String text, boolean demoOnly, List<String> availableCategories) {
        String source = text == null ? "" : text.trim();
        if (source.isBlank()) return ParseResult.failed("질문을 입력해 주세요.");
        if (source.length() > 500) return ParseResult.failed("질문은 500자 이내로 입력해 주세요.");

        LocalDate from;
        LocalDate to;
        String rest;
        try {
            Matcher range = RANGE.matcher(source);
            if (range.find()) {
                from = LocalDate.parse(range.group(1));
                to = LocalDate.parse(range.group(2));
                rest = range.replaceFirst(" ");
            } else {
                Matcher month = MONTH.matcher(source);
                if (!month.find()) return ParseResult.failed("기간을 인식하지 못했습니다. " + HELP);
                from = LocalDate.of(Integer.parseInt(month.group(1)), Integer.parseInt(month.group(2)), 1);
                to = from.withDayOfMonth(from.lengthOfMonth());
                rest = month.replaceFirst(" ");
            }
        } catch (DateTimeException exception) {
            return ParseResult.failed("유효한 날짜를 입력해 주세요. " + HELP);
        }
        if (to.isBefore(from) || ChronoUnit.DAYS.between(from, to) >= 366) {
            return ParseResult.failed("조회 기간은 시작일 이후부터 최대 366일이어야 합니다.");
        }

        List<String> ages = new ArrayList<>();
        for (String age : AGE_BANDS) {
            Pattern p = Pattern.compile(Pattern.quote(age).replace(" ", "\\E\\s*\\Q"));
            Matcher m = p.matcher(rest);
            if (m.find()) {
                ages.add(age);
                rest = m.replaceAll(" ");
            }
        }

        List<String> categories = new ArrayList<>();
        List<String> sortedCategories = new ArrayList<>(availableCategories == null ? List.of() : availableCategories);
        sortedCategories.removeIf(value -> value == null || value.isBlank());
        sortedCategories.sort(Comparator.comparingInt(String::length).reversed());
        for (String category : sortedCategories) {
            Matcher m = Pattern.compile(Pattern.quote(category), Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE).matcher(rest);
            if (m.find()) {
                categories.add(category);
                rest = m.replaceAll(" ");
            }
        }

        boolean quantity = Pattern.compile("수량|판매량|quantity", Pattern.CASE_INSENSITIVE).matcher(rest).find();
        boolean orders = Pattern.compile("주문\\s*(?:건수|건|수)").matcher(rest).find();
        boolean sales = Pattern.compile("매출|판매\\s*금액|sales", Pattern.CASE_INSENSITIVE).matcher(rest).find();
        if ((quantity ? 1 : 0) + (orders ? 1 : 0) + (sales ? 1 : 0) > 1) {
            return ParseResult.failed("지표는 매출, 수량, 주문 건수 중 하나만 입력해 주세요.");
        }
        String metric = quantity ? "QUANTITY" : orders ? "ORDER_COUNT" : "SALES_AMOUNT";
        boolean weekly = rest.contains("주간") || rest.contains("주별");
        boolean monthly = rest.contains("월간") || rest.contains("월별");
        boolean daily = rest.contains("일간") || rest.contains("일별");
        if ((weekly ? 1 : 0) + (monthly ? 1 : 0) + (daily ? 1 : 0) > 1) {
            return ParseResult.failed("집계 단위는 일별, 주별, 월별 중 하나만 입력해 주세요.");
        }
        String grain = weekly ? "WEEK" : monthly ? "MONTH" : "DAY";

        boolean live = Pattern.compile("LIVE|실제\\s*구매", Pattern.CASE_INSENSITIVE).matcher(rest).find();
        boolean demo = Pattern.compile("DEMO|시연\\s*(?:기록|구매)?", Pattern.CASE_INSENSITIVE).matcher(rest).find();
        if (live && demo) return ParseResult.failed("기록 출처를 하나만 선택해 주세요.");
        if (live && demoOnly) return ParseResult.failed("시연 계정은 시연 기록만 조회할 수 있습니다.");
        String recordSource = demoOnly || demo ? "DEMO" : live ? "LIVE" : "ALL";

        // Reject unrecognised terms instead of silently returning a broader aggregate.
        rest = rest.replaceAll("(?i)quantity|sales|LIVE|DEMO", " ")
                .replaceAll("주문\\s*(?:건수|건|수)|판매\\s*금액|실제\\s*구매|시연\\s*(?:기록|구매)?", " ")
                .replaceAll("매출|수량|판매량|일간|일별|주간|주별|월간|월별", " ")
                .replaceAll("보여주세요|알려주세요|조회해주세요|보여줘|알려줘|조회해줘|조회|전체|의|을|를", " ")
                .replaceAll("[\\s,?!·]+", "").trim();
        if (!rest.isEmpty()) {
            return ParseResult.failed("인식하지 못한 조건이 있습니다: " + rest + ". 아래 필터를 직접 선택해 주세요.");
        }

        Map<String, Object> filters = new LinkedHashMap<>();
        filters.put("from", from.toString());
        filters.put("to", to.toString());
        filters.put("grain", grain);
        filters.put("metric", metric);
        filters.put("topN", 5);
        filters.put("recordSource", recordSource);
        filters.put("category", categories);
        filters.put("product", List.of());
        filters.put("ageBand", ages);
        return ParseResult.ok(filters);
    }

    public record ParseResult(boolean ok, String message, Map<String, Object> filters) {
        static ParseResult ok(Map<String, Object> filters) { return new ParseResult(true, null, filters); }
        static ParseResult failed(String message) { return new ParseResult(false, message, Map.of()); }
    }
}
