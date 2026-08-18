package com.project.backend_api.repository;

import com.project.backend_api.domain.product.ProductColor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProductColorRepository extends JpaRepository<ProductColor, Integer> {
    List<ProductColor> findByProductIdOrderBySortOrderAscIdAsc(Integer productId);
}
