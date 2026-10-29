package com.project.backend_api.db;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.FlywayException;
import org.flywaydb.core.api.configuration.Configuration;
import org.flywaydb.core.api.output.MigrateResult;
import org.junit.jupiter.api.Test;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.mysql.MySQLContainer;

import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.Connection;
import java.sql.ResultSet;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@Testcontainers
class CartSyncFlywayExistingSchemaTest {

    @Container
    static final MySQLContainer MYSQL = new MySQLContainer("mysql:8.4");

    @Test
    void firstMigrateOnNonEmptySchemaRunsV1AndLeavesExistingRows() throws Exception {
        String prod = Files.readString(Path.of("src/main/resources/application-prod.properties"));
        assertTrue(prod.contains("spring.flyway.baseline-on-migrate=true"));
        assertTrue(prod.contains("spring.flyway.baseline-version=0"));
        assertTrue(prod.contains("spring.flyway.locations=classpath:db/migration"));
        assertFalse(prod.contains("spring.flyway.default-schema"));
        assertFalse(prod.contains("spring.flyway.schemas"));

        try (Connection connection = connect()) {
            FlywaySchemaFixture.execute(connection, """
                    CREATE TABLE legacy_orders (
                        id BIGINT PRIMARY KEY,
                        note VARCHAR(40) NOT NULL
                    )
                    """);
            FlywaySchemaFixture.execute(connection,
                    "INSERT INTO legacy_orders (id, note) VALUES (1, 'synthetic-keep')");
        }

        Configuration defaults = Flyway.configure()
                .dataSource(MYSQL.getJdbcUrl(), MYSQL.getUsername(), MYSQL.getPassword())
                .load()
                .getConfiguration();
        assertFalse(defaults.isBaselineOnMigrate());
        assertEquals("1", defaults.getBaselineVersion().getVersion());
        assertTrue(defaults.getLocations()[0].toString().contains("db/migration"));

        FlywayException nonEmpty = assertThrows(FlywayException.class, () -> configured(false, "1").migrate());
        assertTrue(nonEmpty.getMessage().contains("non-empty schema"), nonEmpty.getMessage());
        assertFalse(tableExists("flyway_schema_history"));
        assertFalse(tableExists("cart_sync_requests"));

        FlywayException partial = assertThrows(FlywayException.class, () -> configured(true, "1").migrate());
        assertTrue(messageOf(partial).contains("partial schema"), messageOf(partial));
        assertFalse(tableExists("cart_sync_requests"));
        assertFalse(history().contains("1|SQL"));
        dropHistory();
        try (org.hibernate.SessionFactory factory = FlywaySchemaFixture.sessionFactory(
                MYSQL.getJdbcUrl(), MYSQL.getUsername(), MYSQL.getPassword(),
                "create", FlywaySchemaFixture.CURRENT_ENTITIES)) {
            assertNotNull(factory);
        }
        try (Connection connection = connect()) {
            FlywaySchemaFixture.execute(connection, """
                    INSERT INTO users (order_count, session_epoch, total_spent, name, email, password, role)
                    VALUES (0, 7, 0, 'member', 'member@example.com', 'stored-password', 'ROLE_USER')
                    """);
            FlywaySchemaFixture.execute(connection,
                    "INSERT INTO products (name, price) VALUES ('synthetic-product', 1234)");
            FlywaySchemaFixture.execute(connection, """
                    INSERT INTO carts (user_id)
                    SELECT id FROM users WHERE email = 'member@example.com'
                    """);
            FlywaySchemaFixture.execute(connection, """
                    INSERT INTO cart_items (product_id, quantity, cart_id)
                    SELECT products.id, 2, carts.id FROM products JOIN carts
                    WHERE products.name = 'synthetic-product'
                    """);
            FlywaySchemaFixture.execute(connection, "ALTER TABLE cart_items DROP FOREIGN KEY FK1ih6sbv2ngh9gcehrrbw99e6r");
            FlywaySchemaFixture.execute(connection, "ALTER TABLE cart_items DROP COLUMN color_id");
            FlywaySchemaFixture.execute(connection, "ALTER TABLE users DROP COLUMN session_epoch");
            FlywaySchemaFixture.execute(connection, "DROP TABLE cart_sync_requests");
        }

        List<String> legacyColumns = columnSnapshot("legacy_orders");
        MigrateResult first = configured(true, "0").migrate();
        assertTrue(first.migrationsExecuted >= 1);
        assertTrue(tableExists("cart_sync_requests"));
        assertEquals(List.of(
                "0|BASELINE",
                "1|SQL",
                "2|JDBC",
                "3|JDBC",
                "4|JDBC",
                "5|SQL",
                "6|SQL",
                "7|SQL"
        ), history());
        assertTrue(tableExists("password_change_outbox"));
        assertTrue(tableExists("mock_purchase_orders"));
        assertTrue(tableExists("purchase_orders"));
        assertTrue(tableExists("purchase_lines"));
        assertTrue(tableExists("purchase_demo_member_profiles"));
        assertTrue(tableExists("purchase_seed_batches"));
        assertEquals("V1__cart_sync_requests.sql", scriptForVersion("1"));
        assertNotNull(checksumForVersion("1"));
        assertCartSyncColumns();
        assertTrue(columnSnapshot("cart_items").stream().anyMatch(column -> column.startsWith("color_id|") && column.contains("|YES|")));
        assertTrue(columnSnapshot("users").stream().anyMatch(column -> column.startsWith("session_epoch|") && column.contains("|NO|")));
        try (Connection connection = connect();
             ResultSet epoch = connection.createStatement().executeQuery("SELECT session_epoch FROM users WHERE id = 1")) {
            assertTrue(epoch.next());
            assertEquals(0, epoch.getInt(1));
        }
        try (Connection connection = connect();
             ResultSet rows = connection.createStatement().executeQuery("""
                     SELECT quantity, color_id FROM cart_items
                     WHERE cart_id = (SELECT id FROM carts LIMIT 1)
                     """)) {
            assertTrue(rows.next());
            assertEquals(2, rows.getInt(1));
            assertEquals(null, rows.getObject(2));
        }
        assertEquals("synthetic-keep", legacyNote());
        assertEquals(legacyColumns, columnSnapshot("legacy_orders"));
        assertEquals(databaseOf("legacy_orders"), databaseOf("cart_sync_requests"));
        assertEquals(databaseOf("legacy_orders"), databaseOf("flyway_schema_history"));

        int historyRows = history().size();
        MigrateResult second = configured(true, "0").migrate();
        assertEquals(0, second.migrationsExecuted);
        assertEquals(historyRows, history().size());
        assertEquals("synthetic-keep", legacyNote());
        assertEquals(legacyColumns, columnSnapshot("legacy_orders"));

        String deploy = Files.readString(Path.of("../deploy.sh"));
        int start = deploy.indexOf("rollback() {");
        int end = deploy.indexOf("\ntrap ", start);
        String rollback = deploy.substring(start, end);
        assertFalse(rollback.contains("DROP"));
        assertFalse(rollback.contains("mysql"));
        assertFalse(rollback.contains("flyway"));
    }

