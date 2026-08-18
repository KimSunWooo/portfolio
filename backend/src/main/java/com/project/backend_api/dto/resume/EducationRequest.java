package com.project.backend_api.dto.resume;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record EducationRequest(
        @NotBlank @Size(max = 100) String schoolName,
        @Size(max = 100) String major,
        LocalDate startDate,
        LocalDate endDate,
        @Size(max = 500) String description,
        Integer sortOrder
) {}
