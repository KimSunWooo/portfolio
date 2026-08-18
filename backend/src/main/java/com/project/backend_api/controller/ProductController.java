package com.project.backend_api.controller;

import com.project.backend_api.dto.product.ProductDetailResponse;
import com.project.backend_api.dto.product.ProductListResponse;
import com.project.backend_api.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public List<ProductListResponse> getProducts(
            @RequestParam(required = false) String category
    ) {
        return productService.getProducts(category);
    }

    @GetMapping("/{id}")
    public ProductDetailResponse getProduct(@PathVariable Integer id) {
        return productService.getProduct(id);
    }
}
