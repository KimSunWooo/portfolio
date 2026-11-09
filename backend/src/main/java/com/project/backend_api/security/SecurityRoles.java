package com.project.backend_api.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityRoles {

    private SecurityRoles() {
    }

    public static boolean hasAuthority(String authority) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null) {
            return false;
        }
        for (GrantedAuthority granted : authentication.getAuthorities()) {
            if (authority.equals(granted.getAuthority())) {
                return true;
            }
        }
        return false;
    }

    public static boolean isAdmin() {
        return hasAuthority("ROLE_ADMIN");
    }

    public static boolean isDemo() {
        return hasAuthority("ROLE_DEMO");
    }
}
