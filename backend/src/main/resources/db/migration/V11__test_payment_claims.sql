-- Cross-instance claim ledger for Toss 100원 test payments.
-- Distinct from DEMO purchase_orders and from analytics purchase facts.
CREATE TABLE IF NOT EXISTS test_payment_claims (
    payment_key VARCHAR(255) NOT NULL,
    order_id VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) NOT NULL,
    state VARCHAR(32) NOT NULL,
    provider_status VARCHAR(64) NULL,
    updated_at DATETIME(6) NOT NULL,
    PRIMARY KEY (payment_key),
    KEY idx_test_payment_claims_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
