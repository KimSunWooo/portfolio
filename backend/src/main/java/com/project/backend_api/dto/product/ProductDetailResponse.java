package com.project.backend_api.dto.product;

import com.project.backend_api.domain.product.Product;
import com.project.backend_api.domain.product.ProductColor;
import com.project.backend_api.domain.product.ProductDetail;
import com.project.backend_api.domain.product.ProductImage;

import java.util.List;

public record ProductDetailResponse(
        Integer id,
        String name,
        String category,
        Integer price,
        Integer originalPrice,
        String thumbnail,
        Boolean isNew,
        Boolean isBest,
        Integer stock,
        String status,
        Detail detail,
        List<Image> images,
        List<Color> colors
) {
    public record Detail(
            String shortDescription,
            String description,
            String ingredients,
            String usageInfo,
            String productInfo
    ) {}

    public record Image(
            Integer id,
            String imageUrl,
            String imageType,
            Integer sortOrder
    ) {}

    public record Color(
            Integer id,
            String colorName,
            String colorCode,
            String imageUrl,
            Integer stock,
            Integer sortOrder
    ) {}

    public static ProductDetailResponse of(
            Product product,
            ProductDetail detail,
            List<ProductImage> images,
            List<ProductColor> colors
    ) {
        Detail detailDto = detail == null ? null : new Detail(
                detail.getShortDescription(),
                detail.getDescription(),
                detail.getIngredients(),
                detail.getUsageInfo(),
                detail.getProductInfo()
        );

        List<Image> imageDtos = images.stream()
                .map(image -> new Image(
                        image.getId(),
                        image.getImageUrl(),
                        image.getImageType() == null ? null : image.getImageType().name(),
                        image.getSortOrder()
                ))
                .toList();

        List<Color> colorDtos = colors.stream()
                .map(color -> new Color(
                        color.getId(),
                        color.getColorName(),
                        color.getColorCode(),
                        color.getImageUrl(),
                        color.getStock(),
                        color.getSortOrder()
                ))
                .toList();

        return new ProductDetailResponse(
                product.getId(),
                product.getName(),
                product.getCategory(),
                product.getPrice(),
                product.getOriginalPrice(),
                product.getThumbnail(),
                product.getIsNew(),
                product.getIsBest(),
                product.getStock(),
                product.getStatus() == null ? null : product.getStatus().name(),
                detailDto,
                imageDtos,
                colorDtos
        );
    }
}
