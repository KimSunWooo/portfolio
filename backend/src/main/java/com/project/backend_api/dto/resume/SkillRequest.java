package com.project.backend_api.dto.resume;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SkillRequest(
        @NotBlank @Size(max = 50) String name,
        @Size(max = 50) String category,
        @Size(max = 20) String level,
        Integer sortOrder
) {}
