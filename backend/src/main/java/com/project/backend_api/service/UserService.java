package com.project.backend_api.service;

import com.project.backend_api.domain.user.User;
import com.project.backend_api.dto.user.LoginRequest;
import com.project.backend_api.dto.user.SignUpRequest;
import com.project.backend_api.dto.user.TokenResponse;
import com.project.backend_api.repository.UserRepository;
import com.project.backend_api.security.JwtTokenProvider;
import com.project.backend_api.notification.PasswordChangeOutbox;
import com.project.backend_api.security.RefreshSessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.Duration;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.mail.MailSender;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshSessionService refreshSessionService;
    private final MailSender mailSender;
    
    // 💡 ConcurrentHashMap 제거 및 StringRedisTemplate 주입
    private final StringRedisTemplate redisTemplate;
    private final PlatformTransactionManager transactionManager;
    private final ObjectProvider<PasswordChangeOutbox> passwordChangeOutbox;

    // Redis 키 충돌 방지를 위한 접두사 (Prefix)
    private static final String AUTH_CODE_PREFIX = "AUTH_CODE:";
    private static final String AUTH_SEND_PREFIX = "AUTH_SEND:";
    private static final int AUTH_SEND_LIMIT = 5;
    // 인증 코드 만료 시간 (예: 3분)
    private static final long AUTH_CODE_EXPIRATION_MINUTES = 3;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    @Transactional
    public void signUp(SignUpRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }

        User user = User.builder()
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .name(request.name())
                .build();

        userRepository.save(user);
    }

    public TokenResponse login(LoginRequest request) {
        return new TransactionTemplate(transactionManager).execute(status -> {
            User user = userRepository.findByEmailForUpdate(request.email())
                    .orElseThrow(() -> new IllegalArgumentException("가입되지 않은 이메일입니다."));

            if (!passwordEncoder.matches(request.password(), user.getPassword())) {
                throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
            }

            int sessionEpoch = user.advanceSessionEpoch();
            String accessToken = jwtTokenProvider.createAccessToken(user.getEmail(), user.getRole().name());
            String sessionId = refreshSessionService.issue(user.getEmail(), sessionEpoch);
            String refreshToken = jwtTokenProvider.createRefreshToken(user.getEmail(), sessionId, sessionEpoch);
            return new TokenResponse(accessToken, refreshToken);
        });
    }

    public TokenResponse refreshAccessToken(String refreshToken) {
        VerifiedRefresh verified = verifyRefresh(refreshToken);
        User user = userRepository.findByEmail(verified.email())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 유저입니다."));
        if (user.getSessionEpoch() != verified.sessionEpoch()) {
            throw rejected(verified.email(), verified.sessionEpoch());
        }
        String activeSessionId = refreshSessionService.rotate(
                verified.email(),
                verified.sessionId(),
                verified.sessionEpoch()
        );
        User committed = userRepository.findByEmail(verified.email())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 유저입니다."));
        if (committed.getSessionEpoch() != verified.sessionEpoch()) {
            throw rejected(verified.email(), verified.sessionEpoch());
        }
        return new TokenResponse(
                jwtTokenProvider.createAccessToken(committed.getEmail(), committed.getRole().name()),
                jwtTokenProvider.createRefreshToken(verified.email(), activeSessionId, verified.sessionEpoch())
        );
    }

    public LogoutStatus logout(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank() || !jwtTokenProvider.isRefreshToken(refreshToken)) {
            return LogoutStatus.LOCAL_ONLY;
        }
        Integer sessionEpoch = jwtTokenProvider.getSessionEpoch(refreshToken);
        String sessionId = jwtTokenProvider.getSessionId(refreshToken);
        if (sessionEpoch == null || sessionId == null || sessionId.isBlank()) {
            return LogoutStatus.LOCAL_ONLY;
        }
        String email = jwtTokenProvider.getEmailFromToken(refreshToken);
        Boolean advanced = new TransactionTemplate(transactionManager).execute(status -> {
            User user = userRepository.findByEmailForUpdate(email).orElse(null);
            if (user == null || user.getSessionEpoch() != sessionEpoch) {
                return false;
            }
            user.advanceSessionEpoch();
            return true;
        });
        User current = userRepository.findByEmail(email).orElse(null);
        if (current == null) {
            return LogoutStatus.LOCAL_ONLY;
        }
        try {
            refreshSessionService.revoke(email, current.getSessionEpoch());
        } catch (IllegalStateException exception) {
            return LogoutStatus.CLEANUP_INCOMPLETE;
        }
        if (Boolean.TRUE.equals(advanced) || current.getSessionEpoch() > sessionEpoch) {
            return LogoutStatus.REVOKED;
        }
        return LogoutStatus.LOCAL_ONLY;
    }

    private IllegalArgumentException rejected(String email, int presentedEpoch) {
        try {
            refreshSessionService.revoke(email, presentedEpoch);
        } catch (IllegalStateException exception) {
            throw exception;
        }
        return new IllegalArgumentException("폐기되었거나 알 수 없는 Refresh Token입니다.");
    }

    /**
     * 1. 아이디 확인 후 6자리 인증코드 발송 및 Redis 저장
     */
    public void sendPasswordResetCode(String email) {
        try {
            Long attempts = redisTemplate.opsForValue().increment(AUTH_SEND_PREFIX + email);
            if (attempts != null && attempts == 1L) {
                redisTemplate.expire(AUTH_SEND_PREFIX + email, Duration.ofHours(1));
            }
            if (attempts != null && attempts > AUTH_SEND_LIMIT) {
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "잠시 후 다시 시도해 주세요.");
            }
            if (!userRepository.existsByEmail(email)) {
                return;
            }
            String authCode = generateSixDigitCode();
            redisTemplate.opsForValue().set(
                    AUTH_CODE_PREFIX + email,
                    authCode,
                    Duration.ofMinutes(AUTH_CODE_EXPIRATION_MINUTES)
            );
            sendEmail(email, "비밀번호 변경 인증 코드",
                    "인증 코드는 [" + authCode + "] 입니다.\n본 코드는 3분간 유효합니다.");
        } catch (DataAccessException exception) {
            throw new IllegalStateException("인증 코드를 저장하지 못했습니다.", exception);
        }
    }

    /**
     * 2. Redis에서 인증코드 검증
     */
    public boolean verifyResetCode(String email, String code) {
        // Redis에서 저장된 코드 가져오기
        String savedCode = redisTemplate.opsForValue().get(AUTH_CODE_PREFIX + email);
        
        // 코드가 존재하고, 입력받은 코드와 일치하는지 반환
        return savedCode != null && savedCode.equals(code);
    }

    /**
     * 3. 인증코드 확인 후 새 비밀번호로 변경
     */
    public PasswordResetStatus resetPassword(String email, String code, String newPassword) {
        String savedCode = redisTemplate.opsForValue().getAndDelete(AUTH_CODE_PREFIX + email);
        if (savedCode == null || !savedCode.equals(code)) {
            throw new IllegalArgumentException("인증 코드가 일치하지 않거나 만료되었습니다.");
        }
        new TransactionTemplate(transactionManager).executeWithoutResult(status -> {
            User user = userRepository.findByEmailForUpdate(email)
                    .orElseThrow(() -> new IllegalArgumentException("인증 코드가 일치하지 않거나 만료되었습니다."));
            user.updatePassword(passwordEncoder.encode(newPassword));
            user.advanceSessionEpoch();
            passwordChangeOutbox.ifAvailable(outbox -> outbox.record(email));
        });
        User committed = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("인증 코드가 일치하지 않거나 만료되었습니다."));
        try {
            refreshSessionService.revoke(email, committed.getSessionEpoch());
        } catch (IllegalStateException exception) {
            return PasswordResetStatus.CLEANUP_INCOMPLETE;
        }
        return PasswordResetStatus.COMPLETE;
    }

    private VerifiedRefresh verifyRefresh(String refreshToken) {
        if (!jwtTokenProvider.isRefreshToken(refreshToken)) {
            throw new IllegalArgumentException("유효하지 않거나 만료된 Refresh Token입니다.");
        }
        String sessionId = jwtTokenProvider.getSessionId(refreshToken);
        Integer sessionEpoch = jwtTokenProvider.getSessionEpoch(refreshToken);
        if (sessionId == null || sessionId.isBlank() || sessionEpoch == null) {
            throw new IllegalArgumentException("다시 로그인해 주세요.");
        }
        return new VerifiedRefresh(jwtTokenProvider.getEmailFromToken(refreshToken), sessionId, sessionEpoch);
    }

    private record VerifiedRefresh(String email, String sessionId, int sessionEpoch) {
    }

    public enum LogoutStatus {
        REVOKED,
        CLEANUP_INCOMPLETE,
        LOCAL_ONLY
    }

    public enum PasswordResetStatus {
        COMPLETE,
        CLEANUP_INCOMPLETE
    }

    // --- 내부 유틸 메서드 ---

    private String generateSixDigitCode() {
        int code = 100000 + SECURE_RANDOM.nextInt(900000);
        return String.valueOf(code);
    }

    private void sendEmail(String to, String subject, String text) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(subject);
        message.setText(text);
        // message.setFrom("본인의구글이메일@gmail.com"); 
        mailSender.send(message);
    }
}