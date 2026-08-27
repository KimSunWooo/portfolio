package com.project.backend_api.repository;

import com.project.backend_api.domain.cart.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    // 장바구니에 똑같은 상품이 이미 담겨 있는지 확인하기 위해 사용합니다.
    Optional<CartItem> findByCart_IdAndProduct_Id(Long cartId, Integer productId);
}