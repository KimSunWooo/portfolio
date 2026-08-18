package com.project.backend_api.dto.product;

import com.project.backend_api.domain.product.ProductImage;

public record ProductImageResponse(
        Integer id,
        Integer productId,
        String imageUrl,
        String caption,
        String altText,
        String imageType,
        Integer sortOrder
) {
    public static ProductImageResponse from(
            ProductImage image
    ) {
        return new ProductImageResponse(
                image.getId(),
                image.getProductId(),
                image.getImageUrl(),
                image.getCaption(),
                image.getAltText(),
                image.getImageType() == null
                        ? null
                        : image.getImageType().name(),
                image.getSortOrder()
        );
    }
}