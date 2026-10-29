package com.project.backend_api.purchase;

import org.springframework.jdbc.core.JdbcTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.TreeSet;

/**
 * Aggregates rows from purchase_orders / purchase_lines.
 * payment_histories is not used: it has no line items, purchase-time category,
 * unit price, or age. Weeks start on Monday (Asia/Seoul). Day ranges are
 * [from 00:00, to+1 00:00).
 */
public class PurchaseAnalyticsService {

    public static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");
    public static final List<String> AGE_BANDS = List.of("10대 이하", "20대", "30대", "40대", "50대 이상", "미상");
    public static final List<String> RECORD_SOURCES = List.of("ALL", "LIVE", "DEMO");

    private final JdbcTemplate jdbc;

    public PurchaseAnalyticsService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public PurchaseAnalyticsResponse query(PurchaseAnalyticsQuery query) {
        validate(query);
        LocalDateTime aggregatedAt = LocalDateTime.now(SEOUL);
        List<PurchaseLine> lines = load(query).stream()
                .filter(line -> matches(line, query))
                .toList();
        boolean includesDemo = lines.stream().anyMatch(line -> "DEMO".equals(line.recordSource()))
                || "DEMO".equals(query.recordSource())
                || "ALL".equals(query.recordSource());
        return PurchaseAnalyticsResponse.of(query, aggregatedAt, aggregate(lines, query), includesDemo);
    }

    public FilterOptions filterOptions() {
        List<String> products = jdbc.queryForList("""
                SELECT DISTINCT product_name FROM purchase_lines ORDER BY product_name
                """, String.class);
        List<String> categories = jdbc.queryForList("""
                SELECT DISTINCT IFNULL(NULLIF(TRIM(category_name), ''), '미분류') AS category_name
                FROM purchase_lines
                ORDER BY category_name
                """, String.class);
        return new FilterOptions(products, categories, AGE_BANDS, RECORD_SOURCES);
    }

    static void validate(PurchaseAnalyticsQuery query) {
        if (query.from() == null || query.to() == null) {
            throw new IllegalArgumentException("조회 시작일과 종료일이 필요합니다.");
        }
        if (query.to().isBefore(query.from())) {
            throw new IllegalArgumentException("종료일은 시작일보다 빠를 수 없습니다.");
        }
        long days = ChronoUnit.DAYS.between(query.from(), query.to()) + 1;
        if (days > 366) {
            throw new IllegalArgumentException("조회 기간은 366일을 넘길 수 없습니다.");
        }
        if (!List.of("DAY", "WEEK", "MONTH").contains(query.grain())) {
            throw new IllegalArgumentException("집계 단위는 DAY, WEEK, MONTH 중 하나입니다.");
        }
        if (!List.of("SALES_AMOUNT", "QUANTITY", "ORDER_COUNT").contains(query.metric())) {
            throw new IllegalArgumentException("지표는 SALES_AMOUNT, QUANTITY, ORDER_COUNT 중 하나입니다.");
        }
        if (query.topN() < 1 || query.topN() > 20) {
            throw new IllegalArgumentException("Top N은 1부터 20까지입니다.");
        }
        if (!RECORD_SOURCES.contains(query.recordSource())) {
            throw new IllegalArgumentException("기록 출처는 ALL, LIVE, DEMO 중 하나입니다.");
        }
        for (String band : query.ageBands()) {
            if (!AGE_BANDS.contains(band)) {
                throw new IllegalArgumentException("지원하지 않는 연령대입니다.");
            }
        }
    }

