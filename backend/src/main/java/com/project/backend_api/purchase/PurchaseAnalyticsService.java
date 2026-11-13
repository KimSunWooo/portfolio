package com.project.backend_api.purchase;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionOperations;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

/**
 * Aggregates purchase_orders / purchase_lines.
 * payment_histories is not used: it has no line items, purchase-time category,
 * unit price, or age. Weeks start on Monday (Asia/Seoul). Day ranges are
 * [from 00:00, to+1 00:00).
 *
 * <h3>Where each step runs</h3>
 * SQL (bound parameters, a single statement, only a few hundred grouped rows leave MySQL):
 * range / source / product / category / age-band filtering, PAID vs CANCELLED vs REFUNDED sums,
 * distinct-order counts, and grouping by (age band, bucket), product and (age band, category).
 * <p>
 * Java: request validation, zero-filled empty buckets and age bands (needs the calendar, not data),
 * adding up cells that cannot overlap (an order has one age band and one bucket, so per-cell
 * distinct-order counts sum exactly), ordering and the top-N / "others" split, and response assembly.
 * Ordering stays in Java on purpose: the contract is {@code String.compareTo} (UTF-16 code unit
 * order) with the product name as the tie-break, which MySQL collations do not reproduce. The
 * product list is returned in full ({@code rows}), so SQL top-N would save no rows; "others" is
 * derived from the same list. See {@link #aggregateInSnapshot} for why it is one statement.
 *
 * <h3>Equality rules</h3>
 * Grouping and filtering compare strings with {@code utf8mb4_0900_bin} (case/accent sensitive,
 * NO PAD) to match the former {@code String.equals}. The tables use the server default
 * {@code utf8mb4_0900_ai_ci}, which would silently merge "Lip"/"lip" and ignore trailing spaces.
 * Timestamps are DATETIME wall-clock values in Asia/Seoul and are bound as text, so neither the
 * JDBC driver nor the session time zone can shift a bucket.
 *
 * <h3>Consistency</h3>
 * The aggregate is one statement, and a single InnoDB statement reads one snapshot at any isolation
 * level, so its parts cannot disagree. The statement still runs inside a REPEATABLE READ read-only
 * transaction so a future second statement (and {@link #filterOptions(boolean)}, which does run
 * two) shares the same snapshot instead of silently tearing. Before this change a request issued one
 * auto-commit query, so it was also consistent, but only because everything was summed in Java.
 */
public class PurchaseAnalyticsService {

    public static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");
    public static final List<String> AGE_BANDS = List.of("10대 이하", "20대", "30대", "40대", "50대 이상", "미상");
    public static final List<String> RECORD_SOURCES = List.of("ALL", "LIVE", "DEMO");

    private static final String BIN = " COLLATE utf8mb4_0900_bin";
    private static final String PAID = "(l.line_status" + BIN + " = 'PAID')";
    private static final String CANCELLED = "(l.line_status" + BIN + " = 'CANCELLED')";
    private static final String REFUNDED = "(l.line_status" + BIN + " = 'REFUNDED')";
    /** Same rule as the former Java categoryLabel(): blank/NULL becomes 미분류, otherwise the stored text unchanged. */
    private static final String CATEGORY_LABEL =
            "(CASE WHEN l.category_name IS NULL OR TRIM(l.category_name) = '' THEN '미분류' ELSE l.category_name END)";
    /** Same rule as the former Java ageBand(): stored band when not blank, else derived from age_at_purchase. */
    private static final String AGE_BAND_LABEL = "(CASE"
            + " WHEN o.age_band IS NOT NULL AND TRIM(o.age_band) <> '' THEN o.age_band"
            + " WHEN o.age_at_purchase IS NULL THEN '" + AGE_BANDS.get(5) + "'"
            + " WHEN o.age_at_purchase <= 19 THEN '" + AGE_BANDS.get(0) + "'"
            + " WHEN o.age_at_purchase <= 29 THEN '" + AGE_BANDS.get(1) + "'"
            + " WHEN o.age_at_purchase <= 39 THEN '" + AGE_BANDS.get(2) + "'"
            + " WHEN o.age_at_purchase <= 49 THEN '" + AGE_BANDS.get(3) + "'"
            + " ELSE '" + AGE_BANDS.get(4) + "' END)";

