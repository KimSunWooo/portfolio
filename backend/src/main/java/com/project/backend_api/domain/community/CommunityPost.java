package com.project.backend_api.domain.community;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
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
    private String content; // TECH 카테고리의 경우 '해결 과정(Resolution)'이 담깁니다.

    @Column(length = 50)
    private String author;

    @Column(name = "view_count")
    private Integer viewCount;

    @Column(name = "is_pinned")
    private Boolean isPinned;

    // --- 트러블슈팅(TECH) 전용 컬럼 시작 (일반 카테고리일 경우 null) ---
    @Column(name = "occurrence_date")
    private LocalDate occurrenceDate;

    @Column(length = 20)
    private String status; // DISCOVERED, IN_PROGRESS, RESOLVED

    @Column(length = 20)
    private String severity; // HIGH, MEDIUM, LOW

    @Column(name = "tech_stack", length = 100)
    private String techStack;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(columnDefinition = "TEXT")
    private String situation;
    // --- 트러블슈팅(TECH) 전용 컬럼 끝 ---

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // 1. 기존 일반 게시글용 생성 메서드 유지
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

    // 2. 트러블슈팅(TECH) 전용 생성 메서드 오버로딩
    public static CommunityPost createTechLog(
            String title,
            String content, // 상세 해결 과정
            String author,
            Boolean isPinned,
            LocalDate occurrenceDate,
            String status,
            String severity,
            String techStack,
            String errorMessage,
            String situation
    ) {
        CommunityPost post = new CommunityPost();
        post.category = CommunityCategory.TECH;
        post.title = title;
        post.content = content;
        post.author = (author == null || author.isBlank()) ? "ADMIN" : author.trim();
        post.viewCount = 0;
        post.isPinned = Boolean.TRUE.equals(isPinned);
        
        // TECH 전용 필드 매핑
        post.occurrenceDate = occurrenceDate;
        post.status = status;
        post.severity = severity;
        post.techStack = techStack;
        post.errorMessage = errorMessage;
        post.situation = situation;
        
        post.createdAt = LocalDateTime.now();
        post.updatedAt = LocalDateTime.now();
        return post;
    }

    public void update(
            CommunityCategory category,
            String title,
            String content,
            String author,
            Boolean isPinned,
            // TECH 전용 필드들
            LocalDate occurrenceDate,
            String status,
            String severity,
            String techStack,
            String errorMessage,
            String situation
    ) {
        this.category = category;
        this.title = title;
        this.content = content;
        if (author != null && !author.isBlank()) {
            this.author = author.trim();
        }
        this.isPinned = Boolean.TRUE.equals(isPinned);
        
        // TECH 카테고리일 때만 트러블슈팅 데이터 저장, 아니면 null 처리
        if (category == CommunityCategory.TECH) {
            this.occurrenceDate = occurrenceDate;
            this.status = status;
            this.severity = severity;
            this.techStack = techStack;
            this.errorMessage = errorMessage;
            this.situation = situation;
        } else {
            this.occurrenceDate = null;
            this.status = null;
            this.severity = null;
            this.techStack = null;
            this.errorMessage = null;
            this.situation = null;
        }
        this.updatedAt = LocalDateTime.now();
    }

    public void increaseViewCount() {
        this.viewCount = (this.viewCount == null ? 0 : this.viewCount) + 1;
        this.updatedAt = LocalDateTime.now();
    }
}