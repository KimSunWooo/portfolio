package com.project.backend_api.service;

import com.project.backend_api.analytics.ProductDetailReadPublisher;
import com.project.backend_api.domain.product.ProductStatus;
import com.project.backend_api.dto.product.ProductListWrapper;
import com.project.backend_api.observability.ProductListObservation;
import com.project.backend_api.repository.ProductColorRepository;
import com.project.backend_api.repository.ProductDetailRepository;
import com.project.backend_api.repository.ProductImageRepository;
import com.project.backend_api.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;

import java.util.List;
import java.util.function.Consumer;

import static org.junit.jupiter.api.Assertions.assertNotSame;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Cache condition and keys go through Spring's cache proxy and an in-memory cache.
 * This is not a Redis integration test. Eviction after commit stays in
 * {@link ProductListCacheTest}. Refresh session storage is not on this path.
 */
class ProductListCacheProxyTest {

    @SpringJUnitConfig(ProductListCacheProxyTest.EnabledCache.class)
    @ActiveProfiles("product-list-cache-proxy")
    static class Enabled {
        @Autowired
        private ProductService productService;
        @Autowired
        private ProductRepository productRepository;
        @Autowired
        private CacheManager cacheManager;

        @Test
        void repeatCallHitsTheCacheAndSeparateFiltersDoNot() {
            when(productRepository.findByStatusOrderByIdAsc(ProductStatus.SALE)).thenReturn(List.of());
            when(productRepository.findByStatusAndCategoryIgnoreCaseOrderByIdAsc(ProductStatus.SALE, " LIP "))
                    .thenReturn(List.of());
            when(productRepository.findByStatusAndCategoryIgnoreCaseOrderByIdAsc(ProductStatus.SALE, "sample"))
                    .thenReturn(List.of());

            ProductListWrapper first = productService.getProducts(null, null);
            ProductListWrapper second = productService.getProducts("  ", "");
            assertSame(first, second);
            verify(productRepository, times(1)).findByStatusOrderByIdAsc(ProductStatus.SALE);

            productService.getProducts(" LIP ", null);
            productService.getProducts("lip", " ");
            verify(productRepository, times(1))
                    .findByStatusAndCategoryIgnoreCaseOrderByIdAsc(ProductStatus.SALE, " LIP ");
            productService.getProducts("sample", null);
            verify(productRepository, times(1))
                    .findByStatusAndCategoryIgnoreCaseOrderByIdAsc(ProductStatus.SALE, "sample");
            verify(productRepository, times(0))
                    .findByStatusAndCategoryIgnoreCaseOrderByIdAsc(ProductStatus.SALE, "lip");

            Object nativeCache = cacheManager.getCache(ProductListCache.NAME).getNativeCache();
            org.junit.jupiter.api.Assertions.assertEquals(
                    java.util.Set.of("ALL_NONE", "lip_NONE", "sample_NONE"),
                    ((java.util.Map<?, ?>) nativeCache).keySet()
            );
        }
    }

    @SpringJUnitConfig(ProductListCacheProxyTest.DisabledCache.class)
    @ActiveProfiles("product-list-cache-proxy")
    static class Disabled {
        @Autowired
        private ProductService productService;
        @Autowired
        private ProductRepository productRepository;

        @Test
        void everyCallEntersTheRepository() {
            when(productRepository.findByStatusOrderByIdAsc(ProductStatus.SALE)).thenReturn(List.of());

            ProductListWrapper first = productService.getProducts(null, null);
            ProductListWrapper second = productService.getProducts(null, null);

            verify(productRepository, times(2)).findByStatusOrderByIdAsc(ProductStatus.SALE);
            org.junit.jupiter.api.Assertions.assertNotSame(first, second);
        }
    }

    @Configuration
    @Profile("product-list-cache-proxy")
    @EnableCaching
    static class EnabledCache {
        @Bean(name = "productListCacheGate")
        ProductListCacheGate productListCacheGate() {
            return new ProductListCacheGate(true);
        }

        @Bean
        CacheManager cacheManager() {
            return new ConcurrentMapCacheManager(ProductListCache.NAME);
        }

        @Bean
        ProductRepository productRepository() {
            return mock(ProductRepository.class);
        }

        @Bean
        ProductService productService(ProductRepository productRepository, CacheManager cacheManager) {
            return new ProductService(
                    productRepository,
                    mock(ProductDetailRepository.class),
                    mock(ProductImageRepository.class),
                    mock(ProductColorRepository.class),
                    mock(com.amazonaws.services.s3.AmazonS3.class),
                    new ProductListCache(cacheManager),
                    mock(AfterCommit.class),
                    emptyPublisher(),
                    emptyObservation()
            );
        }
    }

    @Configuration
    @Profile("product-list-cache-proxy")
    @EnableCaching
    static class DisabledCache {
        @Bean(name = "productListCacheGate")
        ProductListCacheGate productListCacheGate() {
            return new ProductListCacheGate(false);
        }

        @Bean
        CacheManager cacheManager() {
            return new ConcurrentMapCacheManager(ProductListCache.NAME);
        }

        @Bean
        ProductRepository productRepository() {
            return mock(ProductRepository.class);
        }

        @Bean
        ProductService productService(ProductRepository productRepository, CacheManager cacheManager) {
            return new ProductService(
                    productRepository,
                    mock(ProductDetailRepository.class),
                    mock(ProductImageRepository.class),
                    mock(ProductColorRepository.class),
                    mock(com.amazonaws.services.s3.AmazonS3.class),
                    new ProductListCache(cacheManager),
                    mock(AfterCommit.class),
                    emptyPublisher(),
                    emptyObservation()
            );
        }
    }

    private static ObjectProvider<ProductDetailReadPublisher> emptyPublisher() {
        return new ObjectProvider<>() {
            @Override
            public ProductDetailReadPublisher getObject() {
                throw new IllegalStateException("publisher absent");
            }

            @Override
            public void ifAvailable(Consumer<ProductDetailReadPublisher> dependencyConsumer) {
            }
        };
    }

    private static ObjectProvider<ProductListObservation> emptyObservation() {
        return new ObjectProvider<>() {
            @Override
            public ProductListObservation getObject() {
                throw new IllegalStateException("observation disabled");
            }

            @Override
            public void ifAvailable(Consumer<ProductListObservation> dependencyConsumer) {
            }
        };
    }
}
