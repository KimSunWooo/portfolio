package com.project.backend_api.service;

import org.springframework.cache.Cache;
import org.springframework.lang.Nullable;

import java.util.concurrent.Callable;

/**
 * Namespaces cached values by the shared generation. A loader that observed an old
 * generation may complete, but its result cannot be read under the new namespace.
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
        long observed = generation.current();
        ValueWrapper hit = delegate.get(scopedKey(key, observed));
        if (hit == null) {
            loadGeneration.set(observed);
        } else {
            loadGeneration.remove();
        }
        return hit;
    }

    @Override
    @Nullable
    public <T> T get(Object key, @Nullable Class<T> type) {
        long observed = generation.current();
        T value = delegate.get(scopedKey(key, observed), type);
        if (value == null) {
            loadGeneration.set(observed);
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
            return delegate.get(scopedKey(key, observed), () -> {
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
            long target = observed == null ? generation.current() : observed;
            if (target == generation.current()) delegate.put(scopedKey(key, target), value);
        } finally {
            loadGeneration.remove();
        }
    }

    @Override
    @Nullable
    public ValueWrapper putIfAbsent(Object key, @Nullable Object value) {
        try {
            Long observed = loadGeneration.get();
            long current = generation.current();
            if (observed != null && observed != current) return delegate.get(scopedKey(key, current));
            return delegate.putIfAbsent(scopedKey(key, current), value);
        } finally {
            loadGeneration.remove();
        }
    }

    @Override
    public void evict(Object key) {
        delegate.evict(scopedKey(key, generation.current()));
    }

    @Override
    public void clear() {
        generation.bump();
        delegate.clear();
    }

    boolean putForGeneration(Object key, @Nullable Object value, long observed) {
        if (observed != generation.current()) return false;
        delegate.put(scopedKey(key, observed), value);
        return observed == generation.current();
    }

    static String scopedKey(Object key, long observed) {
        return "generation:" + observed + ":" + key;
    }
}
