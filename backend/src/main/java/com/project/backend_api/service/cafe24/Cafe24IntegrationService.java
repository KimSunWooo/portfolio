package com.project.backend_api.service.cafe24;

import com.project.backend_api.config.cafe24.Cafe24Properties;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class Cafe24IntegrationService {
    private final Cafe24Properties properties;

    public Map<String, Object> getStatus() {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("configured", properties.isConfigured());
        result.put("mallId", blankToNull(properties.getMallId()));
        result.put("apiBaseUrl", properties.apiBaseUrl());
        result.put("redirectUri", blankToNull(properties.getRedirectUri()));
        result.put("oauthReady", properties.isConfigured());
        result.put("message", properties.isConfigured()
                ? "Cafe24 환경변수가 설정되었습니다. OAuth 구현을 이어서 진행할 수 있습니다."
                : "Cafe24 연동 준비 상태입니다. 환경변수 설정 후 OAuth를 연결하세요.");
        return result;
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }
}
