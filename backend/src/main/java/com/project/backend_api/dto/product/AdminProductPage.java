package com.project.backend_api.dto.product;

import com.project.backend_api.domain.product.Product;

import java.util.List;

public record AdminProductPage(
        List<Product> items,
        long totalCount,
        int page,
        int size
) {
}
