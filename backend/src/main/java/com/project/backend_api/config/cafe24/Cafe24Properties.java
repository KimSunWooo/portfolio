package com.project.backend_api.config.cafe24;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "cafe24")
public class Cafe24Properties {
    private String mallId;
    private String clientId;
    private String clientSecret;
    private String redirectUri;

    public String getMallId() { return mallId; }
    public void setMallId(String mallId) { this.mallId = mallId; }
    public String getClientId() { return clientId; }
    public void setClientId(String clientId) { this.clientId = clientId; }
    public String getClientSecret() { return clientSecret; }
    public void setClientSecret(String clientSecret) { this.clientSecret = clientSecret; }
    public String getRedirectUri() { return redirectUri; }
    public void setRedirectUri(String redirectUri) { this.redirectUri = redirectUri; }

    public boolean isConfigured() {
        return notBlank(mallId) && notBlank(clientId) && notBlank(clientSecret) && notBlank(redirectUri);
    }

    public String apiBaseUrl() {
        return notBlank(mallId) ? "https://" + mallId + ".cafe24api.com/api/v2" : null;
    }

    private boolean notBlank(String value) {
        return value != null && !value.isBlank();
    }
}
