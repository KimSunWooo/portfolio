package com.project.backend_api.repository;

import com.project.backend_api.domain.product.ProductColor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductColorRepository extends JpaRepository<ProductColor, Integer> {
    List<ProductColor> findByProductIdOrderBySortOrderAscIdAsc(Integer productId);

    Optional<ProductColor> findByIdAndProductId(Integer id, Integer productId);

    void deleteByProductId(Integer productId);
}
