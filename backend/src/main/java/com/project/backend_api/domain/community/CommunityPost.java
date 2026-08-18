package com.project.backend_api.domain.community;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "community_posts")
public class CommunityPost {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private CommunityCategory category;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(length = 50)
    private String author;

    @Column(name = "view_count")
    private Integer viewCount;

    @Column(name = "is_pinned")
    private Boolean isPinned;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public static CommunityPost create(
            CommunityCategory category,
            String title,
            String content,
            String author,
            Boolean isPinned
    ) {
        CommunityPost post = new CommunityPost();
        post.category = category;
        post.title = title;
        post.content = content;
        post.author = (author == null || author.isBlank()) ? "ADMIN" : author.trim();
        post.viewCount = 0;
        post.isPinned = Boolean.TRUE.equals(isPinned);
        post.createdAt = LocalDateTime.now();
        post.updatedAt = LocalDateTime.now();
        return post;
    }

    public void increaseViewCount() {
        this.viewCount = (this.viewCount == null ? 0 : this.viewCount) + 1;
        this.updatedAt = LocalDateTime.now();
    }
}
