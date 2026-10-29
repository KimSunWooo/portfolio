package com.project.backend_api.purchase;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.transaction.support.TransactionTemplate;
import org.testcontainers.mysql.MySQLContainer;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class BulkDemoPurchaseSeederTest {

    static final MySQLContainer MYSQL = new MySQLContainer("mysql:8.4");
    static BulkDemoPurchaseSeeder seeder;
    static JdbcTemplate jdbc;

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
        DriverManagerDataSource dataSource = new DriverManagerDataSource(url, MYSQL.getUsername(), MYSQL.getPassword());
        jdbc = new JdbcTemplate(dataSource);
        seeder = new BulkDemoPurchaseSeeder(jdbc, new TransactionTemplate(new DataSourceTransactionManager(dataSource)));

        String password = new BCryptPasswordEncoder().encode("test-password");
        jdbc.update("""
                INSERT INTO users (email, password, name, role, created_at, updated_at, order_count, total_spent, session_epoch)
                VALUES ('member-a@example.test', ?, 'A', 'ROLE_USER', ?, ?, 0, 0, 0)
                """, password, LocalDateTime.of(2026, 10, 20, 10, 0), LocalDateTime.of(2026, 10, 20, 10, 0));
        jdbc.update("""
                INSERT INTO users (email, password, name, role, created_at, updated_at, order_count, total_spent, session_epoch)
                VALUES ('member-b@example.test', ?, 'B', 'ROLE_USER', ?, ?, 0, 0, 0)
                """, password, LocalDateTime.of(2026, 10, 21, 10, 0), LocalDateTime.of(2026, 10, 21, 10, 0));
        jdbc.update("""
                INSERT INTO users (email, password, name, role, created_at, updated_at, order_count, total_spent, session_epoch)
                VALUES ('admin@example.test', ?, 'Admin', 'ROLE_ADMIN', ?, ?, 0, 0, 0)
                """, password, LocalDateTime.of(2026, 10, 1, 10, 0), LocalDateTime.of(2026, 10, 1, 10, 0));
        jdbc.update("""
                INSERT INTO products (name, category, price, stock, status, created_at, updated_at, is_new, is_best)
                VALUES ('Shade One', 'LIP', 12000, 10, 'SALE', ?, ?, 1, 0)
                """, LocalDateTime.of(2026, 10, 19, 9, 0), LocalDateTime.of(2026, 10, 19, 9, 0));
        jdbc.update("""
                INSERT INTO products (name, category, price, stock, status, created_at, updated_at, is_new, is_best)
                VALUES ('Fact Two', '팩트', 15000, 10, 'SALE', ?, ?, 0, 1)
                """, LocalDateTime.of(2026, 10, 19, 9, 0), LocalDateTime.of(2026, 10, 19, 9, 0));
    }

    @Test
    void insertsExactCountIdempotentlyWithoutTouchingUserSpend() {
        LocalDate asOf = LocalDate.of(2026, 10, 29);
        BulkDemoPurchaseSeeder.Options options = new BulkDemoPurchaseSeeder.Options(
                20, 42L, asOf, "bulk-test-20", false);

        BulkDemoPurchaseSeeder.SeedReport first = seeder.seed(options);
        assertEquals(20, first.ordersInserted());
        assertTrue(first.linesInserted() >= 20);

        BulkDemoPurchaseSeeder.SeedReport second = seeder.seed(options);
        assertTrue(second.alreadyComplete());
        assertEquals(0, second.ordersInserted());

        Integer orders = jdbc.queryForObject(
                "SELECT COUNT(*) FROM purchase_orders WHERE seed_batch_id = 'bulk-test-20'", Integer.class);
        assertEquals(20, orders);
        Integer paidOrders = jdbc.queryForObject("""
                SELECT COUNT(DISTINCT o.order_key) FROM purchase_orders o
                JOIN purchase_lines l ON l.order_key = o.order_key
                WHERE o.seed_batch_id = 'bulk-test-20' AND l.line_status = 'PAID'
                """, Integer.class);
        assertEquals(20, paidOrders);

        Integer spend = jdbc.queryForObject(
                "SELECT SUM(total_spent) FROM users WHERE role = 'ROLE_USER'", Integer.class);
        assertEquals(0, spend);

        assertThrows(IllegalStateException.class, () -> seeder.seed(
                new BulkDemoPurchaseSeeder.Options(21, 42L, asOf, "bulk-test-20", false)));

        int cleared = seeder.clearBatch("bulk-test-20");
        assertTrue(cleared >= 20);
        Integer remaining = jdbc.queryForObject(
                "SELECT COUNT(*) FROM purchase_orders WHERE seed_batch_id = 'bulk-test-20'", Integer.class);
        assertEquals(0, remaining);
    }
}
