package com.project.backend_api.service;

import com.project.backend_api.domain.cart.Cart;
import com.project.backend_api.domain.cart.CartItem;
import com.project.backend_api.domain.cart.CartSyncRequest;
import com.project.backend_api.domain.product.Product;
import com.project.backend_api.domain.user.User;
import com.project.backend_api.domain.user.UserRole;
import com.project.backend_api.dto.cart.CartRequest;
import com.project.backend_api.dto.product.ProductRequest;
import com.project.backend_api.repository.CartItemRepository;
import com.project.backend_api.repository.CartRepository;
import com.project.backend_api.repository.CartSyncRequestRepository;
import com.project.backend_api.repository.ProductRepository;
import com.project.backend_api.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.support.SimpleTransactionStatus;
import org.springframework.transaction.support.TransactionOperations;
import org.springframework.web.server.ResponseStatusException;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CartServiceTest {

    @Mock
    private CartRepository cartRepository;
    @Mock
    private CartItemRepository cartItemRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ProductRepository productRepository;
    @Mock
    private CartSyncRequestRepository cartSyncRequestRepository;

    private final List<CartSyncRequest> storedSyncs = new ArrayList<>();
    private CartService cartService;

    @BeforeEach
    void setUp() {
        storedSyncs.clear();
        lenient().when(cartSyncRequestRepository.findByUserEmailAndOperationAndRequestKey(any(), any(), any()))
                .thenAnswer(invocation -> storedSyncs.stream()
                        .filter(row -> row.getUserEmail().equals(invocation.getArgument(0))
                                && row.getOperation().equals(invocation.getArgument(1))
                                && row.getRequestKey().equals(invocation.getArgument(2)))
                        .findFirst());
        lenient().when(cartSyncRequestRepository.saveAndFlush(any())).thenAnswer(invocation -> {
            CartSyncRequest row = invocation.getArgument(0);
            storedSyncs.add(row);
            return row;
        });
        cartService = service(directTransactions());
    }

    private CartService service(TransactionOperations transactions) {
        return new CartService(
                cartRepository,
                cartItemRepository,
                userRepository,
                productRepository,
                cartSyncRequestRepository,
                transactions
        );
    }

    private static TransactionOperations directTransactions() {
        return new TransactionOperations() {
            @Override
            public <T> T execute(org.springframework.transaction.support.TransactionCallback<T> action) {
                return action.doInTransaction(new SimpleTransactionStatus());
            }
        };
    }

    @Test
    void emptyCartIsReusedInsteadOfCreatingAnotherCart() {
        Cart cart = Cart.builder().user(user("owner@example.com")).build();
        setId(cart, 4L);
        when(cartRepository.findByUserEmailForUpdate("owner@example.com")).thenReturn(Optional.of(cart));
        when(productRepository.findById(7)).thenReturn(Optional.of(product(7, "SALE")));
        when(cartItemRepository.findByCart_IdAndProduct_Id(4L, 7)).thenReturn(Optional.empty());

        cartService.addCartItem("owner@example.com", new CartRequest(7, 1));

        verify(cartRepository, never()).save(any());
    }

    @Test
    void hiddenProductCannotBeAdded() {
        when(productRepository.findById(7)).thenReturn(Optional.of(product(7, "HIDDEN")));

        IllegalArgumentException error = assertThrows(
                IllegalArgumentException.class,
                () -> cartService.addCartItem("owner@example.com", new CartRequest(7, 1))
        );

        assertEquals("판매 중인 상품만 담을 수 있습니다.", error.getMessage());
    }

    @Test
    void sameSyncKeyDoesNotAddQuantityTwice() {
        Cart cart = Cart.builder().user(user("owner@example.com")).build();
        setId(cart, 4L);
        Product product = product(7, "SALE");
        CartItem item = CartItem.builder().cart(cart).product(product).quantity(1).build();
        when(cartRepository.findByUserEmailForUpdate("owner@example.com")).thenReturn(Optional.of(cart));
        when(productRepository.findById(7)).thenReturn(Optional.of(product));
        when(cartItemRepository.findByCart_IdAndProduct_Id(4L, 7)).thenReturn(Optional.of(item));

        cartService.syncCart("owner@example.com", List.of(new CartRequest(7, 2)), "sync-1");
        cartService.syncCart("owner@example.com", List.of(new CartRequest(7, 2)), "sync-1");

        assertEquals(3, item.getQuantity());
    }

    @Test
    void syncWithoutKeyAddsAgain() {
        Cart cart = Cart.builder().user(user("owner@example.com")).build();
        setId(cart, 4L);
        Product product = product(7, "SALE");
        CartItem item = CartItem.builder().cart(cart).product(product).quantity(1).build();
        when(cartRepository.findByUserEmailForUpdate("owner@example.com")).thenReturn(Optional.of(cart));
        when(productRepository.findById(7)).thenReturn(Optional.of(product));
        when(cartItemRepository.findByCart_IdAndProduct_Id(4L, 7)).thenReturn(Optional.of(item));

        cartService.syncCart("owner@example.com", List.of(new CartRequest(7, 2)), null);
        cartService.syncCart("owner@example.com", List.of(new CartRequest(7, 2)), " ");

        assertEquals(5, item.getQuantity());
    }

    @Test
    void sameKeyWithDifferentContentsConflictsAndDoesNotAddAgain() {
        Cart cart = Cart.builder().user(user("owner@example.com")).build();
        setId(cart, 4L);
        Product product = product(7, "SALE");
        CartItem item = CartItem.builder().cart(cart).product(product).quantity(1).build();
        when(cartRepository.findByUserEmailForUpdate("owner@example.com")).thenReturn(Optional.of(cart));
        when(productRepository.findById(7)).thenReturn(Optional.of(product));
        when(cartItemRepository.findByCart_IdAndProduct_Id(4L, 7)).thenReturn(Optional.of(item));

        cartService.syncCart("owner@example.com", List.of(new CartRequest(7, 2)), "sync-1");
        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> cartService.syncCart("owner@example.com", List.of(new CartRequest(7, 1)), "sync-1")
        );

        assertEquals(HttpStatus.CONFLICT, error.getStatusCode());
        assertEquals(3, item.getQuantity());
    }

    @Test
    void rolledBackSyncDoesNotKeepTheKey() {
        Cart cart = Cart.builder().user(user("owner@example.com")).build();
        setId(cart, 4L);
        Product hidden = product(7, "HIDDEN");
        Product sale = product(7, "SALE");
        when(cartRepository.findByUserEmailForUpdate("owner@example.com")).thenReturn(Optional.of(cart));
        when(productRepository.findById(7)).thenReturn(Optional.of(hidden), Optional.of(sale));
        when(cartItemRepository.findByCart_IdAndProduct_Id(4L, 7)).thenReturn(Optional.empty());
        TransactionOperations rolling = new TransactionOperations() {
            @Override
            public <T> T execute(org.springframework.transaction.support.TransactionCallback<T> action) {
                int before = storedSyncs.size();
                try {
                    return action.doInTransaction(new SimpleTransactionStatus());
                } catch (RuntimeException exception) {
                    while (storedSyncs.size() > before) {
                        storedSyncs.remove(storedSyncs.size() - 1);
                    }
                    throw exception;
                }
            }
        };
        CartService rollingService = service(rolling);

        assertThrows(IllegalArgumentException.class, () ->
                rollingService.syncCart("owner@example.com", List.of(new CartRequest(7, 2)), "sync-rollback"));
        assertEquals(0, storedSyncs.size());

        rollingService.syncCart("owner@example.com", List.of(new CartRequest(7, 2)), "sync-rollback");

        verify(cartItemRepository).save(any());
        assertEquals(1, storedSyncs.size());
    }

    @Test
    void anotherUsersCartItemCannotBeChanged() {
        Cart cart = Cart.builder().user(user("other@example.com")).build();
        Product product = product(7, "SALE");
        CartItem item = CartItem.builder().cart(cart).product(product).quantity(1).build();
        when(cartItemRepository.findById(9L)).thenReturn(Optional.of(item));

        ResponseStatusException error = assertThrows(
                ResponseStatusException.class,
                () -> cartService.updateCartItemQuantity("owner@example.com", 9L, 2)
        );

        assertEquals(HttpStatus.FORBIDDEN, error.getStatusCode());
    }

    private User user(String email) {
        return User.builder().email(email).password("secret").name("owner").role(UserRole.ROLE_USER).build();
    }

    private Product product(int id, String status) {
        Product product = Product.create(new ProductRequest(
                "Lip", null, null, "LIP", 1000, null, null, false, false, 10, status, null
        ));
        setId(product, id);
        return product;
    }

    private void setId(Object target, Object id) {
        try {
            Field field = target.getClass().getDeclaredField("id");
            field.setAccessible(true);
            field.set(target, id);
        } catch (ReflectiveOperationException exception) {
            throw new IllegalStateException(exception);
        }
    }
}
