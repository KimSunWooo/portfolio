package com.project.backend_api.security; // 패키지 경로는 맞게 유지하세요

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        // 1. 헤더에서 토큰(Access Token) 추출
        String token = jwtTokenProvider.resolveToken(request);

        // 2. 토큰이 존재하고 유효한지 검사
        if (token != null && jwtTokenProvider.validateToken(token)) {
            // 3. 유효하다면 인증 정보를 생성하여 Security 통제소에 저장
            Authentication auth = jwtTokenProvider.getAuthentication(token);
            SecurityContextHolder.getContext().setAuthentication(auth);
        }

        // 4. 다음 필터로 무조건 넘기기
        // (토큰이 없어도 여기서 에러를 내지 않아야 SecurityConfig의 permitAll()이 회원가입 등을 통과시켜 줍니다)
        filterChain.doFilter(request, response);
    }
}