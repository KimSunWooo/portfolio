package com.project.backend_api.dto.user;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class TokenResponse {
    private String accessToken;
    private String refreshToken; 
    
    // 생성자가 오버로딩 되어있지 않다면, 
    // AccessToken 하나만 받을 때를 대비한 생성자를 만들어주셔도 좋습니다.
    public TokenResponse(String accessToken) {
        this.accessToken = accessToken;
        this.refreshToken = null;
    }
}