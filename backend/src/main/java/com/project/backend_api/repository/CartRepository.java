package com.project.backend_api.repository;

import com.project.backend_api.domain.cart.Cart;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CartRepository extends JpaRepository<Cart, Long> {
    // 유저의 이메일(로그인 ID)을 기반으로 해당 유저의 장바구니를 찾습니다.
    @Query("SELECT c FROM Cart c JOIN FETCH c.cartItems ci JOIN FETCH ci.product WHERE c.user.email = :email")
    Optional<Cart> findByUserEmailWithProducts(@Param("email") String email);
}