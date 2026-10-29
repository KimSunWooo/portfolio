#!/usr/bin/env bash
# Insert a DEMO purchase batch into the DB that the local verify dashboard uses.
# Default target: portfolio-verify-mysql / portfolio_verify (FE -> localhost:8080 verify profile).
# Does not auto-run on application start. Does not touch LIVE rows or other DEMO batches.
set -euo pipefail

CONTAINER="${PORTFOLIO_VERIFY_MYSQL_CONTAINER:-portfolio-verify-mysql}"
DB="${PORTFOLIO_VERIFY_DB:-portfolio_verify}"
USER="${PORTFOLIO_VERIFY_MYSQL_USER:-root}"
export MYSQL_PWD="${PORTFOLIO_VERIFY_MYSQL_PASSWORD:-verify-db}"

COUNT="${COUNT:-300}"
RANDOM_SEED="${RANDOM_SEED:-20261029}"
AS_OF="${AS_OF:-$(TZ=Asia/Seoul date +%F)}"
BATCH_ID="${BATCH_ID:-bulk-${AS_OF//-/}}"
DRY_RUN="${DRY_RUN:-0}"
CLEAR="${CLEAR:-0}"

if ! docker ps --format '{{.Names}}' | grep -qx "$CONTAINER"; then
  echo "verify mysql container is not running: $CONTAINER" >&2
  exit 1
fi

host_port="$(docker port "$CONTAINER" 3306/tcp | head -1)"
echo "target container=$CONTAINER mapped=$host_port database=$DB batch_id=$BATCH_ID"

before_orders="$(docker exec -e MYSQL_PWD "$CONTAINER" mysql -u"$USER" -N -e \
  "SELECT COUNT(*) FROM purchase_orders WHERE record_source='DEMO' AND seed_batch_id='${BATCH_ID}';" "$DB" 2>/dev/null || echo 0)"
echo "before_batch_orders=$before_orders"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ARGS=(--count="$COUNT" --random-seed="$RANDOM_SEED" --as-of="$AS_OF" --batch-id="$BATCH_ID")
if [[ "$DRY_RUN" == "1" ]]; then
  ARGS+=(--dry-run)
fi
if [[ "$CLEAR" == "1" ]]; then
  ARGS=(--batch-id="$BATCH_ID" --clear)
fi

SEED_ARGS="${ARGS[*]}"
(
  cd "$ROOT"
  BULK_DEMO_JDBC_URL="jdbc:mysql://127.0.0.1:${host_port##*:}/$DB?serverTimezone=Asia/Seoul&characterEncoding=UTF-8" \
  BULK_DEMO_JDBC_USER="$USER" \
  BULK_DEMO_JDBC_PASSWORD="$MYSQL_PWD" \
  ./gradlew -q seedBulkDemoPurchases -PseedArgs="$SEED_ARGS"
)

after_orders="$(docker exec -e MYSQL_PWD "$CONTAINER" mysql -u"$USER" -N -e \
  "SELECT COUNT(*) FROM purchase_orders WHERE record_source='DEMO' AND seed_batch_id='${BATCH_ID}';" "$DB")"
after_lines="$(docker exec -e MYSQL_PWD "$CONTAINER" mysql -u"$USER" -N -e \
  "SELECT COUNT(*) FROM purchase_lines l JOIN purchase_orders o ON o.order_key=l.order_key WHERE o.record_source='DEMO' AND o.seed_batch_id='${BATCH_ID}';" "$DB")"
echo "after_batch_orders=$after_orders lines=$after_lines"

docker exec -e MYSQL_PWD "$CONTAINER" mysql -u"$USER" -N -e "
SELECT 'last30', COUNT(DISTINCT o.order_key), IFNULL(SUM(l.quantity),0), IFNULL(SUM(l.line_amount),0)
FROM purchase_orders o JOIN purchase_lines l ON l.order_key=o.order_key
WHERE o.record_source='DEMO' AND o.seed_batch_id='${BATCH_ID}' AND l.line_status='PAID'
  AND o.purchased_at >= DATE_SUB(CONVERT_TZ(UTC_TIMESTAMP(),'+00:00','+09:00'), INTERVAL 29 DAY);
SELECT 'age', o.age_band, COUNT(*) FROM purchase_orders o
WHERE o.record_source='DEMO' AND o.seed_batch_id='${BATCH_ID}' GROUP BY o.age_band ORDER BY o.age_band;
SELECT 'category', IFNULL(NULLIF(TRIM(l.category_name),''),'미분류') AS category_name, COUNT(*) AS cnt
FROM purchase_lines l JOIN purchase_orders o ON o.order_key=l.order_key
WHERE o.record_source='DEMO' AND o.seed_batch_id='${BATCH_ID}'
GROUP BY IFNULL(NULLIF(TRIM(l.category_name),''),'미분류')
ORDER BY cnt DESC;
" "$DB"

unset MYSQL_PWD
