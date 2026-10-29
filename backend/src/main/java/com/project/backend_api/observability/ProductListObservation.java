package com.project.backend_api.observability;

import java.util.Locale;
import java.util.concurrent.atomic.LongAdder;

/**
 * Isolated counters for the product list path.
 *
 * <p>The bean exists only when {@code app.observability.product-list.enabled=true}.
 * Production leaves that flag false, so these counters are not allocated and no
 * observation endpoint is registered.
 *
 * <p>Each counter is monotonic. A measurement takes a snapshot after warmup and
 * another after the measured requests finish, then uses the difference.
 */
public class ProductListObservation {

    private final LongAdder httpListRequests = new LongAdder();
    private final LongAdder serviceEntries = new LongAdder();
    private final LongAdder productListSelects = new LongAdder();
    private final LongAdder otherProductTableStatements = new LongAdder();

    /**
     * One GET /api/products invocation that entered {@code ProductController}.
     * Detail requests and the observation endpoint are not included.
     */
    public void recordHttpListRequest() {
        httpListRequests.increment();
    }

    /**
     * One entry into the {@code ProductService.getProducts} method body.
     * A cache hit returns before this line and is not counted.
     */
    public void recordServiceEntry() {
        serviceEntries.increment();
    }

    /**
     * Counts a product-list SELECT separately from any other statement whose text
     * mentions the products table. The other count is diagnostic only.
     * Parameters are not stored.
     */
    public void recordSql(String sql) {
        if (sql == null || !sql.toLowerCase(Locale.ROOT).contains("products")) {
            return;
        }
        if (isProductListSelect(sql)) {
            productListSelects.increment();
            return;
        }
        otherProductTableStatements.increment();
    }

    public ProductListObservationSnapshot snapshot() {
        return new ProductListObservationSnapshot(
                httpListRequests.sum(),
                serviceEntries.sum(),
                productListSelects.sum(),
                otherProductTableStatements.sum()
        );
    }

    /**
     * Product-list SELECT text uses the products table, orders rows, and does not
     * select one row by id. Detail queries are excluded.
     */
    public static boolean isProductListSelect(String sql) {
        if (sql == null || sql.isBlank()) {
            return false;
        }
        String normalized = sql.toLowerCase(Locale.ROOT).replace("`", "").replaceAll("\\s+", " ").trim();
        return normalized.startsWith("select")
                && normalized.contains("from products")
                && normalized.contains("order by")
                && !normalized.contains("id=?")
                && !normalized.contains("id = ?");
    }
}
