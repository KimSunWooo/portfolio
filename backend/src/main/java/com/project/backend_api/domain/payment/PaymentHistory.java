package com.project.backend_api.domain.payment;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "payment_histories")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class PaymentHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 💡 마이페이지 조회를 위해 추가! (결제한 유저 식별)
    @Column(nullable = false)
    private String userEmail; 

    @Column(nullable = false)
    private String orderId;

    @Column(nullable = false)
    private String paymentKey;

    @Column(nullable = false)
    private Long amount;

    // 💡 이 컬럼으로 결제(DONE)인지 취소(CANCELED)인지 구분합니다.
    @Column(nullable = false)
    private String status; 

    private String cancelReason;

    @CreatedDate
    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime canceledAt;
}