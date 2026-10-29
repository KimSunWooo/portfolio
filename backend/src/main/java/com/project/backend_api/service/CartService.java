package com.project.backend_api.service;

import com.project.backend_api.domain.cart.Cart;
import com.project.backend_api.domain.cart.CartItem;
import com.project.backend_api.domain.cart.CartSyncRequest;
import com.project.backend_api.domain.product.Product;
import com.project.backend_api.domain.product.ProductColor;
import com.project.backend_api.domain.product.ProductStatus;
import com.project.backend_api.domain.user.User;
import com.project.backend_api.dto.cart.CartItemResponse;
import com.project.backend_api.dto.cart.CartRequest;
import com.project.backend_api.repository.CartItemRepository;
import com.project.backend_api.repository.CartRepository;
import com.project.backend_api.repository.CartSyncRequestRepository;
import com.project.backend_api.repository.ProductColorRepository;
import com.project.backend_api.repository.ProductRepository;
import com.project.backend_api.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionOperations;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Transactional(readOnly = true)
public class CartService {

    static final int MAX_QUANTITY = 99;

    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final ProductColorRepository productColorRepository;
    private final CartSyncRequestRepository cartSyncRequestRepository;
    private final TransactionOperations syncTransactions;

    @Autowired
    public CartService(
            CartRepository cartRepository,
            CartItemRepository cartItemRepository,
            UserRepository userRepository,
            ProductRepository productRepository,
            ProductColorRepository productColorRepository,
            CartSyncRequestRepository cartSyncRequestRepository,
            PlatformTransactionManager transactionManager
    ) {
        this(
                cartRepository,
                cartItemRepository,
                userRepository,
                productRepository,
                productColorRepository,
                cartSyncRequestRepository,
                requiresNew(transactionManager)
        );
    }

    CartService(
            CartRepository cartRepository,
            CartItemRepository cartItemRepository,
            UserRepository userRepository,
            ProductRepository productRepository,
            ProductColorRepository productColorRepository,
            CartSyncRequestRepository cartSyncRequestRepository,
            TransactionOperations syncTransactions
    ) {
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.productColorRepository = productColorRepository;
        this.cartSyncRequestRepository = cartSyncRequestRepository;
        this.syncTransactions = syncTransactions;
    }

