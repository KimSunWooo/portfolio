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
        assertTrue(base.contains("spring.flyway.enabled=false"));

        Flyway flyway = Flyway.configure()
                .dataSource(MYSQL.getJdbcUrl(), MYSQL.getUsername(), MYSQL.getPassword())
                .locations("classpath:db/migration")
                .load();
        flyway.migrate();
        flyway.migrate();

        try (Connection connection = DriverManager.getConnection(
                MYSQL.getJdbcUrl(), MYSQL.getUsername(), MYSQL.getPassword())) {
            assertTrue(tableExists(connection, "cart_sync_requests"));
            assertTrue(tableExists(connection, "flyway_schema_history"));
            assertFalse(tableExists(connection, "carts"));
            assertEquals(1, appliedMigrations(connection));
        }
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
