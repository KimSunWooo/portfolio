package com.project.backend_api.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * CORS decides which browsers may read a response. This filter rejects cookie
 * credentials from a missing or unlisted Origin. SameSite=Lax does not cover a
 * same-site origin that is absent from the allowlist.
 */
public class CookieRequestOriginFilter extends OncePerRequestFilter {

    private final Set<String> allowedOrigins;

    public CookieRequestOriginFilter(String allowedOrigins) {
        this.allowedOrigins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .collect(Collectors.toUnmodifiableSet());
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return !"/api/users/refresh".equals(path) && !"/api/users/logout".equals(path);
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String origin = request.getHeader("Origin");
        if (origin == null || !allowedOrigins.contains(origin)) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.setContentType("text/plain;charset=UTF-8");
            response.getWriter().write("허용되지 않은 요청 출처입니다.");
            return;
        }
        filterChain.doFilter(request, response);
    }
}
