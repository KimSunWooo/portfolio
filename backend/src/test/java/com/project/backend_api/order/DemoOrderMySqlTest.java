package com.project.backend_api.order;

import com.project.backend_api.domain.cart.Cart;
import com.project.backend_api.domain.cart.CartItem;
import com.project.backend_api.domain.product.Product;
import com.project.backend_api.domain.product.ProductColor;
import com.project.backend_api.domain.user.User;
import com.project.backend_api.domain.user.UserRole;
import com.project.backend_api.dto.product.ProductRequest;
import com.project.backend_api.repository.CartItemRepository;
import com.project.backend_api.repository.CartRepository;
import com.project.backend_api.repository.ProductColorRepository;
import com.project.backend_api.repository.ProductRepository;
import com.project.backend_api.repository.UserRepository;
import com.project.backend_api.support.SimpleCacheTestConfiguration;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.mysql.MySQLContainer;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DataJpaTest
@Import(SimpleCacheTestConfiguration.class)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@Testcontainers
@TestPropertySource(properties = {
        "spring.profiles.active=test",
        "spring.jpa.hibernate.ddl-auto=none",
        "spring.flyway.enabled=false",
        "spring.jpa.open-in-view=false",
        "jwt.secret=test-secret-test-secret-test-secret-test",
        "toss.secret-key=test",
        "cloud.aws.credentials.access-key=test",
        "cloud.aws.credentials.secret-key=test",
        "cloud.aws.s3.bucket=test",
        "spring.mail.password=test"
})
class DemoOrderMySqlTest {

