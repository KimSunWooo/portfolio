package com.project.backend_api.repository;

import com.project.backend_api.domain.product.Product;
import com.project.backend_api.domain.product.ProductStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Integer> {
    List<Product> findByStatusOrderByIdAsc(ProductStatus status);
    List<Product> findByStatusAndCategoryIgnoreCaseOrderByIdAsc(ProductStatus status, String category);
}
