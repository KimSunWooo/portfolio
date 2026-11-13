package com.project.backend_api.service;

import com.project.backend_api.dto.payment.PaymentConfirmRequest;
import com.project.backend_api.dto.payment.PaymentConfirmResponse;
import com.project.backend_api.repository.PaymentHistoryRepository;
import com.project.backend_api.support.SimpleCacheTestConfiguration;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.RepeatedTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.mysql.MySQLContainer;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Two logical PaymentService instances share one MySQL claim table.
 * No real Toss calls — fault-injectable gateway only.
 */
@DataJpaTest
@Import(SimpleCacheTestConfiguration.class)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@Testcontainers
@TestPropertySource(properties = {
        "spring.profiles.active=test",
        "spring.jpa.hibernate.ddl-auto=none",
        "spring.flyway.enabled=false",
        "spring.jpa.open-in-view=false",
        "jwt.secret=test-secret-test-secret-test-secret-test",
        "toss.secret-key=test",
        "cloud.aws.credentials.access-key=test",
        "cloud.aws.credentials.secret-key=test",
        "cloud.aws.s3.bucket=test",
        "spring.mail.password=test"
})
class PaymentRecoveryMySqlTest {

    @Container
    static final MySQLContainer MYSQL = new MySQLContainer("mysql:8.4");

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", MYSQL::getJdbcUrl);
        registry.add("spring.datasource.username", MYSQL::getUsername);
        registry.add("spring.datasource.password", MYSQL::getPassword);
    }

    @BeforeAll
    static void migrate() {
        Flyway.configure()
                .dataSource(MYSQL.getJdbcUrl(), MYSQL.getUsername(), MYSQL.getPassword())
                .locations("classpath:db/migration")
                .baselineOnMigrate(true)
                .baselineVersion("0")
                .load()
                .migrate();
    }

    @Autowired
    PaymentHistoryRepository paymentHistoryRepository;
    @Autowired
    JdbcTemplate jdbc;
    @Autowired
    PlatformTransactionManager transactionManager;

    SharedGateway gateway;
    PaymentService instanceA;
    PaymentService instanceB;

    @BeforeEach
    void setUp() {
        jdbc.update("DELETE FROM payment_histories");
        jdbc.update("DELETE FROM test_payment_claims");
        gateway = new SharedGateway();
        JdbcPaymentClaimStore claimsA = new JdbcPaymentClaimStore(jdbc);
        JdbcPaymentClaimStore claimsB = new JdbcPaymentClaimStore(jdbc);
        // Same PlatformTransactionManager as JPA so history saves join the claim transaction.
        instanceA = new PaymentService(gateway, paymentHistoryRepository, claimsA, transactionManager);
        instanceB = new PaymentService(gateway, paymentHistoryRepository, claimsB, transactionManager);
    }

    @RepeatedTest(10)
    void concurrentConfirmAcrossInstancesApprovesOnce() throws Exception {
        int threads = 6;
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch ready = new CountDownLatch(threads);
        CountDownLatch start = new CountDownLatch(1);
        AtomicInteger success = new AtomicInteger();
        List<Future<?>> futures = new ArrayList<>();
        try {
            for (int i = 0; i < threads; i++) {
                PaymentService service = i % 2 == 0 ? instanceA : instanceB;
                futures.add(pool.submit(() -> {
                    ready.countDown();
                    start.await(5, TimeUnit.SECONDS);
                    PaymentConfirmResponse response = service.confirmTestPayment(request("pay-race"), "buyer@example.com");
                    if ("CANCELED".equals(response.status())) {
                        success.incrementAndGet();
                    }
                    return null;
                }));
            }
            assertTrue(ready.await(5, TimeUnit.SECONDS));
            start.countDown();
            for (Future<?> future : futures) {
                future.get(15, TimeUnit.SECONDS);
            }
        } finally {
            start.countDown();
            pool.shutdownNow();
        }

        assertEquals(1, gateway.approvals.get());
        assertEquals(1, gateway.cancels.get());
        assertEquals(threads, success.get());
        assertEquals(1, count("SELECT COUNT(*) FROM payment_histories WHERE status = 'DONE'"));
        assertEquals(1, count("SELECT COUNT(*) FROM payment_histories WHERE status = 'CANCELED'"));
        assertEquals("CANCELED", jdbc.queryForObject(
                "SELECT state FROM test_payment_claims WHERE payment_key = 'pay-race'", String.class));
    }

    @Test
    void existingClaimCannotBeTakenByAnotherOwnerOrOrder() {
        PaymentConfirmRequest request = request("pay-owner");
        instanceA.confirmTestPayment(request, "buyer@example.com");

        ResponseStatusException otherOwner = assertThrows(ResponseStatusException.class,
                () -> instanceB.confirmTestPayment(request, "other@example.com"));
        assertEquals(HttpStatus.FORBIDDEN, otherOwner.getStatusCode());

        PaymentConfirmRequest otherOrder = request("pay-owner");
        otherOrder.setOrderId("ORDER-different");
        ResponseStatusException orderMismatch = assertThrows(ResponseStatusException.class,
                () -> instanceB.confirmTestPayment(otherOrder, "buyer@example.com"));
        assertEquals(HttpStatus.CONFLICT, orderMismatch.getStatusCode());

        assertEquals(1, gateway.approvals.get());
        assertEquals(1, gateway.cancels.get());
        assertEquals("buyer@example.com", jdbc.queryForObject(
                "SELECT user_email FROM test_payment_claims WHERE payment_key = 'pay-owner'", String.class));
        assertEquals("ORDER-pay-owner", jdbc.queryForObject(
                "SELECT order_id FROM test_payment_claims WHERE payment_key = 'pay-owner'", String.class));
        assertEquals("CANCELED", jdbc.queryForObject(
                "SELECT state FROM test_payment_claims WHERE payment_key = 'pay-owner'", String.class));
    }

    @Test
    void uncertainApproveIsReconciledFromProviderWithoutReApprove() {
        // Approve appears to fail locally while provider status cannot be confirmed yet.
        gateway.failApprovalAsUnknown = true;
        assertThrows(PaymentGatewayException.class,
                () -> instanceA.confirmTestPayment(request("pay-uncertain"), "buyer@example.com"));
        assertEquals("UNCERTAIN", jdbc.queryForObject(
                "SELECT state FROM test_payment_claims WHERE payment_key = 'pay-uncertain'", String.class));
        assertEquals(1, gateway.approvals.get());

        // Later the provider shows DONE — another instance reconciles without approving again.
        gateway.failApprovalAsUnknown = false;
        gateway.providerStatus = PaymentGateway.ProviderStatus.DONE;
        PaymentConfirmResponse recovered = instanceB.confirmTestPayment(request("pay-uncertain"), "buyer@example.com");
        assertEquals("CANCELED", recovered.status());
        assertEquals(1, gateway.approvals.get());
        assertTrue(gateway.lookups.get() >= 1);
        assertEquals(1, count("SELECT COUNT(*) FROM payment_histories WHERE payment_key = 'pay-uncertain' AND status = 'DONE'"));
        assertEquals(1, count("SELECT COUNT(*) FROM payment_histories WHERE payment_key = 'pay-uncertain' AND status = 'CANCELED'"));
    }

    @Test
    void cancelFailureLeavesApprovedClaimForRetryWithoutSecondApprove() {
        gateway.failCancel = true;
        assertThrows(PaymentGatewayException.class,
                () -> instanceA.confirmTestPayment(request("pay-cancel"), "buyer@example.com"));
        assertEquals("APPROVED", jdbc.queryForObject(
                "SELECT state FROM test_payment_claims WHERE payment_key = 'pay-cancel'", String.class));
        assertEquals(1, gateway.approvals.get());
        assertEquals(1, count("SELECT COUNT(*) FROM payment_histories WHERE status = 'DONE'"));

        gateway.failCancel = false;
        PaymentConfirmResponse retried = instanceB.confirmTestPayment(request("pay-cancel"), "buyer@example.com");
        assertEquals("CANCELED", retried.status());
        assertEquals(1, gateway.approvals.get());
        assertEquals(1, count("SELECT COUNT(*) FROM payment_histories WHERE status = 'CANCELED'"));
    }

    private int count(String sql) {
        Integer value = jdbc.queryForObject(sql, Integer.class);
        return value == null ? 0 : value;
    }

    private static PaymentConfirmRequest request(String paymentKey) {
        PaymentConfirmRequest request = new PaymentConfirmRequest();
        request.setPaymentKey(paymentKey);
        request.setOrderId("ORDER-" + paymentKey);
        request.setAmount(PaymentService.TEST_AMOUNT);
        return request;
    }

    private static final class SharedGateway implements PaymentGateway {
        private final AtomicInteger approvals = new AtomicInteger();
        private final AtomicInteger cancels = new AtomicInteger();
        private final AtomicInteger lookups = new AtomicInteger();
        private volatile boolean failCancel;
        private volatile boolean failApprovalAsUnknown;
        private volatile ProviderStatus providerStatus = ProviderStatus.NOT_FOUND;

        @Override
        public synchronized PaymentApproval approve(String paymentKey, String orderId, long amount) {
            approvals.incrementAndGet();
            if (failApprovalAsUnknown) {
                providerStatus = ProviderStatus.UNKNOWN;
                throw new PaymentGatewayException("승인 응답 유실");
            }
            providerStatus = ProviderStatus.DONE;
            return new PaymentApproval(paymentKey, orderId, amount);
        }

        @Override
        public synchronized void cancel(String paymentKey, String reason) {
            cancels.incrementAndGet();
            if (failCancel) {
                throw new PaymentGatewayException("취소 실패");
            }
            providerStatus = ProviderStatus.CANCELED;
        }

        @Override
        public synchronized ProviderPayment lookup(String paymentKey) {
            lookups.incrementAndGet();
            if (providerStatus == ProviderStatus.NOT_FOUND) {
                return ProviderPayment.notFound(paymentKey);
            }
            return new ProviderPayment(providerStatus, paymentKey, "ORDER-" + paymentKey, PaymentService.TEST_AMOUNT);
        }
    }
}
