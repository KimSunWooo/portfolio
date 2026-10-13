package com.project.backend_api.domain.cart;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "cart_sync_requests",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_cart_sync_user_op_key",
                columnNames = {"user_email", "operation", "request_key"}
        )
)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class CartSyncRequest {

    public static final String CART_SYNC = "CART_SYNC";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_email", nullable = false, length = 100)
    private String userEmail;

    @Column(name = "operation", nullable = false, length = 32)
    private String operation;

    @Column(name = "request_key", nullable = false, length = 80)
    private String requestKey;

    @Column(name = "request_hash", nullable = false, length = 64)
    private String requestHash;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
}
