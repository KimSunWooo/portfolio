package com.project.backend_api.controller;

import com.project.backend_api.dto.user.LoginRequest;
import com.project.backend_api.dto.user.SignUpRequest;
import com.project.backend_api.dto.user.TokenResponse;
import com.project.backend_api.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/signUp") // 프론트엔드의 /signup 호출과 대소문자가 다를 수 있으니 주의하세요 (통일 권장)
    public ResponseEntity<String> signUp(@Valid @RequestBody SignUpRequest request) {
        try {
            userService.signUp(request);
            return ResponseEntity.ok("회원가입이 완료되었습니다.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            // 1. UserService에서 AccessToken과 RefreshToken을 모두 생성해서 돌려준다고 가정합니다.
            TokenResponse tokenResponse = userService.login(request);

            // 2. Refresh Token을 HttpOnly 쿠키로 생성
            ResponseCookie refreshTokenCookie = ResponseCookie.from("refreshToken", tokenResponse.getRefreshToken())
                    .httpOnly(true)
                    .secure(false) // 로컬 테스트용(false). HTTPS 배포 시에는 true로 변경하세요.
                    .path("/")
                    .maxAge(14 * 24 * 60 * 60) // 14일 유지
                    .sameSite("Lax")
                    .build();

            // 3. 응답 헤더에 쿠키를 심고, Body에는 Access Token만 전달 (프론트엔드 메모리 저장용)
            // TokenResponse 객체가 accessToken만 반환하도록 조정해도 좋습니다.
            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString())
                    .body(tokenResponse); 
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 💡 새로고침 시 토큰을 재발급해주는 엔드포인트
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@CookieValue(value = "refreshToken", required = false) String refreshToken) {
        if (refreshToken == null) {
            return ResponseEntity.status(401).body("Refresh Token이 없습니다. 다시 로그인해주세요.");
        }

        try {
            // 4. 쿠키로 들어온 Refresh Token을 검증하고 새로운 Access Token을 발급받습니다.
            String newAccessToken = userService.refreshAccessToken(refreshToken);
            
            // 5. 새 Access Token을 바디에 담아 반환
            return ResponseEntity.ok(new TokenResponse(newAccessToken, refreshToken));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).body("유효하지 않은 Refresh Token입니다.");
        }
    }

    // 💡 로그아웃 엔드포인트 (쿠키 삭제)
    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        // 수명을 0으로 만든 빈 쿠키를 내려보내서 기존 쿠키를 덮어쓰기(삭제) 합니다.
        ResponseCookie deleteCookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, deleteCookie.toString())
                .body("로그아웃 되었습니다.");
    }
}