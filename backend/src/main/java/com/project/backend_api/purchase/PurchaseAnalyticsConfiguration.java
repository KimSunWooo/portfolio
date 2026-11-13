package com.project.backend_api.purchase;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.PlatformTransactionManager;

@Configuration
public class PurchaseAnalyticsConfiguration {

    @Bean
    PurchaseAnalyticsService purchaseAnalyticsService(JdbcTemplate jdbc, PlatformTransactionManager transactionManager) {
        return new PurchaseAnalyticsService(jdbc, PurchaseAnalyticsService.snapshotOperations(transactionManager));
    }
}