    private static TransactionTemplate requiresNew(PlatformTransactionManager transactionManager) {
        TransactionTemplate template = new TransactionTemplate(transactionManager);
        template.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRES_NEW);
        return template;
    }

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
                        .colorId(item.getColor() == null ? null : item.getColor().getId())
                        .colorName(item.getColor() == null ? null : item.getColor().getColorName())
                        .build())
                .toList();
    }

    @Transactional
    public void addCartItem(String email, CartRequest request) {
        requireQuantity(request.getQuantity());
        Product product = requireSaleProduct(request.getProductId());
        ProductColor color = resolveColor(product, request.getColorId());
        Cart cart = lockOrCreateCart(email);
        mergeLine(cart, product, color, request.getQuantity());
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
     * 같은 사용자, CART_SYNC, Idempotency-Key는 한 트랜잭션에서 한 번만 반영된다.
     * 키가 없으면 재전송 시 수량이 다시 더해진다.
     */
    @Transactional(propagation = Propagation.NOT_SUPPORTED)
    public void syncCart(String email, List<CartRequest> guestCartItems, String idempotencyKey) {
        if (guestCartItems == null || guestCartItems.isEmpty()) {
            return;
        }

        Map<LineKey, Integer> quantities = normalize(guestCartItems);
        String requestKey = requestKey(idempotencyKey);
        if (requestKey == null) {
            syncTransactions.executeWithoutResult(status -> mergeQuantities(email, quantities));
            return;
        }

        String requestHash = hashQuantities(quantities);
        try {
            syncTransactions.executeWithoutResult(status -> {
                if (!claimSync(email, requestKey, requestHash)) {
                    return;
                }
                mergeQuantities(email, quantities);
            });
        } catch (DataIntegrityViolationException exception) {
            replayOrReject(email, requestKey, requestHash);
        }
    }

    private boolean claimSync(String email, String requestKey, String requestHash) {
        Optional<CartSyncRequest> existing = cartSyncRequestRepository
                .findByUserEmailAndOperationAndRequestKey(email, CartSyncRequest.CART_SYNC, requestKey);
        if (existing.isPresent()) {
            acceptSameContent(existing.get(), requestHash);
            return false;
        }
        cartSyncRequestRepository.saveAndFlush(CartSyncRequest.builder()
                .userEmail(email)
                .operation(CartSyncRequest.CART_SYNC)
                .requestKey(requestKey)
                .requestHash(requestHash)
                .createdAt(LocalDateTime.now())
                .build());
        return true;
    }

    private void replayOrReject(String email, String requestKey, String requestHash) {
        CartSyncRequest existing = syncTransactions.execute(status -> cartSyncRequestRepository
                .findByUserEmailAndOperationAndRequestKey(email, CartSyncRequest.CART_SYNC, requestKey)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.CONFLICT,
                        "같은 Idempotency-Key를 저장하지 못했습니다."
                )));
        acceptSameContent(existing, requestHash);
    }

    private void acceptSameContent(CartSyncRequest existing, String requestHash) {
        if (!requestHash.equals(existing.getRequestHash())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "같은 Idempotency-Key에 다른 장바구니 내용이 있습니다."
            );
        }
    }

    private Map<LineKey, Integer> normalize(List<CartRequest> guestCartItems) {
        Map<LineKey, Integer> quantities = new LinkedHashMap<>();
        for (CartRequest item : guestCartItems) {
            if (item == null || item.getProductId() == null) {
                throw new IllegalArgumentException("상품 ID는 필수입니다.");
            }
            requireQuantity(item.getQuantity());
            quantities.merge(new LineKey(item.getProductId(), item.getColorId()), item.getQuantity(), Integer::sum);
        }
        return quantities;
    }

    private void mergeQuantities(String email, Map<LineKey, Integer> quantities) {
        Cart cart = lockOrCreateCart(email);
        List<String> blocked = new ArrayList<>();
        for (Map.Entry<LineKey, Integer> entry : quantities.entrySet()) {
            Product product = requireSaleProduct(entry.getKey().productId());
            ProductColor color = resolveColor(product, entry.getKey().colorId());
            int current = findLine(cart.getId(), product.getId(), color)
                    .map(CartItem::getQuantity)
                    .orElse(0);
            if ((long) current + entry.getValue() > MAX_QUANTITY) {
                blocked.add(lineLabel(product, color));
            }
        }
        if (!blocked.isEmpty()) {
            throw new IllegalArgumentException(
                    "다음 상품은 합산하면 99개를 초과하여 병합하지 않았습니다. 수량을 조정한 뒤 다시 시도해 주세요: "
                            + String.join(", ", blocked));
        }
        for (Map.Entry<LineKey, Integer> entry : quantities.entrySet()) {
            Product product = requireSaleProduct(entry.getKey().productId());
            ProductColor color = resolveColor(product, entry.getKey().colorId());
            mergeLine(cart, product, color, entry.getValue());
        }
    }

    private void mergeLine(Cart cart, Product product, ProductColor color, int quantity) {
        findLine(cart.getId(), product.getId(), color)
                .ifPresentOrElse(
                        existingItem -> addQuantity(existingItem, product, color, quantity),
                        () -> saveNewItem(cart, product, color, quantity)
                );
    }

    private Optional<CartItem> findLine(Long cartId, Integer productId, ProductColor color) {
        if (color == null) {
            return cartItemRepository.findByCart_IdAndProduct_IdAndColorIsNull(cartId, productId);
        }
        return cartItemRepository.findByCart_IdAndProduct_IdAndColor_Id(cartId, productId, color.getId());
    }

    private ProductColor resolveColor(Product product, Integer colorId) {
        if (colorId == null) {
            return null;
        }
        return productColorRepository.findByIdAndProductId(colorId, product.getId())
                .orElseThrow(() -> new IllegalArgumentException("이 상품에서 선택할 수 없는 색상입니다."));
    }

    private String hashQuantities(Map<LineKey, Integer> quantities) {
        String canonical = quantities.entrySet().stream()
                .sorted((left, right) -> {
                    int byProduct = left.getKey().productId().compareTo(right.getKey().productId());
                    if (byProduct != 0) {
                        return byProduct;
                    }
                    return Integer.compare(
                            left.getKey().colorId() == null ? -1 : left.getKey().colorId(),
                            right.getKey().colorId() == null ? -1 : right.getKey().colorId()
                    );
                })
                .map(entry -> {
                    LineKey key = entry.getKey();
                    if (key.colorId() == null) {
                        return key.productId() + ":" + entry.getValue();
                    }
                    return key.productId() + ":" + key.colorId() + ":" + entry.getValue();
                })
                .reduce((left, right) -> left + "," + right)
                .orElse("");
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(canonical.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256을 사용할 수 없습니다.", exception);
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

    private void addQuantity(CartItem cartItem, Product product, ProductColor color, int quantity) {
        long next = (long) cartItem.getQuantity() + quantity;
        if (next > MAX_QUANTITY) {
            throw new IllegalArgumentException(product.getName() + " (" + optionLabel(color)
                    + ")의 수량이 99개를 초과합니다. 기존 수량은 유지됩니다.");
        }
        cartItem.addQuantity(quantity);
    }

    private static String lineLabel(Product product, ProductColor color) {
        return product.getName() + " (" + optionLabel(color) + ")";
    }

    private static String optionLabel(ProductColor color) {
        return color == null ? "색상 없음" : color.getColorName();
    }

    private void saveNewItem(Cart cart, Product product, ProductColor color, int quantity) {
        CartItem newItem = CartItem.builder()
                .cart(cart)
                .product(product)
                .color(color)
                .quantity(quantity)
                .build();
        cartItemRepository.save(newItem);
    }

    private record LineKey(Integer productId, Integer colorId) {
    }

    private void requireQuantity(int quantity) {
        if (quantity < 1 || quantity > MAX_QUANTITY) {
            throw new IllegalArgumentException("수량은 1개 이상 99개 이하여야 합니다.");
        }
    }

    private String requestKey(String idempotencyKey) {
        if (idempotencyKey == null || idempotencyKey.isBlank()) {
            return null;
        }
        String trimmed = idempotencyKey.trim();
        if (trimmed.length() > 80) {
            throw new IllegalArgumentException("Idempotency-Key가 너무 깁니다.");
        }
        return trimmed;
    }
}
