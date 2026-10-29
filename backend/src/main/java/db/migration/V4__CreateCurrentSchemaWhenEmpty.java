package db.migration;

import org.flywaydb.core.api.FlywayException;
import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;

/**
 * Fresh databases receive the current Hibernate schema, including cart color
 * and session_epoch. A database that already has every application table is
 * left unchanged. A schema that has only some of those tables, or an unrelated
 * table without the application tables, fails instead of being treated as a
 * new installation.
 */
public class V4__CreateCurrentSchemaWhenEmpty extends BaseJavaMigration {

    static final List<String> REQUIRED_TABLES = List.of(
            "cart_items",
            "cart_sync_requests",
            "carts",
            "community_posts",
            "educations",
            "experiences",
            "introductions",
            "payment_histories",
            "product_colors",
            "product_details",
            "product_images",
            "products",
            "profile",
            "project_media",
            "projects",
            "skills",
            "users"
    );

    private static final Set<String> ALLOWED_BEFORE_INSTALL = Set.of(
            "cart_sync_requests",
            "flyway_schema_history"
    );

    @Override
    public void migrate(Context context) throws Exception {
        Connection connection = context.getConnection();
        Set<String> present = baseTables(connection);
        List<String> missing = REQUIRED_TABLES.stream().filter(table -> !present.contains(table)).toList();
        if (missing.isEmpty()) {
            requireColumn(connection, "cart_items", "color_id");
            requireColumn(connection, "users", "session_epoch");
            return;
        }
        boolean installable = present.stream().allMatch(ALLOWED_BEFORE_INSTALL::contains);
        if (!installable) {
            List<String> unexpected = present.stream()
                    .filter(table -> !REQUIRED_TABLES.contains(table) && !"flyway_schema_history".equals(table))
                    .toList();
            throw new FlywayException(
                    "Refusing to initialize a partial schema. Missing tables: " + missing
                            + ". Unexpected tables: " + unexpected);
        }
        executeSchema(connection);
    }

    private static Set<String> baseTables(Connection connection) throws Exception {
        Set<String> tables = new TreeSet<>();
        try (ResultSet rows = connection.createStatement().executeQuery("""
                SELECT table_name FROM information_schema.tables
                WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'
                """)) {
            while (rows.next()) {
                tables.add(rows.getString(1));
            }
        }
        return tables;
    }

    private static void requireColumn(Connection connection, String table, String column) throws Exception {
        try (ResultSet rows = connection.createStatement().executeQuery("""
                SELECT 1 FROM information_schema.columns
                WHERE table_schema = DATABASE() AND table_name = '%s' AND column_name = '%s'
                """.formatted(table, column))) {
            if (!rows.next()) {
                throw new FlywayException("Refusing to repair a partial schema. " + table + "." + column + " is missing.");
            }
        }
    }

    private static void executeSchema(Connection connection) throws Exception {
        String script;
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(
                V4__CreateCurrentSchemaWhenEmpty.class.getResourceAsStream("/db/schema/current-schema.sql"),
                StandardCharsets.UTF_8))) {
            script = reader.lines().reduce("", (left, right) -> left.isEmpty() ? right : left + "\n" + right);
        }
        List<String> statements = new ArrayList<>();
        StringBuilder current = new StringBuilder();
        for (String line : script.split("\n", -1)) {
            String trimmed = line.trim();
            if (trimmed.isEmpty() || trimmed.startsWith("--")) {
                continue;
            }
            current.append(line).append('\n');
            if (trimmed.endsWith(";")) {
                statements.add(current.toString());
                current.setLength(0);
            }
        }
        try (Statement statement = connection.createStatement()) {
            for (String sql : statements) {
                statement.execute(sql);
            }
        }
    }
}
