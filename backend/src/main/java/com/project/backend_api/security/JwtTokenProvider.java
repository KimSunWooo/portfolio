package com.project.backend_api.security;

import com.project.backend_api.domain.user.UserRole;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Collections;
import java.util.Date;

@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String secretKeyString;

    @Value("${jwt.expiration}")
    private long tokenValidTime;

    private SecretKey secretKey;

    @PostConstruct
    protected void init() {
        // 비밀키를 암호화 알고리즘에 맞게 세팅
        this.secretKey = Keys.hmacShaKeyFor(secretKeyString.getBytes(StandardCharsets.UTF_8));
    }

    // JWT 토큰 생성
    public String createToken(String email, UserRole role) {
        Date now = new Date();
        Date validity = new Date(now.getTime() + tokenValidTime);

        return Jwts.builder()
                .subject(email) // 토큰 주인을 이메일로 설정
                .claim("role", role.name()) // 권한 정보 저장
                .issuedAt(now)
                .expiration(validity)
                .signWith(secretKey) // 비밀키로 서명
                .compact();
    }

    // 토큰에서 인증 정보 꺼내기
    public Authentication getAuthentication(String token) {
        Claims claims = parseClaims(token);
        String email = claims.getSubject();
        String role = claims.get("role", String.class);

        // Spring Security가 알아들을 수 있는 인증 객체 생성
        SimpleGrantedAuthority authority = new SimpleGrantedAuthority(role);
        return new UsernamePasswordAuthenticationToken(email, "", Collections.singletonList(authority));
    }

    // HTTP 요청 헤더에서 토큰 꺼내기
    public String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        // "Bearer eyJhbGci..." 형태로 넘어오므로 앞의 "Bearer "를 잘라냄
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    // 토큰의 유효성 검증
    public boolean validateToken(String token) {
        try {
            parseClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private Claims parseClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}