    static Aggregate aggregate(List<PurchaseLine> lines, PurchaseAnalyticsQuery query) {
        List<PurchaseLine> paid = lines.stream().filter(PurchaseLine::paid).toList();
        long sales = paid.stream().mapToLong(PurchaseLine::amount).sum();
        long quantity = paid.stream().mapToLong(PurchaseLine::quantity).sum();
        long orders = paid.stream().map(PurchaseLine::orderKey).distinct().count();
        long cancelledQuantity = lines.stream().filter(line -> "CANCELLED".equals(line.status())).mapToLong(PurchaseLine::quantity).sum();
        long cancelledAmount = lines.stream().filter(line -> "CANCELLED".equals(line.status())).mapToLong(PurchaseLine::amount).sum();
        long refundedQuantity = lines.stream().filter(line -> "REFUNDED".equals(line.status())).mapToLong(PurchaseLine::quantity).sum();
        long refundedAmount = lines.stream().filter(line -> "REFUNDED".equals(line.status())).mapToLong(PurchaseLine::amount).sum();

        Map<String, MutableMetric> byProduct = new LinkedHashMap<>();
        for (PurchaseLine line : paid) {
            byProduct.computeIfAbsent(line.productName(), key -> new MutableMetric()).add(line);
        }
        List<NamedMetric> products = byProduct.entrySet().stream()
                .map(entry -> entry.getValue().named(entry.getKey()))
                .sorted(metricOrder(query.metric()))
                .toList();
        List<NamedMetric> shown = products.stream().limit(query.topN()).toList();
        List<NamedMetric> omittedProducts = products.stream().skip(query.topN()).toList();

        Map<String, MutableMetric> byCategory = new TreeMap<>();
        for (PurchaseLine line : paid) {
            byCategory.computeIfAbsent(line.categoryLabel(), key -> new MutableMetric()).add(line);
        }
        for (PurchaseLine line : lines) {
            if (!line.paid()) {
                byCategory.computeIfAbsent(line.categoryLabel(), key -> new MutableMetric());
            }
        }
        List<NamedMetric> categories = byCategory.entrySet().stream()
                .map(entry -> entry.getValue().named(entry.getKey()))
                .toList();

        Map<String, MutableMetric> byAge = new LinkedHashMap<>();
        for (String band : AGE_BANDS) {
            byAge.put(band, new MutableMetric());
        }
        for (PurchaseLine line : paid) {
            byAge.computeIfAbsent(line.ageBand(), key -> new MutableMetric()).add(line);
        }

        Map<String, MutableMetric> trend = new LinkedHashMap<>();
        for (String bucket : buckets(query.from(), query.to(), query.grain())) {
            trend.put(bucket, new MutableMetric());
        }
        for (PurchaseLine line : paid) {
            String bucket = bucket(line.purchasedAt().toLocalDate(), query.grain());
            MutableMetric metric = trend.get(bucket);
            if (metric != null) {
                metric.add(line);
            }
        }

        Map<String, MutableMetric> cross = new TreeMap<>();
        for (PurchaseLine line : paid) {
            String key = line.ageBand() + "\t" + line.categoryLabel();
            cross.computeIfAbsent(key, ignored -> new MutableMetric()).add(line);
        }

        return new Aggregate(
                orders, quantity, sales, cancelledQuantity, cancelledAmount, refundedQuantity, refundedAmount,
                shown,
                omittedProducts.stream().mapToLong(NamedMetric::salesAmount).sum(),
                omittedProducts.stream().mapToLong(NamedMetric::quantity).sum(),
                omittedProducts.size(),
                categories,
                byAge.entrySet().stream().map(entry -> entry.getValue().named(entry.getKey())).toList(),
                trend.entrySet().stream().map(entry -> entry.getValue().named(entry.getKey())).toList(),
                products,
                cross.entrySet().stream().map(entry -> {
                    String[] parts = entry.getKey().split("\t", 2);
                    return new CrossCell(parts[0], parts[1], entry.getValue().named(parts[1]));
                }).toList()
        );
    }

    private List<PurchaseLine> load(PurchaseAnalyticsQuery query) {
        String sourceClause = "ALL".equals(query.recordSource())
                ? ""
                : " AND o.record_source = '" + query.recordSource() + "'";
        return jdbc.query("""
                SELECT o.order_key, o.purchased_at, o.age_at_purchase, o.age_band, o.record_source,
                       l.product_name, l.category_name, l.unit_price, l.quantity, l.line_discount,
                       l.line_amount, l.line_status
                FROM purchase_lines l
                JOIN purchase_orders o ON o.order_key = l.order_key
                WHERE o.purchased_at >= ? AND o.purchased_at < ?
                """ + sourceClause, (rs, row) -> new PurchaseLine(
                rs.getString("order_key"),
                parseWall(rs.getString("purchased_at")),
                (Integer) rs.getObject("age_at_purchase"),
                rs.getString("age_band"),
                rs.getString("record_source"),
                rs.getString("product_name"),
                rs.getString("category_name"),
                rs.getInt("unit_price"),
                rs.getInt("quantity"),
                rs.getInt("line_discount"),
                rs.getInt("line_amount"),
                rs.getString("line_status")
        ), query.from() + " 00:00:00", query.to().plusDays(1) + " 00:00:00");
    }

    private static boolean matches(PurchaseLine line, PurchaseAnalyticsQuery query) {
        if (!query.products().isEmpty() && query.products().stream().noneMatch(line.productName()::equals)) {
            return false;
        }
        if (!query.categories().isEmpty() && query.categories().stream().noneMatch(line.categoryLabel()::equals)) {
            return false;
        }
        return query.ageBands().isEmpty() || query.ageBands().contains(line.ageBand());
    }