    private final JdbcTemplate jdbc;
    private final TransactionOperations snapshot;

    /** Builds a REPEATABLE READ read-only transaction on the JdbcTemplate's own DataSource. */
    public PurchaseAnalyticsService(JdbcTemplate jdbc) {
        this(jdbc, jdbc == null || jdbc.getDataSource() == null
                ? TransactionOperations.withoutTransaction()
                : snapshotOperations(new DataSourceTransactionManager(jdbc.getDataSource())));
    }

    public PurchaseAnalyticsService(JdbcTemplate jdbc, TransactionOperations snapshot) {
        this.jdbc = jdbc;
        this.snapshot = snapshot;
    }

    public static TransactionOperations snapshotOperations(PlatformTransactionManager transactionManager) {
        TransactionTemplate template = new TransactionTemplate(transactionManager);
        template.setIsolationLevel(TransactionDefinition.ISOLATION_REPEATABLE_READ);
        template.setReadOnly(true);
        return template;
    }

    public PurchaseAnalyticsResponse query(PurchaseAnalyticsQuery query) {
        LocalDateTime aggregatedAt = LocalDateTime.now(SEOUL);
        Aggregate aggregate = aggregate(query);
        // A LIVE-only query cannot contain DEMO rows; ALL and DEMO are labelled as including them.
        boolean includesDemo = !"LIVE".equals(query.recordSource());
        return PurchaseAnalyticsResponse.of(query, aggregatedAt, aggregate, includesDemo);
    }

    Aggregate aggregate(PurchaseAnalyticsQuery query) {
        validate(query);
        return snapshot.execute(status -> aggregateInSnapshot(query));
    }

    public FilterOptions filterOptions() {
        return filterOptions(false);
    }

    public FilterOptions filterOptions(boolean demoOnly) {
        return snapshot.execute(status -> filterOptionsInSnapshot(demoOnly));
    }

