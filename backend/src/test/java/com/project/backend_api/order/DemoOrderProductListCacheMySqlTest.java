package com.project.backend_api.order;

import com.project.backend_api.domain.cart.Cart;
import com.project.backend_api.domain.cart.CartItem;
import com.project.backend_api.domain.product.Product;
import com.project.backend_api.domain.product.ProductStatus;
import com.project.backend_api.domain.user.User;
import com.project.backend_api.domain.user.UserRole;
import com.project.backend_api.dto.product.ProductListResponse;
import com.project.backend_api.dto.product.ProductListWrapper;
import com.project.backend_api.dto.product.ProductRequest;
import com.project.backend_api.repository.CartItemRepository;
import com.project.backend_api.repository.CartRepository;
import com.project.backend_api.repository.ProductRepository;
import com.project.backend_api.repository.UserRepository;
import com.project.backend_api.service.ProductListCache;
import com.project.backend_api.service.ProductListCacheGeneration;
import com.project.backend_api.support.SimpleCacheTestConfiguration;
import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.cache.CacheManager;
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

import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Verifies demo-order stock changes invalidate the product-list cache generation
 * the same way ProductService.getProducts would observe after eviction.
 */
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
class DemoOrderProductListCacheMySqlTest {

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
    CartRepository cartRepository;
    @Autowired
    CartItemRepository cartItemRepository;
    @Autowired
    JdbcTemplate jdbc;
    @Autowired
    CacheManager cacheManager;
    @Autowired
    ProductListCacheGeneration generation;

    DemoOrderService orders;
    ProductListCache productListCache;
    User buyer;
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
        var cache = cacheManager.getCache(ProductListCache.NAME);
        if (cache != null) {
            cache.clear();
        }

        productListCache = new ProductListCache(cacheManager, generation);
        orders = new DemoOrderService(userRepository, jdbc, jdbc.getDataSource(), productListCache);

        buyer = userRepository.save(User.builder()
                .email("cache-buyer@example.test").password("x").name("buyer").role(UserRole.ROLE_USER).build());
        product = productRepository.save(Product.create(new ProductRequest(
                "Cache Lip", null, "demo", "LIP", 5000, null, null, true, false, 10, "SALE", null)));
        Cart cart = cartRepository.save(Cart.builder().user(buyer).build());
        cartItemRepository.save(CartItem.builder().cart(cart).product(product).quantity(3).build());
    }

    @Test
    void confirmAndCancelRefreshCachedProductListStock() throws Exception {
        assertEquals(10, stockOf(loadList()));

        DemoOrderService.DemoOrderResponse order = orders.confirm(buyer.getEmail(), "cache-key", "r1");
        assertEquals(7, stockOf(loadList()));
        assertEquals(7, dbStock());

        orders.cancel(buyer.getEmail(), order.orderKey(), "c1");
        assertEquals(10, stockOf(loadList()));
        assertEquals(10, dbStock());
    }

    @Test
    void rolledBackConfirmDoesNotEvictOrPublishWrongStock() throws Exception {
        assertEquals(10, stockOf(loadList()));
        // Force insufficient stock outside the order path so confirm fails and rolls back.
        jdbc.update("UPDATE products SET stock = 1 WHERE id = ?", product.getId());

        assertThrows(ResponseStatusException.class,
                () -> orders.confirm(buyer.getEmail(), "rollback-key", "r2"));

        assertEquals(1, dbStock());
        // Rollback must not evict: cache still holds the pre-attempt snapshot, not a partial deduct.
        assertEquals(10, stockOf(loadList()));
        assertEquals(0, jdbc.queryForObject("SELECT COUNT(*) FROM purchase_orders", Integer.class));
    }

    @Test
    void staleSnapshotCannotRepopulateAfterEviction() throws Exception {
        loadList();
        long observed = productListCache.generation();

        CountDownLatch started = new CountDownLatch(1);
        CountDownLatch release = new CountDownLatch(1);
        ExecutorService pool = Executors.newSingleThreadExecutor();
        Future<Boolean> stalePut = pool.submit(() -> {
            started.countDown();
            release.await(5, TimeUnit.SECONDS);
            ProductListWrapper stale = new ProductListWrapper(List.of(
                    new ProductListResponse(
                            product.getId(), "Cache Lip", "LIP", 5000, null, null, true, false, 10, "SALE"
                    )
            ));
            return productListCache.putIfGenerationMatches(ProductListCache.key(null, null), stale, observed);
        });

        assertTrue(started.await(5, TimeUnit.SECONDS));
        DemoOrderService.DemoOrderResponse order = orders.confirm(buyer.getEmail(), "race-cache", "r");
        release.countDown();
        assertFalse(stalePut.get(5, TimeUnit.SECONDS));
        pool.shutdownNow();

        assertEquals(7, stockOf(loadList()));
        orders.cancel(buyer.getEmail(), order.orderKey(), "done");
    }

    private ProductListWrapper loadList() throws Exception {
        return productListCache.getOrLoad(ProductListCache.key(null, null), () -> {
            List<ProductListResponse> items = productRepository.findByStatusOrderByIdAsc(ProductStatus.SALE)
                    .stream()
                    .map(ProductListResponse::from)
                    .toList();
            return new ProductListWrapper(items);
        });
    }

    private int dbStock() {
        Integer stock = jdbc.queryForObject("SELECT stock FROM products WHERE id = ?", Integer.class, product.getId());
        return stock == null ? 0 : stock;
    }

    private int stockOf(ProductListWrapper wrapper) {
        return wrapper.getProducts().stream()
                .filter(item -> product.getId().equals(item.id()))
                .map(ProductListResponse::stock)
                .findFirst()
                .orElseThrow();
    }
}
