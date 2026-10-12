package com.project.backend_api.service;

import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.Locale;

@Component
public class ProductListCache {

    public static final String NAME = "productList";

    private final CacheManager cacheManager;

    public ProductListCache(CacheManager cacheManager) {
        this.cacheManager = cacheManager;
    }

    public static String key(String category, String search) {
        String normalizedCategory = category == null || category.isBlank()
                ? "ALL"
                : category.trim().toLowerCase(Locale.ROOT);
        String normalizedSearch = search == null || search.isBlank()
                ? "NONE"
                : search.trim().toLowerCase(Locale.ROOT);
        return normalizedCategory + "_" + normalizedSearch;
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

    private void clearProductList() {
        Cache cache = cacheManager.getCache(NAME);
        if (cache != null) {
            cache.clear();
        }
    }
}
