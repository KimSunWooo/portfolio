package com.project.backend_api.domain.product;

import com.project.backend_api.dto.product.ProductRequest;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@Entity
@Table(name = "products")
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 255)
    private String subtitle;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 50)
    private String category;

    @Column(nullable = false)
    private Integer price;

    @Column(name = "original_price")
    private Integer originalPrice;

    @Column(length = 255)
    private String thumbnail;

    @Column(name = "is_new")
    private Boolean isNew;

    @Column(name = "is_best")
    private Boolean isBest;

    private Integer stock;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private ProductStatus status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public static Product create(ProductRequest request) {
        Product product = new Product();
        product.createdAt = LocalDateTime.now();
        product.update(request);
        return product;
    }

    public void update(ProductRequest request) {
        this.name = request.name();
        this.subtitle = request.subtitle();
        this.description = request.description();
        this.category = request.category();
        this.price = request.price();
        this.originalPrice = request.originalPrice();
        this.thumbnail = request.thumbnail();
        this.isNew = request.isNew() != null && request.isNew();
        this.isBest = request.isBest() != null && request.isBest();
        this.stock = request.stock() == null ? 0 : request.stock();

        this.status =
                request.status() == null || request.status().isBlank()
                        ? ProductStatus.SALE
                        : ProductStatus.valueOf(request.status().toUpperCase());

        this.updatedAt = LocalDateTime.now();
    }

    public void updateThumbnail(String thumbnail) {
        this.thumbnail = thumbnail;
        this.updatedAt = LocalDateTime.now();
    }
}