    private FilterOptions filterOptionsInSnapshot(boolean demoOnly) {
        String sourceJoin = demoOnly
                ? " JOIN purchase_orders o ON o.order_key = l.order_key WHERE o.record_source = 'DEMO'"
                : "";
        List<String> products = jdbc.queryForList("""
                SELECT DISTINCT l.product_name FROM purchase_lines l
                """ + sourceJoin + """
                 ORDER BY l.product_name
                """, String.class);
        List<String> categories = jdbc.queryForList("""
                SELECT DISTINCT IFNULL(NULLIF(TRIM(l.category_name), ''), '미분류') AS category_name
                FROM purchase_lines l
                """ + sourceJoin + """
                 ORDER BY category_name
                """, String.class);
        List<String> sources = demoOnly ? List.of("DEMO") : RECORD_SOURCES;
        return new FilterOptions(products, categories, AGE_BANDS, sources);
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

    /**
     * One statement, one scan. The filtered lines are materialised once as CTE {@code f} (the per-row
     * join to purchase_orders is the dominant cost, so it must not be repeated per grouping) and three
     * GROUP BY branches read it:
     * <ul>
     *   <li>A: (age band, bucket) - order-level attributes, so each order sits in exactly one cell and
     *       distinct-order counts can be summed over cells in Java for the summary, ages and trend;</li>
     *   <li>P: product, paid lines only (needs its own DISTINCT because an order has many products);</li>
     *   <li>C: (age band, category), all statuses so status-only categories survive; categories are the
     *       sum over age bands (again one band per order), cross cells are the cells with paid lines.</li>
     * </ul>
     * NO_MERGE keeps MySQL from inlining the CTE into each branch, which would redo the join three times.
     */
    private Aggregate aggregateInSnapshot(PurchaseAnalyticsQuery query) {
        Filter filter = Filter.of(query);
        String sql = "WITH f AS (SELECT o.order_key AS k_order,"
                + " l.product_name" + BIN + " AS k_prod,"
                + " " + CATEGORY_LABEL + BIN + " AS k_cat,"
                + " " + AGE_BAND_LABEL + BIN + " AS k_age,"
                + " " + bucketExpression(query.grain()) + " AS k_bucket,"
                + " " + PAID + " AS is_paid, " + CANCELLED + " AS is_cancelled, " + REFUNDED + " AS is_refunded,"
                + " l.quantity AS qty, l.line_amount AS amt"
                + " FROM purchase_lines l JOIN purchase_orders o ON o.order_key = l.order_key WHERE " + filter.where() + ")"
                + " SELECT /*+ NO_MERGE(f) */ 'A' AS kind, k_age AS k1, k_bucket AS k2,"
                + " COUNT(DISTINCT CASE WHEN is_paid THEN k_order END) AS orders, SUM(is_paid * qty) AS quantity,"
                + " SUM(is_paid * amt) AS sales, SUM(is_cancelled * qty) AS cancelled_qty, SUM(is_cancelled * amt) AS cancelled_amt,"
                + " SUM(is_refunded * qty) AS refunded_qty, SUM(is_refunded * amt) AS refunded_amt, SUM(is_paid) AS paid_lines"
                + " FROM f GROUP BY k_age, k_bucket"
                + " UNION ALL SELECT /*+ NO_MERGE(f) */ 'P', k_prod, NULL,"
                + " COUNT(DISTINCT k_order), SUM(qty), SUM(amt), 0, 0, 0, 0, COUNT(*)"
                + " FROM f WHERE is_paid GROUP BY k_prod"
                + " UNION ALL SELECT /*+ NO_MERGE(f) */ 'C', k_age, k_cat,"
                + " COUNT(DISTINCT CASE WHEN is_paid THEN k_order END), SUM(is_paid * qty), SUM(is_paid * amt), 0, 0, 0, 0, SUM(is_paid)"
                + " FROM f GROUP BY k_age, k_cat";
        List<Row> rows = jdbc.query(sql, (rs, n) -> new Row(
                rs.getString("kind"), rs.getString("k1"), rs.getString("k2"),
                rs.getLong("orders"), rs.getLong("quantity"), rs.getLong("sales"),
                rs.getLong("cancelled_qty"), rs.getLong("cancelled_amt"),
                rs.getLong("refunded_qty"), rs.getLong("refunded_amt"), rs.getLong("paid_lines")), filter.args());

        long orders = 0;
        long quantity = 0;
        long sales = 0;
        long cancelledQuantity = 0;
        long cancelledAmount = 0;
        long refundedQuantity = 0;
        long refundedAmount = 0;
        Map<String, Acc> byAge = new LinkedHashMap<>();
        for (String band : AGE_BANDS) {
            byAge.put(band, new Acc());
        }
        Map<String, Acc> trend = new LinkedHashMap<>();
        for (String bucket : buckets(query.from(), query.to(), query.grain())) {
            trend.put(bucket, new Acc());
        }
        Map<String, Acc> byCategory = new TreeMap<>();
        Map<String, CrossCell> cross = new TreeMap<>();
        List<NamedMetric> products = new ArrayList<>();
        Map<String, Acc> extraAges = new TreeMap<>();

        for (Row row : rows) {
            switch (row.kind()) {
                case "A" -> {
                    orders += row.orders();
                    quantity += row.quantity();
                    sales += row.sales();
                    cancelledQuantity += row.cancelledQuantity();
                    cancelledAmount += row.cancelledAmount();
                    refundedQuantity += row.refundedQuantity();
                    refundedAmount += row.refundedAmount();
                    if (row.paidLines() > 0) {
                        (byAge.containsKey(row.k1()) ? byAge : extraAges).computeIfAbsent(row.k1(), key -> new Acc()).add(row);
                        Acc bucket = trend.get(row.k2());
                        if (bucket != null) {
                            bucket.add(row);
                        }
                    }
                }
                case "P" -> products.add(new NamedMetric(row.k1(), row.orders(), row.quantity(), row.sales()));
                case "C" -> {
                    byCategory.computeIfAbsent(row.k2(), key -> new Acc()).add(row);
                    if (row.paidLines() > 0) {
                        cross.put(row.k1() + "\t" + row.k2(), new CrossCell(row.k1(), row.k2(),
                                new NamedMetric(row.k2(), row.orders(), row.quantity(), row.sales())));
                    }
                }
                default -> throw new IllegalStateException("unexpected analytics row kind " + row.kind());
            }
        }
        extraAges.forEach(byAge::put);
        products.sort(metricOrder(query.metric()));
        List<NamedMetric> shown = products.stream().limit(query.topN()).toList();
        List<NamedMetric> omitted = products.stream().skip(query.topN()).toList();

        return new Aggregate(
                orders, quantity, sales, cancelledQuantity, cancelledAmount, refundedQuantity, refundedAmount,
                shown,
                omitted.stream().mapToLong(NamedMetric::salesAmount).sum(),
                omitted.stream().mapToLong(NamedMetric::quantity).sum(),
                omitted.size(),
                named(byCategory),
                named(byAge),
                named(trend),
                List.copyOf(products),
                List.copyOf(cross.values())
        );
    }

    private static List<NamedMetric> named(Map<String, Acc> metrics) {
        return metrics.entrySet().stream().map(entry -> entry.getValue().named(entry.getKey())).toList();
    }

    /** Fixed SQL per validated grain (never built from request text). Week starts Monday via WEEKDAY(). */
    private static String bucketExpression(String grain) {
        return switch (grain) {
            case "MONTH" -> "DATE_FORMAT(o.purchased_at, '%Y-%m')";
            case "WEEK" -> "DATE_FORMAT(DATE_SUB(DATE(o.purchased_at), INTERVAL WEEKDAY(o.purchased_at) DAY), '%Y-%m-%d')";
            default -> "DATE_FORMAT(o.purchased_at, '%Y-%m-%d')";
        };
    }

    private record Row(
            String kind, String k1, String k2, long orders, long quantity, long sales,
            long cancelledQuantity, long cancelledAmount, long refundedQuantity, long refundedAmount, long paidLines
    ) {
    }

    /** Sums cells of one dimension; valid for distinct-order counts because an order has one age band and one bucket. */
    private static final class Acc {
        private long orders;
        private long quantity;
        private long sales;

        void add(Row row) {
            orders += row.orders();
            quantity += row.quantity();
            sales += row.sales();
        }

        NamedMetric named(String name) {
            return new NamedMetric(name, orders, quantity, sales);
        }
    }

    /** WHERE text with {@code ?} placeholders plus its bound values (dates, source, filter values). */
    private record Filter(String where, Object[] args) {

        static Filter of(PurchaseAnalyticsQuery query) {
            StringBuilder where = new StringBuilder("o.purchased_at >= ? AND o.purchased_at < ?");
            List<Object> args = new ArrayList<>();
            args.add(query.from() + " 00:00:00");
            args.add(query.to().plusDays(1) + " 00:00:00");
            if (!"ALL".equals(query.recordSource())) {
                where.append(" AND o.record_source = ?");
                args.add(query.recordSource());
            }
            in(where, args, "l.product_name" + BIN, query.products());
            in(where, args, CATEGORY_LABEL + BIN, query.categories());
            in(where, args, AGE_BAND_LABEL + BIN, query.ageBands());
            return new Filter(where.toString(), args.toArray());
        }

        private static void in(StringBuilder where, List<Object> args, String expression, List<String> values) {
            if (values.isEmpty()) {
                return;
            }
            where.append(" AND ").append(expression).append(" IN (")
                    .append(String.join(", ", Collections.nCopies(values.size(), "?"))).append(')');
            args.addAll(values);
        }
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

    public record FilterOptions(
            List<String> products,
            List<String> categories,
            List<String> ageBands,
            List<String> recordSources
    ) {
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
}
