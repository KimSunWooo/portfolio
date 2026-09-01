package com.project.backend_api.repository;

import com.project.backend_api.domain.cart.CartItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, Long> {
    // 장바구니에 똑같은 상품이 이미 담겨 있는지 확인하기 위해 사용합니다.
    Optional<CartItem> findByCart_IdAndProduct_Id(Long cartId, Integer productId);

    // 💡 헤더 장바구니 뱃지용: 특정 카트에 담긴 전체 상품 수량 합계 조회
    @Query("SELECT COALESCE(SUM(c.quantity), 0) FROM CartItem c WHERE c.cart.id = :cartId")
    int sumQuantityByCartId(@Param("cartId") Long cartId);
}