package com.project.backend_api.domain.product;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "product_images")
public class ProductImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "product_id", nullable = false)
    private Integer productId;

    @Column(name = "image_url", nullable = false, length = 255)
    private String imageUrl;

    @Column(length = 255)
    private String caption;

    @Column(name = "alt_text", length = 255)
    private String altText;

    @Enumerated(EnumType.STRING)
    @Column(name = "image_type", length = 20)
    private ImageType imageType;

    @Column(name = "sort_order")
    private Integer sortOrder;

    public static ProductImage create(
            Integer productId,
            String imageUrl,
            String caption,
            String altText,
            ImageType imageType,
            Integer sortOrder
    ) {
        ProductImage image = new ProductImage();

        image.productId = productId;
        image.imageUrl = imageUrl;
        image.caption = caption;
        image.altText = altText;
        image.imageType = imageType;
        image.sortOrder = sortOrder == null ? 0 : sortOrder;

        return image;
    }

    public void update(
            String caption,
            String altText,
            ImageType imageType,
            Integer sortOrder
    ) {
        this.caption = caption;
        this.altText = altText;
        this.imageType = imageType;
        this.sortOrder = sortOrder == null ? 0 : sortOrder;
    }
}
