package com.project.backend_api.purchase;

import com.project.backend_api.purchase.PurchaseAnalyticsService.Aggregate;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.transaction.support.TransactionTemplate;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * Before/after benchmark for purchase analytics on an isolated Testcontainers MySQL. Excluded from the
 * normal {@code test} task; run with {@code ./gradlew purchaseAnalyticsBenchmark -PbenchSizes=1000,10000,100000}.
 * <ul>
 *   <li>before = {@link LegacyJavaPurchaseAnalytics} (same code as the previous service, test scope)</li>
 *   <li>after  = {@link PurchaseAnalyticsService}</li>
 * </ul>
 * Data comes from the existing {@link BulkDemoPurchaseSeeder} (DEMO, PAID-only, uniform over ~14 months),
 * then a deterministic SQL pass adds CANCELLED / REFUNDED lines, LIVE orders and NULL categories so every
 * code path has work to do. Each size gets a fresh container. Every scenario first asserts that both
 * implementations return identical aggregates, then times warmed-up repetitions of each.
 * <p>
 * The numbers are wall-clock latencies as seen by the caller (JDBC on localhost to a container), on
 * whatever machine runs this; they are not production figures.
 */
@Tag("benchmark")
class PurchaseAnalyticsBenchmarkTest {

    static final int WARMUP = Integer.getInteger("bench.warmup", 3);
    static final int RUNS = Integer.getInteger("bench.runs", 30);

    record Scenario(String name, PurchaseAnalyticsQuery query) {
    }

    static List<Scenario> scenarios() {
        LocalDate asOf = LocalDate.of(2026, 10, 29);
        return List.of(
                new Scenario("S1 365d DAY ALL no-filter", new PurchaseAnalyticsQuery(
                        asOf.minusDays(364), asOf, "DAY", "SALES_AMOUNT", 5, List.of(), List.of(), List.of(), "ALL")),
                new Scenario("S2 365d MONTH DEMO qty top10", new PurchaseAnalyticsQuery(
                        asOf.minusDays(364), asOf, "MONTH", "QUANTITY", 10, List.of(), List.of(), List.of(), "DEMO")),
                new Scenario("S3 90d WEEK cat=LIP age=20s/30s", new PurchaseAnalyticsQuery(
                        asOf.minusDays(89), asOf, "WEEK", "ORDER_COUNT", 5, List.of(), List.of("LIP"),
                        List.of("20대", "30대"), "ALL")),
                new Scenario("S4 30d DAY 2 products", new PurchaseAnalyticsQuery(
                        asOf.minusDays(29), asOf, "DAY", "SALES_AMOUNT", 5,
                        List.of("BenchProd-01", "BenchProd-07"), List.of(), List.of(), "ALL")));
    }

