package com.project.backend_api.security;

import jakarta.servlet.DispatcherType;

import lombok.RequiredArgsConstructor;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    // 비밀번호 암호화를 위한 PasswordEncoder 빈 등록
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            // 1. CSRF 비활성화 (JWT를 사용하므로)
            .csrf(csrf -> csrf.disable())
            // 2. 세션 비활성화 (Stateless)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            // 3. URL별 접근 제어
            // SecurityConfig.java 내의 filterChain 메서드 일부

            .authorizeHttpRequests(auth -> auth
                .dispatcherTypeMatchers(DispatcherType.ERROR, DispatcherType.FORWARD).permitAll()
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll() 
                
                // 💡 누구나 접근 가능한 공개 API (회원가입, 로그인, 상품 목록/상세 조회)
                .requestMatchers("/uploads/**").permitAll()
                .requestMatchers("/api/users/signUp", "/api/users/login", "/api/users/refresh", "/api/users/logout", "/api/users/password/**").permitAll()
                .requestMatchers("/api/verify/mailbox", "/api/verify/fail-next-revoke", "/api/verify/fail-next-product").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/projects/**", "/api/resume/**", "/api/products/**", "/api/community/**").permitAll()

                // DEMO는 구매 분석 샘플 조회만. 쓰기·회원 조회를 포함한 나머지 관리자 API는 ADMIN만.
                .requestMatchers(HttpMethod.GET,
                        "/api/admin/purchase-analytics",
                        "/api/admin/purchase-analytics/filters")
                    .hasAnyRole("ADMIN", "DEMO")
                .requestMatchers("/api/admin/**").hasRole("ADMIN")

                .requestMatchers("/actuator/**", "/error").permitAll()
                .requestMatchers(HttpMethod.GET, "/internal/product-list-observation").permitAll()

                .anyRequest().authenticated()
            )
            // 4. 커스텀 필터 등록
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(cookieRequestOriginFilter(), JwtAuthenticationFilter.class);

        return http.build();
    }

    // 💡 2. CORS 허용 규칙 상세 설정 (새로 추가된 메서드)
    @Value("${app.cors.allowed-origins:https://swportfolioservices.com}")
    private String allowedOrigins;

    @Bean
    public CookieRequestOriginFilter cookieRequestOriginFilter() {
        return new CookieRequestOriginFilter(allowedOrigins);
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOrigins(
                Arrays.asList(allowedOrigins.split(","))
        );

        configuration.setAllowedMethods(Arrays.asList(
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE",
                "OPTIONS"
        ));

        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
                new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration("/**", configuration);

        return source;
    }
}