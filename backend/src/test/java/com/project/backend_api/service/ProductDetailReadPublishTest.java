package com.project.backend_api.service;

import com.project.backend_api.analytics.ProductDetailReadPublisher;
import com.project.backend_api.domain.product.Product;
import com.project.backend_api.dto.product.ProductRequest;
import com.project.backend_api.repository.ProductColorRepository;
import com.project.backend_api.repository.ProductDetailRepository;
import com.project.backend_api.repository.ProductImageRepository;
import com.project.backend_api.repository.ProductRepository;
import com.project.backend_api.service.ProductListCache;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.web.server.ResponseStatusException;

import java.lang.reflect.Field;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ProductDetailReadPublishTest {

    @Test
    void missingAndFailedReadsDoNotPublish() throws Exception {
        ProductRepository products = mock(ProductRepository.class);
        ProductDetailReadPublisher publisher = mock(ProductDetailReadPublisher.class);
        ProductService service = service(products, publisher);
        when(products.findById(9)).thenReturn(Optional.empty());
        when(products.findById(8)).thenThrow(new RuntimeException("database"));

        assertThrows(ResponseStatusException.class, () -> service.getProduct(9));
        assertThrows(RuntimeException.class, () -> service.getProduct(8));
        verify(publisher, never()).publish(org.mockito.ArgumentMatchers.anyInt());
    }

    @Test
    void successfulReadPublishesTheProductId() throws Exception {
        ProductRepository products = mock(ProductRepository.class);
        ProductDetailReadPublisher publisher = mock(ProductDetailReadPublisher.class);
        ProductService service = service(products, publisher);
        Product product = Product.create(new ProductRequest(
                "Shade", null, "desc", "립", 12000, null, null, false, false, 1, "SALE", null));
        Field id = Product.class.getDeclaredField("id");
        id.setAccessible(true);
        id.set(product, 7);
        when(products.findById(7)).thenReturn(Optional.of(product));

        service.getProduct(7);
        verify(publisher).publish(7);
    }

    private static ProductService service(ProductRepository products, ProductDetailReadPublisher publisher) {
        ProductDetailRepository details = mock(ProductDetailRepository.class);
        ProductImageRepository images = mock(ProductImageRepository.class);
        ProductColorRepository colors = mock(ProductColorRepository.class);
        when(details.findByProductId(org.mockito.ArgumentMatchers.any())).thenReturn(Optional.empty());
        when(images.findByProductIdOrderBySortOrderAscIdAsc(org.mockito.ArgumentMatchers.any())).thenReturn(List.of());
        when(colors.findByProductIdOrderBySortOrderAscIdAsc(org.mockito.ArgumentMatchers.any())).thenReturn(List.of());
        @SuppressWarnings("unchecked")
        ObjectProvider<ProductDetailReadPublisher> provider = mock(ObjectProvider.class);
        when(provider.getIfAvailable()).thenReturn(publisher);
        return new ProductService(
                products,
                details,
                images,
                colors,
                mock(com.amazonaws.services.s3.AmazonS3.class),
                mock(ProductListCache.class),
                mock(AfterCommit.class),
                provider);
    }
}