    @Test
    void benchmark() throws IOException {
        List<Integer> sizes = Arrays.stream(System.getProperty("bench.sizes", "1000,10000").split(","))
                .map(String::trim).filter(s -> !s.isEmpty()).map(Integer::parseInt).toList();
        boolean candidateIndexes = Boolean.getBoolean("bench.candidateIndexes");
        StringBuilder report = new StringBuilder();
        report.append("# purchase analytics benchmark\n\n");
        report.append("- date: ").append(LocalDateTime.now()).append('\n');
        report.append("- image: mysql:8.4 (Testcontainers, fresh container per size, default mysqld settings)\n");
        report.append("- java: ").append(System.getProperty("java.version")).append(", cpus=")
                .append(Runtime.getRuntime().availableProcessors()).append(", maxHeapMB=")
                .append(Runtime.getRuntime().maxMemory() / 1024 / 1024).append('\n');
        report.append("- warmup=").append(WARMUP).append(" runs=").append(RUNS)
                .append(" (nearest-rank percentiles over runs, ms)\n");
        report.append("- candidateIndexes=").append(candidateIndexes).append("\n\n");

        for (int size : sizes) {
            PurchaseAnalyticsTestDb db = PurchaseAnalyticsTestDb.start();
            try {
                JdbcTemplate jdbc = db.jdbc;
                Seeded seeded = seed(db, size);
                report.append("## ").append(size).append(" orders\n\n");
                report.append("- seeded: orders=").append(seeded.orders).append(" lines=").append(seeded.lines)
                        .append(" seedMs=").append(seeded.seedMillis).append('\n');
                report.append("- mix: ").append(seeded.mix).append("\n\n");
                if (candidateIndexes) {
                    applyCandidateIndexes(jdbc);
                    report.append("- candidate index DDL: ").append(candidateIndexStatements()).append("\n\n");
                }
                PurchaseAnalyticsService service = new PurchaseAnalyticsService(jdbc);
                report.append("| scenario | lines in range | before p50 | before p95 | after p50 | after p95 | p50 speedup |\n");
                report.append("|---|---:|---:|---:|---:|---:|---:|\n");
                for (Scenario scenario : scenarios()) {
                    PurchaseAnalyticsQuery query = scenario.query();
                    Aggregate expected = LegacyJavaPurchaseAnalytics.aggregate(jdbc, query);
                    Aggregate actual = service.aggregate(query);
                    assertEquals(expected, actual, scenario.name() + " @" + size);
                    long linesInRange = jdbc.queryForObject("""
                            SELECT COUNT(*) FROM purchase_lines l JOIN purchase_orders o ON o.order_key = l.order_key
                            WHERE o.purchased_at >= ? AND o.purchased_at < ?
                            """, Long.class, query.from() + " 00:00:00", query.to().plusDays(1) + " 00:00:00");

                    long[] before = time(() -> LegacyJavaPurchaseAnalytics.aggregate(jdbc, query));
                    long[] after = time(() -> service.aggregate(query));
                    report.append(String.format("| %s | %d | %.1f | %.1f | %.1f | %.1f | %.1fx |%n",
                            scenario.name(), linesInRange, ms(percentile(before, 50)), ms(percentile(before, 95)),
                            ms(percentile(after, 50)), ms(percentile(after, 95)),
                            (double) percentile(before, 50) / Math.max(1, percentile(after, 50))));
                    System.out.printf("[bench] size=%d %s lines=%d before p50=%.1f p95=%.1f  after p50=%.1f p95=%.1f%n",
                            size, scenario.name(), linesInRange, ms(percentile(before, 50)), ms(percentile(before, 95)),
                            ms(percentile(after, 50)), ms(percentile(after, 95)));
                }
                report.append('\n');
                if (Boolean.getBoolean("bench.explain")) {
                    report.append(explain(jdbc, scenarios().get(0).query()));
                }
            } finally {
                db.container.stop();
            }
        }
        Path out = Path.of("build", "benchmarks", "purchase-analytics-" + System.currentTimeMillis() + ".md");
        Files.createDirectories(out.getParent());
        Files.writeString(out, report.toString(), StandardCharsets.UTF_8);
        System.out.println(report);
        System.out.println("[bench] report written to " + out.toAbsolutePath());
    }

    // ---------------------------------------------------------------------------------------

    record Seeded(int orders, int lines, long seedMillis, String mix) {
    }

