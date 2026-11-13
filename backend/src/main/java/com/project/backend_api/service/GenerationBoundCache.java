package com.project.backend_api.service;

import org.springframework.cache.Cache;
import org.springframework.lang.Nullable;

import java.util.concurrent.Callable;

/**
 * Rejects cache puts that race past an eviction: a loader that observed generation G
 * must not store its result after generation has moved past G.
 */
final class GenerationBoundCache implements Cache {

    private final Cache delegate;
    private final ProductListCacheGeneration generation;
    private final ThreadLocal<Long> loadGeneration = new ThreadLocal<>();

    GenerationBoundCache(Cache delegate, ProductListCacheGeneration generation) {
        this.delegate = delegate;
        this.generation = generation;
    }

    @Override
    public String getName() {
        return delegate.getName();
    }

    @Override
    public Object getNativeCache() {
        return delegate.getNativeCache();
    }

    @Override
    @Nullable
    public ValueWrapper get(Object key) {
        ValueWrapper hit = delegate.get(key);
        if (hit == null) {
            loadGeneration.set(generation.current());
        } else {
            loadGeneration.remove();
        }
        return hit;
    }

    @Override
    @Nullable
    public <T> T get(Object key, @Nullable Class<T> type) {
        T value = delegate.get(key, type);
        if (value == null) {
            loadGeneration.set(generation.current());
        } else {
            loadGeneration.remove();
        }
        return value;
    }

    @Override
    @Nullable
    public <T> T get(Object key, Callable<T> valueLoader) {
        long observed = generation.current();
        try {
            return delegate.get(key, () -> {
                loadGeneration.set(observed);
                return valueLoader.call();
            });
        } finally {
            loadGeneration.remove();
        }
    }

    @Override
    public void put(Object key, @Nullable Object value) {
        try {
            Long observed = loadGeneration.get();
            if (observed != null && observed != generation.current()) {
                return;
            }
            delegate.put(key, value);
            if (observed != null && observed != generation.current()) {
                delegate.evict(key);
            }
        } finally {
            loadGeneration.remove();
        }
    }

    @Override
    @Nullable
    public ValueWrapper putIfAbsent(Object key, @Nullable Object value) {
        try {
            Long observed = loadGeneration.get();
            if (observed != null && observed != generation.current()) {
                return delegate.get(key);
            }
            return delegate.putIfAbsent(key, value);
        } finally {
            loadGeneration.remove();
        }
    }

    @Override
    public void evict(Object key) {
        delegate.evict(key);
    }

    @Override
    public void clear() {
        generation.bump();
        delegate.clear();
    }
}
