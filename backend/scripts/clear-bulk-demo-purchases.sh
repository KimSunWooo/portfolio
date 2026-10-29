#!/usr/bin/env bash
# Removes one DEMO seed batch only: record_source=DEMO AND seed_batch_id=...
set -euo pipefail

BATCH_ID="${1:-}"
if [[ -z "$BATCH_ID" ]]; then
  echo "usage: $0 <batch-id>" >&2
  exit 1
fi

CLEAR=1 BATCH_ID="$BATCH_ID" "$(dirname "$0")/seed-bulk-demo-purchases.sh"
