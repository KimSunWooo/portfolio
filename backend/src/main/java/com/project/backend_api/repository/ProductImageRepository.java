package com.project.backend_api.repository;

import com.project.backend_api.domain.product.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductImageRepository extends JpaRepository<ProductImage, Integer> {
    List<ProductImage> findByProductIdOrderBySortOrderAscIdAsc(Integer productId);
}
