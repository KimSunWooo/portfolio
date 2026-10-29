package com.project.backend_api.db;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.mysql.MySQLContainer;

import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Testcontainers
class CartSyncFlywayMigrationTest {

    @Container
    static final MySQLContainer MYSQL = new MySQLContainer("mysql:8.4");

    @Test
    void prodConfigValidatesAfterFlywayCreatesOnlyTheNewTable() throws Exception {
        String prod = Files.readString(Path.of("src/main/resources/application-prod.properties"));
        String base = Files.readString(Path.of("src/main/resources/application.properties"));
        assertTrue(prod.contains("spring.jpa.hibernate.ddl-auto=validate"));
        assertTrue(prod.contains("spring.flyway.enabled=true"));
        assertTrue(prod.contains("spring.flyway.baseline-on-migrate=true"));
        assertTrue(prod.contains("spring.flyway.baseline-version=0"));
        assertTrue(base.contains("spring.flyway.enabled=false"));

        Flyway flyway = Flyway.configure()
                .dataSource(MYSQL.getJdbcUrl(), MYSQL.getUsername(), MYSQL.getPassword())
                .locations("classpath:db/migration")
                .baselineOnMigrate(true)
                .baselineVersion("0")
                .baselineDescription("Existing schema created outside Flyway")
                .load();
        flyway.migrate();
        flyway.migrate();

        try (Connection connection = DriverManager.getConnection(
                MYSQL.getJdbcUrl(), MYSQL.getUsername(), MYSQL.getPassword())) {
            assertTrue(tableExists(connection, "cart_sync_requests"));
            assertTrue(tableExists(connection, "flyway_schema_history"));
            assertTrue(tableExists(connection, "carts"));
            assertTrue(tableExists(connection, "users"));
            assertTrue(tableExists(connection, "products"));
            assertTrue(FlywaySchemaFixture.columnSnapshot(connection, "cart_items").stream()
                    .anyMatch(column -> column.startsWith("color_id|")));
            assertTrue(FlywaySchemaFixture.columnSnapshot(connection, "users").stream()
                    .anyMatch(column -> column.startsWith("session_epoch|")));
            assertEquals(6, appliedMigrations(connection));
            assertTrue(tableExists(connection, "password_change_outbox"));
            assertTrue(tableExists(connection, "password_change_mail_delivery"));
            assertTrue(tableExists(connection, "product_detail_read_events"));
            assertTrue(tableExists(connection, "mock_purchase_orders"));
            assertTrue(tableExists(connection, "mock_purchase_lines"));
            assertTrue(tableExists(connection, "purchase_orders"));
            assertTrue(tableExists(connection, "purchase_lines"));
            try (ResultSet rows = connection.createStatement().executeQuery(
                    "SELECT version, `type`, script FROM flyway_schema_history WHERE success = 1 ORDER BY installed_rank")) {
                assertTrue(rows.next());
                assertEquals("1", rows.getString(1));
                assertEquals("SQL", rows.getString(2));
                assertEquals("V1__cart_sync_requests.sql", rows.getString(3));
                assertTrue(rows.next());
                assertEquals("2", rows.getString(1));
                assertEquals("JDBC", rows.getString(2));
                assertTrue(rows.next());
                assertEquals("3", rows.getString(1));
                assertEquals("JDBC", rows.getString(2));
                assertTrue(rows.next());
                assertEquals("4", rows.getString(1));
                assertEquals("JDBC", rows.getString(2));
                assertTrue(rows.next());
                assertEquals("5", rows.getString(1));
                assertEquals("SQL", rows.getString(2));
                assertEquals("V5__messaging_and_purchase_analytics.sql", rows.getString(3));
                assertTrue(rows.next());
                assertEquals("6", rows.getString(1));
                assertEquals("SQL", rows.getString(2));
                assertEquals("V6__purchase_orders.sql", rows.getString(3));
                assertFalse(rows.next());
            }
            try (org.hibernate.SessionFactory factory = FlywaySchemaFixture.sessionFactory(
                    MYSQL.getJdbcUrl(), MYSQL.getUsername(), MYSQL.getPassword(),
                    "validate", FlywaySchemaFixture.CURRENT_ENTITIES)) {
                assertNotNull(factory);
            }
        }
    }

