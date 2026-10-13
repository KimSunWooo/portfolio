package com.project.backend_api.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.security.autoconfigure.SecurityAutoConfiguration;
import org.springframework.boot.security.autoconfigure.UserDetailsServiceAutoConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import com.project.backend_api.support.SimpleCacheTestConfiguration;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(
        controllers = AdminAccessWebTest.ProbeController.class,
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
        AdminAccessWebTest.ProbeController.class
})
@TestPropertySource(properties = "jwt.secret=test-secret-test-secret-test-secret-test")
class AdminAccessWebTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Test
    void guestCanReadProductsButNotAdmin() throws Exception {
        mockMvc.perform(get("/api/products")).andExpect(status().isOk());
        mockMvc.perform(get("/api/admin/products")).andExpect(status().isForbidden());
    }

    @Test
    void userCannotOpenAdmin() throws Exception {
        String access = jwtTokenProvider.createAccessToken("user@example.com", "ROLE_USER");

        mockMvc.perform(get("/api/admin/products").header(HttpHeaders.AUTHORIZATION, "Bearer " + access))
                .andExpect(status().isForbidden());
    }

    @Test
    void adminCanOpenAdmin() throws Exception {
        String access = jwtTokenProvider.createAccessToken("admin@example.com", "ROLE_ADMIN");

        mockMvc.perform(get("/api/admin/products").header(HttpHeaders.AUTHORIZATION, "Bearer " + access))
                .andExpect(status().isOk());
    }

    @Test
    void refreshTokenDoesNotAuthenticate() throws Exception {
        String refresh = jwtTokenProvider.createRefreshToken("admin@example.com");

        mockMvc.perform(get("/api/admin/products").header(HttpHeaders.AUTHORIZATION, "Bearer " + refresh))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/products").header(HttpHeaders.AUTHORIZATION, "Bearer " + refresh))
                .andExpect(status().isOk());
    }

    @RestController
    static class ProbeController {
        @GetMapping("/api/admin/products")
        String admin() {
            return "admin";
        }

        @GetMapping("/api/products")
        String products() {
            return "products";
        }
    }
}
