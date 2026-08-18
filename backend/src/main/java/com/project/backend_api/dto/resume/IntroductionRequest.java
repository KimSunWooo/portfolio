package com.project.backend_api.dto.resume;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record IntroductionRequest(
        @Size(max = 100) String title,
        @NotBlank String content,
        Integer sortOrder
) {}
