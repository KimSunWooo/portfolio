#!/usr/bin/env bash
# Removes only DEMO / demo-purchase-* rows. Never truncates purchase tables.
set -euo pipefail

CONTAINER="${PORTFOLIO_VERIFY_MYSQL_CONTAINER:-portfolio-verify-mysql}"
DB="${PORTFOLIO_VERIFY_DB:-portfolio_verify}"
USER="${PORTFOLIO_VERIFY_MYSQL_USER:-root}"
export MYSQL_PWD="${PORTFOLIO_VERIFY_MYSQL_PASSWORD:-verify-db}"

if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  echo "verify mysql container is not running: $CONTAINER" >&2
  exit 1
fi

docker exec -e MYSQL_PWD "$CONTAINER" mysql -u"$USER" "$DB" -e "
DELETE l FROM purchase_lines l
JOIN purchase_orders o ON o.order_key = l.order_key
WHERE o.record_source = 'DEMO' OR o.order_key LIKE 'demo-purchase-%';
DELETE FROM purchase_orders
WHERE record_source = 'DEMO' OR order_key LIKE 'demo-purchase-%';
SELECT 'remaining_demo_orders', COUNT(*) FROM purchase_orders WHERE record_source='DEMO';
"
unset MYSQL_PWD
