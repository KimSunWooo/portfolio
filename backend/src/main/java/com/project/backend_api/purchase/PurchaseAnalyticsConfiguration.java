package com.project.backend_api.purchase;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class PurchaseAnalyticsConfiguration {

    @Bean
    PurchaseAnalyticsService purchaseAnalyticsService(
            JdbcTemplate jdbc,
            @Value("${app.purchase-analytics.source:NONE}") String source
    ) {
        return new PurchaseAnalyticsService(jdbc, source);
    }

    @Bean
    @ConditionalOnProperty(name = "app.purchase-analytics.source", havingValue = "MOCK")
    ApplicationRunner mockPurchaseSeed(JdbcTemplate jdbc) {
        return arguments -> new MockPurchaseSeed(jdbc).seedIfEmpty();
    }
}
