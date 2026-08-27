package com.project.backend_api.service;

import com.project.backend_api.domain.user.User;
import com.project.backend_api.dto.user.LoginRequest;
import com.project.backend_api.dto.user.SignUpRequest;
import com.project.backend_api.dto.user.TokenResponse;
import com.project.backend_api.repository.UserRepository;
import com.project.backend_api.security.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

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

        // 1. Access Token 발급 (수명 짧음, 권한 정보 포함)
        String accessToken = jwtTokenProvider.createAccessToken(user.getEmail(), user.getRole().name());
        
        // 2. Refresh Token 발급 (수명 긺, 일반적으로 권한 없이 식별자만 포함)
        String refreshToken = jwtTokenProvider.createRefreshToken(user.getEmail());

        return new TokenResponse(accessToken, refreshToken);
    }

    public String refreshAccessToken(String refreshToken) {
        // 1. Refresh Token 자체의 유효성(위조 여부 및 만료일) 검증
        if (!jwtTokenProvider.validateToken(refreshToken)) {
            throw new IllegalArgumentException("유효하지 않거나 만료된 Refresh Token입니다.");
        }

        // 2. 토큰에서 유저 이메일 추출 (JwtTokenProvider에 이메일 추출 메서드 필요)
        String email = jwtTokenProvider.getEmailFromToken(refreshToken);

        // 3. DB에서 유저 조회 (삭제된 유저이거나 권한이 변경되었을 수 있으므로 항상 최신 정보 조회)
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 유저입니다."));

        // 4. 새로운 Access Token을 발급하여 반환
        return jwtTokenProvider.createAccessToken(user.getEmail(), user.getRole().name());
    }
}