    private static Flyway configured(boolean baselineOnMigrate, String baselineVersion) {
        return Flyway.configure()
                .dataSource(MYSQL.getJdbcUrl(), MYSQL.getUsername(), MYSQL.getPassword())
                .locations("classpath:db/migration")
                .baselineOnMigrate(baselineOnMigrate)
                .baselineVersion(baselineVersion)
                .baselineDescription("Existing schema created outside Flyway")
                .load();
    }

    private static Connection connect() throws Exception {
        return FlywaySchemaFixture.connect(MYSQL.getJdbcUrl(), MYSQL.getUsername(), MYSQL.getPassword());
    }

    private static boolean tableExists(String table) throws Exception {
        try (Connection connection = connect()) {
            return FlywaySchemaFixture.tableExists(connection, table);
        }
    }

    private static List<String> columnSnapshot(String table) throws Exception {
        try (Connection connection = connect()) {
            return FlywaySchemaFixture.columnSnapshot(connection, table);
        }
    }

    private static void dropHistory() throws Exception {
        try (Connection connection = connect()) {
            if (FlywaySchemaFixture.tableExists(connection, "flyway_schema_history")) {
                FlywaySchemaFixture.execute(connection, "DROP TABLE flyway_schema_history");
            }
        }
    }

    private static List<String> history() throws Exception {
        try (Connection connection = connect();
             ResultSet rows = connection.createStatement().executeQuery("""
                     SELECT version, `type` FROM flyway_schema_history ORDER BY installed_rank
                     """)) {
            List<String> versions = new java.util.ArrayList<>();
            while (rows.next()) {
                versions.add(rows.getString(1) + "|" + rows.getString(2));
            }
            return versions;
        }
    }

