package com.project.backend_api.messaging;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Event payloads use Jackson 2. Spring Boot 4's Jackson auto-configuration
 * exposes tools.jackson, and RedisConfig builds a private typed mapper that is
 * not a bean. Messaging therefore owns a small Jackson 2 mapper without default
 * typing.
 */
@Configuration
@ConditionalOnExpression(
        "'${app.notification.password-changed.enabled:false}' == 'true'"
                + " || '${app.analytics.product-detail-read.enabled:false}' == 'true'"
)
public class MessagingJsonConfig {

    public static final String MESSAGING_OBJECT_MAPPER = "messagingObjectMapper";

    @Bean(name = MESSAGING_OBJECT_MAPPER)
    @Qualifier(MESSAGING_OBJECT_MAPPER)
    ObjectMapper messagingObjectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return mapper;
    }
}
