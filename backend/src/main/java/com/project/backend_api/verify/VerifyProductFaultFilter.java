package com.project.backend_api.verify;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Profile;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.concurrent.atomic.AtomicBoolean;

@Component
@Profile("verify")
@Order(Ordered.HIGHEST_PRECEDENCE)
public class VerifyProductFaultFilter extends OncePerRequestFilter {

    private final AtomicBoolean failNextDetail = new AtomicBoolean();

    public void failNextDetail() {
        failNextDetail.set(true);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String uri = request.getRequestURI();
        boolean detail = "GET".equals(request.getMethod()) && uri.matches("/api/products/\\d+");
        if (detail && failNextDetail.compareAndSet(true, false)) {
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR);
            return;
        }
        filterChain.doFilter(request, response);
    }
}
