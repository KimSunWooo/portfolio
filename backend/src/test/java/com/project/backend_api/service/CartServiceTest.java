package com.project.backend_api.service;

import com.project.backend_api.domain.cart.Cart;
import com.project.backend_api.domain.cart.CartItem;
import com.project.backend_api.domain.product.Product;
import com.project.backend_api.domain.user.User;
import com.project.backend_api.domain.user.UserRole;
import com.project.backend_api.dto.cart.CartRequest;
import com.project.backend_api.dto.product.ProductRequest;
import com.project.backend_api.repository.CartItemRepository;
import com.project.backend_api.repository.CartRepository;
import com.project.backend_api.repository.ProductRepository;
import com.project.backend_api.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.lang.reflect.Field;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
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

    private CartService cartService;

    @BeforeEach
    void setUp() {
        cartService = new CartService(cartRepository, cartItemRepository, userRepository, productRepository);
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
