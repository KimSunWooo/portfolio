package com.project.backend_api.service;

import com.project.backend_api.domain.cart.Cart;
import com.project.backend_api.domain.cart.CartItem;
import com.project.backend_api.domain.product.Product;
import com.project.backend_api.domain.user.User;
import com.project.backend_api.dto.cart.CartItemResponse;
import com.project.backend_api.dto.cart.CartRequest;
import com.project.backend_api.repository.CartItemRepository;
import com.project.backend_api.repository.CartRepository;
import com.project.backend_api.repository.ProductRepository;
import com.project.backend_api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CartService {

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    // 1. 내 장바구니 조회
    public List<CartItemResponse> getCartItems(String email) {
        // 🌟 AS-IS: findByUser_Email -> TO-BE: findByUserEmailWithProducts (N+1 방어 적용)
        Cart cart = cartRepository.findByUserEmailWithProducts(email).orElse(null);
        if (cart == null) {
            return List.of();
        }

        return cart.getCartItems().stream()
                .map(item -> CartItemResponse.builder()
                        .cartItemId(item.getId())
                        .productId(item.getProduct().getId())
                        .productName(item.getProduct().getName())
                        .price(item.getProduct().getPrice())
                        .thumbnailUrl(item.getProduct().getThumbnail())
                        .quantity(item.getQuantity())
                        .build())
                .collect(Collectors.toList());
    }

    // 2. 장바구니에 상품 담기
    @Transactional
    public void addCartItem(String email, CartRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 유저입니다."));

        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 상품입니다."));

        // 🌟 옛날 메서드 이름 수정 완료
        Cart cart = cartRepository.findByUserEmailWithProducts(email).orElseGet(() -> {
            Cart newCart = Cart.builder().user(user).build();
            return cartRepository.save(newCart);
        });

        cartItemRepository.findByCart_IdAndProduct_Id(cart.getId(), product.getId())
                .ifPresentOrElse(
                        cartItem -> cartItem.addQuantity(request.getQuantity()),
                        () -> {
                            CartItem newItem = CartItem.builder()
                                    .cart(cart)
                                    .product(product)
                                    .quantity(request.getQuantity())
                                    .build();
                            cartItemRepository.save(newItem);
                        }
                );
    }

    // 3. 수량 변경
    @Transactional
    public void updateCartItemQuantity(String email, Long cartItemId, int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("수량은 1개 이상이어야 합니다.");
        }

        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new IllegalArgumentException("장바구니에 해당 상품이 없습니다."));

        if (!cartItem.getCart().getUser().getEmail().equals(email)) {
            throw new IllegalArgumentException("권한이 없습니다.");
        }

        cartItem.updateQuantity(quantity);
    }

    // 4. 상품 삭제
    @Transactional
    public void deleteCartItem(String email, Long cartItemId) {
        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new IllegalArgumentException("장바구니에 해당 상품이 없습니다."));

        if (!cartItem.getCart().getUser().getEmail().equals(email)) {
            throw new IllegalArgumentException("권한이 없습니다.");
        }

        cartItemRepository.delete(cartItem);
    }

    // 5. 비회원 장바구니 동기화
    @Transactional
    public void syncCart(String email, List<CartRequest> guestCartItems) {
        if (guestCartItems == null || guestCartItems.isEmpty()) {
            return;
        }

        // 🌟 문법 에러(Syntax Error) 완벽 해결: orElseGet()으로 정상 종료.
        Cart cart = cartRepository.findByUserEmailWithProducts(email)
                .orElseGet(() -> {
                    User user = userRepository.findByEmail(email).orElseThrow();
                    Cart newCart = Cart.builder().user(user).build();
                    return cartRepository.save(newCart);
                });

        for (CartRequest item : guestCartItems) {
            Product product = productRepository.findById(item.getProductId())
                    .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다. ID: " + item.getProductId()));

            cartItemRepository.findByCart_IdAndProduct_Id(cart.getId(), product.getId())
                .ifPresentOrElse(
                    existingItem -> existingItem.addQuantity(item.getQuantity()),
                    () -> {
                        CartItem newItem = CartItem.builder()
                                .cart(cart)
                                .product(product)
                                .quantity(item.getQuantity())
                                .build();
                        cartItemRepository.save(newItem);
                    }
                );
        }
    }
}