#!/usr/bin/env bash
# Blue/green slot map for the portfolio API. Host ports are fixed:
# blue 8081, green 8082. There is no silent default when parsing fails.

port_for_slot() {
  case "$1" in
    blue) printf '8081\n' ;;
    green) printf '8082\n' ;;
    *) return 1 ;;
  esac
}

slot_for_port() {
  case "$1" in
    8081) printf 'blue\n' ;;
    8082) printf 'green\n' ;;
    *) return 1 ;;
  esac
}

container_for_slot() {
  case "$1" in
    blue | green) printf 'portfolio-backend-%s\n' "$1" ;;
    *) return 1 ;;
  esac
}

other_slot() {
  case "$1" in
    blue) printf 'green\n' ;;
    green) printf 'blue\n' ;;
    *) return 1 ;;
  esac
}

# Classify INTERNAL_API_URL on one container without printing the rest of Config.Env.
# Identical values collapse. Differing values are a conflict and are not ordered.
# Status is one line: missing, conflict, invalid, "ok HOST single", or "ok HOST same".
frontend_api_status() {
  local name="$1" key_lines unique value host raw_count unique_count
  key_lines="$(
    docker container inspect -f '{{range .Config.Env}}{{println .}}{{end}}' "$name" 2>/dev/null \
      | sed -n 's/^INTERNAL_API_URL=//p'
  )" || return 1
  if [[ -z "$key_lines" ]]; then
    printf 'missing\n'
    return 0
  fi
  unique="$(printf '%s\n' "$key_lines" | awk 'NF && !seen[$0]++')"
  unique_count="$(printf '%s\n' "$unique" | grep -c .)"
  if [[ "$unique_count" -gt 1 ]]; then
    printf 'conflict\n'
    return 0
  fi
  value="$unique"
  case "$value" in
    http://portfolio-backend-blue:8080) host="portfolio-backend-blue" ;;
    http://portfolio-backend-green:8080) host="portfolio-backend-green" ;;
    *)
      printf 'invalid\n'
      return 0
      ;;
  esac
  raw_count="$(printf '%s\n' "$key_lines" | grep -c .)"
  if [[ "$raw_count" -gt 1 ]]; then
    printf 'ok %s same\n' "$host"
  else
    printf 'ok %s single\n' "$host"
  fi
}

# Prints 8081 or 8082. Returns 1 when the file is missing, ambiguous, or not a slot port.
read_active_port() {
  local file="$1" port lines
  [[ -f "$file" ]] || return 1
  lines="$(grep -cve '^[[:space:]]*$' "$file" || true)"
  [[ "$lines" == "1" ]] || return 1
  port="$(sed -n 's/^set \$service_url http:\/\/127\.0\.0\.1:\(8081\|8082\);$/\1/p' "$file")"
  [[ "$port" == "8081" || "$port" == "8082" ]] || return 1
  printf '%s\n' "$port"
}

run_nginx() {
  if [[ -n "${NGINX_BIN:-}" ]]; then
    "$NGINX_BIN" "$@"
  elif [[ "$(id -u)" -eq 0 ]]; then
    nginx "$@"
  else
    sudo nginx "$@"
  fi
}

