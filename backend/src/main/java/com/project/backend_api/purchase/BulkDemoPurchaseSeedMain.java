package com.project.backend_api.purchase;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDate;

/**
 * CLI entry for bulk DEMO purchase seeding. Not wired into Spring Boot startup.
 *
 * Required env: BULK_DEMO_JDBC_URL, BULK_DEMO_JDBC_USER, BULK_DEMO_JDBC_PASSWORD
 * Args: --count=300 --random-seed=20261029 --as-of=2026-10-29 --batch-id=bulk-20261029
 *       [--dry-run] [--clear]
 */
public final class BulkDemoPurchaseSeedMain {

    private BulkDemoPurchaseSeedMain() {
    }

    public static void main(String[] args) {
        String url = requiredEnv("BULK_DEMO_JDBC_URL");
        String user = requiredEnv("BULK_DEMO_JDBC_USER");
        String password = System.getenv().getOrDefault("BULK_DEMO_JDBC_PASSWORD", "");

        int count = 300;
        long randomSeed = 20261029L;
        LocalDate asOf = LocalDate.now(BulkDemoPurchaseSeeder.SEOUL);
        String batchId = "bulk-" + asOf.toString().replace("-", "");
        boolean dryRun = false;
        boolean clear = false;

        for (String arg : args) {
            if (arg.startsWith("--count=")) {
                count = Integer.parseInt(arg.substring("--count=".length()));
            } else if (arg.startsWith("--random-seed=")) {
                randomSeed = Long.parseLong(arg.substring("--random-seed=".length()));
            } else if (arg.startsWith("--as-of=")) {
                asOf = LocalDate.parse(arg.substring("--as-of=".length()));
            } else if (arg.startsWith("--batch-id=")) {
                batchId = arg.substring("--batch-id=".length());
            } else if ("--dry-run".equals(arg)) {
                dryRun = true;
            } else if ("--clear".equals(arg)) {
                clear = true;
            } else {
                throw new IllegalArgumentException("unknown argument: " + arg);
            }
        }

        DriverManagerDataSource dataSource = new DriverManagerDataSource();
        dataSource.setDriverClassName("com.mysql.cj.jdbc.Driver");
        dataSource.setUrl(url);
        dataSource.setUsername(user);
        dataSource.setPassword(password);
        JdbcTemplate jdbc = new JdbcTemplate(dataSource);
        BulkDemoPurchaseSeeder seeder = new BulkDemoPurchaseSeeder(
                jdbc, new TransactionTemplate(new DataSourceTransactionManager(dataSource)));

        if (clear) {
            int removed = seeder.clearBatch(batchId);
            System.out.println("cleared_batch=" + batchId + " removed_rows=" + removed);
            return;
        }

        BulkDemoPurchaseSeeder.SeedReport report = seeder.seed(
                new BulkDemoPurchaseSeeder.Options(count, randomSeed, asOf, batchId, dryRun));
        System.out.println("batchId=" + report.batchId());
        System.out.println("dryRun=" + report.dryRun());
        System.out.println("alreadyComplete=" + report.alreadyComplete());
        System.out.println("ordersRequested=" + report.ordersRequested());
        System.out.println("ordersInserted=" + report.ordersInserted());
        System.out.println("linesInserted=" + report.linesInserted());
        System.out.println("membersAvailable=" + report.membersAvailable());
        System.out.println("productsAvailable=" + report.productsAvailable());
        System.out.println("earliestPurchaseDate=" + report.earliestPurchaseDate());
        System.out.println("latestPurchaseDate=" + report.latestPurchaseDate());
        System.out.println("constraintNotes=" + report.constraintNotes());
        if (!report.dryRun() && !report.alreadyComplete() && report.ordersInserted() != report.ordersRequested()) {
            System.err.println("inserted order count mismatch");
            System.exit(2);
        }
    }

    private static String requiredEnv(String name) {
        String value = System.getenv(name);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException(name + " is required");
        }
        return value;
    }
}
