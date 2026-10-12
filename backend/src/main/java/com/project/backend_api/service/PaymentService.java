package com.project.backend_api.service;

import com.project.backend_api.domain.payment.PaymentHistory;
import com.project.backend_api.dto.payment.PaymentConfirmRequest;
import com.project.backend_api.dto.payment.PaymentConfirmResponse;
import com.project.backend_api.repository.PaymentHistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class PaymentService {

    public static final long TEST_AMOUNT = 100L;
    private static final String CANCEL_REASON = "포트폴리오 테스트 결제 자동 환불 처리";

    private final PaymentGateway paymentGateway;
    private final PaymentHistoryRepository paymentHistoryRepository;
    private final ConcurrentHashMap<String, Object> paymentLocks = new ConcurrentHashMap<>();

    @Transactional(noRollbackFor = PaymentGatewayException.class)
    public PaymentConfirmResponse confirmTestPayment(PaymentConfirmRequest request, String userEmail) {
        if (userEmail == null || userEmail.isBlank() || "anonymousUser".equals(userEmail)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        if (request == null
                || isBlank(request.getPaymentKey())
                || isBlank(request.getOrderId())
                || request.getAmount() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "결제 정보가 올바르지 않습니다.");
        }
        if (request.getAmount() != TEST_AMOUNT) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "테스트 결제는 100원만 처리할 수 있습니다.");
        }

        String paymentKey = request.getPaymentKey().trim();
        String orderId = request.getOrderId().trim();
        Object lock = paymentLocks.computeIfAbsent(paymentKey, ignored -> new Object());
        synchronized (lock) {
            return confirmLocked(userEmail, paymentKey, orderId);
        }
    }

    private PaymentConfirmResponse confirmLocked(String userEmail, String paymentKey, String orderId) {
        List<PaymentHistory> histories = paymentHistoryRepository.findByPaymentKeyOrderByIdAsc(paymentKey);
        boolean otherOwner = histories.stream().anyMatch(history -> !userEmail.equals(history.getUserEmail()));
        if (otherOwner) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "다른 사용자의 결제입니다.");
        }
        boolean orderMismatch = histories.stream().anyMatch(history -> !orderId.equals(history.getOrderId()));
        if (orderMismatch) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "결제 키와 주문 번호가 일치하지 않습니다.");
        }
        boolean alreadyCanceled = histories.stream().anyMatch(history -> "CANCELED".equals(history.getStatus()));
        if (alreadyCanceled) {
            return canceled(orderId, "이미 자동 취소된 테스트 결제입니다.");
        }

        boolean approved = histories.stream().anyMatch(history -> "DONE".equals(history.getStatus()));
        if (!approved) {
            PaymentGateway.PaymentApproval approval = paymentGateway.approve(paymentKey, orderId, TEST_AMOUNT);
            if (!paymentKey.equals(approval.paymentKey())
                    || !orderId.equals(approval.orderId())
                    || approval.amount() != TEST_AMOUNT) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "결제사 승인 금액 또는 주문 정보가 요청과 다릅니다.");
            }
            paymentHistoryRepository.save(history(userEmail, orderId, paymentKey, "DONE", null, null));
        }

        try {
            paymentGateway.cancel(paymentKey, CANCEL_REASON);
        } catch (PaymentGatewayException exception) {
            throw new PaymentGatewayException("승인은 기록됐지만 자동 취소에 실패했습니다. 완료로 처리하지 않습니다.", exception);
        }

        paymentHistoryRepository.save(history(
                userEmail,
                orderId,
                paymentKey,
                "CANCELED",
                CANCEL_REASON,
                LocalDateTime.now()
        ));
        return canceled(orderId, "테스트 결제가 승인된 뒤 자동 취소되었습니다.");
    }

    public List<PaymentHistory> getMyPaymentHistory(String userEmail, String status) {
        if (userEmail == null || userEmail.isBlank() || "anonymousUser".equals(userEmail)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다.");
        }
        if (!"DONE".equals(status) && !"CANCELED".equals(status)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "조회할 수 있는 결제 상태가 아닙니다.");
        }
        return paymentHistoryRepository.findByUserEmailAndStatusOrderByCreatedAtDesc(userEmail, status);
    }

    private PaymentConfirmResponse canceled(String orderId, String message) {
        return new PaymentConfirmResponse("CANCELED", orderId, TEST_AMOUNT, message, false);
    }

    private PaymentHistory history(
            String userEmail,
            String orderId,
            String paymentKey,
            String status,
            String cancelReason,
            LocalDateTime canceledAt
    ) {
        return PaymentHistory.builder()
                .userEmail(userEmail)
                .orderId(orderId)
                .paymentKey(paymentKey)
                .amount(TEST_AMOUNT)
                .status(status)
                .cancelReason(cancelReason)
                .canceledAt(canceledAt)
                .build();
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
