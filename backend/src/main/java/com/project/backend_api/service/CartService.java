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
        // 장바구니가 없으면 빈 배열 반환 (아직 아무것도 안 담은 유저)
        Cart cart = cartRepository.findByUser_Email(email).orElse(null);
        if (cart == null) {
            return List.of();
        }

        // 장바구니 안의 상품들을 프론트엔드가 요구하는 DTO 형태로 변환
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

        // 유저의 장바구니가 없다면 새로 생성 (지연 생성 방식)
        Cart cart = cartRepository.findByUser_Email(email).orElseGet(() -> {
            Cart newCart = Cart.builder().user(user).build();
            return cartRepository.save(newCart);
        });

        // 이미 장바구니에 있는 상품인지 확인
        cartItemRepository.findByCart_IdAndProduct_Id(cart.getId(), product.getId())
                .ifPresentOrElse(
                        // 이미 있다면 수량만 누적 증가
                        cartItem -> cartItem.addQuantity(request.getQuantity()),
                        // 없다면 새로 담기
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

        // 남이 내 장바구니 수량을 조작하지 못하도록 소유권 검증 (중요 💡)
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

        // 소유권 검증
        if (!cartItem.getCart().getUser().getEmail().equals(email)) {
            throw new IllegalArgumentException("권한이 없습니다.");
        }

        cartItemRepository.delete(cartItem);
    }
}