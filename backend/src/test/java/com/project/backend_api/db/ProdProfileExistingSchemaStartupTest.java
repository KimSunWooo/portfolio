package com.project.backend_api.db;

import com.project.backend_api.BackendApiApplication;
import com.project.backend_api.domain.product.Product;
import com.project.backend_api.repository.CartSyncRequestRepository;
import com.project.backend_api.repository.ProductRepository;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.output.MigrateResult;
import org.hibernate.SessionFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestPropertySource;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.mysql.MySQLContainer;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
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
        "spring.mail.password=test"
})
class ProdProfileExistingSchemaStartupTest {

    static final MySQLContainer MYSQL = new MySQLContainer("mysql:8.4");
    static final GenericContainer<?> REDIS = new GenericContainer<>("redis:7-alpine").withExposedPorts(6379);

    static String missingTableFailure = "";
    static boolean cartSyncAbsentBeforeFix;
    static boolean productSurvivedMissingTableFailure;
    static List<String> productsBefore = List.of();
    static List<String> legacyBefore = List.of();

    static {
        MYSQL.start();
        REDIS.start();
        System.setProperty("spring.datasource.url", MYSQL.getJdbcUrl());
        System.setProperty("spring.datasource.username", MYSQL.getUsername());
        System.setProperty("spring.datasource.password", MYSQL.getPassword());
        System.setProperty("DB_PASSWORD", "unused-file-placeholder");
        System.setProperty("spring.data.redis.host", REDIS.getHost());
        System.setProperty("spring.data.redis.port", Integer.toString(REDIS.getMappedPort(6379)));
    }

    @DynamicPropertySource
    static void prepareExistingSchema(DynamicPropertyRegistry registry) throws Exception {
        try (SessionFactory factory = FlywaySchemaFixture.sessionFactory(
                MYSQL.getJdbcUrl(), MYSQL.getUsername(), MYSQL.getPassword(),
                "create", FlywaySchemaFixture.CURRENT_ENTITIES)) {
            assertNotNull(factory);
        }
        try (Connection connection = connect()) {
            FlywaySchemaFixture.execute(connection, """
                    CREATE TABLE legacy_orders (
                        id BIGINT PRIMARY KEY,
                        note VARCHAR(40) NOT NULL
                    )
                    """);
            FlywaySchemaFixture.execute(connection,
                    "INSERT INTO legacy_orders (id, note) VALUES (1, 'synthetic-keep')");
            FlywaySchemaFixture.execute(connection,
                    "INSERT INTO products (name, price) VALUES ('synthetic-product', 1234)");
            productsBefore = FlywaySchemaFixture.columnSnapshot(connection, "products");
            legacyBefore = FlywaySchemaFixture.columnSnapshot(connection, "legacy_orders");
            FlywaySchemaFixture.execute(connection, "DROP TABLE cart_sync_requests");
            cartSyncAbsentBeforeFix = !FlywaySchemaFixture.tableExists(connection, "cart_sync_requests");
        }

        missingTableFailure = startWithoutFlyway();

        try (Connection connection = connect()) {
            cartSyncAbsentBeforeFix = cartSyncAbsentBeforeFix
                    && !FlywaySchemaFixture.tableExists(connection, "cart_sync_requests")
                    && !FlywaySchemaFixture.tableExists(connection, "flyway_schema_history");
            try (ResultSet rows = connection.createStatement().executeQuery(
                    "SELECT price FROM products WHERE name = 'synthetic-product'")) {
                productSurvivedMissingTableFailure = rows.next() && rows.getInt(1) == 1234;
            }
        }

        registry.add("spring.datasource.url", MYSQL::getJdbcUrl);
        registry.add("spring.datasource.username", MYSQL::getUsername);
        registry.add("spring.datasource.password", MYSQL::getPassword);
        registry.add("spring.data.redis.host", REDIS::getHost);
        registry.add("spring.data.redis.port", () -> REDIS.getMappedPort(6379));
    }

    @AfterAll
    static void clearIsolatedProperties() {
        System.clearProperty("spring.datasource.url");
        System.clearProperty("spring.datasource.username");
        System.clearProperty("spring.datasource.password");
        System.clearProperty("DB_PASSWORD");
        System.clearProperty("spring.data.redis.host");
        System.clearProperty("spring.data.redis.port");
    }

    @Autowired
    private Environment environment;
    @Autowired
    private DataSource dataSource;
    @Autowired
    private Flyway flyway;
    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private CartSyncRequestRepository cartSyncRequestRepository;

