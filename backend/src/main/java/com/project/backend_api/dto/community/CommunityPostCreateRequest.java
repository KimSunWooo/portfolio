package com.project.backend_api.dto.community;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CommunityPostCreateRequest(
        @NotBlank(message = "category는 필수입니다.")
        String category,

        @NotBlank(message = "title은 필수입니다.")
        @Size(max = 255, message = "title은 255자 이하여야 합니다.")
        String title,

        @NotBlank(message = "content는 필수입니다.")
        String content,

        @Size(max = 50, message = "author는 50자 이하여야 합니다.")
        String author,

        Boolean isPinned
) {
}
