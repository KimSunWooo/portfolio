package com.project.backend_api.service;

import com.project.backend_api.domain.cart.CartSyncRequest;
import com.project.backend_api.domain.product.Product;
import com.project.backend_api.domain.product.ProductStatus;
import com.project.backend_api.domain.user.User;
import com.project.backend_api.domain.user.UserRole;
import com.project.backend_api.dto.cart.CartRequest;
import com.project.backend_api.dto.product.ProductRequest;
import com.project.backend_api.repository.CartItemRepository;
import com.project.backend_api.repository.CartRepository;
import com.project.backend_api.repository.CartSyncRequestRepository;
import com.project.backend_api.repository.ProductRepository;
import com.project.backend_api.repository.UserRepository;
import com.project.backend_api.support.SimpleCacheTestConfiguration;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Import;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.mysql.MySQLContainer;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

@DataJpaTest
@Import(SimpleCacheTestConfiguration.class)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@Testcontainers
@TestPropertySource(properties = {
        "spring.profiles.active=test",
        "spring.jpa.hibernate.ddl-auto=create",
        "spring.jpa.open-in-view=false",
        "jwt.secret=test-secret-test-secret-test-secret-test",
        "toss.secret-key=test",
        "cloud.aws.credentials.access-key=test",
        "cloud.aws.credentials.secret-key=test",
        "cloud.aws.s3.bucket=test",
        "spring.mail.password=test"
})
class CartSyncMySqlTest {