    static List<String> buckets(LocalDate from, LocalDate to, String grain) {
        List<String> buckets = new ArrayList<>();
        if ("MONTH".equals(grain)) {
            LocalDate cursor = from.withDayOfMonth(1);
            LocalDate end = to.withDayOfMonth(1);
            while (!cursor.isAfter(end)) {
                buckets.add(bucket(cursor, grain));
                cursor = cursor.plusMonths(1);
            }
            return buckets;
        }
        if ("WEEK".equals(grain)) {
            LocalDate cursor = from.with(TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
            LocalDate end = to.with(TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY));
            while (!cursor.isAfter(end)) {
                buckets.add(bucket(cursor, grain));
                cursor = cursor.plusWeeks(1);
            }
            return buckets;
        }
        LocalDate cursor = from;
        while (!cursor.isAfter(to)) {
            buckets.add(bucket(cursor, grain));
            cursor = cursor.plusDays(1);
        }
        return buckets;
    }

    static String bucket(LocalDate date, String grain) {
        if ("MONTH".equals(grain)) {
            return date.getYear() + "-" + String.format("%02d", date.getMonthValue());
        }
        if ("WEEK".equals(grain)) {
            return date.with(TemporalAdjusters.previousOrSame(java.time.DayOfWeek.MONDAY)).toString();
        }
        return date.toString();
    }

    static String ageBand(Integer age) {
        if (age == null) {
            return "미상";
        }
        if (age <= 19) {
            return "10대 이하";
        }
        if (age <= 29) {
            return "20대";
        }
        if (age <= 39) {
            return "30대";
        }
        if (age <= 49) {
            return "40대";
        }
        return "50대 이상";
    }

    private static Comparator<NamedMetric> metricOrder(String metric) {
        Comparator<NamedMetric> primary = switch (metric) {
            case "QUANTITY" -> Comparator.comparingLong(NamedMetric::quantity);
            case "ORDER_COUNT" -> Comparator.comparingLong(NamedMetric::orderCount);
            default -> Comparator.comparingLong(NamedMetric::salesAmount);
        };
        return primary.reversed().thenComparing(NamedMetric::name);
    }

    private static LocalDateTime parseWall(String value) {
        String text = value.trim().replace(' ', 'T');
        return LocalDateTime.parse(text.substring(0, Math.min(text.length(), 19)));
    }

    public record FilterOptions(
            List<String> products,
            List<String> categories,
            List<String> ageBands,
            List<String> recordSources
    ) {
    }

    public record PurchaseLine(
            String orderKey,
            LocalDateTime purchasedAt,
            Integer ageAtPurchase,
            String storedAgeBand,
            String recordSource,
            String productName,
            String categoryName,
            int unitPrice,
            int quantity,
            int lineDiscount,
            int lineAmount,
            String status
    ) {
        long amount() {
            return lineAmount;
        }

        boolean paid() {
            return "PAID".equals(status);
        }

        String categoryLabel() {
            return categoryName == null || categoryName.isBlank() ? "미분류" : categoryName;
        }

        String ageBand() {
            if (storedAgeBand != null && !storedAgeBand.isBlank()) {
                return storedAgeBand;
            }
            return PurchaseAnalyticsService.ageBand(ageAtPurchase);
        }
    }

    public record NamedMetric(String name, long orderCount, long quantity, long salesAmount) {
    }

    public record CrossCell(String ageBand, String category, NamedMetric metric) {
    }

    public record Aggregate(
            long orderCount,
            long quantity,
            long salesAmount,
            long cancelledQuantity,
            long cancelledAmount,
            long refundedQuantity,
            long refundedAmount,
            List<NamedMetric> shownProducts,
            long omittedSalesAmount,
            long omittedQuantity,
            int omittedProductCount,
            List<NamedMetric> categories,
            List<NamedMetric> ages,
            List<NamedMetric> trend,
            List<NamedMetric> rows,
            List<CrossCell> cross
    ) {
    }

    private static final class MutableMetric {
        private final TreeSet<String> orders = new TreeSet<>();
        private long quantity;
        private long salesAmount;

        void add(PurchaseLine line) {
            orders.add(line.orderKey());
            quantity += line.quantity();
            salesAmount += line.amount();
        }

        NamedMetric named(String name) {
            return new NamedMetric(name, orders.size(), quantity, salesAmount);
        }
    }
}
