package com.project.backend_api.service;

import com.project.backend_api.domain.payment.PaymentHistory;
import com.project.backend_api.dto.payment.PaymentConfirmRequest;
import com.project.backend_api.repository.PaymentHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.List;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    @Value("${toss.secret-key}")
    private String tossSecretKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final PaymentHistoryRepository paymentHistoryRepository;

    @Transactional 
    public Map<String, Object> confirmAndRefund(PaymentConfirmRequest request) {
        String widgetSecretKey = tossSecretKey + ":";
        String encodedKey = Base64.getEncoder().encodeToString(widgetSecretKey.getBytes(StandardCharsets.UTF_8));
        
        HttpHeaders headers = new HttpHeaders();
        headers.setBasicAuth(encodedKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        // JWT 토큰에서 현재 유저 이메일 추출
        String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();

        // ==========================================
            // [STEP 1] 결제 승인 기록 DB 저장 (INSERT)
            // ==========================================
            PaymentHistory payment = PaymentHistory.builder()
                    .userEmail(currentUserEmail)
                    .orderId(request.getOrderId())
                    .paymentKey(request.getPaymentKey())
                    .amount(request.getAmount())
                    .status("DONE") 
                    .build();
            paymentHistoryRepository.save(payment);

            // ==========================================
            // [STEP 2] 승인 성공 즉시 결제 취소 (Refund) 요청
            // ==========================================
            String cancelReason = "포트폴리오 테스트 결제 자동 환불 처리";
            Map<String, Object> cancelPayload = new HashMap<>();
            cancelPayload.put("cancelReason", cancelReason);

            HttpEntity<Map<String, Object>> cancelEntity = new HttpEntity<>(cancelPayload, headers);

            ResponseEntity<Map<String, Object>> cancelResponse = restTemplate.exchange(
                    "https://api.tosspayments.com/v1/payments/" + request.getPaymentKey() + "/cancel",
                    HttpMethod.POST, cancelEntity,
                    new ParameterizedTypeReference<Map<String, Object>>() {}
            );
            
            // 💡 [핵심] 덮어쓰지 않고 새로운 ROW를 만들어서 DB에 추가 저장 (INSERT 2번째)
            PaymentHistory cancelHistory = PaymentHistory.builder()
                    .userEmail(currentUserEmail)
                    .orderId(request.getOrderId())
                    .paymentKey(request.getPaymentKey())
                    .amount(request.getAmount())
                    .status("CANCELED") // 취소 상태
                    .cancelReason(cancelReason)
                    .canceledAt(LocalDateTime.now()) // 취소 시간 기록
                    .build();
            paymentHistoryRepository.save(cancelHistory); // 2번째 줄 생성!

            return cancelResponse.getBody();
    }

    public List<PaymentHistory> getMyPaymentHistory(String status) {
    // 현재 로그인한 유저 이메일
    String userEmail = SecurityContextHolder.getContext().getAuthentication().getName();
    
    // 리포지토리에서 상태(DONE/CANCELED)에 맞는 내역 조회
    return paymentHistoryRepository.findByUserEmailAndStatusOrderByCreatedAtDesc(userEmail, status);
}
}