package com.project.backend_api.purchase;

import org.flywaydb.core.Flyway;

public final class FlywayMigrateMain {
    private FlywayMigrateMain() {}
    public static void main(String[] args) {
        String url = required("FLYWAY_JDBC_URL");
        String user = required("FLYWAY_JDBC_USER");
        String password = System.getenv().getOrDefault("FLYWAY_JDBC_PASSWORD", "");
        var result = Flyway.configure()
                .dataSource(url, user, password)
                .locations("classpath:db/migration")
                .baselineOnMigrate(true)
                .baselineVersion("0")
                .load()
                .migrate();
        System.out.println("migrationsExecuted=" + result.migrationsExecuted);
        System.out.println("targetSchemaVersion=" + result.targetSchemaVersion);
    }
    private static String required(String name) {
        String v = System.getenv(name);
        if (v == null || v.isBlank()) throw new IllegalStateException(name + " required");
        return v;
    }
}
