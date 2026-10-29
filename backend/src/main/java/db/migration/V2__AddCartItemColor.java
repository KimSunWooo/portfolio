package db.migration;

import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;

import java.sql.ResultSet;
import java.sql.Statement;

/**
 * Adds a nullable color reference to existing cart lines.
 * An empty database has no cart_items table yet, so this migration records
 * success without altering anything. It does not rewrite V1.
 */
public class V2__AddCartItemColor extends BaseJavaMigration {

    @Override
    public void migrate(Context context) throws Exception {
        try (Statement statement = context.getConnection().createStatement()) {
            if (!tableExists(statement, "cart_items") || columnExists(statement, "color_id")) {
                return;
            }
            statement.execute("ALTER TABLE cart_items ADD COLUMN color_id INT NULL");
        }
    }

    private static boolean tableExists(Statement statement, String table) throws Exception {
        try (ResultSet rows = statement.executeQuery("""
                SELECT COUNT(*) FROM information_schema.tables
                WHERE table_schema = DATABASE() AND table_name = '%s'
                """.formatted(table))) {
            return rows.next() && rows.getInt(1) > 0;
        }
    }

    private static boolean columnExists(Statement statement, String column) throws Exception {
        try (ResultSet rows = statement.executeQuery("""
                SELECT COUNT(*) FROM information_schema.columns
                WHERE table_schema = DATABASE() AND table_name = 'cart_items' AND column_name = '%s'
                """.formatted(column))) {
            return rows.next() && rows.getInt(1) > 0;
        }
    }
}
