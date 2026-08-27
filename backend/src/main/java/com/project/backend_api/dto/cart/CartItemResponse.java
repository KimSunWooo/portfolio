package com.project.backend_api.dto.cart;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class CartItemResponse {
    private Long cartItemId;
    private Integer productId;
    private String productName;
    private int price;
    private String thumbnailUrl;
    private int quantity;
}