    private static String scriptForVersion(String version) throws Exception {
        try (Connection connection = connect();
             ResultSet rows = connection.createStatement().executeQuery(
                     "SELECT script FROM flyway_schema_history WHERE version = '" + version + "'")) {
            assertTrue(rows.next());
            return rows.getString(1);
        }
    }

    private static Integer checksumForVersion(String version) throws Exception {
        try (Connection connection = connect();
             ResultSet rows = connection.createStatement().executeQuery(
                     "SELECT checksum FROM flyway_schema_history WHERE version = '" + version + "'")) {
            assertTrue(rows.next());
            int checksum = rows.getInt(1);
            return rows.wasNull() ? null : checksum;
        }
    }

    private static String messageOf(Throwable error) {
        StringBuilder message = new StringBuilder();
        Throwable current = error;
        while (current != null) {
            if (current.getMessage() != null) {
                message.append(current.getMessage()).append('\n');
            }
            current = current.getCause();
        }
        return message.toString();
    }

    private static String legacyNote() throws Exception {
        try (Connection connection = connect();
             ResultSet rows = connection.createStatement().executeQuery(
                     "SELECT note FROM legacy_orders WHERE id = 1")) {
            assertTrue(rows.next());
            return rows.getString(1);
        }
    }

    private static String databaseOf(String table) throws Exception {
        try (Connection connection = connect();
             ResultSet rows = connection.createStatement().executeQuery("""
                     SELECT table_schema FROM information_schema.tables
                     WHERE table_schema = DATABASE() AND table_name = '%s'
                     """.formatted(table))) {
            assertTrue(rows.next());
            return rows.getString(1);
        }
    }

    private static void assertCartSyncColumns() throws Exception {
        assertEquals(List.of(
                "id|bigint|NO|auto_increment",
                "user_email|varchar(100)|NO|",
                "operation|varchar(32)|NO|",
                "request_key|varchar(80)|NO|",
                "request_hash|varchar(64)|NO|",
                "created_at|datetime(6)|NO|"
        ), compactColumns("cart_sync_requests"));
        assertEquals(List.of(
                "PRIMARY|id",
                "uk_cart_sync_user_op_key|user_email",
                "uk_cart_sync_user_op_key|operation",
                "uk_cart_sync_user_op_key|request_key"
        ), indexes("cart_sync_requests"));
    }

    private static List<String> compactColumns(String table) throws Exception {
        try (Connection connection = connect();
             ResultSet rows = connection.createStatement().executeQuery("""
                     SELECT column_name, column_type, is_nullable, IFNULL(extra, '')
                     FROM information_schema.columns
                     WHERE table_schema = DATABASE() AND table_name = '%s'
                     ORDER BY ordinal_position
                     """.formatted(table))) {
            List<String> columns = new java.util.ArrayList<>();
            while (rows.next()) {
                columns.add(rows.getString(1) + "|" + rows.getString(2) + "|"
                        + rows.getString(3) + "|" + rows.getString(4));
            }
            return columns;
        }
    }

    private static List<String> indexes(String table) throws Exception {
        try (Connection connection = connect();
             ResultSet rows = connection.createStatement().executeQuery("""
                     SELECT index_name, column_name
                     FROM information_schema.statistics
                     WHERE table_schema = DATABASE() AND table_name = '%s'
                     ORDER BY index_name, seq_in_index
                     """.formatted(table))) {
            List<String> keys = new java.util.ArrayList<>();
            while (rows.next()) {
                keys.add(rows.getString(1) + "|" + rows.getString(2));
            }
            return keys;
        }
    }
}
