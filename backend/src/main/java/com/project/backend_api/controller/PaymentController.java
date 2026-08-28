package com.project.backend_api.controller;

import com.project.backend_api.dto.payment.PaymentConfirmRequest;
import com.project.backend_api.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/confirm")
    public ResponseEntity<?> confirmPayment(@RequestBody PaymentConfirmRequest request) {
        try {
            // 결제 승인 후 즉시 취소하는 서비스 로직 호출
            Map<String, Object> result = paymentService.confirmAndRefund(request);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/history")
    public ResponseEntity<?> getMyHistory(@RequestParam String status) {
        try {
            return ResponseEntity.ok(paymentService.getMyPaymentHistory(status));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}