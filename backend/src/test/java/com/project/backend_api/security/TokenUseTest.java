package com.project.backend_api.security;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TokenUseTest {

    @Test
    void legacyAccessTokenWithRoleRemainsUsable() {
        assertTrue(TokenUse.usableAsAccess(null, "ROLE_USER"));
        assertFalse(TokenUse.usableAsRefresh(null, "ROLE_USER"));
    }

    @Test
    void legacyRefreshTokenWithoutRoleRemainsUsable() {
        assertTrue(TokenUse.usableAsRefresh(null, null));
        assertFalse(TokenUse.usableAsAccess(null, null));
    }

    @Test
    void typedTokensCannotBeSwapped() {
        assertTrue(TokenUse.usableAsAccess("access", "ROLE_ADMIN"));
        assertFalse(TokenUse.usableAsRefresh("access", "ROLE_ADMIN"));
        assertTrue(TokenUse.usableAsRefresh("refresh", null));
        assertFalse(TokenUse.usableAsAccess("refresh", "ROLE_USER"));
    }
}
