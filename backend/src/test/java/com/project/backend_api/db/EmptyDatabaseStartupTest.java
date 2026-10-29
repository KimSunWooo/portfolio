package com.project.backend_api.db;

import com.project.backend_api.repository.ProductRepository;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.output.MigrateResult;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.mysql.MySQLContainer;

import javax.sql.DataSource;
import java.sql.Connection;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("prod")
@TestPropertySource(properties = {
        "server.port=0",
        "jwt.secret=test-secret-test-secret-test-secret-test",
        "toss.secret-key=test",
        "cloud.aws.credentials.access-key=test",
        "cloud.aws.credentials.secret-key=test",
        "cloud.aws.s3.bucket=test",
        "cloud.aws.region.static=ap-northeast-2",
        "spring.mail.password=test",
        "DB_PASSWORD=unused-file-placeholder"
})
class EmptyDatabaseStartupTest {

    static final MySQLContainer MYSQL = new MySQLContainer("mysql:8.4");
    static final GenericContainer<?> REDIS = new GenericContainer<>("redis:7-alpine").withExposedPorts(6379);

    static {
        MYSQL.start();
        REDIS.start();
        if (MYSQL.getJdbcUrl().contains("rds.amazonaws.com")) {
            throw new IllegalStateException("refusing to start against the production database host");
        }
    }

    @DynamicPropertySource
    static void isolatedDatabase(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", MYSQL::getJdbcUrl);
        registry.add("spring.datasource.username", MYSQL::getUsername);
        registry.add("spring.datasource.password", MYSQL::getPassword);
        registry.add("spring.data.redis.host", REDIS::getHost);
        registry.add("spring.data.redis.port", () -> REDIS.getMappedPort(6379));
    }

    @Autowired
    private Environment environment;
    @Autowired
    private DataSource dataSource;
    @Autowired
    private Flyway flyway;
    @Autowired
    private ProductRepository productRepository;

    @Test
    void prodProfileStartsOnAnEmptyDatabase() throws Exception {
        assertEquals(List.of("prod"), List.of(environment.getActiveProfiles()));
        assertEquals("validate", environment.getProperty("spring.jpa.hibernate.ddl-auto"));
        assertEquals("true", environment.getProperty("spring.flyway.enabled"));
        try (Connection connection = dataSource.getConnection()) {
            assertFalse(connection.getMetaData().getURL().contains("rds.amazonaws.com"));
            assertTrue(FlywaySchemaFixture.tableExists(connection, "users"));
            assertTrue(FlywaySchemaFixture.tableExists(connection, "cart_items"));
            assertTrue(FlywaySchemaFixture.columnSnapshot(connection, "cart_items").stream()
                    .anyMatch(column -> column.startsWith("color_id|")));
            assertTrue(FlywaySchemaFixture.columnSnapshot(connection, "users").stream()
                    .anyMatch(column -> column.startsWith("session_epoch|")));
        }
        assertEquals(0, productRepository.count());
        int before = historyRows();
        MigrateResult second = flyway.migrate();
        assertEquals(0, second.migrationsExecuted);
        assertEquals(before, historyRows());
    }

    private int historyRows() throws Exception {
        try (Connection connection = dataSource.getConnection();
             java.sql.ResultSet rows = connection.createStatement().executeQuery(
                     "SELECT COUNT(*) FROM flyway_schema_history")) {
            assertTrue(rows.next());
            return rows.getInt(1);
        }
    }
}
