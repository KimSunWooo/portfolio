package com.project.backend_api.dto.user;

import com.project.backend_api.domain.user.User;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
public class AdminUserResponse {
    private Long id;
    private String email;
    private String name;
    private String role;
    private LocalDateTime joinDate;
    private Integer orderCount;
    private Long totalSpent;

    // Entity를 DTO로 변환하는 편의 메서드
    public static AdminUserResponse from(User user) {
        return new AdminUserResponse(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getRole().name(), // Enum일 경우 String으로 변환
                user.getCreatedAt(),
                user.getOrderCount(),
                user.getTotalSpent()
        );
    }
}