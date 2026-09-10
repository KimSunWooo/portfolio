package com.project.backend_api.service;

import com.project.backend_api.domain.user.User;
import com.project.backend_api.dto.user.LoginRequest;
import com.project.backend_api.dto.user.SignUpRequest;
import com.project.backend_api.dto.user.TokenResponse;
import com.project.backend_api.repository.UserRepository;
import com.project.backend_api.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;

import java.time.Duration;
import java.util.Random;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.mail.MailSender;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final MailSender mailSender;
    
    // 💡 ConcurrentHashMap 제거 및 StringRedisTemplate 주입
    private final StringRedisTemplate redisTemplate;

    // Redis 키 충돌 방지를 위한 접두사 (Prefix)
    private static final String AUTH_CODE_PREFIX = "AUTH_CODE:";
    // 인증 코드 만료 시간 (예: 3분)
    private static final long AUTH_CODE_EXPIRATION_MINUTES = 3;

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
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new IllegalArgumentException("가입되지 않은 이메일입니다."));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        }

        String accessToken = jwtTokenProvider.createAccessToken(user.getEmail(), user.getRole().name());
        String refreshToken = jwtTokenProvider.createRefreshToken(user.getEmail());

        return new TokenResponse(accessToken, refreshToken);
    }

    public String refreshAccessToken(String refreshToken) {
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new IllegalArgumentException("유효하지 않거나 만료된 Refresh Token입니다.");
        }

        String email = jwtTokenProvider.getEmailFromToken(refreshToken);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 유저입니다."));

        return jwtTokenProvider.createAccessToken(user.getEmail(), user.getRole().name());
    }

    /**
     * 1. 아이디 확인 후 6자리 인증코드 발송 및 Redis 저장
     */
    public void sendPasswordResetCode(String email) {
        // 1-1. 이메일 존재 여부 확인
        if (!userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("가입되지 않은 이메일입니다.");
        }

        // 1-2. 6자리 랜덤 인증코드 생성
        String authCode = generateSixDigitCode();

        // 1-3. Redis에 저장 (Key: AUTH_CODE:email, Value: authCode, TTL: 3분)
        redisTemplate.opsForValue().set(
                AUTH_CODE_PREFIX + email, 
                authCode, 
                Duration.ofMinutes(AUTH_CODE_EXPIRATION_MINUTES)
        );

        // 1-4. 이메일 발송
        sendEmail(email, "비밀번호 변경 인증 코드", 
                "인증 코드는 [" + authCode + "] 입니다.\n본 코드는 3분간 유효합니다.");
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
    @Transactional
    public void resetPassword(String email, String code, String newPassword) {
        // 3-1. 인증코드 재확인
        if (!verifyResetCode(email, code)) {
            throw new IllegalArgumentException("인증 코드가 일치하지 않거나 만료되었습니다.");
        }

        // 3-2. 사용자 조회
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // 3-3. 새 비밀번호 업데이트
        user.updatePassword(passwordEncoder.encode(newPassword));
        
        // 3-4. 사용 완료된 인증코드 Redis에서 삭제
        redisTemplate.delete(AUTH_CODE_PREFIX + email);
    }

    // --- 내부 유틸 메서드 ---

    private String generateSixDigitCode() {
        Random random = new Random();
        int code = 100000 + random.nextInt(900000); // 100000 ~ 999999
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