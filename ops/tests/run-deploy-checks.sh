#!/usr/bin/env bash
# Isolated checks for deploy.sh and the Nginx API alignment tool.
# Docker, nginx, and curl are fakes. Nothing here contacts the live service.
set -Eeuo pipefail
export PYTHONDONTWRITEBYTECODE=1

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
export PATH="$ROOT/ops/tests/fake-bin:$PATH"
export NGINX_BIN="$ROOT/ops/tests/fake-bin/nginx"
# Mock checks must not follow an operator's NETWORK or FAIL_STAGE.
export NETWORK=portfolio_default
unset FAIL_STAGE
BACKEND_IMAGE="example/portfolio-backend:abc123"
FRONTEND_IMAGE="example/portfolio-frontend:abc123"
FAILURES=0
FAILED_NAMES=""

ok() { printf 'ok  %s\n' "$1"; }
bad() {
  printf 'FAIL %s\n' "$1" >&2
  FAILED_NAMES="${FAILED_NAMES} ${1}"
  FAILURES=$((FAILURES + 1))
}

# The holder process owns fd 9. A fifo releases it, so no sleep child keeps the lock.
start_held_lock() {
  local lockfile="$1"
  HELD_LOCK_READY="$(mktemp)"
  HELD_LOCK_RELEASE="$(mktemp -u)"
  mkfifo "$HELD_LOCK_RELEASE"
  rm -f "$HELD_LOCK_READY"
  (
    exec 9>"$lockfile"
    flock 9
    : >"$HELD_LOCK_READY"
    IFS= read -r _ <"$HELD_LOCK_RELEASE" || true
  ) &
  HELD_LOCK_PID=$!
  local spins=0
  while [[ ! -f "$HELD_LOCK_READY" ]]; do
    if ! kill -0 "$HELD_LOCK_PID" 2>/dev/null; then
      printf 'lock holder exited before ready\n' >&2
      return 1
    fi
    spins=$((spins + 1))
    if [[ "$spins" -gt 100 ]]; then
      printf 'lock holder was not ready\n' >&2
      return 1
    fi
    sleep 0.05
  done
}

stop_held_lock() {
  local pid="${HELD_LOCK_PID:-}"
  if [[ -n "$pid" ]]; then
    if [[ -p "${HELD_LOCK_RELEASE:-}" ]]; then
      printf 'release\n' >"$HELD_LOCK_RELEASE" 2>/dev/null || kill "$pid" 2>/dev/null || true
    else
      kill "$pid" 2>/dev/null || true
    fi
    local spins=0
    while kill -0 "$pid" 2>/dev/null && [[ "$spins" -lt 40 ]]; do
      sleep 0.05
      spins=$((spins + 1))
    done
    if kill -0 "$pid" 2>/dev/null; then
      kill "$pid" 2>/dev/null || true
    fi
    wait "$pid" 2>/dev/null || true
    HELD_LOCK_PID=
  fi
  if [[ -n "${HELD_LOCK_RELEASE:-}" ]]; then
    rm -f "$HELD_LOCK_RELEASE"
    HELD_LOCK_RELEASE=
  fi
  if [[ -n "${HELD_LOCK_READY:-}" ]]; then
    rm -f "$HELD_LOCK_READY"
    HELD_LOCK_READY=
  fi
}

print_case_diagnostic() {
  local name="$1" code="$2" log="$3"
  printf 'diagnostic check=%s exit=%s\n' "$name" "$code" >&2
  python3 - "$log" <<'PY' >&2
import re, sys
secret = re.compile(r"(?i)(password|secret|token|authorization|api[_-]?key)\s*[:=]")
lines = open(sys.argv[1], errors="replace").read().splitlines()
for line in lines[-40:]:
    if secret.search(line):
        print("[redacted diagnostic line]")
    else:
        print(line)
PY
}

run_case() {
  local name="$1" code log
  shift
  log="$(mktemp)"
  set +e
  (
    set -e
    "$@"
  ) >"$log" 2>&1
  code=$?
  set -e
  if [[ "$code" -eq 0 ]]; then
    ok "$name"
  else
    bad "$name"
    print_case_diagnostic "$name" "$code" "$log"
  fi
  rm -f "$log"
}

write_site() {
  local mode="$1" dest="$2"
  python3 - "$mode" "$dest" "$SERVICE_URL_INC" <<'PY'
import sys
mode, dest, include = sys.argv[1:]
api = (
    f"        include {include};\n        proxy_pass $service_url;\n"
    if mode == "aligned"
    else "        proxy_pass http://localhost:8080;\n"
)
open(dest, "w").write(f"""server {{
    listen 443 ssl;
    server_name swportfolioservices.com;
    ssl_certificate /etc/letsencrypt/live/swportfolioservices.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/swportfolioservices.com/privkey.pem;

    location / {{
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }}

    location /api/ {{
{api}        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }}
}}
""")
PY
}

