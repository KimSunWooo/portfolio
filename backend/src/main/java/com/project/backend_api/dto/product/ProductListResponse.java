package com.project.backend_api.dto.product;

import com.project.backend_api.domain.product.Product;

public record ProductListResponse(
        Integer id,
        String name,
        String category,
        Integer price,
        Integer originalPrice,
        String thumbnail,
        Boolean isNew,
        Boolean isBest,
        Integer stock,
        String status
) {
    public static ProductListResponse from(Product product) {
        return new ProductListResponse(
                product.getId(),
                product.getName(),
                product.getCategory(),
                product.getPrice(),
                product.getOriginalPrice(),
                product.getThumbnail(),
                product.getIsNew(),
                product.getIsBest(),
                product.getStock(),
                product.getStatus() == null ? null : product.getStatus().name()
        );
    }
}
