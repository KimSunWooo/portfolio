package com.project.backend_api.service;

import com.project.backend_api.domain.cart.Cart;
import com.project.backend_api.domain.cart.CartItem;
import com.project.backend_api.domain.product.Product;
import com.project.backend_api.domain.product.ProductStatus;
import com.project.backend_api.domain.user.User;
import com.project.backend_api.dto.cart.CartItemResponse;
import com.project.backend_api.dto.cart.CartRequest;
import com.project.backend_api.repository.CartItemRepository;
import com.project.backend_api.repository.CartRepository;
import com.project.backend_api.repository.ProductRepository;
import com.project.backend_api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CartService {

    static final int MAX_QUANTITY = 99;

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;

    /**
     * 단일 프로세스에서만 같은 Idempotency-Key의 재전송을 한 번으로 처리한다.
     * DB에 키를 저장하지 않으므로 재시작이나 다른 인스턴스에서는 다시 더해질 수 있다.
     */
    private final Set<String> completedSyncKeys = ConcurrentHashMap.newKeySet();
    private final ConcurrentHashMap<String, Object> syncLocks = new ConcurrentHashMap<>();

    public List<CartItemResponse> getCartItems(String email) {
        Cart cart = cartRepository.findByUserEmailWithProducts(email).orElse(null);
        if (cart == null || cart.getCartItems() == null) {
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
                .toList();
    }

    @Transactional
    public void addCartItem(String email, CartRequest request) {
        requireQuantity(request.getQuantity());
        Product product = requireSaleProduct(request.getProductId());
        Cart cart = lockOrCreateCart(email);

        cartItemRepository.findByCart_IdAndProduct_Id(cart.getId(), product.getId())
                .ifPresentOrElse(
                        cartItem -> addQuantity(cartItem, request.getQuantity()),
                        () -> saveNewItem(cart, product, request.getQuantity())
                );
    }

    @Transactional
    public void updateCartItemQuantity(String email, Long cartItemId, int quantity) {
        requireQuantity(quantity);
        CartItem cartItem = requireOwnedItem(email, cartItemId);
        cartItem.updateQuantity(quantity);
    }

    @Transactional
    public void deleteCartItem(String email, Long cartItemId) {
        CartItem cartItem = requireOwnedItem(email, cartItemId);
        cartItemRepository.delete(cartItem);
    }

    /**
     * 비회원 장바구니를 회원 장바구니에 더한다.
     * 같은 Idempotency-Key는 이 프로세스 안에서 다시 더하지 않는다.
     * 키가 없으면 재전송 시 수량이 다시 더해진다.
     */
    @Transactional
    public void syncCart(String email, List<CartRequest> guestCartItems, String idempotencyKey) {
        if (guestCartItems == null || guestCartItems.isEmpty()) {
            return;
        }

        String scopedKey = scopeKey(email, idempotencyKey);
        if (scopedKey == null) {
            mergeGuestItems(email, guestCartItems);
            return;
        }

        Object lock = syncLocks.computeIfAbsent(scopedKey, ignored -> new Object());
        synchronized (lock) {
            if (completedSyncKeys.contains(scopedKey)) {
                return;
            }
            mergeGuestItems(email, guestCartItems);
            if (completedSyncKeys.size() > 1000) {
                completedSyncKeys.clear();
            }
            completedSyncKeys.add(scopedKey);
        }
    }

    private void mergeGuestItems(String email, List<CartRequest> guestCartItems) {
        Map<Integer, Integer> quantities = new LinkedHashMap<>();
        for (CartRequest item : guestCartItems) {
            if (item == null || item.getProductId() == null) {
                throw new IllegalArgumentException("상품 ID는 필수입니다.");
            }
            requireQuantity(item.getQuantity());
            quantities.merge(item.getProductId(), item.getQuantity(), Integer::sum);
        }

        Cart cart = lockOrCreateCart(email);
        for (Map.Entry<Integer, Integer> entry : quantities.entrySet()) {
            Product product = requireSaleProduct(entry.getKey());
            int quantity = entry.getValue();
            requireQuantity(quantity);
            cartItemRepository.findByCart_IdAndProduct_Id(cart.getId(), product.getId())
                    .ifPresentOrElse(
                            existingItem -> addQuantity(existingItem, quantity),
                            () -> saveNewItem(cart, product, quantity)
                    );
        }
    }

    private Cart lockOrCreateCart(String email) {
        return cartRepository.findByUserEmailForUpdate(email).orElseGet(() -> {
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 유저입니다."));
            Cart newCart = Cart.builder().user(user).build();
            return cartRepository.save(newCart);
        });
    }

    private Product requireSaleProduct(Integer productId) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new IllegalArgumentException("상품을 찾을 수 없습니다."));
        if (product.getStatus() != ProductStatus.SALE) {
            throw new IllegalArgumentException("판매 중인 상품만 담을 수 있습니다.");
        }
        return product;
    }

    private CartItem requireOwnedItem(String email, Long cartItemId) {
        CartItem cartItem = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "장바구니에 해당 상품이 없습니다."));
        if (cartItem.getCart() == null
                || cartItem.getCart().getUser() == null
                || !email.equals(cartItem.getCart().getUser().getEmail())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "본인 장바구니만 수정할 수 있습니다.");
        }
        return cartItem;
    }

    private void addQuantity(CartItem cartItem, int quantity) {
        long next = (long) cartItem.getQuantity() + quantity;
        if (next > MAX_QUANTITY) {
            throw new IllegalArgumentException("수량은 99개 이하여야 합니다.");
        }
        cartItem.addQuantity(quantity);
    }

    private void saveNewItem(Cart cart, Product product, int quantity) {
        CartItem newItem = CartItem.builder()
                .cart(cart)
                .product(product)
                .quantity(quantity)
                .build();
        cartItemRepository.save(newItem);
    }

    private void requireQuantity(int quantity) {
        if (quantity < 1 || quantity > MAX_QUANTITY) {
            throw new IllegalArgumentException("수량은 1개 이상 99개 이하여야 합니다.");
        }
    }

    private String scopeKey(String email, String idempotencyKey) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return null;
        }
        String trimmed = idempotencyKey.trim();
        if (trimmed.length() > 80) {
            throw new IllegalArgumentException("Idempotency-Key가 너무 깁니다.");
        }
        return email + ":" + trimmed;
    }
}
