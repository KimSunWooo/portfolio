package com.project.backend_api.dto.project;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

public record ProjectMediaUpdateRequest(
        @Size(max = 500) String caption,
        @Size(max = 255) String description,
        @Size(max = 255) String altText,
        @Min(0) @Max(9999) Integer sortOrder
) {}
