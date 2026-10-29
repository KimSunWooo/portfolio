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

import java.util.List;

import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = PurchaseAnalyticsController.class,
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
        PurchaseAnalyticsAccessTest.StubAnalytics.class
})
@TestPropertySource(properties = "jwt.secret=test-secret-test-secret-test-secret-test")
class PurchaseAnalyticsAccessTest {

    @Autowired
    private MockMvc mockMvc;
    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Test
    void guestAndUserCannotReadTheDashboard() throws Exception {
        mockMvc.perform(get("/api/admin/purchase-analytics")
                        .param("from", "2026-10-01")
                        .param("to", "2026-10-31"))
                .andExpect(status().isForbidden());
        String user = jwtTokenProvider.createAccessToken("user@example.com", "ROLE_USER");
        mockMvc.perform(get("/api/admin/purchase-analytics")
                        .param("from", "2026-10-01")
                        .param("to", "2026-10-31")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + user))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminReceivesDatabaseBasisAndABadRangeIsRejected() throws Exception {
        String admin = jwtTokenProvider.createAccessToken("admin@example.com", "ROLE_ADMIN");
        mockMvc.perform(get("/api/admin/purchase-analytics")
                        .param("from", "2026-10-01")
                        .param("to", "2026-10-31")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dataBasis").value("DATABASE"))
                .andExpect(jsonPath("$.available").value(true))
                .andExpect(jsonPath("$.summary.orderCount").value(0))
                .andExpect(jsonPath("$.message").value(nullValue()));
        mockMvc.perform(get("/api/admin/purchase-analytics")
                        .param("from", "2026-12-31")
                        .param("to", "2026-01-01")
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + admin))
                .andExpect(status().isBadRequest());
    }

    @TestConfiguration
    static class StubAnalytics {
        @Bean
        PurchaseAnalyticsService purchaseAnalyticsService() {
            return new PurchaseAnalyticsService(null) {
                @Override
                public PurchaseAnalyticsResponse query(PurchaseAnalyticsQuery query) {
                    PurchaseAnalyticsService.validate(query);
                    return PurchaseAnalyticsResponse.of(
                            query,
                            java.time.LocalDateTime.of(2026, 10, 29, 12, 0),
                            new PurchaseAnalyticsService.Aggregate(
                                    0, 0, 0, 0, 0, 0, 0, List.of(), 0, 0, 0, List.of(), List.of(), List.of(), List.of(), List.of()),
                            false);
                }

                @Override
                public PurchaseAnalyticsService.FilterOptions filterOptions() {
                    return new PurchaseAnalyticsService.FilterOptions(
                            List.of(), List.of(), PurchaseAnalyticsService.AGE_BANDS, PurchaseAnalyticsService.RECORD_SOURCES);
                }
            };
        }
    }
}
