package com.project.backend_api.repository;

import com.project.backend_api.domain.cart.CartSyncRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CartSyncRequestRepository extends JpaRepository<CartSyncRequest, Long> {

    Optional<CartSyncRequest> findByUserEmailAndOperationAndRequestKey(
            String userEmail,
            String operation,
            String requestKey
    );
}