    @Test
    void partialSchemaIsNotTreatedAsAFreshInstall() throws Exception {
        try (MySQLContainer partial = new MySQLContainer("mysql:8.4")) {
            partial.start();
            try (Connection connection = DriverManager.getConnection(
                    partial.getJdbcUrl(), partial.getUsername(), partial.getPassword())) {
                FlywaySchemaFixture.execute(connection, """
                        CREATE TABLE users (
                            id BIGINT PRIMARY KEY,
                            email VARCHAR(100) NOT NULL
                        )
                        """);
                FlywaySchemaFixture.execute(connection, "INSERT INTO users (id, email) VALUES (1, 'member@example.com')");
            }
            Flyway flyway = flywayFor(partial);
            org.flywaydb.core.api.FlywayException failure = assertThrows(
                    org.flywaydb.core.api.FlywayException.class, flyway::migrate);
            assertTrue(causeText(failure).contains("partial schema"), causeText(failure));
            try (Connection connection = DriverManager.getConnection(
                    partial.getJdbcUrl(), partial.getUsername(), partial.getPassword())) {
                assertTrue(FlywaySchemaFixture.tableExists(connection, "users"));
                assertFalse(FlywaySchemaFixture.tableExists(connection, "products"));
                assertFalse(FlywaySchemaFixture.tableExists(connection, "carts"));
                try (ResultSet rows = connection.createStatement().executeQuery(
                        "SELECT email FROM users WHERE id = 1")) {
                    assertTrue(rows.next());
                    assertEquals("member@example.com", rows.getString(1));
                }
                try (ResultSet rows = connection.createStatement().executeQuery(
                        "SELECT version FROM flyway_schema_history WHERE success = 1 AND version = '4'")) {
                    assertFalse(rows.next());
                }
            }
        }
    }

    @Test
    void missingCurrentColumnIsNotRepairedAfterItsMigrationSucceeded() throws Exception {
        try (MySQLContainer database = new MySQLContainer("mysql:8.4")) {
            database.start();
            Flyway.configure()
                    .dataSource(database.getJdbcUrl(), database.getUsername(), database.getPassword())
                    .locations("classpath:db/migration")
                    .baselineOnMigrate(true)
                    .baselineVersion("0")
                    .target("3")
                    .load()
                    .migrate();
            try (org.hibernate.SessionFactory factory = FlywaySchemaFixture.sessionFactory(
                    database.getJdbcUrl(), database.getUsername(), database.getPassword(),
                    "create", FlywaySchemaFixture.CURRENT_ENTITIES)) {
                assertNotNull(factory);
            }
            try (Connection connection = DriverManager.getConnection(
                    database.getJdbcUrl(), database.getUsername(), database.getPassword())) {
                FlywaySchemaFixture.execute(connection, "ALTER TABLE cart_items DROP FOREIGN KEY FK1ih6sbv2ngh9gcehrrbw99e6r");
                FlywaySchemaFixture.execute(connection, "ALTER TABLE cart_items DROP COLUMN color_id");
            }
            Flyway flyway = flywayFor(database);
            org.flywaydb.core.api.FlywayException failure = assertThrows(
                    org.flywaydb.core.api.FlywayException.class, flyway::migrate);
            assertTrue(causeText(failure).contains("color_id"), causeText(failure));
            try (Connection connection = DriverManager.getConnection(
                    database.getJdbcUrl(), database.getUsername(), database.getPassword())) {
                assertFalse(FlywaySchemaFixture.columnSnapshot(connection, "cart_items").stream()
                        .anyMatch(column -> column.startsWith("color_id|")));
                assertTrue(FlywaySchemaFixture.tableExists(connection, "products"));
            }
        }
    }

    private static Flyway flywayFor(MySQLContainer database) {
        return Flyway.configure()
                .dataSource(database.getJdbcUrl(), database.getUsername(), database.getPassword())
                .locations("classpath:db/migration")
                .baselineOnMigrate(true)
                .baselineVersion("0")
                .baselineDescription("Existing schema created outside Flyway")
                .load();
    }

    private static String causeText(Throwable error) {
        StringBuilder text = new StringBuilder();
        Throwable current = error;
        while (current != null) {
            if (current.getMessage() != null) {
                text.append(current.getMessage()).append('\n');
            }
            current = current.getCause();
        }
        return text.toString();
    }

    private static boolean tableExists(Connection connection, String table) throws Exception {
        try (ResultSet tables = connection.getMetaData().getTables(MYSQL.getDatabaseName(), null, table, null)) {
            return tables.next();
        }
    }

    private static int appliedMigrations(Connection connection) throws Exception {
        try (ResultSet rows = connection.createStatement()
                .executeQuery("SELECT COUNT(*) FROM flyway_schema_history WHERE success = 1")) {
            assertTrue(rows.next());
            return rows.getInt(1);
        }
    }
}
