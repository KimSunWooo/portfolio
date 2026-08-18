package com.project.backend_api.dto.community;

import com.project.backend_api.domain.community.CommunityPost;

import java.time.LocalDateTime;

public record CommunityPostListResponse(
        Integer id,
        String category,
        String title,
        String author,
        Integer viewCount,
        Boolean isPinned,
        LocalDateTime createdAt
) {
    public static CommunityPostListResponse from(CommunityPost post) {
        return new CommunityPostListResponse(
                post.getId(),
                post.getCategory() == null ? null : post.getCategory().name(),
                post.getTitle(),
                post.getAuthor(),
                post.getViewCount(),
                post.getIsPinned(),
                post.getCreatedAt()
        );
    }
}
