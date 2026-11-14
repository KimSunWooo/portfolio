package com.project.backend_api.service;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.lang.Nullable;
import org.springframework.stereotype.Component;

import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.atomic.AtomicLong;

/** Cache namespace shared across application instances; local fallback is for isolated tests. */
@Component
public class ProductListCacheGeneration {
    private static final String REDIS_KEY = "portfolio:product-list:generation:v2";
    private final AtomicLong local = new AtomicLong();
    private final StringRedisTemplate redis;

    public ProductListCacheGeneration() {
        this.redis = null;
    }

    @Autowired
    public ProductListCacheGeneration(ObjectProvider<StringRedisTemplate> provider) {
        this.redis = provider.getIfAvailable();
    }

    public ProductListCacheGeneration(@Nullable StringRedisTemplate redis) {
        this.redis = redis;
    }

    public long current() {
        if (redis == null) return local.get();
        for (int attempt = 0; attempt < 3; attempt++) {
            String current = redis.opsForValue().get(REDIS_KEY);
            if (current != null) return Long.parseLong(current);
            long candidate = randomGeneration();
            if (Boolean.TRUE.equals(redis.opsForValue().setIfAbsent(REDIS_KEY, Long.toString(candidate)))) {
                return candidate;
            }
        }
        throw new IllegalStateException("Unable to initialize product cache generation");
    }

    public long bump() {
        if (redis == null) return local.incrementAndGet();
        long next = randomGeneration();
        redis.opsForValue().set(REDIS_KEY, Long.toString(next));
        return next;
    }

    private static long randomGeneration() {
        // A new random namespace also prevents stale keys resurfacing if Redis evicts the stamp.
        return ThreadLocalRandom.current().nextLong(1, Long.MAX_VALUE);
    }
}
