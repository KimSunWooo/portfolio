package com.project.backend_api.service;

import com.project.backend_api.domain.product.*;
import com.project.backend_api.dto.product.ProductDetailResponse;
import com.project.backend_api.dto.product.ProductListResponse;
import com.project.backend_api.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductDetailRepository productDetailRepository;
    private final ProductImageRepository productImageRepository;
    private final ProductColorRepository productColorRepository;

    public List<ProductListResponse> getProducts(String category) {
        List<Product> products =
                category == null || category.isBlank()
                        ? productRepository.findByStatusOrderByIdAsc(ProductStatus.SALE)
                        : productRepository.findByStatusAndCategoryIgnoreCaseOrderByIdAsc(
                                ProductStatus.SALE,
                                category
                        );

        return products.stream()
                .map(ProductListResponse::from)
                .toList();
    }

    public ProductDetailResponse getProduct(Integer id) {
        Product product = productRepository.findById(id)
                .filter(item -> item.getStatus() != ProductStatus.HIDDEN)
                .orElseThrow(() -> new ResponseStatusException(
                        NOT_FOUND,
                        "상품을 찾을 수 없습니다. id=" + id
                ));

        ProductDetail detail = productDetailRepository.findByProductId(id).orElse(null);
        List<ProductImage> images =
                productImageRepository.findByProductIdOrderBySortOrderAscIdAsc(id);
        List<ProductColor> colors =
                productColorRepository.findByProductIdOrderBySortOrderAscIdAsc(id);

        return ProductDetailResponse.of(product, detail, images, colors);
    }
}
