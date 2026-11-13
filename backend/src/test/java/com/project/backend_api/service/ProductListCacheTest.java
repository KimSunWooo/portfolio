package com.project.backend_api.service;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.concurrent.ConcurrentMapCache;
import org.springframework.cache.support.SimpleCacheManager;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ProductListCacheTest {

    @Test
    void productListCacheCanBeDisabledWithoutARequestParameter() throws Exception {
        Cacheable cacheable = ProductService.class
                .getMethod("getProducts", String.class, String.class)
                .getAnnotation(Cacheable.class);
        assertEquals("@productListCacheGate.enabled()", cacheable.condition());
        assertFalse(new ProductListCacheGate(false).enabled());
        assertTrue(new ProductListCacheGate(true).enabled());
    }

    @Test
    void blankAndNullFiltersShareOneKey() {
        assertEquals("ALL_NONE", ProductListCache.key(null, null));
        assertEquals("ALL_NONE", ProductListCache.key("  ", ""));
    }

    @Test
    void categoryAndSearchAreNormalized() {
        assertEquals("lip_red", ProductListCache.key(" LIP ", " Red "));
    }

    @AfterEach
    void clearSynchronization() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    void cacheClearsAfterCommitAndStaysAfterRollback() {
        SimpleCacheManager manager = new SimpleCacheManager();
        ConcurrentMapCache cache = new ConcurrentMapCache(ProductListCache.NAME);
        manager.setCaches(List.of(cache));
        manager.initializeCaches();
        ProductListCache productListCache = new ProductListCache(manager);
        cache.put("lip_none", "stale");

        TransactionSynchronizationManager.initSynchronization();
        productListCache.evictAfterCommit();
        assertEquals("stale", cache.get("lip_none", String.class));

        for (TransactionSynchronization synchronization : TransactionSynchronizationManager.getSynchronizations()) {
            synchronization.afterCompletion(TransactionSynchronization.STATUS_ROLLED_BACK);
        }
        assertEquals("stale", cache.get("lip_none", String.class));

        for (TransactionSynchronization synchronization : TransactionSynchronizationManager.getSynchronizations()) {
            synchronization.afterCommit();
        }
        assertNull(cache.get("lip_none"));
    }

    @Test
    void staleLoaderCannotRepopulateAfterEviction() throws Exception {
        ProductListCacheGeneration generation = new ProductListCacheGeneration();
        SimpleCacheManager manager = new SimpleCacheManager();
        ConcurrentMapCache raw = new ConcurrentMapCache(ProductListCache.NAME);
        manager.setCaches(List.of(raw));
        manager.initializeCaches();
        GenerationAwareCacheManager aware = new GenerationAwareCacheManager(manager, generation);
        ProductListCache productListCache = new ProductListCache(aware, generation);

        long observed = productListCache.generation();
        productListCache.evictAfterCommit();
        assertTrue(productListCache.generation() > observed);
        assertFalse(productListCache.putIfGenerationMatches("ALL_NONE", "stale-stock", observed));
        assertNull(aware.getCache(ProductListCache.NAME).get("ALL_NONE"));

        assertTrue(productListCache.putIfGenerationMatches("ALL_NONE", "fresh", productListCache.generation()));
        assertEquals("fresh", aware.getCache(ProductListCache.NAME).get("ALL_NONE", String.class));
    }
}
