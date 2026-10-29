package com.project.backend_api.security;

/**
 * Optional hook used only by the isolated verify profile. Production does not
 * register an implementation, so revocation behavior is unchanged.
 */
public interface SessionRevokeFault {
    void beforeRevoke();
}
