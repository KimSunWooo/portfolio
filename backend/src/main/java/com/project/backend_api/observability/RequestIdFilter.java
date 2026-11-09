package com.project.backend_api.observability;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 20)
public class RequestIdFilter extends OncePerRequestFilter {

    public static final String HEADER = "X-Request-Id";
    private static final Logger log = LoggerFactory.getLogger(RequestIdFilter.class);

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String incoming = request.getHeader(HEADER);
        String requestId = incoming == null || incoming.isBlank()
                ? UUID.randomUUID().toString().replace("-", "")
                : incoming.trim();
        MDC.put("requestId", requestId);
        response.setHeader(HEADER, requestId);
        try {
            if (request.getRequestURI() != null && request.getRequestURI().startsWith("/api/demo-orders")) {
                log.info("demo-order request method={} path={} requestId={}",
                        request.getMethod(), request.getRequestURI(), requestId);
            }
            filterChain.doFilter(request, response);
            if (request.getRequestURI() != null && request.getRequestURI().startsWith("/api/demo-orders")) {
                log.info("demo-order response status={} requestId={}", response.getStatus(), requestId);
            }
        } finally {
            MDC.remove("requestId");
        }
    }
}
