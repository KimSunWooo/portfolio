package com.project.backend_api.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Measurement switch for the product list cache only.
 * The default is enabled. A false value skips Spring's cache lookup and store
 * for {@code getProducts}. It does not change Refresh session storage.
 */
@Component("productListCacheGate")
public class ProductListCacheGate {

    private final boolean enabled;

    public ProductListCacheGate(
            @Value("${app.cache.product-list.enabled:true}") boolean enabled
    ) {
        this.enabled = enabled;
    }

    public boolean enabled() {
        return enabled;
    }
}