# PROJECT_DIR, ENV_FILE, and LOCK_FILE stay on the shared portfolio directory.
# They do not follow the script path, the current directory, or portfolio-release/<sha>.
use_shared_project_paths() {
  if [[ -z "${PROJECT_DIR:-}" ]]; then
    PROJECT_DIR="${HOME}/portfolio"
  fi
  [[ "$PROJECT_DIR" == /* ]] || {
    echo "deploy: PROJECT_DIR는 절대 경로여야 합니다: $PROJECT_DIR" >&2
    exit 1
  }
  ENV_FILE="${ENV_FILE:-$PROJECT_DIR/.env}"
  LOCK_FILE="${LOCK_FILE:-$PROJECT_DIR/.deploy.lock}"
}

acquire_deploy_lock() {
  local lock="${LOCK_FILE:-${PROJECT_DIR:-$HOME/portfolio}/.deploy.lock}"
  mkdir -p "$(dirname "$lock")"
  exec 9>>"$lock"
  if ! flock -n 9; then
    echo "deploy: $lock 잠금이 이미 있어 서비스 변경 전에 중단합니다." >&2
    exit 1
  fi
}

prepare_backup_dir() {
  local dir="$1"
  if mkdir -p "$dir" 2>/dev/null && [[ -w "$dir" ]]; then
    return 0
  fi
  sudo mkdir -p "$dir"
  sudo chown "$(id -u):$(id -g)" "$dir"
}

begin_nginx_backup() {
  local dir="$1"
  prepare_backup_dir "$dir"
  : >"${dir}/manifest.tsv"
}

record_backup_file() {
  local backup_dir="$1" original="$2" dest
  [[ -f "$original" ]] || return 1
  dest="${backup_dir}/files${original}"
  if ! mkdir -p "$(dirname "$dest")" 2>/dev/null || [[ ! -w "$(dirname "$dest")" ]]; then
    sudo mkdir -p "$(dirname "$dest")"
    sudo chown -R "$(id -u):$(id -g)" "${backup_dir}/files"
  fi
  if [[ -r "$original" ]]; then
    cp "$original" "$dest"
  else
    sudo cp "$original" "$dest"
    sudo chown "$(id -u):$(id -g)" "$dest"
    sudo chmod a+r "$dest"
  fi
  printf '%s\t%s\n' "$original" "$dest" >>"${backup_dir}/manifest.tsv"
}

write_recovery_state() {
  local backup_dir="$1"
  local file="${backup_dir}/recovery-state"
  shift
  : >"$file"
  while [[ $# -ge 2 ]]; do
    printf '%s=%s\n' "$1" "$2" >>"$file"
    shift 2
  done
}

write_nginx_restore_script() {
  local backup_dir="$1"
  cat >"${backup_dir}/restore.sh" <<'EOF'
#!/usr/bin/env bash
# Restore each original path from the paired backup path in manifest.tsv.
set -Eeuo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MANIFEST="$HERE/manifest.tsv"
[[ -f "$MANIFEST" ]] || { echo "restore: manifest가 없습니다: $MANIFEST" >&2; exit 1; }
copied=0
while IFS=$'\t' read -r original saved || [[ -n "${original:-}" ]]; do
  [[ -n "${original:-}" ]] || continue
  [[ "$original" != \#* ]] || continue
  [[ -n "${saved:-}" && -f "$saved" ]] || {
    echo "restore: 백업 파일이 없습니다: ${saved:-<empty>} (원본 ${original})" >&2
    exit 1
  }
  echo "restore: ${saved} -> ${original}"
  if [[ -w "$original" || ( ! -e "$original" && -w "$(dirname "$original")" ) ]]; then
    cat "$saved" >"$original"
  else
    sudo tee "$original" >/dev/null <"$saved"
  fi
  copied=$((copied + 1))
done <"$MANIFEST"
[[ "$copied" -gt 0 ]] || { echo "restore: manifest에 복원 항목이 없습니다." >&2; exit 1; }
if [[ -n "${NGINX_BIN:-}" ]]; then
  "$NGINX_BIN" -t
  "$NGINX_BIN" -s reload
elif [[ "$(id -u)" -eq 0 ]]; then
  nginx -t
  nginx -s reload
else
  sudo nginx -t
  sudo nginx -s reload
fi
echo "restore: ${copied}개 파일을 manifest 기준으로 복원했습니다."
EOF
  chmod +x "${backup_dir}/restore.sh"
}

write_service_url() {
  local file="$1" port="$2" tmp
  [[ "$port" == "8081" || "$port" == "8082" ]] || return 1
  tmp="$(mktemp)"
  printf 'set $service_url http://127.0.0.1:%s;\n' "$port" >"$tmp"
  if [[ -w "$file" || ( ! -e "$file" && -w "$(dirname "$file")" ) ]]; then
    cat "$tmp" >"$file"
  else
    sudo tee "$file" >/dev/null <"$tmp"
  fi
  rm -f "$tmp"
}
