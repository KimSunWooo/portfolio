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
            TokenResponse tokenResponse = userService.login(request);

            ResponseCookie refreshTokenCookie = ResponseCookie.from(
                    "refreshToken",
                    tokenResponse.getRefreshToken()
            )
                    .httpOnly(true)
                    .secure(true)
                    .path("/")
                    .maxAge(14 * 24 * 60 * 60)
                    .sameSite("Lax")
                    .build();

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, refreshTokenCookie.toString())
                    .body(new TokenResponse(
                            tokenResponse.getAccessToken(),
                            null
                    ));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // 💡 새로고침 시 토큰을 재발급해주는 엔드포인트
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(
            @CookieValue(value = "refreshToken", required = false) String refreshToken
    ) {
        System.out.println("[REFRESH] refreshToken 존재 여부: " + (refreshToken != null));

        if (refreshToken == null) {
            System.out.println("[REFRESH] refreshToken 쿠키 없음");

            return ResponseEntity.status(401)
                    .body("Refresh Token이 없습니다. 다시 로그인해주세요.");
        }

        try {
            System.out.println("[REFRESH] refreshToken 전달됨");

            String newAccessToken =
                    userService.refreshAccessToken(refreshToken);

            System.out.println("[REFRESH] Access Token 재발급 성공");

            return ResponseEntity.ok(
                new TokenResponse(newAccessToken, null)
        );

        } catch (IllegalArgumentException e) {
            System.out.println("[REFRESH] Refresh Token 검증 실패: " + e.getMessage());

            return ResponseEntity.status(401)
                    .body("유효하지 않은 Refresh Token입니다.");
        }
    }

    // 💡 로그아웃 엔드포인트 (쿠키 삭제)
    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        // 수명을 0으로 만든 빈 쿠키를 내려보내서 기존 쿠키를 덮어쓰기(삭제) 합니다.
        ResponseCookie deleteCookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, deleteCookie.toString())
                .body("로그아웃 되었습니다.");
    }
}