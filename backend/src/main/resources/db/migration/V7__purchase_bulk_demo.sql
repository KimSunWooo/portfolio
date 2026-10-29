-- Bulk DEMO purchase support: member link, batch id, longer product names,
-- synthetic age profiles. Existing purchase rows remain valid with NULL user_id.

ALTER TABLE purchase_orders
    ADD COLUMN user_id BIGINT NULL AFTER order_key,
    ADD COLUMN seed_batch_id VARCHAR(64) NULL AFTER record_source,
    ADD KEY idx_purchase_orders_user (user_id),
    ADD KEY idx_purchase_orders_batch (seed_batch_id),
    ADD CONSTRAINT fk_purchase_orders_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL;

ALTER TABLE purchase_lines
    MODIFY COLUMN product_name VARCHAR(150) NOT NULL,
    ADD UNIQUE KEY uk_purchase_lines_order_product (order_key, product_id);

CREATE TABLE purchase_demo_member_profiles (
    user_id BIGINT NOT NULL,
    synthetic_birth_date DATE NULL,
    age_band_hint VARCHAR(16) NOT NULL,
    source VARCHAR(32) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (user_id),
    CONSTRAINT fk_purchase_demo_member_profiles_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE purchase_seed_batches (
    batch_id VARCHAR(64) NOT NULL,
    order_count INT NOT NULL,
    random_seed BIGINT NOT NULL,
    as_of_date DATE NOT NULL,
    params_hash VARCHAR(64) NOT NULL,
    created_at DATETIME(6) NOT NULL,
    PRIMARY KEY (batch_id)
);
