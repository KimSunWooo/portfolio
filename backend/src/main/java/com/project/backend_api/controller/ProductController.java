package com.project.backend_api.controller;

import com.project.backend_api.domain.product.Product;
import com.project.backend_api.dto.product.ProductDetailResponse;
import com.project.backend_api.dto.product.ProductListResponse;
import com.project.backend_api.dto.product.ProductRequest;
import com.project.backend_api.service.ProductService;

import com.project.backend_api.dto.product.ProductImageResponse;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;

import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    // =========================
    // Public
    // =========================

    @GetMapping
    public List<ProductListResponse> getProducts(
            @RequestParam(required = false) String category
    ) {
        return productService.getProducts(category);
    }

    @GetMapping("/{id}")
    public ProductDetailResponse getProduct(
            @PathVariable Integer id
    ) {
        return productService.getProduct(id);
    }


    // =========================
    // Admin
    // =========================

    @GetMapping("/admin")
    public List<Product> getAdminProducts() {
        return productService.getAdminProducts();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Product createProduct(
            @Valid @RequestBody ProductRequest request
    ) {
        return productService.createProduct(request);
    }

    @PutMapping("/{id}")
    public Product updateProduct(
            @PathVariable Integer id,
            @Valid @RequestBody ProductRequest request
    ) {
        return productService.updateProduct(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProduct(
            @PathVariable Integer id
    ) {
        productService.deleteProduct(id);
    }

    @GetMapping("/{productId}/images")
    public List<ProductImageResponse> getProductImages(
            @PathVariable Integer productId
    ) {
        return productService.getProductImages(productId);
    }

    @PostMapping(
            value = "/{productId}/images",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    @ResponseStatus(HttpStatus.CREATED)
    public ProductImageResponse uploadProductImage(
            @PathVariable Integer productId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String caption,
            @RequestParam(required = false) String altText,
            @RequestParam(required = false) String imageType,
            @RequestParam(defaultValue = "0") Integer sortOrder
    ) {
        return productService.addProductImage(
                productId,
                file,
                caption,
                altText,
                imageType,
                sortOrder
        );
    }

    @PutMapping("/{productId}/images/{imageId}")
    public ProductImageResponse updateProductImage(
            @PathVariable Integer productId,
            @PathVariable Integer imageId,
            @RequestParam(required = false) String caption,
            @RequestParam(required = false) String altText,
            @RequestParam(required = false) String imageType,
            @RequestParam(defaultValue = "0") Integer sortOrder
    ) {
        return productService.updateProductImage(
                productId,
                imageId,
                caption,
                altText,
                imageType,
                sortOrder
        );
    }

    @DeleteMapping("/{productId}/images/{imageId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProductImage(
            @PathVariable Integer productId,
            @PathVariable Integer imageId
    ) {
        productService.deleteProductImage(
                productId,
                imageId
        );
    }
}
