package com.project.backend_api.service;

public interface PaymentGateway {
    PaymentApproval approve(String paymentKey, String orderId, long amount);

    void cancel(String paymentKey, String reason);

    /**
     * Provider-side status used to recover when the local claim is UNCERTAIN
     * or when a previous process died between approve/cancel and persistence.
     */
    ProviderPayment lookup(String paymentKey);

    record PaymentApproval(String paymentKey, String orderId, long amount) {}

    enum ProviderStatus {
        NOT_FOUND,
        READY,
        IN_PROGRESS,
        DONE,
        CANCELED,
        ABORTED,
        UNKNOWN
    }

    record ProviderPayment(ProviderStatus status, String paymentKey, String orderId, long amount) {
        static ProviderPayment notFound(String paymentKey) {
            return new ProviderPayment(ProviderStatus.NOT_FOUND, paymentKey, null, -1L);
        }
    }
}
