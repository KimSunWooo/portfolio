package com.project.backend_api.service;

public interface PaymentGateway {
    PaymentApproval approve(String paymentKey, String orderId, long amount);

    void cancel(String paymentKey, String reason);

    record PaymentApproval(String paymentKey, String orderId, long amount) {}
}
