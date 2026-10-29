-- Password-change notification outbox, product-detail read dedup, and mock purchase facts.
-- These tables are unused while the matching features stay off.
-- Rows are not purged automatically. Dedup history must outlive broker retention
-- if a replay should not send another mail or increment a count.

CREATE TABLE password_change_outbox (
    id BIGINT NOT NULL AUTO_INCREMENT,
    event_id CHAR(36) NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    schema_version INT NOT NULL,
    recipient_email VARCHAR(255) NOT NULL,
    changed_at DATETIME(6) NOT NULL,
    status VARCHAR(32) NOT NULL,
    publish_attempts INT NOT NULL DEFAULT 0,
    published_at DATETIME(6) NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_password_change_outbox_event (event_id),
    KEY idx_password_change_outbox_status (status, id)
);

CREATE TABLE password_change_mail_delivery (
    event_id CHAR(36) NOT NULL,
    status VARCHAR(32) NOT NULL,
    attempt_count INT NOT NULL,
    processed_at DATETIME(6) NOT NULL,
    PRIMARY KEY (event_id)
);

CREATE TABLE product_detail_read_events (
    event_id CHAR(36) NOT NULL,
    product_id INT NOT NULL,
    occurred_at DATETIME(6) NOT NULL,
    processed_at DATETIME(6) NOT NULL,
    PRIMARY KEY (event_id),
    KEY idx_product_detail_read_events_product (product_id)
);

CREATE TABLE product_detail_read_counts (
    product_id INT NOT NULL,
    success_count BIGINT NOT NULL,
    PRIMARY KEY (product_id)
);

CREATE TABLE mock_purchase_orders (
    order_key VARCHAR(64) NOT NULL,
    purchased_at DATETIME(6) NOT NULL,
    age_at_purchase INT NULL,
    PRIMARY KEY (order_key),
    KEY idx_mock_purchase_orders_at (purchased_at)
);

CREATE TABLE mock_purchase_lines (
    id BIGINT NOT NULL AUTO_INCREMENT,
    order_key VARCHAR(64) NOT NULL,
    product_key VARCHAR(64) NOT NULL,
    product_name VARCHAR(120) NOT NULL,
    category_name VARCHAR(64) NULL,
    unit_price INT NOT NULL,
    quantity INT NOT NULL,
    line_discount INT NOT NULL,
    line_status VARCHAR(16) NOT NULL,
    PRIMARY KEY (id),
    KEY idx_mock_purchase_lines_order (order_key),
    CONSTRAINT fk_mock_purchase_lines_order
        FOREIGN KEY (order_key) REFERENCES mock_purchase_orders (order_key)
);
