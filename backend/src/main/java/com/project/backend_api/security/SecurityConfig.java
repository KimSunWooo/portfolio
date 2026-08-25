package com.project.backend_api.security;

import lombok.RequiredArgsConstructor;
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

import java.util.List;

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
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // 회원가입, 로그인은 모두 허용
                .requestMatchers("/api/users/signup", "/api/users/login").permitAll()
                // 상품 조회(GET)는 허용 (포트폴리오이므로 누구나 볼 수 있게)
                .requestMatchers(HttpMethod.GET, "/api/products/**").permitAll()

                // 💡여기가 핵심입니다! "/error" 경로를 허용해 주어야 진짜 에러 원인(400)을 볼 수 있습니다.
                .requestMatchers("/actuator/**", "/error").permitAll()
                // AWS 상태 체크 등 필요시 열어둘 경로
                .requestMatchers("/actuator/**").permitAll()
                // 그 외의 POST, PUT, DELETE 등 상품 등록/수정/삭제 등은 인증된(로그인한) 사람만 허용
                // 추후 Admin 권한 세분화 가능
                .anyRequest().authenticated()
            )
            // 4. 커스텀 필터 등록
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // 💡 2. CORS 허용 규칙 상세 설정 (새로 추가된 메서드)
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // 프론트엔드(Next.js) 주소 명시적 허용
        configuration.setAllowedOrigins(List.of("http://localhost:3000"));
        // 허용할 HTTP 메서드
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        // 허용할 헤더 (Authorization 등)
        configuration.setAllowedHeaders(List.of("*"));
        // 자격 증명(쿠키, 인증 헤더) 허용
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration); // 모든 API 경로에 위 규칙 적용
        return source;
    }
}