package com.project.backend_api.repository;

import com.project.backend_api.domain.product.ProductDetail;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ProductDetailRepository extends JpaRepository<ProductDetail, Integer> {
    Optional<ProductDetail> findByProductId(Integer productId);
}
