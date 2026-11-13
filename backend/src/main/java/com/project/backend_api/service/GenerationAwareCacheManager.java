package com.project.backend_api.service;

import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;

import java.util.Collection;

/**
 * Wraps the product-list cache so eviction generation is checked on put.
 */
public final class GenerationAwareCacheManager implements CacheManager {

    private final CacheManager delegate;
    private final ProductListCacheGeneration generation;

    public GenerationAwareCacheManager(CacheManager delegate, ProductListCacheGeneration generation) {
        this.delegate = delegate;
        this.generation = generation;
    }

    @Override
    public Cache getCache(String name) {
        Cache cache = delegate.getCache(name);
        if (cache == null) {
            return null;
        }
        if (ProductListCache.NAME.equals(name)) {
            if (cache instanceof GenerationBoundCache) {
                return cache;
            }
            return new GenerationBoundCache(cache, generation);
        }
        return cache;
    }

    @Override
    public Collection<String> getCacheNames() {
        return delegate.getCacheNames();
    }
}
