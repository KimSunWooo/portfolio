#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HTML="$ROOT/portfolio_source/index.html"
OUT="$ROOT/KimSunWoo_WebDeveloper_Portfolio_2026.pdf"
google-chrome --headless --disable-gpu --no-pdf-header-footer \
  --print-to-pdf="$OUT" \
  "file://$HTML"
echo "wrote $OUT"
