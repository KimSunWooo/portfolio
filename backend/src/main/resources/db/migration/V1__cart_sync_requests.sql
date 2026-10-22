-- V1. Flyway applies this on the production profile before Hibernate validate.
-- It creates cart_sync_requests only. Existing rows are not read or updated.
--
-- Recovery before this migration is kept: stop the new backend, then
-- DROP TABLE cart_sync_requests; and DROP TABLE flyway_schema_history;
-- Do not drop carts or cart_items.

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