setup() {
  local mode="${1:-aligned}" with_blue="${2:-0}" ssr="${3:-portfolio-backend-green}"
  WORK="$(mktemp -d)"
  export MOCK_STATE="$WORK/mock"
  export PROJECT_DIR="$WORK/project"
  export LOCK_FILE="$PROJECT_DIR/.deploy.lock"
  export SERVICE_URL_INC="$WORK/nginx/conf.d/service-url.inc"
  export BACKUP_DIR="$WORK/backups"
  export PUBLIC_ORIGIN="http://public.test"
  export HEALTH_TIMEOUT=2
  export HEALTH_INTERVAL=0
  export NGINX_SITE="$WORK/nginx/sites-enabled/swportfolioservices.com"
  export NGINX_CONF_FILES="$NGINX_SITE"
  mkdir -p "$PROJECT_DIR" "$WORK/nginx/conf.d" "$WORK/nginx/sites-enabled" "$BACKUP_DIR" "$MOCK_STATE"
  printf 'REDIS_HOST=redis-container\n' >"$PROJECT_DIR/.env"
  printf 'set $service_url http://127.0.0.1:8082;\n' >"$SERVICE_URL_INC"
  write_site "$mode" "$NGINX_SITE"
  python3 - "$MOCK_STATE" "$with_blue" "$ssr" <<'PY'
import json, sys
from pathlib import Path
mock, with_blue, ssr = sys.argv[1:]
frontend = {
    "image": "example/portfolio-frontend:old",
    "status": "running",
    "restart": "always",
    "networks": ["portfolio_default", "extra_net"],
    "env": [
        f"INTERNAL_API_URL=http://{ssr}:8080",
        "NEXT_PUBLIC_API_URL=https://swportfolioservices.com",
    ],
    "ports": {"3000/tcp": "3000"},
    "mounts": ["/var/log/portfolio:/logs:ro"],
}
green = {
    "image": "example/portfolio-backend:old",
    "status": "running",
    "restart": "unless-stopped",
    "networks": ["portfolio_default"],
    "env": ["REDIS_HOST=redis-container"],
    "ports": {"8080/tcp": "8082"},
    "mounts": [],
}
compose = dict(green, ports={"8080/tcp": "8080"})
containers = {
    "portfolio-frontend": frontend,
    "portfolio-backend-green": green,
    "portfolio-backend-api-1": compose,
}
if with_blue == "1":
    containers["portfolio-backend-blue"] = dict(green, ports={"8080/tcp": "8081"})
state = {
    "containers": containers,
    "networks": ["portfolio_default", "extra_net"],
    "pulled": [],
    "nginx_port": "8082",
    "initial_port": "8082",
    "nginx_t_seen": 0,
    "public_api_hits": 0,
}
Path(mock).mkdir(parents=True, exist_ok=True)
(Path(mock) / "state.json").write_text(json.dumps(state))
(Path(mock) / "commands.log").write_text("")
PY
  unset FAIL_STAGE
}

deploy() {
  "$ROOT/deploy.sh" --backend-image "$BACKEND_IMAGE" --frontend-image "$FRONTEND_IMAGE"
}

state_py() {
  python3 - "$@" <<'PY'
import json, os, sys
state = json.loads(open(os.environ["MOCK_STATE"] + "/state.json").read())
expr = sys.argv[1]
def has_name(prefix, status=None):
    for name, container in state["containers"].items():
        if name.startswith(prefix) and (status is None or container.get("status") == status):
            return True
    return False
safe = {"state": state, "Path": __import__("pathlib").Path, "os": os, "has_name": has_name}
try:
    passed = bool(eval(expr, {"__builtins__": {}}, safe))
except Exception as exc:
    print(f"assertion error: {expr}: {exc}", file=sys.stderr)
    raise SystemExit(1) from exc
if not passed:
    print(f"assertion failed: {expr}", file=sys.stderr)
    raise SystemExit(1)
PY
}

assert_no_rm() {
  ! grep -w rm "$MOCK_STATE/commands.log" >/dev/null
}

case_success() {
  setup aligned 0
  deploy >/tmp/deploy-success.out 2>&1
  state_py 'state["containers"]["portfolio-backend-blue"]["status"]=="running"'
  state_py 'state["containers"]["portfolio-backend-blue"]["image"]=="example/portfolio-backend:abc123"'
  state_py 'state["containers"]["portfolio-backend-blue"]["ports"]["8080/tcp"]=="8081"'
  state_py 'state["containers"]["portfolio-backend-blue"]["restart"]=="unless-stopped"'
  state_py '"portfolio_default" in state["containers"]["portfolio-backend-blue"]["networks"]'
  state_py 'state["containers"]["portfolio-backend-green"]["status"]=="exited"'
  state_py 'state["containers"]["portfolio-backend-api-1"]["status"]=="running"'
  state_py 'state["containers"]["portfolio-frontend"]["status"]=="running"'
  state_py '"INTERNAL_API_URL=http://portfolio-backend-blue:8080" in state["containers"]["portfolio-frontend"]["env"]'
  state_py '"NEXT_PUBLIC_API_URL=https://swportfolioservices.com" in state["containers"]["portfolio-frontend"]["env"]'
  state_py 'has_name("portfolio-frontend-previous")'
  state_py '"extra_net" in state["containers"]["portfolio-frontend"]["networks"]'
  state_py '"/var/log/portfolio:/logs:ro" in state["containers"]["portfolio-frontend"]["mounts"]'
  grep -q 'set $service_url http://127.0.0.1:8081;' "$SERVICE_URL_INC"
  state_py 'state["nginx_port"]=="8081"'
  grep -q CLEANUP_LATER /tmp/deploy-success.out
  assert_no_rm
}

case_pull_failure() {
  setup aligned 0
  export FAIL_STAGE=pull
  if deploy >/tmp/deploy-pull.out 2>&1; then return 1; fi
  state_py '"portfolio-backend-blue" not in state["containers"]'
  state_py 'state["containers"]["portfolio-backend-green"]["status"]=="running"'
  state_py 'state["containers"]["portfolio-frontend"]["image"]=="example/portfolio-frontend:old"'
  ! grep -q 'pull example/portfolio-backend:abc123$' "$MOCK_STATE/commands.log" || true
  state_py '"example/portfolio-backend:abc123" not in state["pulled"]'
}

