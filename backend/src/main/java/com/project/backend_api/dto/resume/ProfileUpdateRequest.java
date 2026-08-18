package com.project.backend_api.dto.resume;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ProfileUpdateRequest(
        @NotBlank @Size(max = 50) String name,
        @Size(max = 100) String jobTitle,
        @Size(max = 100) String email,
        @Size(max = 30) String phone,
        @Size(max = 255) String githubUrl,
        @Size(max = 255) String profileImage,
        @Size(max = 500) String shortIntro
) {}
