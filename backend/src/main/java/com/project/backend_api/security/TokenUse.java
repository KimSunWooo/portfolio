package com.project.backend_api.security;

/**
 * Access/Refresh 용도 구분.
 * tokenType 이 없는 기존 토큰은 role 유무로 구분한다.
 * role 이 있는 기존 Access Token 과 role 이 없는 기존 Refresh Token 은 재로그인 없이 유지한다.
 */
public final class TokenUse {

    private TokenUse() {
    }

    public static boolean usableAsAccess(String tokenType, String role) {
        if ("refresh".equals(tokenType)) {
            return false;
        }
        return role != null && !role.isBlank();
    }

    public static boolean usableAsRefresh(String tokenType, String role) {
        if ("access".equals(tokenType)) {
            return false;
        }
        if ("refresh".equals(tokenType)) {
            return true;
        }
        return role == null || role.isBlank();
    }
}