case_backend_health() {
  setup aligned 0
  export FAIL_STAGE=backend_health
  if deploy >/tmp/deploy-backend.out 2>&1; then return 1; fi
  state_py 'state["containers"]["portfolio-backend-green"]["status"]=="running"'
  state_py 'state["containers"]["portfolio-frontend"]["image"]=="example/portfolio-frontend:old"'
  state_py '"portfolio-backend-blue" not in state["containers"]'
  state_py 'has_name("portfolio-backend-blue-failed")'
  grep -q 'set $service_url http://127.0.0.1:8082;' "$SERVICE_URL_INC"
  assert_no_rm
}

case_frontend_run() {
  setup aligned 0
  export FAIL_STAGE=frontend_run
  if deploy >/tmp/deploy-frun.out 2>&1; then return 1; fi
  state_py 'state["containers"]["portfolio-frontend"]["status"]=="running"'
  state_py 'state["containers"]["portfolio-frontend"]["image"]=="example/portfolio-frontend:old"'
  state_py 'state["containers"]["portfolio-backend-green"]["status"]=="running"'
  state_py '"portfolio-backend-blue" not in state["containers"]'
  grep -q 'set $service_url http://127.0.0.1:8082;' "$SERVICE_URL_INC"
  assert_no_rm
}

case_frontend_health() {
  setup aligned 0
  export FAIL_STAGE=frontend_health
  if deploy >/tmp/deploy-fhealth.out 2>&1; then return 1; fi
  state_py 'state["containers"]["portfolio-frontend"]["image"]=="example/portfolio-frontend:old"'
  state_py 'state["containers"]["portfolio-frontend"]["status"]=="running"'
  state_py 'state["containers"]["portfolio-backend-green"]["status"]=="running"'
  grep -q 'set $service_url http://127.0.0.1:8082;' "$SERVICE_URL_INC"
  assert_no_rm
}

case_nginx_test() {
  setup aligned 0
  export FAIL_STAGE=nginx_test
  if deploy >/tmp/deploy-nginxt.out 2>&1; then return 1; fi
  grep -q 'set $service_url http://127.0.0.1:8082;' "$SERVICE_URL_INC"
  state_py 'state["containers"]["portfolio-frontend"]["image"]=="example/portfolio-frontend:old"'
  state_py 'state["containers"]["portfolio-backend-green"]["status"]=="running"'
  assert_no_rm
}

case_public_check() {
  setup aligned 0
  export FAIL_STAGE=public_check
  if deploy >/tmp/deploy-public.out 2>&1; then return 1; fi
  grep -q 'set $service_url http://127.0.0.1:8082;' "$SERVICE_URL_INC"
  state_py 'state["containers"]["portfolio-frontend"]["image"]=="example/portfolio-frontend:old"'
  state_py 'state["nginx_port"]=="8082"'
  state_py 'state["containers"]["portfolio-backend-green"]["status"]=="running"'
  assert_no_rm
}

case_after_stop() {
  setup aligned 0
  export FAIL_STAGE=after_stop
  if deploy >/tmp/deploy-after.out 2>&1; then return 1; fi
  grep -q 'set $service_url http://127.0.0.1:8082;' "$SERVICE_URL_INC"
  state_py 'state["containers"]["portfolio-backend-green"]["status"]=="running"'
  state_py 'state["containers"]["portfolio-frontend"]["image"]=="example/portfolio-frontend:old"'
  state_py 'state["nginx_port"]=="8082"'
  assert_no_rm
}

case_rollback_preserves() {
  setup aligned 0
  export FAIL_STAGE=rollback_nginx
  if deploy >/tmp/deploy-preserve.out 2>&1; then return 1; fi
  grep -q PRESERVED /tmp/deploy-preserve.out
  [[ -n "$(find "$BACKUP_DIR" -type f -print -quit)" ]]
  state_py 'has_name("portfolio-frontend")'
  state_py 'has_name("portfolio-backend-blue")'
  assert_no_rm
}

case_in_use_not_deleted() {
  setup aligned 1 portfolio-backend-blue
  if deploy >/tmp/deploy-inuse.out 2>&1; then return 1; fi
  grep -q '삭제하지 않습니다' /tmp/deploy-preserve.out 2>/dev/null || grep -q '삭제하지 않습니다' /tmp/deploy-inuse.out
  state_py 'state["containers"]["portfolio-backend-blue"]["status"]=="running"'
  state_py '"example/portfolio-backend:abc123" not in state["pulled"]'
  ! grep -w rename "$MOCK_STATE/commands.log" >/dev/null
}

case_unused_retired() {
  setup aligned 1
  deploy >/tmp/deploy-retire.out 2>&1
  state_py 'state["containers"]["portfolio-backend-blue"]["image"]=="example/portfolio-backend:abc123"'
  state_py 'has_name("portfolio-backend-blue-retired", "exited")'
  assert_no_rm
}

case_bad_port() {
  setup aligned 0
  printf 'set $service_url http://127.0.0.1:8080;\n' >"$SERVICE_URL_INC"
  if deploy >/tmp/deploy-port.out 2>&1; then return 1; fi
  state_py '"example/portfolio-backend:abc123" not in state["pulled"]'
  grep -q '8081 또는 8082' /tmp/deploy-port.out
}

