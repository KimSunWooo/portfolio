#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HTML="$ROOT/portfolio_source/index.html"
OUT="$ROOT/KimSunWoo_WebDeveloper_Portfolio_2026.pdf"
PROFILE="${TMPDIR:-/tmp}/portfolio-pdf-chrome-profile"
mkdir -p "$PROFILE"
google-chrome --headless --disable-gpu --no-pdf-header-footer \
  --user-data-dir="$PROFILE" \
  --print-to-pdf="$OUT" \
  "file://$HTML"
echo "wrote $OUT"
