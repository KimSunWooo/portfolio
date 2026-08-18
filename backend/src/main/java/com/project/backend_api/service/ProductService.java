package com.project.backend_api.service;

import com.project.backend_api.domain.product.*;
import com.project.backend_api.dto.product.ProductDetailResponse;
import com.project.backend_api.dto.product.ProductImageResponse;
import com.project.backend_api.dto.product.ProductListResponse;
import com.project.backend_api.dto.product.ProductRequest;
import com.project.backend_api.repository.*;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;

import static org.springframework.http.HttpStatus.BAD_REQUEST;
import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductDetailRepository productDetailRepository;
    private final ProductImageRepository productImageRepository;
    private final ProductColorRepository productColorRepository;


    // =========================================================
    // PUBLIC PRODUCT
    // =========================================================

    /**
     * 사용자 Shop 상품 목록
     *
     * SALE 상태의 상품만 반환한다.
     * category가 전달되면 카테고리 필터링을 적용한다.
     */
    public List<ProductListResponse> getProducts(String category) {

        List<Product> products =
                category == null || category.isBlank()
                        ? productRepository.findByStatusOrderByIdAsc(
                                ProductStatus.SALE
                        )
                        : productRepository
                                .findByStatusAndCategoryIgnoreCaseOrderByIdAsc(
                                        ProductStatus.SALE,
                                        category
                                );

        return products.stream()
                .map(ProductListResponse::from)
                .toList();
    }


    /**
     * 사용자 Shop 상품 상세
     */
    public ProductDetailResponse getProduct(Integer id) {

        Product product = productRepository.findById(id)
                .filter(item ->
                        item.getStatus() != ProductStatus.HIDDEN
                )
                .orElseThrow(() ->
                        new ResponseStatusException(
                                NOT_FOUND,
                                "상품을 찾을 수 없습니다. id=" + id
                        )
                );

        ProductDetail detail =
                productDetailRepository
                        .findByProductId(id)
                        .orElse(null);

        List<ProductImage> images =
                productImageRepository
                        .findByProductIdOrderBySortOrderAscIdAsc(id);

        List<ProductColor> colors =
                productColorRepository
                        .findByProductIdOrderBySortOrderAscIdAsc(id);

        return ProductDetailResponse.of(
                product,
                detail,
                images,
                colors
        );
    }


    // =========================================================
    // ADMIN PRODUCT CRUD
    // =========================================================

    /**
     * 관리자 상품 전체 목록
     *
     * SALE / SOLD_OUT / HIDDEN 전부 반환
     */
    public List<Product> getAdminProducts() {

        return productRepository
                .findAllByOrderByIdDesc();
    }


    /**
     * 상품 생성
     */
    @Transactional
    public Product createProduct(
            ProductRequest request
    ) {

        try {

            Product product =
                    Product.create(request);

            return productRepository.save(product);

        } catch (IllegalArgumentException e) {

            throw new ResponseStatusException(
                    BAD_REQUEST,
                    "지원하지 않는 상품 상태입니다."
            );
        }
    }


    /**
     * 상품 수정
     */
    @Transactional
    public Product updateProduct(
            Integer id,
            ProductRequest request
    ) {

        Product product =
                productRepository.findById(id)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        NOT_FOUND,
                                        "상품을 찾을 수 없습니다. id=" + id
                                )
                        );

        try {

            product.update(request);

        } catch (IllegalArgumentException e) {

            throw new ResponseStatusException(
                    BAD_REQUEST,
                    "지원하지 않는 상품 상태입니다."
            );
        }

        return product;
    }


    /**
     * 상품 삭제
     */
    @Transactional
    public void deleteProduct(Integer id) {

        if (!productRepository.existsById(id)) {

            throw new ResponseStatusException(
                    NOT_FOUND,
                    "상품을 찾을 수 없습니다. id=" + id
            );
        }

        productRepository.deleteById(id);
    }


    // =========================================================
    // PRODUCT IMAGE
    // =========================================================

    /**
     * 특정 상품 이미지 목록
     */
    public List<ProductImageResponse> getProductImages(
            Integer productId
    ) {

        if (!productRepository.existsById(productId)) {

            throw new ResponseStatusException(
                    NOT_FOUND,
                    "상품을 찾을 수 없습니다. id=" + productId
            );
        }

        return productImageRepository
                .findByProductIdOrderBySortOrderAscIdAsc(productId)
                .stream()
                .map(ProductImageResponse::from)
                .toList();
    }


    /**
     * 상품 이미지 업로드
     */
    @Transactional
    public ProductImageResponse addProductImage(
            Integer productId,
            MultipartFile file,
            String caption,
            String altText,
            String imageType,
            Integer sortOrder
    ) {

        Product product =
                productRepository.findById(productId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        NOT_FOUND,
                                        "상품을 찾을 수 없습니다. id="
                                                + productId
                                )
                        );


        // -----------------------------------------------------
        // 파일 존재 확인
        // -----------------------------------------------------

        if (file == null || file.isEmpty()) {

            throw new ResponseStatusException(
                    BAD_REQUEST,
                    "업로드할 이미지가 없습니다."
            );
        }


        // -----------------------------------------------------
        // 이미지 파일인지 확인
        // -----------------------------------------------------

        String contentType =
                file.getContentType();

        if (
                contentType == null ||
                !contentType.startsWith("image/")
        ) {

            throw new ResponseStatusException(
                    BAD_REQUEST,
                    "이미지 파일만 업로드할 수 있습니다."
            );
        }


        // -----------------------------------------------------
        // 이미지 타입
        // -----------------------------------------------------

        ImageType type;

        try {

            type =
                    imageType == null ||
                    imageType.isBlank()
                            ? ImageType.DETAIL
                            : ImageType.valueOf(
                                    imageType.toUpperCase()
                            );

        } catch (IllegalArgumentException e) {

            throw new ResponseStatusException(
                    BAD_REQUEST,
                    "지원하지 않는 이미지 타입입니다."
            );
        }


        // -----------------------------------------------------
        // 실제 이미지 파일 저장
        // -----------------------------------------------------

        String imageUrl =
                saveProductImage(
                        productId,
                        file
                );


        // -----------------------------------------------------
        // product_images DB 저장
        // -----------------------------------------------------

        ProductImage image =
                ProductImage.create(
                        productId,
                        imageUrl,
                        caption,
                        altText,
                        type,
                        sortOrder
                );

        ProductImage saved =
                productImageRepository.save(image);


        // -----------------------------------------------------
        // MAIN 이미지라면 products.thumbnail 변경
        // -----------------------------------------------------

        if (type == ImageType.MAIN) {

            product.updateThumbnail(
                    imageUrl
            );
        }


        return ProductImageResponse.from(saved);
    }


    /**
     * 상품 이미지 정보 수정
     *
     * 실제 이미지 파일을 교체하는 API가 아니라
     * caption / alt / type / sortOrder 수정
     */
    @Transactional
    public ProductImageResponse updateProductImage(
            Integer productId,
            Integer imageId,
            String caption,
            String altText,
            String imageType,
            Integer sortOrder
    ) {

        ProductImage image =
                productImageRepository
                        .findById(imageId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        NOT_FOUND,
                                        "상품 이미지를 찾을 수 없습니다."
                                )
                        );


        // 해당 상품에 속한 이미지인지 확인
        if (!image.getProductId().equals(productId)) {

            throw new ResponseStatusException(
                    BAD_REQUEST,
                    "해당 상품의 이미지가 아닙니다."
            );
        }


        // -----------------------------------------------------
        // ImageType 처리
        // -----------------------------------------------------

        ImageType type;

        try {

            type =
                    imageType == null ||
                    imageType.isBlank()
                            ? image.getImageType()
                            : ImageType.valueOf(
                                    imageType.toUpperCase()
                            );

        } catch (IllegalArgumentException e) {

            throw new ResponseStatusException(
                    BAD_REQUEST,
                    "지원하지 않는 이미지 타입입니다."
            );
        }


        // -----------------------------------------------------
        // 이미지 정보 수정
        // -----------------------------------------------------

        image.update(
                caption,
                altText,
                type,
                sortOrder
        );


        // -----------------------------------------------------
        // MAIN으로 변경된 경우 thumbnail 변경
        // -----------------------------------------------------

        if (type == ImageType.MAIN) {

            Product product =
                    productRepository.findById(productId)
                            .orElseThrow(() ->
                                    new ResponseStatusException(
                                            NOT_FOUND,
                                            "상품을 찾을 수 없습니다. id="
                                                    + productId
                                    )
                            );

            product.updateThumbnail(
                    image.getImageUrl()
            );
        }


        return ProductImageResponse.from(image);
    }


    /**
     * 상품 이미지 삭제
     */
    @Transactional
    public void deleteProductImage(
            Integer productId,
            Integer imageId
    ) {

        ProductImage image =
                productImageRepository
                        .findById(imageId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        NOT_FOUND,
                                        "상품 이미지를 찾을 수 없습니다."
                                )
                        );


        // 해당 상품 이미지인지 확인
        if (!image.getProductId().equals(productId)) {

            throw new ResponseStatusException(
                    BAD_REQUEST,
                    "해당 상품의 이미지가 아닙니다."
            );
        }


        // -----------------------------------------------------
        // 실제 이미지 파일 삭제
        // -----------------------------------------------------

        deleteProductImageFile(
                image.getImageUrl()
        );


        // -----------------------------------------------------
        // DB 데이터 삭제
        // -----------------------------------------------------

        productImageRepository.delete(image);
    }


    // =========================================================
    // PRODUCT IMAGE FILE SYSTEM
    // =========================================================

    /**
     * 상품 이미지 파일 저장
     *
     * 저장 위치:
     *
     * backend/
     *   uploads/
     *     products/
     *       {productId}/
     *          UUID.jpg
     */
    private String saveProductImage(
            Integer productId,
            MultipartFile file
    ) {

        try {

            Path uploadDir =
                    Paths.get(
                            System.getProperty("user.dir"),
                            "uploads",
                            "products",
                            String.valueOf(productId)
                    );


            // 폴더 없으면 생성
            Files.createDirectories(
                    uploadDir
            );


            // -------------------------------------------------
            // 확장자 추출
            // -------------------------------------------------

            String originalFilename =
                    file.getOriginalFilename();

            String extension = "";

            if (
                    originalFilename != null &&
                    originalFilename.contains(".")
            ) {

                extension =
                        originalFilename.substring(
                                originalFilename.lastIndexOf(".")
                        );
            }


            // -------------------------------------------------
            // UUID 파일명
            // -------------------------------------------------

            String filename =
                    UUID.randomUUID()
                            + extension;


            Path targetPath =
                    uploadDir
                            .resolve(filename)
                            .normalize();


            // -------------------------------------------------
            // 파일 저장
            // -------------------------------------------------

            Files.copy(
                    file.getInputStream(),
                    targetPath
            );


            // DB에는 URL만 저장
            return "/uploads/products/"
                    + productId
                    + "/"
                    + filename;


        } catch (IOException e) {

            throw new RuntimeException(
                    "상품 이미지 저장에 실패했습니다.",
                    e
            );
        }
    }


    /**
     * 실제 상품 이미지 파일 삭제
     */
    private void deleteProductImageFile(
            String imageUrl
    ) {

        if (
                imageUrl == null ||
                imageUrl.isBlank()
        ) {
            return;
        }


        try {

            String relativePath =
                    imageUrl.startsWith("/")
                            ? imageUrl.substring(1)
                            : imageUrl;


            Path targetPath =
                    Paths.get(
                            System.getProperty("user.dir"),
                            relativePath
                    )
                    .normalize();


            Files.deleteIfExists(
                    targetPath
            );


        } catch (IOException e) {

            throw new RuntimeException(
                    "상품 이미지 삭제에 실패했습니다.",
                    e
            );
        }
    }
}