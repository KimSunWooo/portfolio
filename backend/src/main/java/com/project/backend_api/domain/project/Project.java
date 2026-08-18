package com.project.backend_api.domain.project;

import com.project.backend_api.dto.project.ProjectRequest;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "projects")
public class Project {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(length = 255)
    private String subtitle;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "tech_stack", length = 500)
    private String techStack;

    @Column(name = "project_url", length = 255)
    private String projectUrl;

    @Column(name = "github_url", length = 255)
    private String githubUrl;

    @Column(length = 255)
    private String thumbnail;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private ProjectStatus status;

    @Column(name = "is_featured")
    private Boolean isFeatured;

    @Column(name = "sort_order")
    private Integer sortOrder;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public static Project create(ProjectRequest request) {
        Project project = new Project();
        project.createdAt = LocalDateTime.now();
        project.update(request);
        return project;
    }

    public void update(ProjectRequest request) {
        this.title = request.title();
        this.subtitle = request.subtitle();
        this.description = request.description();
        this.techStack = request.techStack();
        this.projectUrl = request.projectUrl();
        this.githubUrl = request.githubUrl();
        this.thumbnail = request.thumbnail();
        this.status = request.status() == null || request.status().isBlank()
                ? ProjectStatus.IN_PROGRESS
                : ProjectStatus.valueOf(request.status().toUpperCase());
        this.isFeatured = request.isFeatured() == null ? Boolean.TRUE : request.isFeatured();
        this.sortOrder = request.sortOrder() == null ? 0 : request.sortOrder();
        this.startDate = request.startDate();
        this.endDate = request.endDate();
        this.updatedAt = LocalDateTime.now();
    }
}
