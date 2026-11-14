package com.project.backend_api.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.concurrent.Callable;

@Component
public class ProductListCache {

    public static final String NAME = "productList";

    private final CacheManager cacheManager;
    private final ProductListCacheGeneration generation;

    @Autowired
    public ProductListCache(CacheManager cacheManager, ProductListCacheGeneration generation) {
        this.cacheManager = cacheManager;
        this.generation = generation;
    }

    /** Unit-test convenience when a shared generation bean is not wired. */
    public ProductListCache(CacheManager cacheManager) {
        this(cacheManager, new ProductListCacheGeneration());
    }

    public static String key(String category, String search) {
        String categoryValue = category == null || category.isBlank() ? "" : category;
        String searchValue = search == null || search.isBlank() ? "" : search;
        // Length prefixes prevent delimiter/sentinel collisions. Preserve nonblank input
        // exactly because the repository receives it unchanged.
        return "v2:" + categoryValue.length() + ":" + categoryValue
                + ":" + searchValue.length() + ":" + searchValue;
    }

    public long generation() {
        return generation.current();
    }

    public void evictAfterCommit() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    clearProductList();
                }
            });
            return;
        }
        clearProductList();
    }

    public <T> T getOrLoad(String cacheKey, Callable<T> loader) throws Exception {
        Cache cache = cacheManager.getCache(NAME);
        if (cache == null) {
            return loader.call();
        }
        Cache.ValueWrapper hit = cache.get(cacheKey);
        if (hit != null) {
            @SuppressWarnings("unchecked")
            T value = (T) hit.get();
            return value;
        }
        long observed = generation.current();
        T loaded = loader.call();
        putIfGenerationMatches(cacheKey, loaded, observed);
        return loaded;
    }

    public boolean putIfGenerationMatches(String cacheKey, Object value, long expectedGeneration) {
        if (generation.current() != expectedGeneration) {
            return false;
        }
        Cache cache = cacheManager.getCache(NAME);
        if (cache == null) {
            return false;
        }
        if (cache instanceof GenerationBoundCache bound) {
            return bound.putForGeneration(cacheKey, value, expectedGeneration);
        }
        cache.put(cacheKey, value);
        if (generation.current() != expectedGeneration) {
            cache.evict(cacheKey);
            return false;
        }
        return true;
    }

    private void clearProductList() {
        Cache cache = cacheManager.getCache(NAME);
        if (cache == null) {
            generation.bump();
            return;
        }
        // GenerationBoundCache.clear bumps the shared stamp; plain caches need an explicit bump.
        if (!(cache instanceof GenerationBoundCache)) {
            generation.bump();
        }
        cache.clear();
    }
}
