package com.project.backend_api.purchase;

import org.flywaydb.core.Flyway;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.testcontainers.mysql.MySQLContainer;

import javax.sql.DataSource;

/** Isolated, migrated Testcontainers MySQL for the purchase analytics tests and benchmark. */
final class PurchaseAnalyticsTestDb {

    final MySQLContainer container;
    final String url;
    final DataSource dataSource;
    final JdbcTemplate jdbc;

    private PurchaseAnalyticsTestDb(MySQLContainer container, String url) {
        this.container = container;
        this.url = url;
        this.dataSource = dataSource(url);
        this.jdbc = new JdbcTemplate(dataSource);
    }

    /** @param extraServerArgs mysqld flags, for example {@code --innodb-buffer-pool-size=1G} */
    static PurchaseAnalyticsTestDb start(String... extraServerArgs) {
        MySQLContainer container = new MySQLContainer("mysql:8.4");
        if (extraServerArgs.length > 0) {
            container.withCommand(extraServerArgs);
        }
        container.start();
        String url = container.getJdbcUrl() + "?serverTimezone=Asia/Seoul";
        Flyway.configure()
                .dataSource(url, container.getUsername(), container.getPassword())
                .locations("classpath:db/migration")
                .baselineOnMigrate(true)
                .baselineVersion("0")
                .load()
                .migrate();
        return new PurchaseAnalyticsTestDb(container, url);
    }

    DriverManagerDataSource dataSource(String jdbcUrl) {
        return new DriverManagerDataSource(jdbcUrl, container.getUsername(), container.getPassword());
    }

    JdbcTemplate jdbcWithTimeZone(String serverTimezone) {
        return new JdbcTemplate(dataSource(container.getJdbcUrl() + "?serverTimezone=" + serverTimezone));
    }
}
