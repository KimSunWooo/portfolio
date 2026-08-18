package com.project.backend_api.domain.product;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "product_colors")
public class ProductColor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "product_id", nullable = false)
    private Integer productId;

    @Column(name = "color_name", nullable = false, length = 50)
    private String colorName;

    @Column(name = "color_code", length = 20)
    private String colorCode;

    @Column(name = "image_url", length = 255)
    private String imageUrl;

    private Integer stock;

    @Column(name = "sort_order")
    private Integer sortOrder;
}
