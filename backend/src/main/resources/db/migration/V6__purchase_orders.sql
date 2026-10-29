-- Purchase facts for admin analytics. Distinct from payment_histories (gateway
-- receipts without line items) and from the unused V5 mock_purchase_* tables.
-- LIVE rows would come from a future order commit. DEMO rows are explicit seeds.

CREATE TABLE purchase_orders (
    order_key VARCHAR(64) NOT NULL,
    purchased_at DATETIME(6) NOT NULL,
    age_at_purchase INT NULL,
    age_band VARCHAR(16) NOT NULL,
    record_source VARCHAR(16) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (order_key),
    KEY idx_purchase_orders_at_source (purchased_at, record_source),
    KEY idx_purchase_orders_source (record_source)
);

CREATE TABLE purchase_lines (
    id BIGINT NOT NULL AUTO_INCREMENT,
    order_key VARCHAR(64) NOT NULL,
    product_id INT NULL,
    product_name VARCHAR(120) NOT NULL,
    category_name VARCHAR(64) NULL,
    unit_price INT NOT NULL,
    quantity INT NOT NULL,
    line_discount INT NOT NULL,
    line_amount INT NOT NULL,
    line_status VARCHAR(16) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_purchase_lines_order (order_key),
    KEY idx_purchase_lines_product (product_name),
    KEY idx_purchase_lines_category (category_name),
    CONSTRAINT fk_purchase_lines_order
        FOREIGN KEY (order_key) REFERENCES purchase_orders (order_key)
);