case_unaligned() {
  setup literal 0
  if deploy >/tmp/deploy-unaligned.out 2>&1; then return 1; fi
  state_py '"example/portfolio-backend:abc123" not in state["pulled"]'
  grep -q 'proxy_pass http://localhost:8080;' "$NGINX_SITE"
}

case_reject_latest() {
  setup aligned 0
  if "$ROOT/deploy.sh" --backend-image example/portfolio-backend:latest --frontend-image "$FRONTEND_IMAGE" >/tmp/deploy-latest.out 2>&1; then
    return 1
  fi
  state_py '"example/portfolio-backend:latest" not in state.get("pulled", [])'
}

case_lock() {
  setup aligned 0
  trap 'stop_held_lock' EXIT
  start_held_lock "$LOCK_FILE"
  local code=0
  deploy >/tmp/deploy-lock.out 2>&1 || code=$?
  stop_held_lock
  trap - EXIT
  [[ "$code" -ne 0 ]]
  grep -q '잠금' /tmp/deploy-lock.out
  state_py '"example/portfolio-backend:abc123" not in state["pulled"]'
}

case_apply_aligns() {
  setup literal 0
  local before after
  before="$(python3 -c 'import pathlib,sys; print("\n".join(line.strip() for line in pathlib.Path(sys.argv[1]).read_text().splitlines() if "ssl_certificate" in line))' "$NGINX_SITE")"
  "$ROOT/ops/nginx/apply-api-upstream.sh" >/tmp/apply.out 2>&1
  grep -q 'proxy_pass $service_url;' "$NGINX_SITE"
  grep -q "include $SERVICE_URL_INC;" "$NGINX_SITE"
  grep -q 'proxy_pass http://localhost:3000;' "$NGINX_SITE"
  ! grep -q 'proxy_pass http://localhost:8080;' "$NGINX_SITE"
  grep -q 'proxy_set_header X-Forwarded-Proto $scheme;' "$NGINX_SITE"
  after="$(python3 -c 'import pathlib,sys; print("\n".join(line.strip() for line in pathlib.Path(sys.argv[1]).read_text().splitlines() if "ssl_certificate" in line))' "$NGINX_SITE")"
  [[ "$before" == "$after" ]]
  grep -q 'set $service_url http://127.0.0.1:8082;' "$SERVICE_URL_INC"
  local sum
  sum="$(cksum "$NGINX_SITE")"
  "$ROOT/ops/nginx/apply-api-upstream.sh" >/tmp/apply2.out 2>&1
  [[ "$(cksum "$NGINX_SITE")" == "$sum" ]]
  [[ "$BACKUP_DIR" != "$WORK/nginx"* ]]
  ! "$NGINX_BIN" -T | grep -F "$BACKUP_DIR" >/dev/null
  assert_no_rm
}

case_apply_nginx_restores() {
  setup literal 0
  export FAIL_STAGE=nginx_test
  if "$ROOT/ops/nginx/apply-api-upstream.sh" >/tmp/apply-nginx.out 2>&1; then
    return 1
  fi
  grep -q 'proxy_pass http://localhost:8080;' "$NGINX_SITE"
  grep -q 'proxy_pass http://localhost:3000;' "$NGINX_SITE"
  grep -q PRESERVED /tmp/apply-nginx.out
  ! grep -q 'proxy_pass $service_url;' "$NGINX_SITE"
}

case_apply_refuses_non_slot() {
  setup literal 0 portfolio-backend-api-1
  local sum
  sum="$(cksum "$NGINX_SITE")"
  if "$ROOT/ops/nginx/apply-api-upstream.sh" >/tmp/apply-refuse.out 2>&1; then return 1; fi
  [[ "$(cksum "$NGINX_SITE")" == "$sum" ]]
  grep -q '추측하지 않고' /tmp/apply-refuse.out
}

case_apply_backup_outside_nginx() {
  setup literal 0
  BACKUP_DIR=/etc/nginx/conf.d/portfolio-backup-test
  if "$ROOT/ops/nginx/apply-api-upstream.sh" >/tmp/apply-backup.out 2>&1; then return 1; fi
  [[ ! -d /etc/nginx/conf.d/portfolio-backup-test ]]
  grep -q '/etc/nginx 밖' /tmp/apply-backup.out
}

