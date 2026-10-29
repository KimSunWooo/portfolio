package com.project.backend_api.controller;

import com.project.backend_api.dto.user.LoginRequest;
import com.project.backend_api.dto.user.PasswordRequest.EmailRequest;
import com.project.backend_api.dto.user.PasswordRequest.ResetRequest;
import com.project.backend_api.dto.user.PasswordRequest.VerifyCodeRequest;
import com.project.backend_api.dto.user.SignUpRequest;
import com.project.backend_api.dto.user.TokenResponse;
import com.project.backend_api.service.UserService;
import com.project.backend_api.service.UserService.LogoutStatus;
import com.project.backend_api.service.UserService.PasswordResetStatus;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.server.ResponseStatusException;
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

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, refreshCookie(tokenResponse.getRefreshToken(), 14 * 24 * 60 * 60).toString())
                    .body(new TokenResponse(
                            tokenResponse.getAccessToken(),
                            null
                    ));

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body("인증 세션을 저장하지 못했습니다.");
        }
    }

    // 💡 새로고침 시 토큰을 재발급해주는 엔드포인트
    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(
            @CookieValue(value = "refreshToken", required = false) String refreshToken
    ) {
        if (refreshToken == null) {
            return ResponseEntity.status(401)
                    .body("Refresh Token이 없습니다. 다시 로그인해주세요.");
        }

        try {
            TokenResponse renewed = userService.refreshAccessToken(refreshToken);
            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, refreshCookie(renewed.getRefreshToken(), 14 * 24 * 60 * 60).toString())
                    .body(new TokenResponse(renewed.getAccessToken(), null));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401)
                    .body("유효하지 않은 Refresh Token입니다.");
        } catch (IllegalStateException | DataAccessException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body("인증 세션을 확인하지 못했습니다.");
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(
            @CookieValue(value = "refreshToken", required = false) String refreshToken
    ) {
        LogoutStatus status = userService.logout(refreshToken);
        String code = switch (status) {
            case REVOKED -> "revoked";
            case CLEANUP_INCOMPLETE -> "incomplete";
            case LOCAL_ONLY -> "local_only";
        };
        String message = switch (status) {
            case REVOKED -> "로그아웃되었습니다.";
            case CLEANUP_INCOMPLETE -> "이 브라우저에서는 로그아웃했지만 서버 세션 정리가 끝나지 않았습니다. 다시 로그인해 주세요.";
            case LOCAL_ONLY -> "이 브라우저의 로그인 정보는 지웠지만 서버 세션은 확인하지 못했습니다.";
        };
        ResponseEntity.BodyBuilder response = status == LogoutStatus.CLEANUP_INCOMPLETE
                ? ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                : ResponseEntity.ok();
        return response
                .header(HttpHeaders.SET_COOKIE, refreshCookie("", 0).toString())
                .body(java.util.Map.of("status", code, "message", message));
    }

    private static ResponseCookie refreshCookie(String token, long maxAgeSeconds) {
        return ResponseCookie.from("refreshToken", token)
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(maxAgeSeconds)
                .sameSite("Lax")
                .build();
    }

    @PostMapping("/password/send-code")
    public ResponseEntity<?> sendPasswordResetCode(@Valid @RequestBody EmailRequest request) {
        try {
            userService.sendPasswordResetCode(request.getEmail());
            return ResponseEntity.ok("계정이 있으면 이메일로 인증 코드를 보냈습니다.");
        } catch (ResponseStatusException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getReason());
        } catch (RuntimeException e) {
            return ResponseEntity.internalServerError().body("이메일 발송에 실패했습니다.");
        }
    }

    /**
     * 2. 인증코드 확인 (프론트엔드에서 인증번호 일치 여부 먼저 확인할 때 사용)
     */
    @PostMapping("/password/verify-code")
    public ResponseEntity<?> verifyCode(@Valid @RequestBody VerifyCodeRequest request) {
        try {
            boolean isValid = userService.verifyResetCode(request.getEmail(), request.getCode());
            if (isValid) {
                return ResponseEntity.ok("인증이 완료되었습니다.");
            } else {
                return ResponseEntity.badRequest().body("인증 코드가 일치하지 않거나 만료되었습니다.");
            }
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    /**
     * 3. 인증코드 확인 후 새 비밀번호 변경
     */
    @PostMapping("/password/reset")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetRequest request) {
        try {
            PasswordResetStatus status = userService.resetPassword(
                    request.getEmail(),
                    request.getCode(),
                    request.getNewPassword()
            );
            if (status == PasswordResetStatus.CLEANUP_INCOMPLETE) {
                return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                        .body("비밀번호는 변경되었습니다. 이전 로그인은 더 이상 갱신할 수 없습니다. 다시 로그인해 주세요.");
            }
            return ResponseEntity.ok("비밀번호가 변경되었습니다. 새로운 비밀번호로 로그인해 주세요.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    
}