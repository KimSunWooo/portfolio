package com.project.backend_api.service;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.concurrent.ConcurrentMapCache;
import org.springframework.cache.support.SimpleCacheManager;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.spy;

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
        assertEquals(ProductListCache.key(null, null), ProductListCache.key("  ", ""));
    }

    @Test
    void keyPreservesNonblankInputAndCannotConfuseDelimitersOrSentinels() {
        assertNotEquals(ProductListCache.key("lip", "red_blue"), ProductListCache.key("lip_red", "blue"));
        assertNotEquals(ProductListCache.key(" LIP ", " Red "), ProductListCache.key("lip", "red"));
        assertNotEquals(ProductListCache.key(null, null), ProductListCache.key("ALL", "NONE"));
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

    @Test
    void stalePutPausedAfterGenerationCheckIsInvisibleAfterInvalidation() throws Exception {
        ProductListCacheGeneration generation = new ProductListCacheGeneration();
        ConcurrentMapCache delegate = spy(new ConcurrentMapCache(ProductListCache.NAME));
        GenerationBoundCache first = new GenerationBoundCache(delegate, generation);
        GenerationBoundCache second = new GenerationBoundCache(delegate, generation);
        CountDownLatch enteredPut = new CountDownLatch(1);
        CountDownLatch allowPut = new CountDownLatch(1);
        doAnswer(invocation -> {
            enteredPut.countDown();
            if (!allowPut.await(5, TimeUnit.SECONDS)) throw new AssertionError("put did not resume");
            return invocation.callRealMethod();
        }).when(delegate).put(any(), any());

        try (var executor = Executors.newSingleThreadExecutor()) {
            var loader = executor.submit(() -> {
                assertNull(first.get("race"));
                first.put("race", "stale");
            });
            try {
                assertTrue(enteredPut.await(5, TimeUnit.SECONDS));
                second.clear();
            } finally {
                allowPut.countDown();
            }
            loader.get(5, TimeUnit.SECONDS);
            assertNull(second.get("race"));
        }
    }
}