case_release_paths() {
  setup aligned 0
  local home="$HOME" project shared_env release_a release_b manual
  home="$(mktemp -d)"
  project="$home/portfolio"
  mkdir -p "$project"
  shared_env="$project/.env"
  cp "$PROJECT_DIR/.env" "$shared_env"
  printf 'SHARED_MARKER=from-portfolio-env\n' >>"$shared_env"
  printf 'DB_PASSWORD=shared-secret-should-not-print\n' >>"$shared_env"
  unset PROJECT_DIR LOCK_FILE ENV_FILE
  export HOME="$home"
  release_a="$home/portfolio-release/aaaaaaaaaaaaaaaa"
  release_b="$home/portfolio-release/bbbbbbbbbbbbbbbb"
  manual="$home/portfolio-release/manual"
  local dest
  for dest in "$release_a" "$release_b" "$manual"; do
    mkdir -p "$dest/ops"
    cp "$ROOT/deploy.sh" "$dest/deploy.sh"
    cp -a "$ROOT/ops/lib" "$ROOT/ops/nginx" "$dest/ops/"
    chmod +x "$dest/deploy.sh" "$dest/ops/nginx/apply-api-upstream.sh" "$dest/ops/nginx/recover-service.sh"
    printf 'DB_PASSWORD=release-secret-should-not-load\n' >"$dest/.env"
    [[ ! -f "$dest/ops/.env" ]]
  done
  mkdir -p "$project/ops/lib" "$project/ops/nginx"
  printf 'echo broken-project-slots\nexit 99\n' >"$project/ops/lib/slots.sh"
  printf 'import sys\nsys.exit(99)\n' >"$project/ops/nginx/rewrite_api_proxy.py"
  local code apply_code sum
  sum="$(cksum "$NGINX_SITE")"
  trap 'stop_held_lock' EXIT
  start_held_lock "$project/.deploy.lock"
  code=0
  apply_code=0
  (cd / && env -u PROJECT_DIR -u LOCK_FILE -u ENV_FILE HOME="$home" NETWORK=portfolio_default \
    "$release_b/deploy.sh" --backend-image "$BACKEND_IMAGE" --frontend-image "$FRONTEND_IMAGE") \
    >/tmp/deploy-release-lock.out 2>&1 || code=$?
  (cd /tmp && env -u PROJECT_DIR -u LOCK_FILE -u ENV_FILE HOME="$home" NETWORK=portfolio_default \
    "$manual/ops/nginx/apply-api-upstream.sh") >/tmp/apply-release-lock.out 2>&1 || apply_code=$?
  stop_held_lock
  trap - EXIT
  [[ "$code" -ne 0 && "$apply_code" -ne 0 ]]
  grep -q -F "$project/.deploy.lock" /tmp/deploy-release-lock.out
  grep -q -F "$project/.deploy.lock" /tmp/apply-release-lock.out
  [[ "$(cksum "$NGINX_SITE")" == "$sum" ]]
  ! grep -F 'shared-secret-should-not-print' /tmp/deploy-release-lock.out /tmp/apply-release-lock.out
  ! grep -F 'release-secret-should-not-load' /tmp/deploy-release-lock.out /tmp/apply-release-lock.out
  state_py '"example/portfolio-backend:abc123" not in state["pulled"]'
  (cd / && env -u PROJECT_DIR -u LOCK_FILE -u ENV_FILE HOME="$home" \
    "$release_a/deploy.sh" --backend-image "$BACKEND_IMAGE" --frontend-image "$FRONTEND_IMAGE") \
    >/tmp/deploy-release.out 2>&1
  grep -q -F "script=${release_a}" /tmp/deploy-release.out
  grep -q -F "project=${project}" /tmp/deploy-release.out
  grep -q -F "env=${shared_env}" /tmp/deploy-release.out
  grep -q -F "lock=${project}/.deploy.lock" /tmp/deploy-release.out
  grep -q -F -- "--env-file" "$MOCK_STATE/commands.log"
  grep -q -F -- "$shared_env" "$MOCK_STATE/commands.log"
  ! grep -F 'shared-secret-should-not-print' /tmp/deploy-release.out "$MOCK_STATE/commands.log"
  ! grep -F 'release-secret-should-not-load' /tmp/deploy-release.out "$MOCK_STATE/commands.log"
  state_py '"SHARED_MARKER=from-portfolio-env" in state["containers"]["portfolio-backend-blue"]["env"]'
  state_py 'not [item for item in state["containers"]["portfolio-backend-blue"]["env"] if "release-secret-should-not-load" in item]'
  local state_file
  state_file="$(find "$BACKUP_DIR" -name recovery-state -print -quit)"
  [[ -n "$state_file" && -f "$state_file" ]]
  grep -q '^frontend_previous=portfolio-frontend-previous$' "$state_file"
  grep -q '^active_backend=portfolio-backend-green$' "$state_file"
  local manifest saved
  manifest="$(find "$BACKUP_DIR" -name manifest.tsv -print -quit)"
  [[ -n "$manifest" ]]
  saved="$(awk -F '\t' -v path="$SERVICE_URL_INC" '$1==path { print $2 }' "$manifest")"
  [[ -f "$saved" ]]
  grep -q 'set $service_url http://127.0.0.1:8082;' "$saved"
  grep -q 'set $service_url http://127.0.0.1:8081;' "$SERVICE_URL_INC"
  stops="$(grep -c -w stop "$MOCK_STATE/commands.log" || true)"
  (cd /tmp && env -u PROJECT_DIR -u LOCK_FILE -u ENV_FILE HOME="$home" \
    "$release_a/ops/nginx/recover-service.sh" --backup "$(dirname "$manifest")" --apply) \
    >/tmp/recover-healthy.out 2>&1
  grep -q '중지하지 않습니다' /tmp/recover-healthy.out
  [[ "$(grep -c -w stop "$MOCK_STATE/commands.log" || true)" == "$stops" ]]
}

