package com.project.backend_api.dto.user;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record SignUpRequest(
        @NotBlank(message = "이메일은 필수입니다.") 
        @Email(message = "이메일 형식이 올바르지 않습니다.") 
        String email,

        @NotBlank(message = "비밀번호는 필수입니다.") 
        @Size(min = 4, message = "비밀번호는 최소 4자 이상이어야 합니다.") 
        String password,

        @NotBlank(message = "이름은 필수입니다.") 
        String name
) {}