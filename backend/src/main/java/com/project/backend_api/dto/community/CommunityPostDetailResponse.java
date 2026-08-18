package com.project.backend_api.dto.community;

import com.project.backend_api.domain.community.CommunityPost;

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
        LocalDateTime updatedAt
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
                post.getUpdatedAt()
        );
    }
}