case_manifest_restore() {
  setup literal 0
  "$ROOT/ops/nginx/apply-api-upstream.sh" >/tmp/apply-manifest.out 2>&1
  local manifest saved_site saved_inc backup
  manifest="$(find "$BACKUP_DIR" -name manifest.tsv -print -quit)"
  backup="$(dirname "$manifest")"
  saved_site="$(awk -F '\t' -v path="$NGINX_SITE" '$1==path { print $2 }' "$manifest")"
  saved_inc="$(awk -F '\t' -v path="$SERVICE_URL_INC" '$1==path { print $2 }' "$manifest")"
  [[ -f "$saved_site" && -f "$saved_inc" ]]
  grep -q 'proxy_pass http://localhost:8080;' "$saved_site"
  grep -q 'proxy_pass http://localhost:3000;' "$saved_site"
  grep -q 'set $service_url http://127.0.0.1:8082;' "$saved_inc"
  printf 'broken-site\n' >"$NGINX_SITE"
  printf 'broken-inc\n' >"$SERVICE_URL_INC"
  "$backup/restore.sh" >/tmp/restore-manifest.out 2>&1
  grep -F "restore: ${saved_site} -> ${NGINX_SITE}" /tmp/restore-manifest.out
  grep -F "restore: ${saved_inc} -> ${SERVICE_URL_INC}" /tmp/restore-manifest.out
  cmp -s "$saved_site" "$NGINX_SITE"
  cmp -s "$saved_inc" "$SERVICE_URL_INC"
  [[ -f "$backup/recovery-state" ]]
  grep -q '^active_backend=portfolio-backend-green$' "$backup/recovery-state"
  grep -q '^frontend_previous=$' "$backup/recovery-state"
}

case_recover_missing_container() {
  setup aligned 0
  python3 - "$MOCK_STATE/state.json" <<'PY'
import json, sys
path = sys.argv[1]
state = json.loads(open(path).read())
state["containers"]["portfolio-frontend"]["status"] = "exited"
open(path, "w").write(json.dumps(state))
PY
  local backup="$BACKUP_DIR/recorded"
  mkdir -p "$backup/files${SERVICE_URL_INC%/*}"
  cp "$SERVICE_URL_INC" "$backup/files${SERVICE_URL_INC}"
  printf '%s\t%s\n' "$SERVICE_URL_INC" "$backup/files${SERVICE_URL_INC}" >"$backup/manifest.tsv"
  cat >"$backup/restore.sh" <<'EOF'
#!/usr/bin/env bash
echo "restore-should-not-run" >&2
exit 99
EOF
  chmod +x "$backup/restore.sh"
  cat >"$backup/recovery-state" <<'EOF'
frontend_name=portfolio-frontend
frontend_previous=portfolio-frontend-previous-missing
active_backend=portfolio-backend-green
active_port=8082
active_slot=green
new_backend=
EOF
  local sum code=0
  sum="$(cksum "$NGINX_SITE")"
  if "$ROOT/ops/nginx/recover-service.sh" --backup "$backup" --apply >/tmp/recover-missing.out 2>&1; then
    code=0
  else
    code=$?
  fi
  [[ "$code" -ne 0 ]]
  grep -q '보존 프런트 컨테이너가 없습니다: portfolio-frontend-previous-missing' /tmp/recover-missing.out
  grep -q '프런트엔드를 중지하지 않습니다' /tmp/recover-missing.out
  ! grep -q 'restore-should-not-run' /tmp/recover-missing.out
  ! grep -w stop "$MOCK_STATE/commands.log" >/dev/null
  [[ "$(cksum "$NGINX_SITE")" == "$sum" ]]
  state_py 'state["containers"]["portfolio-frontend"]["status"]=="exited"'
}

set_frontend_env() {
  python3 - "$MOCK_STATE/state.json" "$@" <<'PY'
import json, sys
path, *env = sys.argv[1:]
state = json.load(open(path))
state["containers"]["portfolio-frontend"]["env"] = env
json.dump(state, open(path, "w"))
PY
}

case_mock_keeps_duplicate_env() {
  setup aligned 0
  printf 'INTERNAL_API_URL=http://backend-api:8080\n' >"$WORK/override.env"
  docker run -d --name env-probe --restart unless-stopped \
    --env-file "$WORK/override.env" \
    -e INTERNAL_API_URL=http://portfolio-backend-green:8080 \
    example/none:1 >/tmp/mock-dup.out
  python3 - "$MOCK_STATE/state.json" <<'PY'
import json, sys
env = json.load(open(sys.argv[1]))["containers"]["env-probe"]["env"]
if env != [
    "INTERNAL_API_URL=http://backend-api:8080",
    "INTERNAL_API_URL=http://portfolio-backend-green:8080",
]:
    raise SystemExit(f"mock collapsed duplicate env: {env}")
PY
  python3 - "$MOCK_STATE/state.json" <<'PY'
import json, sys
path = sys.argv[1]
state = json.load(open(path))
state["images"] = {
    "example/with-env:1": {
        "env": ["INTERNAL_API_URL=http://from-image:8080", "IMAGE_MARKER=from-image"]
    }
}
json.dump(state, open(path, "w"))
PY
  docker run -d --name env-image --restart unless-stopped \
    -e INTERNAL_API_URL=http://portfolio-backend-blue:8080 \
    example/with-env:1 >/tmp/mock-image.out
  python3 - "$MOCK_STATE/state.json" <<'PY'
import json, sys
env = json.load(open(sys.argv[1]))["containers"]["env-image"]["env"]
internal = [item for item in env if item.startswith("INTERNAL_API_URL=")]
if internal != ["INTERNAL_API_URL=http://portfolio-backend-blue:8080"]:
    raise SystemExit(f"image env was not overridden once: {env}")
if "IMAGE_MARKER=from-image" not in env:
    raise SystemExit("image marker missing")
PY
}

