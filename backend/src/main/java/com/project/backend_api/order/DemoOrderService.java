package com.project.backend_api.order;

import com.project.backend_api.domain.product.Product;
import com.project.backend_api.domain.product.ProductStatus;
import com.project.backend_api.domain.user.User;
import com.project.backend_api.repository.ProductRepository;
import com.project.backend_api.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.server.ResponseStatusException;

import javax.sql.DataSource;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
public class DemoOrderService {

    public static final String RECORD_SOURCE = "DEMO";
    public static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");

    private final UserRepository userRepository;
    private final ProductRepository productRepository;
    private final JdbcTemplate jdbc;
    private final TransactionTemplate transactions;

    public DemoOrderService(
            UserRepository userRepository,
            ProductRepository productRepository,
            JdbcTemplate jdbc,
            DataSource dataSource
    ) {
        this.userRepository = userRepository;
        this.productRepository = productRepository;
        this.jdbc = jdbc;
        this.transactions = new TransactionTemplate(new DataSourceTransactionManager(dataSource));
    }

    public DemoOrderResponse confirm(String email, String requestKey, String requestId) {
        return transactions.execute(status -> confirmInTransaction(email, requestKey, requestId));
    }

    private DemoOrderResponse confirmInTransaction(String email, String requestKey, String requestId) {
        if (requestKey == null || requestKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Idempotency-Key가 필요합니다.");
        }
        User user = requireUser(email);
        Long cartId = jdbc.query("""
                SELECT c.id FROM carts c
                JOIN users u ON u.id = c.user_id
                WHERE u.email = ?
                FOR UPDATE
                """, rs -> rs.next() ? rs.getLong(1) : null, email);
        if (cartId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "장바구니를 찾을 수 없습니다.");
        }
        List<CartSnapshot> items = jdbc.query("""
                SELECT ci.product_id, ci.color_id, ci.quantity
                FROM cart_items ci
                WHERE ci.cart_id = ?
                ORDER BY ci.product_id, ci.color_id
                """, (rs, row) -> new CartSnapshot(
                rs.getInt("product_id"),
                (Integer) rs.getObject("color_id"),
                rs.getInt("quantity")
        ), cartId);
        if (items.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "장바구니 상품이 없습니다.");
        }
        String hash = hashSnapshots(items);

        List<Map<String, Object>> existing = jdbc.queryForList("""
                SELECT request_hash, order_key FROM demo_order_requests
                WHERE user_id = ? AND request_key = ?
                """, user.getId(), requestKey.trim());
        if (!existing.isEmpty()) {
            String storedHash = String.valueOf(existing.getFirst().get("request_hash"));
            if (!hash.equals(storedHash)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "같은 Idempotency-Key에 다른 장바구니 내용이 전달되었습니다.");
            }
            return loadOrder(String.valueOf(existing.getFirst().get("order_key")), requestId);
        }

        String orderKey = "demo-" + UUID.randomUUID().toString().replace("-", "");
        LocalDateTime purchasedAt = LocalDateTime.now(SEOUL);
        try {
            jdbc.update("""
                    INSERT INTO purchase_orders
                    (order_key, user_id, purchased_at, age_at_purchase, age_band, record_source, seed_batch_id, created_at)
                    VALUES (?, ?, ?, NULL, '미상', ?, NULL, ?)
                    """, orderKey, user.getId(), purchasedAt, RECORD_SOURCE, purchasedAt);

            for (CartSnapshot item : items) {
                Product product = productRepository.findById(item.productId())
                        .orElseThrow(() -> new ResponseStatusException(HttpStatus.CONFLICT, "상품을 찾을 수 없습니다."));
                if (product.getStatus() != ProductStatus.SALE) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "판매 중이 아닌 상품이 포함되어 있습니다.");
                }
                int unitPrice = product.getPrice() == null ? 0 : product.getPrice();
                int quantity = item.quantity();
                if (quantity < 1 || quantity > 99) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "수량 범위를 확인하세요.");
                }
                deductStock(product.getId(), item.colorId(), quantity);
                int lineAmount = unitPrice * quantity;
                jdbc.update("""
                        INSERT INTO purchase_lines
                        (order_key, product_id, color_id, product_name, category_name, unit_price, quantity,
                         line_discount, line_amount, line_status, stock_restored)
                        VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, 'PAID', 0)
                        """,
                        orderKey,
                        product.getId(),
                        item.colorId(),
                        product.getName(),
                        product.getCategory(),
                        unitPrice,
                        quantity,
                        lineAmount);
            }

            jdbc.update("""
                    INSERT INTO demo_order_requests (user_id, request_key, request_hash, order_key, created_at)
                    VALUES (?, ?, ?, ?, ?)
                    """, user.getId(), requestKey.trim(), hash, orderKey, purchasedAt);
        } catch (DataIntegrityViolationException exception) {
            List<Map<String, Object>> raced = jdbc.queryForList("""
                    SELECT request_hash, order_key FROM demo_order_requests
                    WHERE user_id = ? AND request_key = ?
                    """, user.getId(), requestKey.trim());
            if (!raced.isEmpty() && hash.equals(String.valueOf(raced.getFirst().get("request_hash")))) {
                return loadOrder(String.valueOf(raced.getFirst().get("order_key")), requestId);
            }
            throw new ResponseStatusException(HttpStatus.CONFLICT, "주문 확정 요청이 충돌했습니다.", exception);
        }

        jdbc.update("DELETE FROM cart_items WHERE cart_id = ?", cartId);
        return loadOrder(orderKey, requestId);
    }

    public DemoOrderResponse cancel(String email, String orderKey, String requestId) {
        return transactions.execute(status -> cancelInTransaction(email, orderKey, requestId));
    }

    private DemoOrderResponse cancelInTransaction(String email, String orderKey, String requestId) {
        User user = requireUser(email);
        List<Map<String, Object>> orders = jdbc.queryForList("""
                SELECT order_key, user_id FROM purchase_orders WHERE order_key = ?
                """, orderKey);
        if (orders.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "주문을 찾을 수 없습니다.");
        }
        Object owner = orders.getFirst().get("user_id");
        if (owner == null || !user.getId().equals(((Number) owner).longValue())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "다른 사용자의 주문입니다.");
        }

        List<Map<String, Object>> lines = jdbc.queryForList("""
                SELECT id, product_id, color_id, quantity, line_status, stock_restored
                FROM purchase_lines WHERE order_key = ?
                """, orderKey);
        for (Map<String, Object> line : lines) {
            String status = String.valueOf(line.get("line_status"));
            boolean restored = ((Number) line.get("stock_restored")).intValue() == 1;
            if ("PAID".equals(status) && !restored) {
                Integer productId = line.get("product_id") == null ? null : ((Number) line.get("product_id")).intValue();
                Integer colorId = line.get("color_id") == null ? null : ((Number) line.get("color_id")).intValue();
                int quantity = ((Number) line.get("quantity")).intValue();
                restoreStock(productId, colorId, quantity);
                jdbc.update("""
                        UPDATE purchase_lines
                        SET line_status = 'CANCELLED', stock_restored = 1
                        WHERE id = ?
                        """, line.get("id"));
            }
        }
        return loadOrder(orderKey, requestId);
    }

    public List<DemoOrderResponse> listMine(String email) {
        User user = requireUser(email);
        List<String> keys = jdbc.queryForList("""
                SELECT order_key FROM purchase_orders
                WHERE user_id = ? AND seed_batch_id IS NULL
                ORDER BY purchased_at DESC
                """, String.class, user.getId());
        return keys.stream().map(key -> loadOrder(key, null)).toList();
    }

    public DemoOrderResponse getMine(String email, String orderKey) {
        DemoOrderResponse response = loadOrder(orderKey, null);
        User user = requireUser(email);
        if (response.userId() == null || !user.getId().equals(response.userId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "다른 사용자의 주문입니다.");
        }
        return response;
    }

    private void deductStock(Integer productId, Integer colorId, int quantity) {
        int productUpdated = jdbc.update("""
                UPDATE products SET stock = stock - ?
                WHERE id = ? AND stock >= ?
                """, quantity, productId, quantity);
        if (productUpdated != 1) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "상품 재고가 부족합니다.");
        }
        if (colorId != null) {
            Integer colorStock = jdbc.query("""
                    SELECT stock FROM product_colors WHERE id = ? AND product_id = ?
                    """, rs -> rs.next() ? (Integer) rs.getObject(1) : null, colorId, productId);
            if (colorStock != null) {
                int colorUpdated = jdbc.update("""
                        UPDATE product_colors SET stock = stock - ?
                        WHERE id = ? AND product_id = ? AND stock >= ?
                        """, quantity, colorId, productId, quantity);
                if (colorUpdated != 1) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "색상 재고가 부족합니다.");
                }
            }
        }
    }

    private void restoreStock(Integer productId, Integer colorId, int quantity) {
        if (productId != null) {
            jdbc.update("UPDATE products SET stock = stock + ? WHERE id = ?", quantity, productId);
        }
        if (colorId != null) {
            jdbc.update("UPDATE product_colors SET stock = IFNULL(stock, 0) + ? WHERE id = ?", quantity, colorId);
        }
    }

    private DemoOrderResponse loadOrder(String orderKey, String requestId) {
        List<Map<String, Object>> headers = jdbc.queryForList("""
                SELECT order_key, user_id, purchased_at, record_source
                FROM purchase_orders WHERE order_key = ?
                """, orderKey);
        if (headers.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "주문을 찾을 수 없습니다.");
        }
        Map<String, Object> header = headers.getFirst();
        List<DemoOrderLine> lines = jdbc.query("""
                SELECT product_id, color_id, product_name, category_name, unit_price, quantity,
                       line_discount, line_amount, line_status
                FROM purchase_lines WHERE order_key = ? ORDER BY id
                """, (rs, row) -> new DemoOrderLine(
                (Integer) rs.getObject("product_id"),
                (Integer) rs.getObject("color_id"),
                rs.getString("product_name"),
                rs.getString("category_name"),
                rs.getInt("unit_price"),
                rs.getInt("quantity"),
                rs.getInt("line_discount"),
                rs.getInt("line_amount"),
                rs.getString("line_status")
        ), orderKey);
        long paidAmount = lines.stream().filter(line -> "PAID".equals(line.status())).mapToLong(DemoOrderLine::lineAmount).sum();
        String status = lines.stream().allMatch(line -> "CANCELLED".equals(line.status()) || "REFUNDED".equals(line.status()))
                ? "CANCELLED"
                : "CONFIRMED";
        Long userId = header.get("user_id") == null ? null : ((Number) header.get("user_id")).longValue();
        return new DemoOrderResponse(
                String.valueOf(header.get("order_key")),
                userId,
                String.valueOf(header.get("purchased_at")),
                String.valueOf(header.get("record_source")),
                status,
                paidAmount,
                lines,
                requestId
        );
    }

    private User requireUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다."));
    }

    private static String hashSnapshots(List<CartSnapshot> items) {
        StringBuilder builder = new StringBuilder();
        for (CartSnapshot item : items) {
            builder.append(item.productId()).append(':')
                    .append(item.colorId() == null ? "-" : item.colorId()).append(':')
                    .append(item.quantity()).append('|');
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(builder.toString().getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(exception);
        }
    }

    private record CartSnapshot(int productId, Integer colorId, int quantity) {
    }

    public record DemoOrderLine(
            Integer productId,
            Integer colorId,
            String productName,
            String categoryName,
            int unitPrice,
            int quantity,
            int lineDiscount,
            int lineAmount,
            String status
    ) {
    }

    public record DemoOrderResponse(
            String orderKey,
            Long userId,
            String purchasedAt,
            String recordSource,
            String status,
            long paidAmount,
            List<DemoOrderLine> lines,
            String requestId
    ) {
    }
}
