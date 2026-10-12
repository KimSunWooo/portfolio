package com.project.backend_api.controller;

import com.project.backend_api.dto.payment.PaymentConfirmRequest;
import com.project.backend_api.dto.payment.PaymentConfirmResponse;
import com.project.backend_api.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/confirm")
    public PaymentConfirmResponse confirmPayment(
            @RequestBody PaymentConfirmRequest request,
            Authentication authentication
    ) {
        return paymentService.confirmTestPayment(request, currentEmail(authentication));
    }

    @GetMapping("/history")
    public Object getMyHistory(@RequestParam String status, Authentication authentication) {
        return paymentService.getMyPaymentHistory(currentEmail(authentication), status);
    }

    private String currentEmail(Authentication authentication) {
        if (authentication == null || authentication.getName() == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        return authentication.getName();
    }
}