case_frontend_one_internal_url() {
  setup aligned 0
  printf 'INTERNAL_API_URL=http://backend-api:8080\nONLY_IN_DOTENV=dotenv-secret\n' >>"$PROJECT_DIR/.env"
  set_frontend_env \
    "INTERNAL_API_URL=http://backend-api:8080" \
    "INTERNAL_API_URL=http://portfolio-backend-green:8080" \
    "CUSTOM_KEEP=keep-me" \
    "NEXT_PUBLIC_API_URL=https://swportfolioservices.com"
  python3 - "$MOCK_STATE/state.json" <<'PY'
import json, sys
path = sys.argv[1]
state = json.load(open(path))
state["images"] = {
    "example/portfolio-frontend:abc123": {
        "env": ["INTERNAL_API_URL=http://from-image:8080", "IMAGE_MARKER=from-image"]
    }
}
json.dump(state, open(path, "w"))
PY
  deploy >/tmp/deploy-frontend-env.out 2>&1
  python3 - "$MOCK_STATE/state.json" "$MOCK_STATE/commands.log" /tmp/deploy-frontend-env.out <<'PY'
import json, sys
state_path, log_path, out_path = sys.argv[1:]
env = json.load(open(state_path))["containers"]["portfolio-frontend"]["env"]
internal = [item for item in env if item.startswith("INTERNAL_API_URL=")]
if internal != ["INTERNAL_API_URL=http://portfolio-backend-blue:8080"]:
    raise SystemExit(f"frontend internal url: {internal}")
for required in ("CUSTOM_KEEP=keep-me", "IMAGE_MARKER=from-image", "NEXT_PUBLIC_API_URL=https://swportfolioservices.com"):
    if required not in env:
        raise SystemExit(f"missing {required}")
if any("backend-api" in item or "from-image:8080" in item or item.startswith("ONLY_IN_DOTENV=") for item in env):
    raise SystemExit(f"unexpected env source leaked: {env}")
log = open(log_path).read()
out = open(out_path).read()
if "dotenv-secret" in log or "dotenv-secret" in out:
    raise SystemExit("dotenv value was printed or passed")
runs = [line for line in log.splitlines() if "portfolio-frontend" in line and "example/portfolio-frontend:abc123" in line and " run " in line]
if len(runs) != 1 or runs[0].count("INTERNAL_API_URL=") != 1 or "--env-file" in runs[0]:
    raise SystemExit("frontend run did not set INTERNAL_API_URL exactly once without env-file")
if "INTERNAL_API_URL=http://portfolio-backend-blue:8080" not in runs[0]:
    raise SystemExit("frontend run target mismatch")
PY
  grep -q 'INTERNAL_API_URL=http://backend-api:8080' "$PROJECT_DIR/.env"
  grep -q 'ONLY_IN_DOTENV=dotenv-secret' "$PROJECT_DIR/.env"
}

case_apply_api_variants() {
  local sum
  setup literal 0
  set_frontend_env \
    "INTERNAL_API_URL=http://backend-api:8080" \
    "INTERNAL_API_URL=http://portfolio-backend-green:8080" \
    "DB_PASSWORD=slot-secret"
  sum="$(cksum "$NGINX_SITE" "$SERVICE_URL_INC")"
  if "$ROOT/ops/nginx/apply-api-upstream.sh" >/tmp/apply-conflict.out 2>&1; then
    return 1
  fi
  [[ "$(cksum "$NGINX_SITE" "$SERVICE_URL_INC")" == "$sum" ]]
  grep -q '서로 다른 값으로 중복' /tmp/apply-conflict.out
  ! grep -q 'slot-secret' /tmp/apply-conflict.out
  [[ -z "$(find "$BACKUP_DIR" -type f -print -quit)" ]]

  setup literal 0
  set_frontend_env "NEXT_PUBLIC_API_URL=https://swportfolioservices.com"
  sum="$(cksum "$NGINX_SITE")"
  if "$ROOT/ops/nginx/apply-api-upstream.sh" >/tmp/apply-missing.out 2>&1; then
    return 1
  fi
  [[ "$(cksum "$NGINX_SITE")" == "$sum" ]]
  grep -q 'INTERNAL_API_URL이 없습니다' /tmp/apply-missing.out

  setup literal 0
  set_frontend_env "INTERNAL_API_URL=http://backend-api:8080"
  sum="$(cksum "$NGINX_SITE")"
  if "$ROOT/ops/nginx/apply-api-upstream.sh" >/tmp/apply-invalid.out 2>&1; then
    return 1
  fi
  [[ "$(cksum "$NGINX_SITE")" == "$sum" ]]
  grep -q 'blue/green 컨테이너 주소가 아닙니다' /tmp/apply-invalid.out

  setup literal 0
  set_frontend_env \
    "INTERNAL_API_URL=http://portfolio-backend-green:8080" \
    "INTERNAL_API_URL=http://portfolio-backend-green:8080"
  "$ROOT/ops/nginx/apply-api-upstream.sh" >/tmp/apply-same.out 2>&1
  grep -q '같은 값으로 여러 번' /tmp/apply-same.out
  grep -q 'proxy_pass $service_url;' "$NGINX_SITE"
  grep -q 'set $service_url http://127.0.0.1:8082;' "$SERVICE_URL_INC"

  setup literal 1 portfolio-backend-blue
  "$ROOT/ops/nginx/apply-api-upstream.sh" >/tmp/apply-blue.out 2>&1
  grep -q 'set $service_url http://127.0.0.1:8081;' "$SERVICE_URL_INC"
  grep -q 'proxy_pass http://localhost:3000;' "$NGINX_SITE"

  setup literal 0
  set_frontend_env \
    "INTERNAL_API_URL=http://backend-api:8080" \
    "INTERNAL_API_URL=http://portfolio-backend-green:8080" \
    "DB_PASSWORD=slot-secret"
  "$ROOT/ops/nginx/apply-api-upstream.sh" --slot green >/tmp/apply-slot.out 2>&1
  grep -q 'proxy_pass $service_url;' "$NGINX_SITE"
  ! grep -q 'slot-secret' /tmp/apply-slot.out
  ! grep -q 'DB_PASSWORD' /tmp/apply-slot.out
}

