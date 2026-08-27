package com.project.backend_api.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import javax.crypto.SecretKey;
import java.util.Collections;
import java.util.Date;
import java.util.List;

@Component
public class JwtTokenProvider {

    @Value("${jwt.secret}")
    private String secretKeyString;

    private final long accessTokenValidityInMilliseconds = 1000L * 60 * 30;
    private final long refreshTokenValidityInMilliseconds = 1000L * 60 * 60 * 24 * 14;

    // 💡 Key 대신 SecretKey 타입 사용 (최신 권장 사항)
    private SecretKey secretKey;

    @PostConstruct
    protected void init() {
        this.secretKey = Keys.hmacShaKeyFor(secretKeyString.getBytes());
    }

    public String createAccessToken(String email, String role) {
        Date now = new Date();
        Date validity = new Date(now.getTime() + accessTokenValidityInMilliseconds);

        // 💡 set 접두사가 모두 사라지고, claim()으로 직관적인 데이터 주입
        return Jwts.builder()
                .subject(email)
                .claim("role", role)
                .issuedAt(now)
                .expiration(validity)
                .signWith(secretKey) // 알고리즘 생략 가능 (키 길이에 맞춰 자동 선택됨)
                .compact();
    }

    public String createRefreshToken(String email) {
        Date now = new Date();
        Date validity = new Date(now.getTime() + refreshTokenValidityInMilliseconds);

        return Jwts.builder()
                .subject(email)
                .issuedAt(now)
                .expiration(validity)
                .signWith(secretKey)
                .compact();
    }

    public String getEmailFromToken(String token) {
        // 💡 parserBuilder() 대신 parser() 사용, getBody() 대신 getPayload() 사용
        return Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser().verifyWith(secretKey).build().parseSignedClaims(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    // 💡 1. HTTP 헤더에서 토큰을 추출하는 메서드
    public String resolveToken(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        // "Bearer "로 시작하는지 확인 후, 실제 토큰 문자열만 잘라서 반환
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7);
        }
        return null;
    }

    // 💡 2. 토큰을 복호화하여 Spring Security용 인증(Authentication) 객체를 만드는 메서드
    public Authentication getAuthentication(String token) {
        // 토큰의 알맹이(Payload) 복호화
        Claims claims = Jwts.parser()
                .verifyWith(secretKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        String email = claims.getSubject();
        String role = claims.get("role", String.class);

        // Spring Security가 인식할 수 있는 권한 객체로 변환
        List<GrantedAuthority> authorities = Collections.singletonList(new SimpleGrantedAuthority(role));

        // 인증된 사용자 정보(Principal) 생성 (비밀번호는 보안상 빈 문자열로 처리)
        UserDetails principal = new User(email, "", authorities);

        // SecurityContext에 넣을 최종 Authentication 객체 반환
        return new UsernamePasswordAuthenticationToken(principal, token, authorities);
    }
}