    static Seeded seed(PurchaseAnalyticsTestDb db, int orders) {
        JdbcTemplate jdbc = db.jdbc;
        String password = new BCryptPasswordEncoder().encode("bench");
        LocalDateTime floor = LocalDateTime.of(2025, 9, 1, 9, 0);
        for (int i = 1; i <= 40; i++) {
            jdbc.update("""
                    INSERT INTO users (email, password, name, role, created_at, updated_at, order_count, total_spent, session_epoch)
                    VALUES (?, ?, ?, 'ROLE_USER', ?, ?, 0, 0, 0)
                    """, "bench" + i + "@example.test", password, "bench" + i, floor, floor);
        }
        List<String> categories = List.of("LIP", "팩트", "아이", "스킨케어", "베이스", "블러셔");
        for (int i = 1; i <= 60; i++) {
            jdbc.update("""
                    INSERT INTO products (name, category, price, stock, status, created_at, updated_at, is_new, is_best)
                    VALUES (?, ?, ?, 100, 'SALE', ?, ?, 0, 0)
                    """, String.format("BenchProd-%02d", i), categories.get((i - 1) % categories.size()),
                    5_000 + (i % 12) * 1_500, floor, floor);
        }
        BulkDemoPurchaseSeeder seeder = new BulkDemoPurchaseSeeder(
                jdbc, new TransactionTemplate(new DataSourceTransactionManager(db.dataSource)));
        long started = System.nanoTime();
        BulkDemoPurchaseSeeder.SeedReport report = seeder.seed(new BulkDemoPurchaseSeeder.Options(
                orders, 20261113L, LocalDate.of(2026, 10, 29), "bench-" + orders, false));
        long seedMillis = (System.nanoTime() - started) / 1_000_000;
        assertEquals(orders, report.ordersInserted());

        // Deterministic status / source / category mix on top of the generator's PAID-only DEMO rows.
        jdbc.update("UPDATE purchase_lines SET line_status = 'CANCELLED' WHERE MOD(id, 17) = 0");
        jdbc.update("UPDATE purchase_lines SET line_status = 'REFUNDED' WHERE MOD(id, 29) = 0 AND MOD(id, 17) <> 0");
        jdbc.update("UPDATE purchase_lines SET category_name = NULL WHERE MOD(id, 53) = 0");
        jdbc.update("UPDATE purchase_orders SET record_source = 'LIVE' WHERE MOD(CRC32(order_key), 10) < 3");
        jdbc.execute("ANALYZE TABLE purchase_orders, purchase_lines");

        Map<String, Object> counts = jdbc.queryForMap("""
                SELECT (SELECT COUNT(*) FROM purchase_orders) AS o, (SELECT COUNT(*) FROM purchase_lines) AS l,
                       (SELECT COUNT(*) FROM purchase_orders WHERE record_source = 'LIVE') AS live,
                       (SELECT COUNT(*) FROM purchase_lines WHERE line_status = 'CANCELLED') AS cancelled,
                       (SELECT COUNT(*) FROM purchase_lines WHERE line_status = 'REFUNDED') AS refunded,
                       (SELECT COUNT(*) FROM purchase_orders WHERE age_band = '미상') AS unknown_age,
                       (SELECT MIN(purchased_at) FROM purchase_orders) AS min_at,
                       (SELECT MAX(purchased_at) FROM purchase_orders) AS max_at
                """);
        String mix = "LIVE orders=" + counts.get("live") + ", CANCELLED lines=" + counts.get("cancelled")
                + ", REFUNDED lines=" + counts.get("refunded") + ", age 미상 orders=" + counts.get("unknown_age")
                + ", purchased_at " + counts.get("min_at") + " .. " + counts.get("max_at");
        return new Seeded(((Number) counts.get("o")).intValue(), ((Number) counts.get("l")).intValue(), seedMillis, mix);
    }

    static void applyCandidateIndexes(JdbcTemplate jdbc) {
        for (String statement : candidateIndexStatements()) {
            jdbc.execute(statement);
        }
        jdbc.execute("ANALYZE TABLE purchase_orders, purchase_lines");
    }

    static List<String> candidateIndexStatements() {
        String raw = System.getProperty("bench.candidateSql", "");
        return raw.isBlank() ? List.of() : Arrays.stream(raw.split(";;")).map(String::trim).filter(s -> !s.isEmpty()).toList();
    }

    static String explain(JdbcTemplate jdbc, PurchaseAnalyticsQuery query) {
        StringBuilder out = new StringBuilder("### EXPLAIN ANALYZE (S1 shape)\n\n```\n");
        String sql = "EXPLAIN ANALYZE SELECT COUNT(DISTINCT o.order_key), SUM(l.quantity), SUM(l.line_amount) "
                + "FROM purchase_lines l JOIN purchase_orders o ON o.order_key = l.order_key "
                + "WHERE o.purchased_at >= ? AND o.purchased_at < ? AND l.line_status = 'PAID'";
        for (String line : jdbc.queryForList(sql, String.class, query.from() + " 00:00:00", query.to().plusDays(1) + " 00:00:00")) {
            out.append(line).append('\n');
        }
        return out.append("```\n").toString();
    }

    static long[] time(Runnable runnable) {
        for (int i = 0; i < WARMUP; i++) {
            runnable.run();
        }
        long[] nanos = new long[RUNS];
        for (int i = 0; i < RUNS; i++) {
            long started = System.nanoTime();
            runnable.run();
            nanos[i] = System.nanoTime() - started;
        }
        Arrays.sort(nanos);
        return nanos;
    }

    static long percentile(long[] sortedNanos, int p) {
        int rank = (int) Math.ceil(p / 100.0 * sortedNanos.length);
        return sortedNanos[Math.max(0, rank - 1)];
    }

    static double ms(long nanos) {
        return nanos / 1_000_000.0;
    }
}