    @Test
    void prodProfileMigratesThenValidatesWithoutChangingExistingRows() throws Exception {
        assertEquals(List.of("prod"), List.of(environment.getActiveProfiles()));
        assertEquals("validate", environment.getProperty("spring.jpa.hibernate.ddl-auto"));
        assertEquals("true", environment.getProperty("spring.flyway.enabled"));
        assertTrue(cartSyncAbsentBeforeFix);
        assertTrue(productSurvivedMissingTableFailure);
        assertTrue(missingTableFailure.contains("cart_sync_requests"), missingTableFailure);
        assertTrue(missingTableFailure.toLowerCase().contains("missing table")
                || missingTableFailure.toLowerCase().contains("schema-validation"), missingTableFailure);

        try (Connection connection = dataSource.getConnection()) {
            String url = connection.getMetaData().getURL();
            assertFalse(url.contains("rds.amazonaws.com"));
            assertEquals("0", flyway.getConfiguration().getBaselineVersion().getVersion());
            assertTrue(flyway.getConfiguration().isBaselineOnMigrate());
            assertTrue(FlywaySchemaFixture.tableExists(connection, "cart_sync_requests"));
            try (ResultSet rows = connection.createStatement().executeQuery("""
                    SELECT version, `type`, script, checksum IS NOT NULL
                    FROM flyway_schema_history ORDER BY installed_rank
                    """)) {
                assertTrue(rows.next());
                assertEquals("0", rows.getString(1));
                assertEquals("BASELINE", rows.getString(2));
                assertTrue(rows.next());
                assertEquals("1", rows.getString(1));
                assertEquals("SQL", rows.getString(2));
                assertEquals("V1__cart_sync_requests.sql", rows.getString(3));
                assertTrue(rows.getBoolean(4));
                assertTrue(rows.next());
                assertEquals("2", rows.getString(1));
                assertEquals("JDBC", rows.getString(2));
                assertTrue(rows.next());
                assertEquals("3", rows.getString(1));
                assertEquals("JDBC", rows.getString(2));
                assertTrue(rows.next());
                assertEquals("4", rows.getString(1));
                assertEquals("JDBC", rows.getString(2));
                assertFalse(rows.next());
            }
            assertEquals(productsBefore, FlywaySchemaFixture.columnSnapshot(connection, "products"));
            assertEquals(legacyBefore, FlywaySchemaFixture.columnSnapshot(connection, "legacy_orders"));
            try (ResultSet rows = connection.createStatement().executeQuery(
                    "SELECT note FROM legacy_orders WHERE id = 1")) {
                assertTrue(rows.next());
                assertEquals("synthetic-keep", rows.getString(1));
            }
        }

        List<Product> synthetic = productRepository.findAll().stream()
                .filter(product -> "synthetic-product".equals(product.getName()))
                .toList();
        assertEquals(1, synthetic.size());
        assertEquals(1234, synthetic.get(0).getPrice());
        assertEquals(0, cartSyncRequestRepository.count());

        int before = historyRows();
        MigrateResult second = flyway.migrate();
        assertEquals(0, second.migrationsExecuted);
        assertEquals(before, historyRows());

        try (SessionFactory previous = FlywaySchemaFixture.sessionFactory(
                MYSQL.getJdbcUrl(), MYSQL.getUsername(), MYSQL.getPassword(),
                "validate", FlywaySchemaFixture.entitiesWithoutCartSync())) {
            assertNotNull(previous);
        }
        try (Connection connection = connect()) {
            assertTrue(FlywaySchemaFixture.tableExists(connection, "cart_sync_requests"));
            assertTrue(FlywaySchemaFixture.tableExists(connection, "flyway_schema_history"));
            try (ResultSet rows = connection.createStatement().executeQuery(
                    "SELECT note FROM legacy_orders WHERE id = 1")) {
                assertTrue(rows.next());
                assertEquals("synthetic-keep", rows.getString(1));
            }
        }
    }

    private static String startWithoutFlyway() {
        String url = System.getProperty("spring.datasource.url", "");
        if (url.contains("rds.amazonaws.com")) {
            throw new IllegalStateException("refusing to start against the production database host");
        }
        SpringApplication application = new SpringApplication(BackendApiApplication.class);
        try {
            ConfigurableApplicationContext context = application.run(
                    "--spring.profiles.active=prod",
                    "--spring.flyway.enabled=false",
                    "--spring.jpa.hibernate.ddl-auto=validate",
                    "--server.port=0",
                    "--jwt.secret=test-secret-test-secret-test-secret-test",
                    "--toss.secret-key=test",
                    "--cloud.aws.credentials.access-key=test",
                    "--cloud.aws.credentials.secret-key=test",
                    "--cloud.aws.s3.bucket=test",
                    "--cloud.aws.region.static=ap-northeast-2",
                    "--spring.mail.password=test");
            context.close();
            return "STARTED";
        } catch (RuntimeException ex) {
            return schemaSnippet(ex);
        }
    }

    private static String schemaSnippet(Throwable error) {
        StringBuilder snippet = new StringBuilder();
        Throwable current = error;
        while (current != null) {
            snippet.append(current.getClass().getSimpleName()).append('\n');
            String message = current.getMessage() == null ? "" : current.getMessage();
            for (String line : message.split("\n")) {
                String lower = line.toLowerCase();
                if (lower.contains("password") || lower.contains("jdbc:") || lower.contains("secret")) {
                    continue;
                }
                snippet.append(line).append('\n');
            }
            current = current.getCause();
        }
        return snippet.toString();
    }

    private int historyRows() throws Exception {
        try (Connection connection = dataSource.getConnection();
             ResultSet rows = connection.createStatement().executeQuery(
                     "SELECT COUNT(*) FROM flyway_schema_history")) {
            assertTrue(rows.next());
            return rows.getInt(1);
        }
    }

    private static Connection connect() throws Exception {
        return FlywaySchemaFixture.connect(MYSQL.getJdbcUrl(), MYSQL.getUsername(), MYSQL.getPassword());
    }
}
