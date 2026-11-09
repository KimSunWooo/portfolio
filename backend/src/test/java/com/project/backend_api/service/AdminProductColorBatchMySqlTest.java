package com.project.backend_api.service;

import com.project.backend_api.domain.product.Product;
import com.project.backend_api.domain.product.ProductColor;
import com.project.backend_api.dto.product.ProductRequest;
import com.project.backend_api.repository.ProductColorRepository;
import com.project.backend_api.repository.ProductRepository;
import com.project.backend_api.support.SimpleCacheTestConfiguration;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.mysql.MySQLContainer;

import jakarta.persistence.EntityManagerFactory;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@DataJpaTest
@Import(SimpleCacheTestConfiguration.class)
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Transactional(propagation = Propagation.NOT_SUPPORTED)
@Testcontainers
@TestPropertySource(properties = {
        "spring.profiles.active=test",
        "spring.jpa.hibernate.ddl-auto=create",
        "spring.jpa.open-in-view=false",
        "spring.jpa.properties.hibernate.generate_statistics=true",
        "jwt.secret=test-secret-test-secret-test-secret-test",
        "toss.secret-key=test",
        "cloud.aws.credentials.access-key=test",
        "cloud.aws.credentials.secret-key=test",
        "cloud.aws.s3.bucket=test",
        "spring.mail.password=test"
})
class AdminProductColorBatchMySqlTest {

    @Container
    static final MySQLContainer MYSQL = new MySQLContainer("mysql:8.4");

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", MYSQL::getJdbcUrl);
        registry.add("spring.datasource.username", MYSQL::getUsername);
        registry.add("spring.datasource.password", MYSQL::getPassword);
    }

    @Autowired
    ProductRepository productRepository;
    @Autowired
    ProductColorRepository productColorRepository;
    @Autowired
    EntityManagerFactory entityManagerFactory;

    @BeforeEach
    void seed() {
        productColorRepository.deleteAll();
        productRepository.deleteAll();
        for (int index = 1; index <= 12; index++) {
            Product saved = productRepository.save(Product.create(new ProductRequest(
                    "Batch Shade " + index, null, "batch", "LIP",
                    1000 * index, null, null, true, false, 10, "SALE", null)));
            productColorRepository.save(ProductColor.create(saved.getId(), "C" + index + "A", 0));
            productColorRepository.save(ProductColor.create(saved.getId(), "C" + index + "B", 1));
        }
    }

    @Test
    void pageSizedColorLookupDoesNotGrowWithProductCount() {
        Statistics statistics = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
        statistics.clear();

        int pageSize = 5;
        Page<Product> firstPage = productRepository.findAllByOrderByIdDesc(PageRequest.of(0, pageSize));
        assertEquals(12, firstPage.getTotalElements());
        assertEquals(pageSize, firstPage.getContent().size());

        List<Integer> ids = firstPage.getContent().stream().map(Product::getId).toList();
        long beforeColors = statistics.getPrepareStatementCount();
        List<ProductColor> colors = productColorRepository.findByProductIdInOrderBySortOrderAscIdAsc(ids);
        long colorStatements = statistics.getPrepareStatementCount() - beforeColors;

        assertEquals(1, colorStatements);
        assertEquals(pageSize * 2, colors.size());

        Map<Integer, List<String>> byProduct = new LinkedHashMap<>();
        for (Integer id : ids) {
            byProduct.put(id, new ArrayList<>());
        }
        for (ProductColor color : colors) {
            byProduct.get(color.getProductId()).add(color.getColorCode());
        }
        assertTrue(byProduct.values().stream().allMatch(list -> list.size() == 2));

        statistics.clear();
        long beforeNPlusOne = statistics.getPrepareStatementCount();
        for (Integer id : ids) {
            productColorRepository.findByProductIdOrderBySortOrderAscIdAsc(id);
        }
        long nPlusOneStatements = statistics.getPrepareStatementCount() - beforeNPlusOne;
        assertEquals(pageSize, nPlusOneStatements);
        assertTrue(nPlusOneStatements > colorStatements);
    }
}
