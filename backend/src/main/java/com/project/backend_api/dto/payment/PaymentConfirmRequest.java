package com.project.backend_api.dto.payment;

import lombok.Data;

@Data
public class PaymentConfirmRequest {
    private String paymentKey;
    private String orderId;
    private Long amount;
}