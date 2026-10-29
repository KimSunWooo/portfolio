package com.project.backend_api.security;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class CookieRequestOriginFilterTest {

    private final MockMvc mockMvc = MockMvcBuilders
            .standaloneSetup(new ProbeController())
            .addFilters(new CookieRequestOriginFilter("https://swportfolioservices.com"))
            .build();

    @Test
    void listedOriginCanRefreshAndLogout() throws Exception {
        mockMvc.perform(post("/api/users/refresh").header("Origin", "https://swportfolioservices.com"))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/users/logout").header("Origin", "https://swportfolioservices.com"))
                .andExpect(status().isOk());
    }

    @Test
    void missingOrUnlistedOriginIsRejected() throws Exception {
        mockMvc.perform(post("/api/users/refresh")).andExpect(status().isForbidden());
        mockMvc.perform(post("/api/users/logout").header("Origin", "https://evil.example"))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/users/refresh").header("Origin", "https://www.swportfolioservices.com"))
                .andExpect(status().isForbidden());
    }

    @Test
    void otherRoutesDoNotRequireOrigin() throws Exception {
        mockMvc.perform(get("/api/products")).andExpect(status().isOk());
    }

    @RestController
    static class ProbeController {
        @PostMapping(value = "/api/users/refresh", produces = MediaType.TEXT_PLAIN_VALUE)
        String refresh() {
            return "ok";
        }

        @PostMapping(value = "/api/users/logout", produces = MediaType.TEXT_PLAIN_VALUE)
        String logout() {
            return "ok";
        }

        @GetMapping("/api/products")
        String products() {
            return "ok";
        }
    }
}
