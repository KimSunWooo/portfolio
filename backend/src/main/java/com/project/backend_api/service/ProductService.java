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

import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.DeleteObjectRequest;
import com.amazonaws.services.s3.model.ObjectMetadata;
import com.amazonaws.services.s3.model.PutObjectRequest;

import org.springframework.beans.factory.annotation.Value;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

import static org.springframework.http.HttpStatus.INTERNAL_SERVER_ERROR;
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
    
    // S3 클라이언트 주입
    private final AmazonS3 amazonS3;

    // S3 버킷 이름 주입
    @Value("${cloud.aws.s3.bucket}")
    private String bucket;

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
            String imageType, // 프론트에서 넘어오는 String 타입
            Integer sortOrder
    ) {

        Product product =
                productRepository.findById(productId)
                        .orElseThrow(() ->
                                new ResponseStatusException(
                                        NOT_FOUND,
                                        "상품을 찾을 수 없습니다. id=" + productId
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
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new ResponseStatusException(
                    BAD_REQUEST,
                    "이미지 파일만 업로드할 수 있습니다."
            );
        }

        // -----------------------------------------------------
        // 💡 핵심 1: ImageType 변수 선언 및 String -> Enum 변환
        // -----------------------------------------------------
        ImageType type; // 여기서 변수를 선언해야 아래에서 에러가 안 납니다!
        
        try {
            type = imageType == null || imageType.isBlank()
                            ? ImageType.DETAIL
                            : ImageType.valueOf(imageType.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new ResponseStatusException(
                    BAD_REQUEST,
                    "지원하지 않는 이미지 타입입니다."
            );
        }

        // -----------------------------------------------------
        // 실제 이미지 파일 저장 (S3) + 🚨 껍데기 상품 방어 로직
        // -----------------------------------------------------
        String imageUrl;
        try {
            imageUrl = saveProductImage(productId, file);
        } catch (Exception e) {
            // S3 업로드 실패 시 방어 로직 (수동 롤백)
            if (product.getThumbnail() == null || product.getThumbnail().isBlank()) {
                productRepository.delete(product);
                
                throw new ResponseStatusException(
                        INTERNAL_SERVER_ERROR,
                        "S3 이미지 업로드 실패로 인해 상품 등록이 취소(롤백)되었습니다.", e
                );
            }
            
            throw new ResponseStatusException(
                    INTERNAL_SERVER_ERROR,
                    "이미지 업로드에 실패했습니다.", e
            );
        }

        // -----------------------------------------------------
        // product_images DB 저장
        // -----------------------------------------------------
        ProductImage image =
                ProductImage.create(
                        productId,
                        imageUrl,
                        caption,
                        altText,
                        type,      // 💡 핵심 2: 변환이 완료된 Enum 타입(type)을 전달
                        sortOrder
                );

        ProductImage saved = productImageRepository.save(image);

        // -----------------------------------------------------
        // MAIN 이미지라면 products.thumbnail 변경
        // -----------------------------------------------------
        if (type == ImageType.MAIN) {
            product.updateThumbnail(imageUrl);
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
        // 실제 이미지 파일 삭제 (S3)
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
    // PRODUCT IMAGE FILE SYSTEM (AWS S3)
    // =========================================================

    /**
     * 상품 이미지 파일 저장 (S3)
     */
    private String saveProductImage(
            Integer productId,
            MultipartFile file
    ) {

        try {
            // -------------------------------------------------
            // 확장자 추출
            // -------------------------------------------------
            String originalFilename = file.getOriginalFilename();
            String extension = "";

            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }

            // -------------------------------------------------
            // UUID 파일명 및 S3 경로 설정
            // -------------------------------------------------
            String filename = UUID.randomUUID() + extension;
            String objectName = "products/" + productId + "/" + filename;

            // -------------------------------------------------
            // S3 메타데이터 설정 및 업로드
            // -------------------------------------------------
            ObjectMetadata metadata = new ObjectMetadata();
            metadata.setContentType(file.getContentType());
            metadata.setContentLength(file.getSize());

            // 퍼블릭 읽기 권한(CannedAccessControlList.PublicRead) 부여
            amazonS3.putObject(new PutObjectRequest(bucket, objectName, file.getInputStream(), metadata));
                    

            // 업로드된 파일의 S3 URL 반환
            return amazonS3.getUrl(bucket, objectName).toString();

        } catch (IOException e) {
            throw new RuntimeException("상품 이미지(S3) 저장에 실패했습니다.", e);
        }
    }


    /**
     * 실제 상품 이미지 파일 삭제 (S3)
     */
    private void deleteProductImageFile(
            String imageUrl
    ) {

        if (imageUrl == null || imageUrl.isBlank()) {
            return;
        }

        try {
            // S3 URL에서 객체 키(objectName)만 추출
            // 예: https://your-bucket.s3.ap-northeast-2.amazonaws.com/products/1/uuid.jpg
            // -> products/1/uuid.jpg
            String splitStr = ".com/";
            if (imageUrl.contains(splitStr)) {
                String objectName = imageUrl.substring(imageUrl.indexOf(splitStr) + splitStr.length());
                amazonS3.deleteObject(new DeleteObjectRequest(bucket, objectName));
            }

        } catch (Exception e) {
            throw new RuntimeException("상품 이미지(S3) 삭제에 실패했습니다.", e);
        }
    }
}