package com.project.backend_api.purchase;

import com.project.backend_api.security.JwtAuthenticationFilter;
import com.project.backend_api.security.JwtTokenProvider;
import com.project.backend_api.security.SecurityConfig;
import com.project.backend_api.support.SimpleCacheTestConfiguration;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.security.autoconfigure.SecurityAutoConfiguration;
import org.springframework.boot.security.autoconfigure.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.atomic.AtomicReference;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.not;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = {
                PurchaseAnalyticsController.class,
                DemoPurchaseAnalyticsAccessTest.ProbeController.class
        },
        excludeAutoConfiguration = {
                SecurityAutoConfiguration.class,
                UserDetailsServiceAutoConfiguration.class
        }
)
@AutoConfigureMockMvc
@Import({
        SecurityConfig.class,
        JwtAuthenticationFilter.class,
        JwtTokenProvider.class,
        SimpleCacheTestConfiguration.class,
        DemoPurchaseAnalyticsAccessTest.StubAnalytics.class,
        DemoPurchaseAnalyticsAccessTest.ProbeController.class
})
@TestPropertySource(properties = "jwt.secret=test-secret-test-secret-test-secret-test")
class DemoPurchaseAnalyticsAccessTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private JwtTokenProvider jwtTokenProvider;
    @Autowired
    private AtomicReference<String> lastRecordSource;

    @Test
    void demoCanReadSampleAnalyticsButNotLiveOrMemberOrWrites() throws Exception {
        String demo = jwtTokenProvider.createAccessToken("demo@example.com", "ROLE_DEMO");

        mockMvc.perform(get("/api/admin/purchase-analytics")
                        .param("from", "2026-10-01")
                        .param("to", "2026-10-31")
                        .param("recordSource", "LIVE")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + demo))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dataBasis").value("DATABASE"));
        assertEquals("DEMO", lastRecordSource.get());

        mockMvc.perform(get("/api/admin/purchase-analytics")
                        .param("from", "2026-10-01")
                        .param("to", "2026-10-31")
                        .param("recordSource", "ALL")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + demo))
                .andExpect(status().isOk());
        assertEquals("DEMO", lastRecordSource.get());

        mockMvc.perform(get("/api/admin/purchase-analytics/filters")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + demo))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.recordSources", contains("DEMO")))
                .andExpect(jsonPath("$.recordSources", not(contains("LIVE"))))
                .andExpect(jsonPath("$.recordSources", not(contains("ALL"))));

        mockMvc.perform(get("/api/admin/users")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + demo))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/admin/products")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + demo))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminStillReadsRequestedSourceAndCanOpenMemberList() throws Exception {
        String admin = jwtTokenProvider.createAccessToken("admin@example.com", "ROLE_ADMIN");

        mockMvc.perform(get("/api/admin/purchase-analytics")
                        .param("from", "2026-10-01")
                        .param("to", "2026-10-31")
                        .param("recordSource", "LIVE")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + admin))
                .andExpect(status().isOk());
        assertEquals("LIVE", lastRecordSource.get());

        mockMvc.perform(get("/api/admin/users")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + admin))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/admin/products")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + admin))
                .andExpect(status().isOk());
    }

    @TestConfiguration
    static class StubAnalytics {
        @Bean
        AtomicReference<String> lastRecordSource() {
            return new AtomicReference<>();
        }

        @Bean
        PurchaseAnalyticsService purchaseAnalyticsService(AtomicReference<String> lastRecordSource) {
            return new PurchaseAnalyticsService(null) {
                @Override
                public PurchaseAnalyticsResponse query(PurchaseAnalyticsQuery query) {
                    PurchaseAnalyticsService.validate(query);
                    lastRecordSource.set(query.recordSource());
                    return PurchaseAnalyticsResponse.of(
                            query,
                            java.time.LocalDateTime.of(2026, 10, 29, 12, 0),
                            new PurchaseAnalyticsService.Aggregate(
                                    0, 0, 0, 0, 0, 0, 0, List.of(), 0, 0, 0, List.of(), List.of(), List.of(), List.of(), List.of()),
                            true);
                }

                @Override
                public FilterOptions filterOptions(boolean demoOnly) {
                    List<String> sources = demoOnly ? List.of("DEMO") : new ArrayList<>(RECORD_SOURCES);
                    return new FilterOptions(List.of(), List.of(), AGE_BANDS, sources);
                }
            };
        }
    }

    @RestController
    static class ProbeController {
        @GetMapping("/api/admin/users")
        String users() {
            return "users";
        }

        @PostMapping("/api/admin/products")
        String createProduct() {
            return "created";
        }
    }
}
