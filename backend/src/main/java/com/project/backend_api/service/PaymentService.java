package com.project.backend_api.service;

import com.project.backend_api.domain.payment.PaymentHistory;
import com.project.backend_api.dto.payment.PaymentConfirmRequest;
import com.project.backend_api.dto.payment.PaymentConfirmResponse;
import com.project.backend_api.observability.OperationLog;
import com.project.backend_api.repository.PaymentHistoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionOperations;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Portfolio test payment: approve 100원 then auto-cancel.
 * Ownership of a paymentKey is claimed in {@link PaymentClaimStore} so multiple
 * app instances sharing MySQL cannot double-approve. When local state is uncertain,
 * the provider {@link PaymentGateway#lookup(String)} result is the source of truth.
 */
@Service
public class PaymentService {

    public static final long TEST_AMOUNT = 100L;
    private static final String CANCEL_REASON = "포트폴리오 테스트 결제 자동 환불 처리";

    private final PaymentGateway paymentGateway;
    private final PaymentHistoryRepository paymentHistoryRepository;
    private final PaymentClaimStore claimStore;
    private final TransactionOperations transactions;
    /** Intra-process serialization on top of DB claims (unit tests / same JVM). */
    private final ConcurrentHashMap<String, Object> paymentLocks = new ConcurrentHashMap<>();

    @Autowired
    public PaymentService(
            PaymentGateway paymentGateway,
            PaymentHistoryRepository paymentHistoryRepository,
            PaymentClaimStore claimStore,
            PlatformTransactionManager transactionManager
    ) {
        this(paymentGateway, paymentHistoryRepository, claimStore, requiresNew(transactionManager));
    }

    PaymentService(
            PaymentGateway paymentGateway,
            PaymentHistoryRepository paymentHistoryRepository,
            TransactionOperations transactions
    ) {
        this(paymentGateway, paymentHistoryRepository, new InMemoryPaymentClaimStore(), transactions);
    }

    PaymentService(
            PaymentGateway paymentGateway,
            PaymentHistoryRepository paymentHistoryRepository,
            PaymentClaimStore claimStore,
            TransactionOperations transactions
    ) {
        this.paymentGateway = paymentGateway;
        this.paymentHistoryRepository = paymentHistoryRepository;
        this.claimStore = claimStore;
        this.transactions = transactions;
    }

    private static TransactionTemplate requiresNew(PlatformTransactionManager transactionManager) {
        TransactionTemplate template = new TransactionTemplate(transactionManager);
        template.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        return template;
    }

    public PaymentConfirmResponse confirmTestPayment(PaymentConfirmRequest request, String userEmail) {
        return OperationLog.observe(OperationLog.Operation.PAYMENT_CONFIRM, scope -> {
            scope.stage("validate");
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
                scope.stage("claim");
                PaymentGatewayException[] cancelFailure = new PaymentGatewayException[1];
                PaymentConfirmResponse response = transactions.execute(status -> {
                    try {
                        return confirmClaimed(userEmail, paymentKey, orderId, scope);
                    } catch (PaymentGatewayException exception) {
                        cancelFailure[0] = exception;
                        return null;
                    }
                });
                if (cancelFailure[0] != null) {
                    throw cancelFailure[0];
                }
                return response;
            }
        });
    }

    private PaymentConfirmResponse confirmClaimed(
            String userEmail,
            String paymentKey,
            String orderId,
            OperationLog.Scope scope
    ) {
        PaymentClaimStore.Claim claim = claimStore.tryBegin(paymentKey, orderId, userEmail);
        if (!userEmail.equals(claim.userEmail())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "다른 사용자의 결제입니다.");
        }
        if (!orderId.equals(claim.orderId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "결제 키와 주문 번호가 일치하지 않습니다.");
        }

        List<PaymentHistory> histories = paymentHistoryRepository.findByPaymentKeyOrderByIdAsc(paymentKey);
        boolean otherOwner = histories.stream().anyMatch(history -> !userEmail.equals(history.getUserEmail()));
        if (otherOwner) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "다른 사용자의 결제입니다.");
        }
        boolean orderMismatch = histories.stream().anyMatch(history -> !orderId.equals(history.getOrderId()));
        if (orderMismatch) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "결제 키와 주문 번호가 일치하지 않습니다.");
        }
        if (histories.stream().anyMatch(history -> "CANCELED".equals(history.getStatus()))
                || claim.state() == PaymentClaimStore.State.CANCELED) {
            claimStore.update(paymentKey, PaymentClaimStore.State.CANCELED, "CANCELED");
            return canceled(orderId, "이미 자동 취소된 테스트 결제입니다.");
        }

        boolean approvedLocally = histories.stream().anyMatch(history -> "DONE".equals(history.getStatus()))
                || claim.state() == PaymentClaimStore.State.APPROVED;

        if (!approvedLocally || claim.state() == PaymentClaimStore.State.UNCERTAIN
                || claim.state() == PaymentClaimStore.State.PROCESSING) {
            scope.stage("reconcile");
            approvedLocally = ensureApproved(userEmail, paymentKey, orderId, claim, approvedLocally, scope);
        }

        scope.stage("cancel");
        try {
            paymentGateway.cancel(paymentKey, CANCEL_REASON);
        } catch (PaymentGatewayException exception) {
            claimStore.update(paymentKey, PaymentClaimStore.State.APPROVED, "DONE");
            throw new PaymentGatewayException("승인은 기록됐지만 자동 취소에 실패했습니다. 완료로 처리하지 않습니다.", exception);
        }

        if (histories.stream().noneMatch(history -> "CANCELED".equals(history.getStatus()))) {
            paymentHistoryRepository.save(history(
                    userEmail,
                    orderId,
                    paymentKey,
                    "CANCELED",
                    CANCEL_REASON,
                    LocalDateTime.now()
            ));
        }
        claimStore.update(paymentKey, PaymentClaimStore.State.CANCELED, "CANCELED");
        return canceled(orderId, "테스트 결제가 승인된 뒤 자동 취소되었습니다.");
    }

    private boolean ensureApproved(
            String userEmail,
            String paymentKey,
            String orderId,
            PaymentClaimStore.Claim claim,
            boolean approvedLocally,
            OperationLog.Scope scope
    ) {
        if (approvedLocally && claim.state() != PaymentClaimStore.State.UNCERTAIN) {
            return true;
        }

        PaymentGateway.ProviderPayment provider = null;
        if (claim.state() == PaymentClaimStore.State.UNCERTAIN
                || claim.state() == PaymentClaimStore.State.PROCESSING && approvedLocally) {
            scope.stage("lookup");
            provider = paymentGateway.lookup(paymentKey);
            if (provider.status() == PaymentGateway.ProviderStatus.CANCELED) {
                persistCanceledIfMissing(userEmail, orderId, paymentKey);
                claimStore.update(paymentKey, PaymentClaimStore.State.CANCELED, provider.status().name());
                throw new ResponseStatusException(HttpStatus.CONFLICT, "결제사에서 이미 취소된 결제입니다.");
            }
            if (provider.status() == PaymentGateway.ProviderStatus.DONE) {
                persistDoneIfMissing(userEmail, orderId, paymentKey);
                claimStore.update(paymentKey, PaymentClaimStore.State.APPROVED, "DONE");
                return true;
            }
            if (provider.status() == PaymentGateway.ProviderStatus.NOT_FOUND
                    || provider.status() == PaymentGateway.ProviderStatus.READY
                    || provider.status() == PaymentGateway.ProviderStatus.ABORTED) {
                // Safe to approve only when provider has no successful charge.
            } else if (provider.status() == PaymentGateway.ProviderStatus.IN_PROGRESS
                    || provider.status() == PaymentGateway.ProviderStatus.UNKNOWN) {
                claimStore.update(paymentKey, PaymentClaimStore.State.UNCERTAIN, provider.status().name());
                throw new PaymentGatewayException("결제사 상태가 불확실합니다. 재승인하지 않고 확인이 필요합니다.");
            }
        }

        if (approvedLocally) {
            return true;
        }

        scope.stage("approve");
        claimStore.update(paymentKey, PaymentClaimStore.State.PROCESSING, provider == null ? null : provider.status().name());
        try {
            PaymentGateway.PaymentApproval approval = paymentGateway.approve(paymentKey, orderId, TEST_AMOUNT);
            if (!paymentKey.equals(approval.paymentKey())
                    || !orderId.equals(approval.orderId())
                    || approval.amount() != TEST_AMOUNT) {
                claimStore.update(paymentKey, PaymentClaimStore.State.UNCERTAIN, "MISMATCH");
                throw new ResponseStatusException(HttpStatus.CONFLICT, "결제사 승인 금액 또는 주문 정보가 요청과 다릅니다.");
            }
        } catch (PaymentGatewayException exception) {
            scope.stage("lookup-after-approve-failure");
            PaymentGateway.ProviderPayment after = paymentGateway.lookup(paymentKey);
            if (after.status() == PaymentGateway.ProviderStatus.DONE) {
                persistDoneIfMissing(userEmail, orderId, paymentKey);
                claimStore.update(paymentKey, PaymentClaimStore.State.APPROVED, "DONE");
                return true;
            }
            if (after.status() == PaymentGateway.ProviderStatus.CANCELED) {
                persistCanceledIfMissing(userEmail, orderId, paymentKey);
                claimStore.update(paymentKey, PaymentClaimStore.State.CANCELED, "CANCELED");
                throw exception;
            }
            claimStore.update(paymentKey, PaymentClaimStore.State.UNCERTAIN, after.status().name());
            throw new PaymentGatewayException("승인 결과가 불확실합니다. 결제사 상태를 확인한 뒤 복구합니다.", exception);
        }

        persistDoneIfMissing(userEmail, orderId, paymentKey);
        claimStore.update(paymentKey, PaymentClaimStore.State.APPROVED, "DONE");
        return true;
    }

    private void persistDoneIfMissing(String userEmail, String orderId, String paymentKey) {
        List<PaymentHistory> histories = paymentHistoryRepository.findByPaymentKeyOrderByIdAsc(paymentKey);
        if (histories.stream().noneMatch(history -> "DONE".equals(history.getStatus()))) {
            paymentHistoryRepository.save(history(userEmail, orderId, paymentKey, "DONE", null, null));
        }
    }

    private void persistCanceledIfMissing(String userEmail, String orderId, String paymentKey) {
        List<PaymentHistory> histories = paymentHistoryRepository.findByPaymentKeyOrderByIdAsc(paymentKey);
        if (histories.stream().noneMatch(history -> "CANCELED".equals(history.getStatus()))) {
            paymentHistoryRepository.save(history(
                    userEmail, orderId, paymentKey, "CANCELED", CANCEL_REASON, LocalDateTime.now()));
        }
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
