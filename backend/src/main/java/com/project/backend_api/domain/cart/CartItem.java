package com.project.backend_api.domain.cart;

import com.project.backend_api.domain.product.Product;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "cart_items")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class CartItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cart_id", nullable = false)
    private Cart cart;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    // 담은 수량
    @Column(nullable = false)
    private int quantity;

    // 수량 변경 편의 메서드
    public void updateQuantity(int quantity) {
        this.quantity = quantity;
    }
    
    // 같은 상품을 또 담았을 때 수량 누적
    public void addQuantity(int quantity) {
        this.quantity += quantity;
    }
}