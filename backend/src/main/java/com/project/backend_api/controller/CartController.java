package com.project.backend_api.controller;

import com.project.backend_api.dto.cart.CartItemResponse;
import com.project.backend_api.dto.cart.CartRequest;
import com.project.backend_api.service.CartService; // 잠시 후 생성할 서비스
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;

import java.util.List;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    // 1. 내 장바구니 조회
    @GetMapping
    public ResponseEntity<?> getMyCart(Authentication authentication) {
        
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("로그인이 필요합니다.");
        }

        String email = authentication.getName(); // JWT 토큰에서 추출된 유저 이메일
        return ResponseEntity.ok(cartService.getCartItems(email));
    }

    // 2. 장바구니에 상품 담기
    @PostMapping
    public ResponseEntity<String> addCartItem(@Valid @RequestBody CartRequest request, Authentication authentication) {
        String email = authentication.getName();
        cartService.addCartItem(email, request);
        return ResponseEntity.ok("장바구니에 상품이 담겼습니다.");
    }

    // 3. 장바구니 상품 수량 변경
    @PutMapping("/{cartItemId}")
    public ResponseEntity<String> updateCartItemQuantity(
            @PathVariable Long cartItemId,
            @RequestParam int quantity,
            Authentication authentication) {
        String email = authentication.getName();
        cartService.updateCartItemQuantity(email, cartItemId, quantity);
        return ResponseEntity.ok("수량이 변경되었습니다.");
    }

    // 4. 장바구니 상품 삭제
    @DeleteMapping("/{cartItemId}")
    public ResponseEntity<String> deleteCartItem(
            @PathVariable Long cartItemId,
            Authentication authentication) {
        String email = authentication.getName();
        cartService.deleteCartItem(email, cartItemId);
        return ResponseEntity.ok("상품이 삭제되었습니다.");
    }

    @GetMapping("/count")
    public ResponseEntity<Integer> getCartCount(Authentication authentication) {
        if (authentication == null || authentication.getName() == null) {
            return ResponseEntity.ok(0);
        }
        String email = authentication.getName();
        
        List<CartItemResponse> items = cartService.getCartItems(email);
        
        // 스트림 대신 향상된 for문을 사용하여 Null 경고를 완벽하게 원천 차단합니다.
        int totalQuantity = 0;
        if (items != null) {
            for (CartItemResponse item : items) {
                if (item != null) {
                    totalQuantity += item.getQuantity();
                }
            }
        }
                                 
        return ResponseEntity.ok(totalQuantity);
    }
}