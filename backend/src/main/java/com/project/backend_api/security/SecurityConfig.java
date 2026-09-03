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
                .requestMatchers("/api/users/signUp", "/api/users/login", "/api/users/refresh", "/api/users/logout").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/projects/**", "/api/resume/**", "/api/products/**", "/api/cart/**").permitAll()
                .requestMatchers("/api/payments/**").permitAll()
                
                // 🔒 관리자(ADMIN)만 접근 가능한 API (상품 등록, 수정, 삭제)
                // 주의: DB와 JWT 토큰에는 "ROLE_ADMIN"이라는 형태로 저장되어 있어야 Spring이 "ADMIN"으로 인식합니다.
                .requestMatchers(HttpMethod.POST, "/api/products/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/products/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/products/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/projects/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/projects/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/projects/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.POST, "/api/admin/community/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.PUT, "/api/admin/community/**").hasRole("ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/api/admin/community/**").hasRole("ADMIN")
                
                .requestMatchers("/actuator/**", "/error").permitAll()
                
                // 그 외의 모든 요청은 로그인(인증)된 유저만 접근 가능
                .anyRequest().authenticated()
            )
            // 4. 커스텀 필터 등록
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // 💡 2. CORS 허용 규칙 상세 설정 (새로 추가된 메서드)
    @Value("${app.cors.allowed-origins:http://localhost:3000}")
    private String allowedOrigins;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // 2. 하드코딩된 주소를 지우고, 주입받은 변수를 리스트로 변환해 넣습니다.
        configuration.setAllowedOrigins(Arrays.asList(allowedOrigins.split(",")));
        
        // 허용할 HTTP 메서드 (api.ts에 있던 PATCH도 안전하게 추가)
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        // 허용할 헤더
        configuration.setAllowedHeaders(Arrays.asList("*"));
        // 자격 증명 허용
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration); 
        return source;
    }
}