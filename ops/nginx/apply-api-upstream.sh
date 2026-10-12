#!/usr/bin/env bash
# Align the live Nginx /api proxy with the blue/green slot already used by Next.js SSR.
# Does not print secret values. Refuses to guess a config path when nginx -T cannot name one file.
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=../lib/slots.sh
source "$ROOT/ops/lib/slots.sh"
use_shared_project_paths

SERVICE_URL_INC="${SERVICE_URL_INC:-/etc/nginx/conf.d/service-url.inc}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/portfolio-nginx}"
FRONTEND_NAME="${FRONTEND_NAME:-portfolio-frontend}"
PUBLIC_ORIGIN="${PUBLIC_ORIGIN:-https://swportfolioservices.com}"
SLOT="${SLOT:-}"
NETWORK="${NETWORK:-portfolio_default}"

usage() {
  echo "usage: $0 [--slot blue|green] [--frontend-container NAME] [--backup-dir DIR]" >&2
  exit 2
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --slot)
      SLOT="$2"
      shift 2
      ;;
    --frontend-container)
      FRONTEND_NAME="$2"
      shift 2
      ;;
    --backup-dir)
      BACKUP_DIR="$2"
      shift 2
      ;;
    --service-url-inc)
      SERVICE_URL_INC="$2"
      shift 2
      ;;
    --public-origin)
      PUBLIC_ORIGIN="$2"
      shift 2
      ;;
    -h | --help) usage ;;
    *) usage ;;
  esac
done