    @Container
    static final MySQLContainer MYSQL = new MySQLContainer("mysql:8.4");

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", MYSQL::getJdbcUrl);
        registry.add("spring.datasource.username", MYSQL::getUsername);
        registry.add("spring.datasource.password", MYSQL::getPassword);
    }

    @BeforeAll
    static void migrate() {
        Flyway.configure()
                .dataSource(MYSQL.getJdbcUrl(), MYSQL.getUsername(), MYSQL.getPassword())
                .locations("classpath:db/migration")
                .baselineOnMigrate(true)
                .baselineVersion("0")
                .load()
                .migrate();
    }

    @Autowired
    UserRepository userRepository;
    @Autowired
    ProductRepository productRepository;
    @Autowired
    ProductColorRepository productColorRepository;
    @Autowired
    CartRepository cartRepository;
    @Autowired
    CartItemRepository cartItemRepository;
    @Autowired
    JdbcTemplate jdbc;

    DemoOrderService service;
    User buyer;
    User other;
    Product product;

    @BeforeEach
    void setUp() {
        jdbc.update("DELETE FROM demo_order_requests");
        jdbc.update("DELETE FROM purchase_lines");
        jdbc.update("DELETE FROM purchase_orders");
        jdbc.update("DELETE FROM cart_items");
        jdbc.update("DELETE FROM carts");
        jdbc.update("DELETE FROM product_colors");
        jdbc.update("DELETE FROM products");
        jdbc.update("DELETE FROM users");

        service = new DemoOrderService(userRepository, jdbc, jdbc.getDataSource());
        buyer = userRepository.save(User.builder()
                .email("buyer@example.test").password("x").name("buyer").role(UserRole.ROLE_USER).build());
        other = userRepository.save(User.builder()
                .email("other@example.test").password("x").name("other").role(UserRole.ROLE_USER).build());
        product = productRepository.save(Product.create(new ProductRequest(
                "Demo Lip", null, "demo", "LIP", 5000, null, null, true, false, 1, "SALE", null)));
        Cart cart = cartRepository.save(Cart.builder().user(buyer).build());
        cartItemRepository.save(CartItem.builder().cart(cart).product(product).quantity(1).build());
    }

    @Test
    void confirmIsIdempotentFeedsPaidAnalyticsAndRestoresStockOnce() throws Exception {
        DemoOrderService.DemoOrderResponse first = service.confirm(buyer.getEmail(), "key-1", "req-1");
        DemoOrderService.DemoOrderResponse again = service.confirm(buyer.getEmail(), "key-1", "req-2");
        assertEquals(first.orderKey(), again.orderKey());
        assertEquals(1, count("SELECT COUNT(*) FROM purchase_orders WHERE seed_batch_id IS NULL"));
        assertEquals(0, count("SELECT COUNT(*) FROM cart_items"));
        assertEquals(0, count("SELECT stock FROM products WHERE id = " + product.getId()));
        assertEquals(5000L, jdbc.queryForObject("""
                SELECT COALESCE(SUM(line_amount),0) FROM purchase_lines
                WHERE order_key = ? AND line_status = 'PAID'
                """, Long.class, first.orderKey()));

        Product contested = productRepository.save(Product.create(new ProductRequest(
                "Scarce", null, "demo", "LIP", 1000, null, null, true, false, 1, "SALE", null)));
        Cart cartA = cartRepository.findByUserEmailWithProducts(buyer.getEmail())
                .orElseGet(() -> cartRepository.save(Cart.builder().user(buyer).build()));
        Cart cartB = cartRepository.findByUserEmailWithProducts(other.getEmail())
                .orElseGet(() -> cartRepository.save(Cart.builder().user(other).build()));
        cartItemRepository.save(CartItem.builder().cart(cartA).product(contested).quantity(1).build());
        cartItemRepository.save(CartItem.builder().cart(cartB).product(contested).quantity(1).build());

        ExecutorService pool = Executors.newFixedThreadPool(2);
        List<Callable<Object>> tasks = List.of(
                () -> invoke(() -> service.confirm(buyer.getEmail(), "buyer-stock", "a")),
                () -> invoke(() -> service.confirm(other.getEmail(), "other-stock", "b"))
        );
        List<Future<Object>> futures = pool.invokeAll(tasks);
        List<Object> results = new ArrayList<>();
        for (Future<Object> future : futures) {
            results.add(future.get());
        }
        pool.shutdownNow();
        long successes = results.stream().filter(DemoOrderService.DemoOrderResponse.class::isInstance).count();
        long failures = results.stream().filter(ResponseStatusException.class::isInstance).count();
        assertEquals(1, successes);
        assertEquals(1, failures);
        assertEquals(0, count("SELECT stock FROM products WHERE id = " + contested.getId()));

        DemoOrderService.DemoOrderResponse won = results.stream()
                .filter(DemoOrderService.DemoOrderResponse.class::isInstance)
                .map(DemoOrderService.DemoOrderResponse.class::cast)
                .findFirst()
                .orElseThrow();
        String ownerEmail = won.userId().equals(buyer.getId()) ? buyer.getEmail() : other.getEmail();
        String stranger = won.userId().equals(buyer.getId()) ? other.getEmail() : buyer.getEmail();
        assertThrows(ResponseStatusException.class, () -> service.cancel(stranger, won.orderKey(), "x"));
        DemoOrderService.DemoOrderResponse canceled = service.cancel(ownerEmail, won.orderKey(), "cancel");
        assertEquals("CANCELLED", canceled.status());
        assertEquals(0L, canceled.paidAmount());
        assertEquals(1, count("SELECT stock FROM products WHERE id = " + contested.getId()));
        service.cancel(ownerEmail, won.orderKey(), "cancel-again");
        assertEquals(1, count("SELECT stock FROM products WHERE id = " + contested.getId()));
        assertTrue(service.listMine(ownerEmail).stream().anyMatch(order -> order.orderKey().equals(won.orderKey())));
    }

    @Test
    void concurrentCancelRestoresStockExactlyOnce() throws Exception {
        jdbc.update("DELETE FROM cart_items");
        Product bulk = productRepository.save(Product.create(new ProductRequest(
                "Bulk Lip", null, "demo", "LIP", 3000, null, null, true, false, 10, "SALE", null)));
        Cart cart = cartRepository.findByUserEmailWithProducts(buyer.getEmail())
                .orElseGet(() -> cartRepository.save(Cart.builder().user(buyer).build()));
        cartItemRepository.save(CartItem.builder().cart(cart).product(bulk).quantity(3).build());

        DemoOrderService.DemoOrderResponse order = service.confirm(buyer.getEmail(), "cancel-race-key", "req");
        assertEquals(7, count("SELECT stock FROM products WHERE id = " + bulk.getId()));

        int threads = 8;
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch ready = new CountDownLatch(threads);
        CountDownLatch start = new CountDownLatch(1);
        AtomicInteger cancelled = new AtomicInteger();
        List<Future<?>> futures = new ArrayList<>();
        for (int i = 0; i < threads; i++) {
            futures.add(pool.submit(() -> {
                ready.countDown();
                start.await(5, TimeUnit.SECONDS);
                DemoOrderService.DemoOrderResponse response =
                        service.cancel(buyer.getEmail(), order.orderKey(), "cancel-" + Thread.currentThread().threadId());
                if ("CANCELLED".equals(response.status())) {
                    cancelled.incrementAndGet();
                }
                return null;
            }));
        }
        assertTrue(ready.await(5, TimeUnit.SECONDS));
        start.countDown();
        for (Future<?> future : futures) {
            future.get(10, TimeUnit.SECONDS);
        }
        pool.shutdownNow();

        assertEquals(threads, cancelled.get());
        assertEquals(10, count("SELECT stock FROM products WHERE id = " + bulk.getId()));
        assertEquals(1, count("""
                SELECT COUNT(*) FROM purchase_lines
                WHERE order_key = '%s' AND line_status = 'CANCELLED' AND stock_restored = 1
                """.formatted(order.orderKey())));
    }

    @Test
    void concurrentCancelWithColorStockRestoresBothLevelsOnce() throws Exception {
        jdbc.update("DELETE FROM cart_items");
        Product colored = productRepository.save(Product.create(new ProductRequest(
                "Color Lip", null, "demo", "LIP", 4000, null, null, true, false, 5, "SALE", null)));
        ProductColor color = productColorRepository.save(ProductColor.create(colored.getId(), "red", 0));
        jdbc.update("UPDATE product_colors SET stock = 5 WHERE id = ?", color.getId());

        Cart cart = cartRepository.findByUserEmailWithProducts(buyer.getEmail())
                .orElseGet(() -> cartRepository.save(Cart.builder().user(buyer).build()));
        cartItemRepository.save(CartItem.builder().cart(cart).product(colored).color(color).quantity(2).build());

        DemoOrderService.DemoOrderResponse order = service.confirm(buyer.getEmail(), "color-cancel", "req");
        assertEquals(3, count("SELECT stock FROM products WHERE id = " + colored.getId()));
        assertEquals(3, count("SELECT stock FROM product_colors WHERE id = " + color.getId()));

        ExecutorService pool = Executors.newFixedThreadPool(6);
        CountDownLatch ready = new CountDownLatch(6);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<?>> futures = new ArrayList<>();
        for (int i = 0; i < 6; i++) {
            futures.add(pool.submit(() -> {
                ready.countDown();
                start.await(5, TimeUnit.SECONDS);
                service.cancel(buyer.getEmail(), order.orderKey(), "c");
                return null;
            }));
        }
        assertTrue(ready.await(5, TimeUnit.SECONDS));
        start.countDown();
        for (Future<?> future : futures) {
            future.get(10, TimeUnit.SECONDS);
        }
        pool.shutdownNow();

        assertEquals(5, count("SELECT stock FROM products WHERE id = " + colored.getId()));
        assertEquals(5, count("SELECT stock FROM product_colors WHERE id = " + color.getId()));
    }

    @Test
    void otherUserCannotCancelAndDoesNotChangeStock() {
        DemoOrderService.DemoOrderResponse order = service.confirm(buyer.getEmail(), "forbid-cancel", "req");
        int stockAfterConfirm = count("SELECT stock FROM products WHERE id = " + product.getId());
        assertThrows(ResponseStatusException.class,
                () -> service.cancel(other.getEmail(), order.orderKey(), "x"));
        assertEquals(stockAfterConfirm, count("SELECT stock FROM products WHERE id = " + product.getId()));
    }

    private int count(String sql) {
        Integer value = jdbc.queryForObject(sql, Integer.class);
        return value == null ? 0 : value;
    }

    private static Object invoke(Callable<Object> callable) {
        try {
            return callable.call();
        } catch (RuntimeException exception) {
            return exception;
        } catch (Exception exception) {
            throw new IllegalStateException(exception);
        }
    }
}
