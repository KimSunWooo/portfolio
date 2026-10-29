package com.project.backend_api.observability;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ProductListObservationTest {

    @Test
    void listSelectMatchesHibernateTextAndIgnoresDetailAndTransactionStatements() {
        String list = "SELECT `p1_0` . `id` , `p1_0` . `status` FROM `products` `p1_0` "
                + "WHERE `p1_0` . `status` = ? ORDER BY `p1_0` . `id`";
        String detail = "SELECT `p1_0` . `id` FROM `products` `p1_0` WHERE `p1_0` . `id` = ?";
        assertTrue(ProductListObservation.isProductListSelect(list));
        assertFalse(ProductListObservation.isProductListSelect(detail));
        assertFalse(ProductListObservation.isProductListSelect("SET SESSION TRANSACTION READ ONLY"));
        assertFalse(ProductListObservation.isProductListSelect("COMMIT"));
    }

    @Test
    void countersStaySeparate() {
        ProductListObservation observation = new ProductListObservation();
        observation.recordHttpListRequest();
        observation.recordHttpListRequest();
        observation.recordServiceEntry();
        observation.recordSql("SELECT id FROM `products` p WHERE p.status = ? ORDER BY p.id");
        observation.recordSql("SELECT id FROM `products` p WHERE p.id=?");

        ProductListObservationSnapshot snapshot = observation.snapshot();
        assertEquals(2, snapshot.httpListRequests());
        assertEquals(1, snapshot.serviceEntries());
        assertEquals(1, snapshot.productListSelects());
    }
}
