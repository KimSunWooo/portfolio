package com.project.backend_api.dto.cart;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class CartRequest {
    @NotNull(message = "상품 ID는 필수입니다.")
    private Integer productId;

    @Min(value = 1, message = "수량은 1개 이상이어야 합니다.")
    @Max(value = 99, message = "수량은 99개 이하여야 합니다.")
    private int quantity;

    private Integer colorId;

    public CartRequest(Integer productId, int quantity) {
        this(productId, quantity, null);
    }

    public CartRequest(Integer productId, int quantity, Integer colorId) {
        this.productId = productId;
        this.quantity = quantity;
        this.colorId = colorId;
    }
}