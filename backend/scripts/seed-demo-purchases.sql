-- DEMO purchase facts for verify analytics. Idempotent on order_key / line identity.
START TRANSACTION;

INSERT IGNORE INTO purchase_orders (order_key, purchased_at, age_at_purchase, age_band, record_source, created_at) VALUES
('demo-purchase-20250930-1', '2025-09-30 23:30:00', 25, '20대', 'DEMO', NOW(6)),
('demo-purchase-20251001-1', '2025-10-01 00:00:00', 25, '20대', 'DEMO', NOW(6)),
('demo-purchase-20251015-1', '2025-10-15 12:00:00', NULL, '미상', 'DEMO', NOW(6)),
('demo-purchase-20251020-1', '2025-10-20 10:00:00', 17, '10대 이하', 'DEMO', NOW(6)),
('demo-purchase-20251021-1', '2025-10-21 10:00:00', 33, '30대', 'DEMO', NOW(6)),
('demo-purchase-20251031-1', '2025-10-31 23:59:00', 52, '50대 이상', 'DEMO', NOW(6)),
('demo-purchase-20251101-1', '2025-11-01 00:00:00', 25, '20대', 'DEMO', NOW(6)),
('demo-purchase-20260115-1', '2026-01-15 11:00:00', 22, '20대', 'DEMO', NOW(6)),
('demo-purchase-20260201-1', '2026-02-01 00:00:00', NULL, '미상', 'DEMO', NOW(6)),
('demo-purchase-20260331-1', '2026-03-31 23:00:00', 61, '50대 이상', 'DEMO', NOW(6)),
('demo-purchase-20261001-1', '2026-10-01 10:00:00', 28, '20대', 'DEMO', NOW(6)),
('demo-purchase-20261015-1', '2026-10-15 15:00:00', 41, '40대', 'DEMO', NOW(6));

INSERT INTO purchase_lines (order_key, product_id, product_name, category_name, unit_price, quantity, line_discount, line_amount, line_status)
SELECT v.order_key, v.product_id, v.product_name, v.category_name, v.unit_price, v.quantity, v.line_discount, v.line_amount, v.line_status
FROM (
  SELECT 'demo-purchase-20250930-1' AS order_key, 1 AS product_id, 'Verify Shade' AS product_name, 'LIP' AS category_name, 12000 AS unit_price, 1 AS quantity, 0 AS line_discount, 12000 AS line_amount, 'PAID' AS line_status
  UNION ALL SELECT 'demo-purchase-20251001-1', 1, 'Verify Shade', 'LIP', 10000, 2, 1000, 19000, 'PAID'
  UNION ALL SELECT 'demo-purchase-20251001-1', NULL, 'Demo Lip B', '립', 8000, 1, 0, 8000, 'PAID'
  UNION ALL SELECT 'demo-purchase-20251015-1', 1, 'Verify Shade', 'LIP', 15000, 1, 0, 15000, 'PAID'
  UNION ALL SELECT 'demo-purchase-20251020-1', NULL, 'Demo Mystery', NULL, 3000, 1, 0, 3000, 'PAID'
  UNION ALL SELECT 'demo-purchase-20251021-1', NULL, 'Demo Lip B', '립', 8000, 1, 0, 8000, 'REFUNDED'
  UNION ALL SELECT 'demo-purchase-20251031-1', NULL, 'Demo Skin C', '스킨케어', 20000, 1, 0, 20000, 'PAID'
  UNION ALL SELECT 'demo-purchase-20251031-1', NULL, 'Demo Eye D', '아이', 5000, 1, 0, 5000, 'CANCELLED'
  UNION ALL SELECT 'demo-purchase-20251101-1', NULL, 'Demo Lip B', '립', 8000, 9, 0, 72000, 'PAID'
  UNION ALL SELECT 'demo-purchase-20260115-1', 1, 'Verify Shade', 'LIP', 11000, 1, 0, 11000, 'PAID'
  UNION ALL SELECT 'demo-purchase-20260115-1', NULL, 'Demo Lip B', '립', 9000, 2, 0, 18000, 'PAID'
  UNION ALL SELECT 'demo-purchase-20260201-1', NULL, 'Demo Skin C', '스킨케어', 18000, 1, 0, 18000, 'PAID'
  UNION ALL SELECT 'demo-purchase-20260331-1', NULL, 'Demo Eye D', '아이', 7000, 1, 0, 7000, 'PAID'
  UNION ALL SELECT 'demo-purchase-20261001-1', 1, 'Verify Shade', 'LIP', 12000, 3, 0, 36000, 'PAID'
  UNION ALL SELECT 'demo-purchase-20261015-1', NULL, 'Demo Fact A', '팩트', 14000, 2, 0, 28000, 'PAID'
  UNION ALL SELECT 'demo-purchase-20261015-1', NULL, 'Demo Lip B', '립', 8500, 1, 0, 8500, 'PAID'
) AS v
WHERE NOT EXISTS (
  SELECT 1 FROM purchase_lines existing
  WHERE existing.order_key = v.order_key
    AND existing.product_name = v.product_name
    AND existing.line_status = v.line_status
    AND existing.quantity = v.quantity
);

COMMIT;
