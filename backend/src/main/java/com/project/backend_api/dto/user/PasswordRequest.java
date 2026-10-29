package com.project.backend_api.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

public class PasswordRequest {

    @Getter @Setter
    public static class EmailRequest {
        @NotBlank(message = "이메일을 입력해주세요.")
        @Email(message = "유효한 이메일 형식이어야 합니다.")
        private String email;
    }

    @Getter @Setter
    public static class VerifyCodeRequest {
        @NotBlank(message = "이메일을 입력해주세요.")
        private String email;

        @NotBlank(message = "인증 코드를 입력해주세요.")
        private String code;
    }

    @Getter @Setter
    public static class ResetRequest {
        @NotBlank(message = "이메일을 입력해주세요.")
        private String email;

        @NotBlank(message = "인증 코드를 입력해주세요.")
        private String code;

        @NotBlank(message = "새 비밀번호를 입력해주세요.")
        @Size(min = 4, message = "비밀번호는 최소 4자 이상이어야 합니다.")
        private String newPassword;
    }
}