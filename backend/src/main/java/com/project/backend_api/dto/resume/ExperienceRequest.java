package com.project.backend_api.dto.resume;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record ExperienceRequest(
        @NotBlank @Size(max = 100) String companyName,
        @Size(max = 100) String position,
        LocalDate startDate,
        LocalDate endDate,
        String description,
        Integer sortOrder
) {}
