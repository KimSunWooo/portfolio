package com.project.backend_api.service;

import com.project.backend_api.domain.payment.PaymentHistory;
import com.project.backend_api.dto.payment.PaymentConfirmRequest;
import com.project.backend_api.dto.payment.PaymentConfirmResponse;
import com.project.backend_api.repository.PaymentHistoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.support.SimpleTransactionStatus;
import org.springframework.transaction.support.TransactionOperations;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private PaymentHistoryRepository paymentHistoryRepository;

    private final List<PaymentHistory> saved = new ArrayList<>();
    private FakePaymentGateway gateway;
    private PaymentService paymentService;

    @BeforeEach
    void setUp() {
        gateway = new FakePaymentGateway();
        paymentService = new PaymentService(gateway, paymentHistoryRepository, directTransactions());
        lenient().when(paymentHistoryRepository.findByPaymentKeyOrderByIdAsc("pay-1")).thenAnswer(invocation -> List.copyOf(saved));
        lenient().when(paymentHistoryRepository.save(any())).thenAnswer(invocation -> {
            PaymentHistory history = invocation.getArgument(0);
            saved.add(history);
            return history;
        });
    }

    @Test
    void approvalIsRequiredBeforeDoneAndCancelIsRecorded() {
        PaymentConfirmResponse response = paymentService.confirmTestPayment(request(100L), "buyer@example.com");

        assertEquals("CANCELED", response.status());
        assertFalse(response.cartCleared());
        assertEquals(1, gateway.approvals);
        assertEquals(1, gateway.cancels);
        assertEquals(List.of("DONE", "CANCELED"), saved.stream().map(PaymentHistory::getStatus).toList());
    }

    @Test
    void failedApprovalDoesNotSaveDone() {
        gateway.failApproval = true;

        assertThrows(PaymentGatewayException.class, () -> paymentService.confirmTestPayment(request(100L), "buyer@example.com"));

        assertEquals(0, saved.size());
    }

    @Test
    void wrongAmountDoesNotCallGateway() {
        assertThrows(ResponseStatusException.class, () -> paymentService.confirmTestPayment(request(5000L), "buyer@example.com"));
        verify(paymentHistoryRepository, never()).save(any());
        assertEquals(0, gateway.approvals);
    }

    @Test
    void repeatedCallbackDoesNotApproveAgain() {
        paymentService.confirmTestPayment(request(100L), "buyer@example.com");
        paymentService.confirmTestPayment(request(100L), "buyer@example.com");

        assertEquals(1, gateway.approvals);
        assertEquals(1, gateway.cancels);
    }

    @Test
    void secondConfirmCannotApproveWhileTheFirstCommitIsStillRunning() throws Exception {
        CountDownLatch commitStarted = new CountDownLatch(1);
        CountDownLatch releaseCommit = new CountDownLatch(1);
        TransactionOperations gating = new TransactionOperations() {
            @Override
            public <T> T execute(org.springframework.transaction.support.TransactionCallback<T> action) {
                T result = action.doInTransaction(new SimpleTransactionStatus());
                commitStarted.countDown();
                try {
                    if (!releaseCommit.await(5, TimeUnit.SECONDS)) {
                        throw new IllegalStateException("commit was not released");
                    }
                } catch (InterruptedException exception) {
                    Thread.currentThread().interrupt();
                    throw new IllegalStateException(exception);
                }
                return result;
            }
        };
        PaymentService service = new PaymentService(gateway, paymentHistoryRepository, gating);
        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            Future<?> first = pool.submit(() -> service.confirmTestPayment(request(100L), "buyer@example.com"));
            if (!commitStarted.await(5, TimeUnit.SECONDS)) {
                throw new IllegalStateException("first confirm did not reach commit");
            }
            assertEquals(1, gateway.approvals);
            Future<?> second = pool.submit(() -> service.confirmTestPayment(request(100L), "buyer@example.com"));
            Thread.sleep(200);
            assertFalse(second.isDone());
            assertEquals(1, gateway.approvals);
            releaseCommit.countDown();
            first.get(5, TimeUnit.SECONDS);
            second.get(5, TimeUnit.SECONDS);
            assertEquals(1, gateway.approvals);
        } finally {
            releaseCommit.countDown();
            pool.shutdownNow();
        }
    }

    @Test
    void cancelFailureKeepsDoneAndDoesNotReportSuccess() {
        gateway.failCancel = true;

        assertThrows(PaymentGatewayException.class, () -> paymentService.confirmTestPayment(request(100L), "buyer@example.com"));

        ArgumentCaptor<PaymentHistory> captor = ArgumentCaptor.forClass(PaymentHistory.class);
        verify(paymentHistoryRepository, times(1)).save(captor.capture());
        assertEquals("DONE", captor.getValue().getStatus());
    }

    private static TransactionOperations directTransactions() {
        return new TransactionOperations() {
            @Override
            public <T> T execute(org.springframework.transaction.support.TransactionCallback<T> action) {
                return action.doInTransaction(new SimpleTransactionStatus());
            }
        };
    }

    private PaymentConfirmRequest request(long amount) {
        PaymentConfirmRequest request = new PaymentConfirmRequest();
        request.setPaymentKey("pay-1");
        request.setOrderId("ORDER-1");
        request.setAmount(amount);
        return request;
    }

    private static final class FakePaymentGateway implements PaymentGateway {
        private int approvals;
        private int cancels;
        private boolean failApproval;
        private boolean failCancel;

        @Override
        public PaymentApproval approve(String paymentKey, String orderId, long amount) {
            approvals++;
            if (failApproval) {
                throw new PaymentGatewayException("승인 실패");
            }
            return new PaymentApproval(paymentKey, orderId, amount);
        }

        @Override
        public void cancel(String paymentKey, String reason) {
            cancels++;
            if (failCancel) {
                throw new PaymentGatewayException("취소 실패");
            }
        }
    }
}
