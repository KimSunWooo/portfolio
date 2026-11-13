package com.project.backend_api.service;

import org.springframework.stereotype.Component;

import java.util.concurrent.atomic.AtomicLong;

/**
 * Shared generation stamp for product-list cache entries.
 * Eviction bumps the stamp so in-flight loaders cannot store pre-eviction snapshots.
 */
@Component
public class ProductListCacheGeneration {

    private final AtomicLong value = new AtomicLong();

    public long current() {
        return value.get();
    }

    public long bump() {
        return value.incrementAndGet();
    }
}
