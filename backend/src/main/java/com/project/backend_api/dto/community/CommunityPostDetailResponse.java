package com.project.backend_api.dto.community;

import com.project.backend_api.domain.community.CommunityPost;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record CommunityPostDetailResponse(
        Integer id,
        String category,
        String title,
        String content,
        String author,
        Integer viewCount,
        Boolean isPinned,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        
        // --- 트러블슈팅(TECH) 전용 응답 필드 추가 ---
        LocalDate occurrenceDate,
        String status,
        String severity,
        String techStack,
        String errorMessage,
        String situation
) {
    public static CommunityPostDetailResponse from(CommunityPost post) {
        return new CommunityPostDetailResponse(
                post.getId(),
                post.getCategory() == null ? null : post.getCategory().name(),
                post.getTitle(),
                post.getContent(),
                post.getAuthor(),
                post.getViewCount(),
                post.getIsPinned(),
                post.getCreatedAt(),
                post.getUpdatedAt(),
                
                // --- TECH 필드 매핑 ---
                post.getOccurrenceDate(),
                post.getStatus(),
                post.getSeverity(),
                post.getTechStack(),
                post.getErrorMessage(),
                post.getSituation()
        );
    }
}