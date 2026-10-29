package com.project.backend_api.purchase;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class PurchaseAnalyticsConfiguration {

    @Bean
    PurchaseAnalyticsService purchaseAnalyticsService(JdbcTemplate jdbc) {
        return new PurchaseAnalyticsService(jdbc);
    }
}
