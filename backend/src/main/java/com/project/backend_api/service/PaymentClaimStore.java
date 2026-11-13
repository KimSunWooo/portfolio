package com.project.backend_api.service;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Cross-instance ownership of a test-payment attempt.
 * Implementations must make {@link #tryBegin} atomic for a given payment key.
 */
public interface PaymentClaimStore {

    enum State {
        PROCESSING,
        APPROVED,
        UNCERTAIN,
        CANCELED
    }

    record Claim(
            String paymentKey,
            String orderId,
            String userEmail,
            State state,
            String providerStatus,
            LocalDateTime updatedAt
    ) {
    }

    /**
     * Insert PROCESSING when absent. When present, return the locked existing row.
     */
    Claim tryBegin(String paymentKey, String orderId, String userEmail);

    Optional<Claim> findForUpdate(String paymentKey);

    void update(String paymentKey, State state, String providerStatus);
}
