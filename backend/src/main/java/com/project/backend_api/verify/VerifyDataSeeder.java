package com.project.backend_api.verify;

import com.project.backend_api.domain.cart.Cart;
import com.project.backend_api.domain.cart.CartItem;
import com.project.backend_api.domain.product.Product;
import com.project.backend_api.domain.product.ProductColor;
import com.project.backend_api.domain.user.User;
import com.project.backend_api.domain.user.UserRole;
import com.project.backend_api.dto.product.ProductRequest;
import com.project.backend_api.repository.CartItemRepository;
import com.project.backend_api.repository.CartRepository;
import com.project.backend_api.repository.ProductColorRepository;
import com.project.backend_api.repository.ProductRepository;
import com.project.backend_api.repository.UserRepository;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

import javax.sql.DataSource;
import java.nio.file.Files;
import java.sql.Connection;
import java.nio.file.Path;
import java.nio.file.attribute.PosixFilePermission;
import java.security.SecureRandom;
import java.util.EnumSet;
import java.util.Set;

@Configuration
@Profile("verify")
public class VerifyDataSeeder {

    private static final String MEMBER_EMAIL = "verify-member@example.test";
    private static final String ADMIN_EMAIL = "verify-admin@example.test";

    @Bean
    ApplicationRunner seedVerificationData(
            UserRepository users,
            ProductRepository products,
            ProductColorRepository colors,
            CartRepository carts,
            CartItemRepository cartItems,
            PasswordEncoder passwordEncoder,
            DataSource dataSource
    ) {
        return arguments -> {
            try (Connection connection = dataSource.getConnection()) {
                String url = connection.getMetaData().getURL();
                if (url != null && url.contains("rds.amazonaws.com")) {
                    throw new IllegalStateException("verify profile refused a production database host");
                }
            }
            if (users.count() > 0) {
                return;
            }
            String memberPassword = password();
            String adminPassword = password();
            User member = users.save(User.builder()
                    .email(MEMBER_EMAIL)
                    .password(passwordEncoder.encode(memberPassword))
                    .name("검증회원")
                    .role(UserRole.ROLE_USER)
                    .build());
            users.save(User.builder()
                    .email(ADMIN_EMAIL)
                    .password(passwordEncoder.encode(adminPassword))
                    .name("검증관리자")
                    .role(UserRole.ROLE_ADMIN)
                    .build());
            Product product = products.save(Product.create(new ProductRequest(
                    "Verify Shade", null, "isolated verification product", "LIP",
                    12000, null, null, true, false, 20, "SALE", null)));
            colors.save(ProductColor.create(product.getId(), "Coral", 0));
            colors.save(ProductColor.create(product.getId(), "Ink", 1));
            Cart cart = carts.save(Cart.builder().user(member).build());
            cartItems.save(CartItem.builder().cart(cart).product(product).quantity(2).build());
            Path output = Path.of("build", "verify-accounts.properties");
            Files.createDirectories(output.getParent());
            Files.writeString(output, """
                    memberEmail=%s
                    memberPassword=%s
                    adminEmail=%s
                    adminPassword=%s
                    productId=%d
                    """.formatted(MEMBER_EMAIL, memberPassword, ADMIN_EMAIL, adminPassword, product.getId()));
            Set<PosixFilePermission> ownerOnly = EnumSet.of(
                    PosixFilePermission.OWNER_READ, PosixFilePermission.OWNER_WRITE);
            Files.setPosixFilePermissions(output, ownerOnly);
        };
    }

    private static String password() {
        SecureRandom random = new SecureRandom();
        String alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
        StringBuilder value = new StringBuilder("vfy-");
        for (int index = 0; index < 20; index++) {
            value.append(alphabet.charAt(random.nextInt(alphabet.length())));
        }
        return value.toString();
    }
}
