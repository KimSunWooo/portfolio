package com.project.backend_api.dto.community;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

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

        Boolean isPinned,

        // --- 트러블슈팅(TECH) 전용 추가 필드 ---
        // 일반 게시판에서는 null이 들어올 수 있으므로 필수 값 검증을 생략합니다.
        
        LocalDate occurrenceDate,

        @Size(max = 20, message = "status는 20자 이하여야 합니다.")
        String status,

        @Size(max = 20, message = "severity는 20자 이하여야 합니다.")
        String severity,

        @Size(max = 100, message = "techStack은 100자 이하여야 합니다.")
        String techStack,

        String errorMessage,

        String situation
) {
}