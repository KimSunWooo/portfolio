package com.project.backend_api.dto.payment;

public record PaymentConfirmResponse(
        String status,
        String orderId,
        Long amount,
        String message,
        boolean cartCleared
) {}
