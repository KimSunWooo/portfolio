package com.project.backend_api.repository;

import com.project.backend_api.domain.payment.PaymentHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PaymentHistoryRepository extends JpaRepository<PaymentHistory, Long> {
    
    // 1. 마이페이지 - "결제 내역" 탭 (status가 'DONE'인 것만 조회)
    List<PaymentHistory> findByUserEmailAndStatusOrderByCreatedAtDesc(String userEmail, String status);

    // 2. 단건 조회 (나중에 주문 상세조회용)
    // Optional<PaymentHistory> findByOrderId(String orderId);
}