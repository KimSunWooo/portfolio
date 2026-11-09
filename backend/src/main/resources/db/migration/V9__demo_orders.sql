-- Demo cart confirm orders (separate from Toss 100원 payment_histories).
-- User-created rows use seed_batch_id IS NULL so seed cleanup can stay scoped.

CREATE TABLE demo_order_requests (
    id BIGINT NOT NULL AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    request_key VARCHAR(80) NOT NULL,
    request_hash VARCHAR(64) NOT NULL,
    order_key VARCHAR(64) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT uk_demo_order_user_key UNIQUE (user_id, request_key),
    CONSTRAINT fk_demo_order_requests_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_demo_order_requests_order
        FOREIGN KEY (order_key) REFERENCES purchase_orders (order_key)
);

ALTER TABLE purchase_lines
    ADD COLUMN color_id INT NULL AFTER product_id,
    ADD COLUMN stock_restored TINYINT(1) NOT NULL DEFAULT 0 AFTER line_status;