case_conflict_preserves_target() {
  setup aligned 1
  set_frontend_env \
    "INTERNAL_API_URL=http://backend-api:8080" \
    "INTERNAL_API_URL=http://portfolio-backend-green:8080"
  if deploy >/tmp/deploy-conflict.out 2>&1; then
    return 1
  fi
  grep -q '확인 전에 삭제하지 않습니다' /tmp/deploy-conflict.out
  state_py 'state["containers"]["portfolio-backend-blue"]["status"]=="running"'
  state_py 'state["containers"]["portfolio-backend-blue"]["image"]=="example/portfolio-backend:old"'
  state_py '"example/portfolio-backend:abc123" not in state["pulled"]'
  ! grep -w rename "$MOCK_STATE/commands.log" >/dev/null
}

static_checks() {
  ! grep -n 'docker ps -aq -f name=' "$ROOT/deploy.sh" >/dev/null
  ! grep -nE 'docker (image|system) prune' "$ROOT/deploy.sh" >/dev/null
  ! grep -n 'sleep 15' "$ROOT/deploy.sh" >/dev/null
  ! grep -n 'rollback || true' "$ROOT/deploy.sh" >/dev/null
  bash -n "$ROOT/deploy.sh"
  bash -n "$ROOT/ops/nginx/apply-api-upstream.sh"
  bash -n "$ROOT/ops/nginx/recover-service.sh"
  bash -n "$ROOT/ops/lib/slots.sh"
  bash -n "$ROOT/ops/tests/run-deploy-checks.sh"
  python3 -m py_compile "$ROOT/ops/lib/frontend_run.py" "$ROOT/ops/nginx/rewrite_api_proxy.py" "$ROOT/ops/tests/mockstate.py"
  python3 "$ROOT/ops/lib/frontend_run.py" --self-test
  python3 "$ROOT/ops/nginx/rewrite_api_proxy.py" --self-test
  python3 - "$ROOT" <<'PY'
import sys
from pathlib import Path
text = Path(sys.argv[1], ".github/workflows/deploy.yml").read_text()
required = [
    "cancel-in-progress: false",
    "workflow_dispatch:",
    "!**/*.md",
    "github.sha",
    "script_stop: true",
    "verify-deploy:",
    "ops/tests/run-deploy-checks.sh",
    "runs-on: ubuntu-24.04",
    "actions/checkout@v5",
    "actions/setup-java@v5",
    'java-version: "21"',
    "actions/setup-node@v5",
    'node-version: "22"',
    "backend-tests:",
    "frontend-checks:",
    'export PROJECT_DIR="$HOME/portfolio"',
    'export ENV_FILE="$PROJECT_DIR/.env"',
    'export LOCK_FILE="$PROJECT_DIR/.deploy.lock"',
    'test -f "$DIR/ops/lib/slots.sh"',
    'test -f "$DIR/ops/lib/frontend_run.py"',
    'test -f "$DIR/ops/nginx/rewrite_api_proxy.py"',
    'test -f "$DIR/ops/nginx/recover-service.sh"',
    'test ! -e "$DIR/.env"',
]
missing = [item for item in required if item not in text]
if missing:
    raise SystemExit("workflow missing " + ", ".join(missing))
for line in text.splitlines():
    if "--backend-image" in line or "--frontend-image" in line:
        if ":latest" in line:
            raise SystemExit("deploy command uses latest")
PY
}

chmod +x "$ROOT/deploy.sh" "$ROOT/ops/nginx/apply-api-upstream.sh" "$ROOT/ops/nginx/recover-service.sh" \
  "$ROOT/ops/tests/fake-bin/docker" "$ROOT/ops/tests/fake-bin/nginx" "$ROOT/ops/tests/fake-bin/curl"

run_case static static_checks
run_case success case_success
run_case pull-failure case_pull_failure
run_case backend-health case_backend_health
run_case frontend-run case_frontend_run
run_case frontend-health case_frontend_health
run_case nginx-test case_nginx_test
run_case public-check case_public_check
run_case after-stop case_after_stop
run_case rollback-preserves case_rollback_preserves
run_case in-use-not-deleted case_in_use_not_deleted
run_case unused-retired case_unused_retired
run_case bad-port case_bad_port
run_case unaligned-nginx case_unaligned
run_case reject-latest case_reject_latest
run_case deploy-lock case_lock
run_case apply-align case_apply_aligns
run_case apply-nginx-restore case_apply_nginx_restores
run_case apply-refuse-non-slot case_apply_refuses_non_slot
run_case apply-backup-outside case_apply_backup_outside_nginx
run_case release-paths case_release_paths
run_case manifest-restore case_manifest_restore
run_case recover-missing case_recover_missing_container
run_case mock-keeps-duplicate-env case_mock_keeps_duplicate_env
run_case frontend-one-internal-url case_frontend_one_internal_url
run_case apply-api-variants case_apply_api_variants
run_case conflict-preserves-target case_conflict_preserves_target

if [[ "$FAILURES" -ne 0 ]]; then
  printf '%s check(s) failed:%s\n' "$FAILURES" "$FAILED_NAMES" >&2
  exit 1
fi
printf 'all deploy checks passed\n'
