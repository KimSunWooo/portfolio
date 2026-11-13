package com.project.backend_api.service;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Single-process claim store used by unit tests. Production uses {@link JdbcPaymentClaimStore}.
 */
public final class InMemoryPaymentClaimStore implements PaymentClaimStore {

    private final ConcurrentHashMap<String, Claim> claims = new ConcurrentHashMap<>();

    @Override
    public Claim tryBegin(String paymentKey, String orderId, String userEmail) {
        Claim created = new Claim(
                paymentKey,
                orderId,
                userEmail,
                State.PROCESSING,
                null,
                LocalDateTime.now()
        );
        Claim existing = claims.putIfAbsent(paymentKey, created);
        return existing == null ? created : existing;
    }

    @Override
    public Optional<Claim> findForUpdate(String paymentKey) {
        return Optional.ofNullable(claims.get(paymentKey));
    }

    @Override
    public void update(String paymentKey, State state, String providerStatus) {
        claims.computeIfPresent(paymentKey, (key, previous) -> new Claim(
                previous.paymentKey(),
                previous.orderId(),
                previous.userEmail(),
                state,
                providerStatus,
                LocalDateTime.now()
        ));
    }
}
