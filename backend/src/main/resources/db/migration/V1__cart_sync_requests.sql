-- V1. Apply this file to the production database before starting a backend
-- image that maps CartSyncRequest. spring.jpa.hibernate.ddl-auto stays validate.
--
-- Order: this is the first versioned migration. Apply V1 only once.
-- Existing rows in users, carts, cart_items, products, and payment_histories
-- are not read or updated.
--
-- Recovery before the new image is kept: DROP TABLE cart_sync_requests;
-- If the new image is already running, roll it back to the previous image
-- after dropping the table. Do not drop carts or cart_items.

CREATE TABLE cart_sync_requests (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_email VARCHAR(100) NOT NULL,
    operation VARCHAR(32) NOT NULL,
    request_key VARCHAR(80) NOT NULL,
    request_hash VARCHAR(64) NOT NULL,
    created_at DATETIME NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_cart_sync_user_op_key UNIQUE (user_email, operation, request_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
