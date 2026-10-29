package com.project.backend_api.observability;

import jakarta.annotation.PreDestroy;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.hibernate.autoconfigure.HibernatePropertiesCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Off unless an isolated measurement sets {@code app.observability.product-list.enabled=true}.
 */
@Configuration
@ConditionalOnProperty(name = "app.observability.product-list.enabled", havingValue = "true")
public class ProductListObservationConfiguration {

    @Bean
    public ProductListObservation productListObservation() {
        ProductListObservation observation = new ProductListObservation();
        ProductListObservationRegistry.bind(observation);
        return observation;
    }

    @Bean
    public HibernatePropertiesCustomizer productListStatementInspector() {
        return properties -> properties.put(
                "hibernate.session_factory.statement_inspector",
                ProductListStatementInspector.class.getName()
        );
    }

    @PreDestroy
    public void unbind() {
        ProductListObservationRegistry.clear();
    }
}
