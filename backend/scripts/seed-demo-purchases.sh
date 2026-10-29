#!/usr/bin/env bash
# Insert DEMO purchase rows into the isolated verify MySQL only.
# Re-runs skip existing demo-purchase-* keys. Does not touch LIVE rows.
# This is NOT payment-pipeline ingestion: LIVE checkout does not write purchase_* yet.
# Seed catalog: 12 DEMO purchase_orders across months. 2026-10 PAID = 2 orders / 6 qty / 72500.
set -euo pipefail

CONTAINER="${PORTFOLIO_VERIFY_MYSQL_CONTAINER:-portfolio-verify-mysql}"
DB="${PORTFOLIO_VERIFY_DB:-portfolio_verify}"
USER="${PORTFOLIO_VERIFY_MYSQL_USER:-root}"
# Password comes from the verify compose file; never print it.
export MYSQL_PWD="${PORTFOLIO_VERIFY_MYSQL_PASSWORD:-verify-db}"

if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  echo "verify mysql container is not running: $CONTAINER" >&2
  exit 1
fi

host_port="$(docker port "$CONTAINER" 3306/tcp | head -1)"
echo "target container=$CONTAINER mapped=$host_port database=$DB"

before_orders="$(docker exec -e MYSQL_PWD "$CONTAINER" mysql -u"$USER" -N -e \
  "SELECT COUNT(*) FROM purchase_orders WHERE record_source='DEMO';" "$DB")"
before_lines="$(docker exec -e MYSQL_PWD "$CONTAINER" mysql -u"$USER" -N -e \
  "SELECT COUNT(*) FROM purchase_lines l JOIN purchase_orders o ON o.order_key=l.order_key WHERE o.record_source='DEMO';" "$DB")"
echo "before demo orders=$before_orders lines=$before_lines"

docker exec -i -e MYSQL_PWD "$CONTAINER" mysql -u"$USER" "$DB" < "$(dirname "$0")/seed-demo-purchases.sql"

after_orders="$(docker exec -e MYSQL_PWD "$CONTAINER" mysql -u"$USER" -N -e \
  "SELECT COUNT(*) FROM purchase_orders WHERE record_source='DEMO';" "$DB")"
after_lines="$(docker exec -e MYSQL_PWD "$CONTAINER" mysql -u"$USER" -N -e \
  "SELECT COUNT(*) FROM purchase_lines l JOIN purchase_orders o ON o.order_key=l.order_key WHERE o.record_source='DEMO';" "$DB")"
echo "after demo orders=$after_orders lines=$after_lines"

october="$(docker exec -e MYSQL_PWD "$CONTAINER" mysql -u"$USER" -N -e "
SELECT COUNT(DISTINCT o.order_key), IFNULL(SUM(CASE WHEN l.line_status='PAID' THEN l.quantity ELSE 0 END),0),
       IFNULL(SUM(CASE WHEN l.line_status='PAID' THEN l.line_amount ELSE 0 END),0)
FROM purchase_orders o
JOIN purchase_lines l ON l.order_key = o.order_key
WHERE o.record_source='DEMO'
  AND o.purchased_at >= '2026-10-01 00:00:00'
  AND o.purchased_at <  '2026-11-01 00:00:00';
" "$DB")"
echo "october-2026 demo distinct_orders/quantity/sales=$october"
unset MYSQL_PWD
