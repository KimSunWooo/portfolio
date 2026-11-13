package com.project.backend_api.support;

import com.project.backend_api.service.GenerationAwareCacheManager;
import com.project.backend_api.service.ProductListCacheGeneration;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.cache.CacheManager;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;

@TestConfiguration
public class SimpleCacheTestConfiguration {

    @Bean
    ProductListCacheGeneration productListCacheGeneration() {
        return new ProductListCacheGeneration();
    }

    @Bean
    CacheManager cacheManager(ProductListCacheGeneration productListCacheGeneration) {
        return new GenerationAwareCacheManager(
                new ConcurrentMapCacheManager(),
                productListCacheGeneration
        );
    }
}
