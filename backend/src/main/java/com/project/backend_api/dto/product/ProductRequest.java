package com.project.backend_api.dto.product;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ProductRequest(
        @NotBlank
        @Size(max = 150)
        String name,

        @Size(max = 255)
        String subtitle,

        String description,

        @Size(max = 50)
        String category,

        @NotNull
        @Min(0)
        Integer price,

        @Min(0)
        Integer originalPrice,

        @Size(max = 255)
        String thumbnail,

        Boolean isNew,
        Boolean isBest,

        @Min(0)
        Integer stock,

        String status
) {}