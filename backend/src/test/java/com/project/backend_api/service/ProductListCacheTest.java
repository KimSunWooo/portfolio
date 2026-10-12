package com.project.backend_api.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class ProductListCacheTest {

    @Test
    void blankAndNullFiltersShareOneKey() {
        assertEquals("ALL_NONE", ProductListCache.key(null, null));
        assertEquals("ALL_NONE", ProductListCache.key("  ", ""));
    }

    @Test
    void categoryAndSearchAreNormalized() {
        assertEquals("lip_red", ProductListCache.key(" LIP ", " Red "));
    }
}
