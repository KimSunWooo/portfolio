package com.project.backend_api.db;

import org.junit.jupiter.api.Test;
import org.springframework.boot.WebApplicationType;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.ConfigurableEnvironment;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class FlywayProdSettingsTest {

    @Test
    void packagedProdProfileUsesBaselineThatStillRunsV1() throws Exception {
        String prod = Files.readString(Path.of("src/main/resources/application-prod.properties"));
        String base = Files.readString(Path.of("src/main/resources/application.properties"));
        assertTrue(base.contains("spring.flyway.enabled=false"));
        assertTrue(prod.contains("spring.flyway.enabled=true"));
        assertTrue(prod.contains("spring.flyway.baseline-version=0"));
        assertFalse(prod.contains("spring.flyway.default-schema"));
        assertFalse(prod.contains("spring.flyway.schemas"));

        try (ConfigurableApplicationContext context = probe()) {
            ConfigurableEnvironment environment = context.getEnvironment();
            assertEquals(java.util.List.of("prod"), java.util.List.of(environment.getActiveProfiles()));
            assertEquals("0", environment.getProperty("spring.flyway.baseline-version"));
            assertEquals("true", environment.getProperty("spring.flyway.baseline-on-migrate"));
            assertEquals("classpath:db/migration", environment.getProperty("spring.flyway.locations"));
            assertEquals("true", environment.getProperty("spring.flyway.enabled"));
            assertEquals("validate", environment.getProperty("spring.jpa.hibernate.ddl-auto"));
            assertNull(environment.getProperty("spring.flyway.default-schema"));
            assertNull(environment.getProperty("spring.flyway.schemas"));
        }
    }

    @Test
    void nonProdProfileLeavesFlywayDisabled() {
        try (ConfigurableApplicationContext context = new SpringApplicationBuilder(Probe.class)
                .web(WebApplicationType.NONE)
                .run()) {
            assertEquals("false", context.getEnvironment().getProperty("spring.flyway.enabled"));
        }
    }

    @Test
    void systemPropertyAndCommandLineOverridePackagedBaseline() {
        System.setProperty("spring.flyway.baseline-version", "9");
        try (ConfigurableApplicationContext context = probe()) {
            assertEquals("9", context.getEnvironment().getProperty("spring.flyway.baseline-version"));
        } finally {
            System.clearProperty("spring.flyway.baseline-version");
        }

        System.setProperty("spring.flyway.baseline-version", "9");
        try (ConfigurableApplicationContext context = new SpringApplicationBuilder(Probe.class)
                .web(WebApplicationType.NONE)
                .run("--spring.profiles.active=prod", "--spring.flyway.baseline-version=1")) {
            assertEquals(java.util.List.of("prod"), java.util.List.of(context.getEnvironment().getActiveProfiles()));
            assertEquals("1", context.getEnvironment().getProperty("spring.flyway.baseline-version"));
        } finally {
            System.clearProperty("spring.flyway.baseline-version");
        }
    }

    private static ConfigurableApplicationContext probe() {
        return new SpringApplicationBuilder(Probe.class)
                .web(WebApplicationType.NONE)
                .run("--spring.profiles.active=prod");
    }

    @Configuration
    static class Probe {
    }
}