    @Container
    static final MySQLContainer MYSQL = new MySQLContainer("mysql:8.4");

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", MYSQL::getJdbcUrl);
        registry.add("spring.datasource.username", MYSQL::getUsername);
        registry.add("spring.datasource.password", MYSQL::getPassword);
    }

    @Autowired
    private CartRepository cartRepository;
    @Autowired
    private CartItemRepository cartItemRepository;
    @Autowired
    private UserRepository userRepository;
    @Autowired
    private ProductRepository productRepository;
    @Autowired
    private CartSyncRequestRepository cartSyncRequestRepository;
    @Autowired
    private PlatformTransactionManager transactionManager;
    @Autowired
    private DataSource dataSource;

    private JdbcTemplate jdbcTemplate;

    private CartService cartService;

    @BeforeEach
    void resetDatabase() throws Exception {
        jdbcTemplate = new JdbcTemplate(dataSource);
        jdbcTemplate.execute("DROP TABLE IF EXISTS cart_sync_requests");
        String sql = Files.readString(Path.of("src/main/resources/db/migration/V1__cart_sync_requests.sql"));
        StringBuilder statement = new StringBuilder();
        for (String line : sql.split("\n")) {
            String trimmed = line.trim();
            if (trimmed.startsWith("--") || trimmed.isEmpty()) {
                continue;
            }
            statement.append(line).append('\n');
        }
        jdbcTemplate.execute(statement.toString().trim());
        cartItemRepository.deleteAll();
        cartRepository.deleteAll();
        productRepository.deleteAll();
        userRepository.deleteAll();
        cartService = new CartService(
                cartRepository,
                cartItemRepository,
                userRepository,
                productRepository,
                cartSyncRequestRepository,
                transactionManager
        );
    }

    @Test
    void sameKeyIsStoredOnceAndSurvivesANewServiceInstance() {
        User owner = userRepository.save(user("owner@example.com"));
        Product product = productRepository.save(product("Lip", "SALE"));

        cartService.syncCart(owner.getEmail(), List.of(new CartRequest(product.getId(), 2)), "sync-db");
        CartService restarted = new CartService(
                cartRepository,
                cartItemRepository,
                userRepository,
                productRepository,
                cartSyncRequestRepository,
                transactionManager
        );
        restarted.syncCart(owner.getEmail(), List.of(new CartRequest(product.getId(), 2)), "sync-db");

        assertEquals(1, cartSyncRequestRepository.count());
        assertEquals(2, quantity(owner.getEmail(), product.getId()));
    }

    @Test
    void differentContentsForTheSameKeyConflict() {
        User owner = userRepository.save(user("owner@example.com"));
        Product product = productRepository.save(product("Lip", "SALE"));
        cartService.syncCart(owner.getEmail(), List.of(new CartRequest(product.getId(), 2)), "sync-db");

        ResponseStatusException error = assertThrows(ResponseStatusException.class, () ->
                cartService.syncCart(owner.getEmail(), List.of(new CartRequest(product.getId(), 1)), "sync-db"));

        assertEquals(409, error.getStatusCode().value());
        assertEquals(2, quantity(owner.getEmail(), product.getId()));
    }

    @Test
    void rolledBackSyncCanBeRetriedWithTheSameKey() {
        User owner = userRepository.save(user("owner@example.com"));
        Product product = productRepository.save(product("Lip", "HIDDEN"));

        assertThrows(IllegalArgumentException.class, () ->
                cartService.syncCart(owner.getEmail(), List.of(new CartRequest(product.getId(), 2)), "sync-retry"));
        assertEquals(0, cartSyncRequestRepository.count());

        product.update(request("Lip", "SALE"));
        productRepository.save(product);
        cartService.syncCart(owner.getEmail(), List.of(new CartRequest(product.getId(), 2)), "sync-retry");

        assertEquals(1, cartSyncRequestRepository.count());
        assertEquals(2, quantity(owner.getEmail(), product.getId()));
    }

    @Test
    void concurrentSameKeyAddsQuantityOnce() throws Exception {
        User owner = userRepository.save(user("owner@example.com"));
        Product product = productRepository.save(product("Lip", "SALE"));
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            Future<?> first = pool.submit(() -> syncTogether(start, owner.getEmail(), product.getId()));
            Future<?> second = pool.submit(() -> syncTogether(start, owner.getEmail(), product.getId()));
            start.countDown();
            first.get(20, TimeUnit.SECONDS);
            second.get(20, TimeUnit.SECONDS);
        } finally {
            pool.shutdownNow();
        }

        assertEquals(1, cartSyncRequestRepository.count());
        assertEquals(2, quantity(owner.getEmail(), product.getId()));
    }

    @Test
    void anotherUserCannotChangeTheCartItem() {
        User owner = userRepository.save(user("owner@example.com"));
        userRepository.save(user("other@example.com"));
        Product product = productRepository.save(product("Lip", "SALE"));
        new TransactionTemplate(transactionManager).executeWithoutResult(status ->
                cartService.addCartItem(owner.getEmail(), new CartRequest(product.getId(), 1)));
        Long itemId = cartItemRepository.findAll().get(0).getId();

        ResponseStatusException error = assertThrows(ResponseStatusException.class, () ->
                new TransactionTemplate(transactionManager).executeWithoutResult(status ->
                        cartService.updateCartItemQuantity("other@example.com", itemId, 4)));

        assertEquals(403, error.getStatusCode().value());
        assertEquals(1, quantity(owner.getEmail(), product.getId()));
    }

    @Test
    void adminUpdateIsVisibleToThePublicSaleQuery() {
        Product product = productRepository.save(product("Lip", "HIDDEN"));
        product.update(request("Renamed lip", "SALE"));
        productRepository.saveAndFlush(product);

        List<Product> visible = productRepository.findByStatusOrderByIdAsc(ProductStatus.SALE);
        assertEquals(1, visible.size());
        assertEquals("Renamed lip", visible.get(0).getName());
        assertEquals(ProductStatus.SALE, visible.get(0).getStatus());
    }

    @Test
    void sameKeyForDifferentUsersAndOperationsDoesNotCollide() {
        User first = userRepository.save(user("first@example.com"));
        User second = userRepository.save(user("second@example.com"));
        Product product = productRepository.save(product("Lip", "SALE"));
        cartService.syncCart(first.getEmail(), List.of(new CartRequest(product.getId(), 1)), "shared-key");
        cartService.syncCart(second.getEmail(), List.of(new CartRequest(product.getId(), 1)), "shared-key");
        cartSyncRequestRepository.saveAndFlush(CartSyncRequest.builder()
                .userEmail(first.getEmail())
                .operation("OTHER_OP")
                .requestKey("shared-key")
                .requestHash("different-operation")
                .createdAt(java.time.LocalDateTime.now())
                .build());

        assertEquals(3, cartSyncRequestRepository.count());
        assertEquals(1, quantity(first.getEmail(), product.getId()));
        assertEquals(1, quantity(second.getEmail(), product.getId()));
    }

    private void syncTogether(CountDownLatch start, String email, Integer productId) {
        try {
            if (!start.await(10, TimeUnit.SECONDS)) {
                throw new IllegalStateException("threads did not start");
            }
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException(exception);
        }
        cartService.syncCart(email, List.of(new CartRequest(productId, 2)), "sync-concurrent");
    }

    private int quantity(String email, Integer productId) {
        return cartRepository.findByUserEmailWithProducts(email)
                .orElseThrow()
                .getCartItems()
                .stream()
                .filter(item -> item.getProduct().getId().equals(productId))
                .mapToInt(item -> item.getQuantity())
                .sum();
    }

    private User user(String email) {
        return User.builder().email(email).password("secret").name("owner").role(UserRole.ROLE_USER).build();
    }

    private Product product(String name, String status) {
        return Product.create(request(name, status));
    }

    private ProductRequest request(String name, String status) {
        return new ProductRequest(name, null, null, "LIP", 1000, null, null, false, false, 10, status, null);
    }
}