backup_root="$(readlink -f "$BACKUP_DIR" 2>/dev/null || echo "$BACKUP_DIR")"
case "$backup_root" in
  /etc/nginx | /etc/nginx/*)
    echo "nginx-api: 백업 경로는 /etc/nginx 밖이어야 합니다." >&2
    exit 1
    ;;
esac

acquire_deploy_lock
echo "nginx-api: script=${ROOT} project=${PROJECT_DIR} lock=${LOCK_FILE}" >&2

if [[ -z "$SLOT" ]]; then
  if ! docker container inspect "$FRONTEND_NAME" >/dev/null 2>&1; then
    echo "nginx-api: 프런트엔드 컨테이너를 찾지 못했습니다. --slot을 지정하지 않으면 추측하지 않습니다." >&2
    exit 1
  fi
  ssr_status="$(frontend_api_status "$FRONTEND_NAME")" || {
    echo "nginx-api: INTERNAL_API_URL을 읽지 못했습니다. 설정은 변경하지 않습니다." >&2
    exit 1
  }
  case "$ssr_status" in
    missing)
      echo "nginx-api: INTERNAL_API_URL이 없습니다. 슬롯을 추측하지 않고 중단합니다." >&2
      exit 1
      ;;
    conflict)
      echo "nginx-api: INTERNAL_API_URL이 서로 다른 값으로 중복되어 슬롯을 판단할 수 없습니다. Config.Env 순서로 고르지 않습니다. 설정은 변경하지 않습니다." >&2
      exit 1
      ;;
    invalid)
      echo "nginx-api: INTERNAL_API_URL이 blue/green 컨테이너 주소가 아닙니다. 슬롯을 추측하지 않고 중단합니다." >&2
      exit 1
      ;;
    "ok portfolio-backend-blue single" | "ok portfolio-backend-blue same") SLOT=blue ;;
    "ok portfolio-backend-green single" | "ok portfolio-backend-green same") SLOT=green ;;
    *)
      echo "nginx-api: INTERNAL_API_URL 판별에 실패했습니다. 설정은 변경하지 않습니다." >&2
      exit 1
      ;;
  esac
  if [[ "$ssr_status" == *" same" ]]; then
    echo "nginx-api: INTERNAL_API_URL이 같은 값으로 여러 번 등록되어 있습니다. 그 하나의 주소로 슬롯 ${SLOT}을 판별했습니다." >&2
  fi
fi

TARGET_PORT="$(port_for_slot "$SLOT")" || {
  echo "nginx-api: slot은 blue 또는 green이어야 합니다." >&2
  exit 1
}
TARGET_CONTAINER="$(container_for_slot "$SLOT")"
running="false"
if docker container inspect "$TARGET_CONTAINER" >/dev/null 2>&1; then
  running="$(docker container inspect -f '{{.State.Running}}' "$TARGET_CONTAINER")"
fi
if [[ "$running" != "true" ]]; then
  echo "nginx-api: ${TARGET_CONTAINER}가 실행 중이 아닙니다. Nginx를 그 슬롯으로 바꾸지 않습니다." >&2
  exit 1
fi
published="$(docker container inspect -f '{{(index (index .NetworkSettings.Ports "8080/tcp") 0).HostPort}}' "$TARGET_CONTAINER")"
if [[ "$published" != "$TARGET_PORT" ]]; then
  echo "nginx-api: ${TARGET_CONTAINER} 호스트 포트가 ${TARGET_PORT}가 아닙니다." >&2
  exit 1
fi

dump="$(run_nginx -T 2>&1)" || {
  echo "nginx-api: nginx -T 실패. 설정 파일을 추측하지 않습니다." >&2
  exit 1
}
mapfile -t config_files < <(printf '%s\n' "$dump" | python3 "$ROOT/ops/nginx/rewrite_api_proxy.py" find-files)
if [[ "${#config_files[@]}" -eq 0 ]]; then
  echo "nginx-api: nginx -T에 설정 파일 경로가 없습니다." >&2
  exit 1
fi

declare -a api_files=()
for file in "${config_files[@]}"; do
  [[ -f "$file" ]] || continue
  if python3 - "$file" <<'PY'
import pathlib, sys
text = pathlib.Path(sys.argv[1]).read_text()
sys.exit(0 if "location /api" in text else 1)
PY
  then
    api_files+=("$file")
  fi
done
if [[ "${#api_files[@]}" -eq 0 ]]; then
  echo "nginx-api: /api location이 있는 설정 파일을 찾지 못했습니다." >&2
  exit 1
fi

changed=0
stamp="$(date +%Y%m%d%H%M%S)"
backup="$BACKUP_DIR/$stamp"
begin_nginx_backup "$backup"
restore_needed=0

restore() {
  [[ "$restore_needed" == "1" ]] || return 0
  [[ -x "$backup/restore.sh" ]] || return 1
  "$backup/restore.sh"
}

trap 'status=$?; if [[ "$status" -ne 0 ]]; then if ! restore; then echo "nginx-api: PRESERVED backup $backup" >&2; echo "nginx-api: nginx 복구 명령: bash $backup/restore.sh" >&2; fi; fi; exit "$status"' EXIT

for file in "${api_files[@]}"; do
  record_backup_file "$backup" "$file"
done
if [[ -f "$SERVICE_URL_INC" ]]; then
  record_backup_file "$backup" "$SERVICE_URL_INC"
fi
write_nginx_restore_script "$backup"
write_recovery_state "$backup" \
  frontend_name "$FRONTEND_NAME" \
  frontend_previous "" \
  active_backend "$TARGET_CONTAINER" \
  active_port "$TARGET_PORT" \
  active_slot "$SLOT" \
  new_backend ""
restore_needed=1

tmp_inc="$(mktemp)"
printf 'set $service_url http://127.0.0.1:%s;\n' "$TARGET_PORT" >"$tmp_inc"
current_inc=""
[[ -f "$SERVICE_URL_INC" ]] && current_inc="$(cat "$SERVICE_URL_INC" 2>/dev/null || sudo cat "$SERVICE_URL_INC")"
if [[ "$current_inc" != "$(cat "$tmp_inc")" ]]; then
  if [[ -w "$(dirname "$SERVICE_URL_INC")" || -w "$SERVICE_URL_INC" ]]; then
    cat "$tmp_inc" >"$SERVICE_URL_INC"
  else
    sudo tee "$SERVICE_URL_INC" >/dev/null <"$tmp_inc"
  fi
  changed=1
fi
rm -f "$tmp_inc"

for file in "${api_files[@]}"; do
  out="$(mktemp)"
  result="$(python3 "$ROOT/ops/nginx/rewrite_api_proxy.py" rewrite --file "$file" --include "$SERVICE_URL_INC" --output "$out")"
  if [[ "$result" == "changed" ]]; then
    if [[ -w "$file" ]]; then
      cat "$out" >"$file"
    else
      sudo tee "$file" >/dev/null <"$out"
    fi
    changed=1
  fi
  rm -f "$out"
done

if [[ "$changed" == "0" ]]; then
  restore_needed=0
  trap - EXIT
  echo "nginx-api: already aligned to ${SLOT} ${TARGET_CONTAINER}" >&2
  exit 0
fi

run_nginx -t || {
  echo "nginx-api: nginx -t 실패. 백업에서 복구합니다." >&2
  exit 1
}
run_nginx -s reload || {
  echo "nginx-api: nginx reload 실패. 백업에서 복구합니다." >&2
  exit 1
}

curl -fsS --max-time 20 -o /dev/null "$PUBLIC_ORIGIN/" || {
  echo "nginx-api: 프런트엔드 응답 확인 실패. 복구합니다." >&2
  exit 1
}
curl -fsS --max-time 20 -o /dev/null "$PUBLIC_ORIGIN/api/products" || {
  echo "nginx-api: 공개 API 응답 확인 실패. 복구합니다." >&2
  exit 1
}
curl -fsS --max-time 20 -o /dev/null "http://127.0.0.1:${TARGET_PORT}/api/products" || {
  echo "nginx-api: 슬롯 API 응답 확인 실패. 복구합니다." >&2
  exit 1
}

dump="$(run_nginx -T 2>&1)"
printf '%s\n' "$dump" | python3 "$ROOT/ops/nginx/rewrite_api_proxy.py" assert-ready --include "$SERVICE_URL_INC"
active="$(read_active_port "$SERVICE_URL_INC")"
[[ "$active" == "$TARGET_PORT" ]] || {
  echo "nginx-api: service-url.inc 포트가 슬롯과 다릅니다." >&2
  exit 1
}

restore_needed=0
trap - EXIT
echo "nginx-api: ${SLOT} 호스트 ${TARGET_PORT} / 컨테이너 ${TARGET_CONTAINER} 로 API를 정렬했습니다." >&2
echo "nginx-api: backup $backup" >&2
echo "nginx-api: manifest $backup/manifest.tsv" >&2
echo "nginx-api: nginx 복구 명령: bash $backup/restore.sh" >&2
