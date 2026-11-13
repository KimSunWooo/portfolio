#!/usr/bin/env bash
# Fails the PR when a required backend test class did not run, ran zero tests, or was skipped.
# `gradlew test` already fails on a red test. It stays green if a class is deleted, renamed,
# or disabled, so this reads the JUnit XML and pins the core suites by name.
#
# Usage: check-required-backend-tests.sh [results-dir]
# Add a class name below when a new suite becomes part of the PR contract.
set -Eeuo pipefail

RESULTS="${1:-backend/build/test-results/test}"
PREFIX="com.project.backend_api"

# Exact classes. Each needs tests > 0 and skipped == 0.
REQUIRED=(
  # DEMO order confirm / cancel / stock, concurrency against MySQL
  "$PREFIX.order.DemoOrderMySqlTest"
  "$PREFIX.order.DemoOrderProductListCacheMySqlTest"
  # product list cache (generation, proxy, eviction)
  "$PREFIX.service.ProductListCacheTest"
  "$PREFIX.service.ProductListCacheProxyTest"
  # purchase analytics: math, access (admin / demo), MySQL aggregates
  "$PREFIX.purchase.PurchaseAnalyticsMathTest"
  "$PREFIX.purchase.PurchaseAnalyticsAccessTest"
  "$PREFIX.purchase.DemoPurchaseAnalyticsAccessTest"
  "$PREFIX.purchase.PurchaseAnalyticsMySqlTest"
  # purchase analytics SQL aggregation: hand counts, snapshot, and equivalence with the legacy Java sums
  "$PREFIX.purchase.PurchaseAnalyticsSqlMySqlTest"
  "$PREFIX.purchase.PurchaseAnalyticsSqlEquivalenceMySqlTest"
  # login / session recovery
  "$PREFIX.security.RefreshSessionRedisTest"
  "$PREFIX.security.SessionLifecycleMySqlTest"
  # structured operation log
  "$PREFIX.observability.OperationLogTest"
  # payment
  "$PREFIX.service.PaymentServiceTest"
)

# Patterns where at least one class must run. Payment recovery and concurrency suites are
# named by pattern so new ones are covered without editing this file.
REQUIRED_PATTERNS=(
  "$PREFIX\\.[a-z.]*Payment[A-Za-z]*(Recovery|Concurren|MySql|Uncertain)[A-Za-z]*Test"
)

failures=0

suite_line() {
  local class="$1" file="$RESULTS/TEST-$1.xml"
  [[ -f "$file" ]] || return 1
  grep -m1 -o '<testsuite [^>]*>' "$file"
}

attr() {
  sed -n "s/.*[ ]$1=\"\([0-9]*\)\".*/\1/p" <<<"$2"
}

check_class() {
  local class="$1" line tests skipped failed
  if ! line="$(suite_line "$class")"; then
    printf 'MISSING  %s (no JUnit result: renamed, deleted, or not run)\n' "$class" >&2
    return 1
  fi
  tests="$(attr tests "$line")"; skipped="$(attr skipped "$line")"
  failed=$(( $(attr failures "$line") + $(attr errors "$line") ))
  if [[ "${tests:-0}" -lt 1 ]]; then
    printf 'EMPTY    %s ran 0 tests\n' "$class" >&2; return 1
  fi
  if [[ "${skipped:-0}" -gt 0 ]]; then
    printf 'SKIPPED  %s skipped %s of %s tests\n' "$class" "$skipped" "$tests" >&2; return 1
  fi
  if [[ "$failed" -gt 0 ]]; then
    printf 'FAILED   %s failures+errors=%s\n' "$class" "$failed" >&2; return 1
  fi
  printf 'ok       %s (%s tests)\n' "$class" "$tests"
}

if [[ ! -d "$RESULTS" ]]; then
  printf 'no test results directory: %s\n' "$RESULTS" >&2
  exit 1
fi

for class in "${REQUIRED[@]}"; do
  check_class "$class" || failures=$((failures + 1))
done

for pattern in "${REQUIRED_PATTERNS[@]}"; do
  matched=0
  for file in "$RESULTS"/TEST-*.xml; do
    [[ -e "$file" ]] || continue
    class="$(basename "$file" .xml)"; class="${class#TEST-}"
    if [[ "$class" =~ $pattern ]]; then
      matched=$((matched + 1))
      check_class "$class" || failures=$((failures + 1))
    fi
  done
  if [[ "$matched" -eq 0 ]]; then
    printf 'MISSING  no test class matches %s\n' "$pattern" >&2
    failures=$((failures + 1))
  fi
done

if [[ "$failures" -gt 0 ]]; then
  printf '%s required backend test check(s) failed\n' "$failures" >&2
  exit 1
fi
printf 'all required backend suites ran\n'
