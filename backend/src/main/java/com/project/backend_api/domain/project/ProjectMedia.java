package com.project.backend_api.domain.project;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "project_media")
public class ProjectMedia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "project_id", nullable = false)
    private Integer projectId;

    @Enumerated(EnumType.STRING)
    @Column(name = "media_type", nullable = false, length = 20)
    private MediaType mediaType;

    @Column(name = "media_url", nullable = false, length = 500)
    private String mediaUrl;

    @Column(length = 500)
    private String caption;

    @Column(name = "alt_text", length = 255)
    private String altText;

    @Column(name = "sort_order")
    private Integer sortOrder;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public static ProjectMedia create(
            Integer projectId,
            MediaType mediaType,
            String mediaUrl,
            String caption,
            String altText,
            Integer sortOrder
    ) {
        ProjectMedia media = new ProjectMedia();

        media.projectId = projectId;
        media.mediaType = mediaType;
        media.mediaUrl = mediaUrl;
        media.caption = caption;
        media.altText = altText;
        media.sortOrder = sortOrder == null ? 0 : sortOrder;
        media.createdAt = LocalDateTime.now();

        return media;
    }

    public void update(
            String caption,
            String altText,
            Integer sortOrder
    ) {
        this.caption = caption;
        this.altText = altText;
        this.sortOrder = sortOrder == null ? 0 : sortOrder;
    }
}