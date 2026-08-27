package com.project.backend_api.domain.user;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "users") // user는 예약어인 경우가 많아 users로 복수형을 많이 씁니다.
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String email; // 로그인 아이디로 사용

    @Column(nullable = false)
    private String password; // 암호화되어 저장될 비밀번호

    @Column(nullable = false, length = 50)
    private String name;

    @Column(length = 20)
    private String phoneNumber; // 💡 나중에 SMS 인증 추가 시 사용하기 위해 미리 빼둠

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role; // ROLE_USER or ROLE_ADMIN

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "order_count", nullable = false)
    private Integer orderCount = 0; // 초기값 0 세팅

    @Column(name = "total_spent", nullable = false)
    private Long totalSpent = 0L;   // 초기값 0 세팅

    // 엔티티가 저장되기 전에 자동으로 현재 시간 세팅
    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    // 엔티티가 수정될 때 자동으로 현재 시간 세팅
    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    @Builder
    public User(String email, String password, String name, String phoneNumber, UserRole role) {
        this.email = email;
        this.password = password;
        this.name = name;
        this.phoneNumber = phoneNumber;
        this.role = role != null ? role : UserRole.ROLE_USER; // 기본값은 일반 유저
    }
}