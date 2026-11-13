package com.project.backend_api.purchase;

import org.springframework.jdbc.core.JdbcTemplate;

import com.project.backend_api.purchase.PurchaseAnalyticsService.Aggregate;
import com.project.backend_api.purchase.PurchaseAnalyticsService.CrossCell;
import com.project.backend_api.purchase.PurchaseAnalyticsService.NamedMetric;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.TreeSet;

/**
 * Verbatim copy of the pre-SQL-aggregation implementation (load every matching row, filter and
 * sum in Java), kept in test scope as
 * <ul>
 *   <li>the oracle that SQL aggregation must reproduce exactly, and</li>
 *   <li>the "before" side of the benchmark.</li>
 * </ul>
 * Only the entry point ({@link #aggregate(JdbcTemplate, PurchaseAnalyticsQuery)}) and the record
 * placement changed; the load/matches/aggregate bodies are the original ones.
 */
final class LegacyJavaPurchaseAnalytics {

    private LegacyJavaPurchaseAnalytics() {
    }

    static Aggregate aggregate(JdbcTemplate jdbc, PurchaseAnalyticsQuery query) {
        PurchaseAnalyticsService.validate(query);
        List<PurchaseLine> lines = load(jdbc, query).stream()
                .filter(line -> matches(line, query))
                .toList();
        return aggregate(lines, query);
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
        for (String band : PurchaseAnalyticsService.AGE_BANDS) {
            byAge.put(band, new MutableMetric());
        }
        for (PurchaseLine line : paid) {
            byAge.computeIfAbsent(line.ageBand(), key -> new MutableMetric()).add(line);
        }

        Map<String, MutableMetric> trend = new LinkedHashMap<>();
        for (String bucket : PurchaseAnalyticsService.buckets(query.from(), query.to(), query.grain())) {
            trend.put(bucket, new MutableMetric());
        }
        for (PurchaseLine line : paid) {
            String bucket = PurchaseAnalyticsService.bucket(line.purchasedAt().toLocalDate(), query.grain());
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

    static List<PurchaseLine> load(JdbcTemplate jdbc, PurchaseAnalyticsQuery query) {
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

    record PurchaseLine(
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
