package db.migration;

import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;

import java.sql.ResultSet;
import java.sql.Statement;

/**
 * Records the account session generation used to reject revoked refresh tokens.
 * A database without the users table records this version and changes nothing.
 */
public class V3__AddUserSessionEpoch extends BaseJavaMigration {

    @Override
    public void migrate(Context context) throws Exception {
        try (Statement statement = context.getConnection().createStatement()) {
            if (!tableExists(statement, "users") || columnExists(statement, "session_epoch")) {
                return;
            }
            statement.execute("ALTER TABLE users ADD COLUMN session_epoch INT NOT NULL DEFAULT 0");
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
                WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = '%s'
                """.formatted(column))) {
            return rows.next() && rows.getInt(1) > 0;
        }
    }
}
