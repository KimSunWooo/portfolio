package com.project.backend_api.dto.project;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record ProjectRequest(
        @NotBlank @Size(max = 150) String title,
        @Size(max = 255) String subtitle,
        String description,
        @Size(max = 500) String techStack,
        @Size(max = 255) String projectUrl,
        @Size(max = 255) String githubUrl,
        @Size(max = 255) String thumbnail,
        String status,
        Boolean isFeatured,
        Integer sortOrder,
        LocalDate startDate,
        LocalDate endDate
) {}
