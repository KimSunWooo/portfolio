#!/usr/bin/env bash
# Blue/green deploy for swportfolioservices.com.
# The frontend keeps a single host port 3000, so replacing it leaves a short gap.
# This script does not delete .env, Redis, the database, or S3 objects, and it does not prune images.
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=ops/lib/slots.sh
source "$ROOT/ops/lib/slots.sh"
use_shared_project_paths
NETWORK="${NETWORK:-portfolio_default}"
SERVICE_URL_INC="${SERVICE_URL_INC:-/etc/nginx/conf.d/service-url.inc}"
FRONTEND_NAME="${FRONTEND_NAME:-portfolio-frontend}"
PUBLIC_ORIGIN="${PUBLIC_ORIGIN:-https://swportfolioservices.com}"
HEALTH_PATH="${HEALTH_PATH:-/api/products}"
HEALTH_TIMEOUT="${HEALTH_TIMEOUT:-90}"
HEALTH_INTERVAL="${HEALTH_INTERVAL:-1}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/portfolio-nginx}"
BACKEND_IMAGE=""
FRONTEND_IMAGE=""

PHASE="start"
NEW_BACKEND=""
OLD_BACKEND=""
FRONTEND_PREVIOUS=""
NGINX_BACKUP=""
ROLLBACK_DONE=0

usage() {
  echo "usage: $0 --backend-image NAME:TAG --frontend-image NAME:TAG" >&2
  exit 2
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --backend-image)
      BACKEND_IMAGE="$2"
      shift 2
      ;;
    --frontend-image)
      FRONTEND_IMAGE="$2"
      shift 2
      ;;
    -h | --help) usage ;;
    *) usage ;;
  esac
done

die() {
  echo "deploy: $*" >&2
  set +e
  rollback
  exit 1
}

require_tag() {
  local image="$1" tag
  [[ "$image" == *:* && "$image" != *: ]] || die "이미지 태그가 없습니다: $image"
  tag="${image##*:}"
  [[ "$tag" != "latest" ]] || die "배포 대상으로 :latest 를 거부합니다: $image"
}

wait_http() {
  local url="$1" deadline
  deadline=$((SECONDS + HEALTH_TIMEOUT))
  while (( SECONDS < deadline )); do
    if curl -fsS --max-time 5 -o /dev/null "$url"; then
      return 0
    fi
    sleep "$HEALTH_INTERVAL"
  done
  return 1
}

container_exists() {
  docker container inspect "$1" >/dev/null 2>&1
}

container_running() {
  [[ "$(docker container inspect -f '{{.State.Running}}' "$1" 2>/dev/null || echo false)" == "true" ]]
}

container_in_use() {
  local name="$1" port="$2" active_port status
  active_port="$(read_active_port "$SERVICE_URL_INC")" || return 0
  [[ "$port" == "$active_port" ]] && return 0
  if container_exists "$FRONTEND_NAME"; then
    status="$(frontend_api_status "$FRONTEND_NAME")" || return 0
    case "$status" in
      "ok ${name} single" | "ok ${name} same")
        return 0
        ;;
    esac
  fi
  return 1
}

refuse_ambiguous_target() {
  local status
  if ! container_exists "$TARGET_CONTAINER" || ! container_exists "$FRONTEND_NAME"; then
    return 0
  fi
  status="$(frontend_api_status "$FRONTEND_NAME")" \
    || die "프런트 INTERNAL_API_URL을 읽지 못해 ${TARGET_CONTAINER}를 삭제하지 않습니다."
  if [[ "$status" == "conflict" ]]; then
    die "프런트 INTERNAL_API_URL이 서로 다른 값으로 중복되어 ${TARGET_CONTAINER} 사용 여부를 확인할 수 없습니다. 확인 전에 삭제하지 않습니다."
  fi
}

preserve_message() {
  echo "deploy: PRESERVED containers and nginx backup ${NGINX_BACKUP:-<none>}. 자동 복구가 끝나지 않았습니다." >&2
  if [[ -n "$NGINX_BACKUP" && -f "$NGINX_BACKUP/manifest.tsv" ]]; then
    echo "deploy: manifest ${NGINX_BACKUP}/manifest.tsv" >&2
    echo "deploy: nginx 복구 명령: bash ${NGINX_BACKUP}/restore.sh" >&2
  fi
}

restore_frontend() {
  local failed
  # The preserved container keeps the env it was created with, including any
  # INTERNAL_API_URL duplicates. Rollback starts that container unchanged.
  [[ -n "$FRONTEND_PREVIOUS" ]] || return 0
  if container_exists "$FRONTEND_NAME"; then
    docker stop "$FRONTEND_NAME" >/dev/null 2>&1 || return 1
    failed="${FRONTEND_NAME}-failed-$(date +%Y%m%d%H%M%S)"
    docker rename "$FRONTEND_NAME" "$failed" >/dev/null 2>&1 || return 1
    echo "deploy: PRESERVED failed frontend as $failed" >&2
  fi
  docker rename "$FRONTEND_PREVIOUS" "$FRONTEND_NAME" >/dev/null 2>&1 || return 1
  docker start "$FRONTEND_NAME" >/dev/null 2>&1 || return 1
  FRONTEND_PREVIOUS=""
}

rollback() {
  local preserved=0 retired
  [[ "$ROLLBACK_DONE" == "1" ]] && return 0
  ROLLBACK_DONE=1
  set +e
  echo "deploy: rollback from phase ${PHASE}" >&2

  if [[ "$PHASE" == "nginx" || "$PHASE" == "stopped-old" ]]; then
    if [[ -n "$NGINX_BACKUP" && -x "$NGINX_BACKUP/restore.sh" ]]; then
      if ! "$NGINX_BACKUP/restore.sh"; then
        echo "deploy: Nginx manifest 복구가 실패했습니다. 백업 ${NGINX_BACKUP} 을 유지합니다." >&2
        preserve_message
        preserved=1
      fi
    else
      preserve_message
      preserved=1
    fi
  fi

  if [[ -n "$FRONTEND_PREVIOUS" ]]; then
    restore_frontend || preserved=1
  fi

  if [[ -n "$NEW_BACKEND" ]] && container_exists "$NEW_BACKEND"; then
    docker stop "$NEW_BACKEND" >/dev/null 2>&1 || preserved=1
    retired="${NEW_BACKEND}-failed-$(date +%Y%m%d%H%M%S)"
    if docker rename "$NEW_BACKEND" "$retired" >/dev/null 2>&1; then
      echo "deploy: PRESERVED failed backend as $retired" >&2
    else
      preserved=1
    fi
  fi

  if [[ "$PHASE" == "stopped-old" && -n "$OLD_BACKEND" ]]; then
    docker start "$OLD_BACKEND" >/dev/null 2>&1 || preserved=1
  fi

  if [[ "$preserved" -ne 0 ]]; then
    preserve_message
    return 1
  fi
  return 0
}

trap 'status=$?; echo "deploy: failed near line $LINENO" >&2; if ! rollback; then echo "deploy: 복구 단계가 실패했습니다. 컨테이너와 백업을 보존했습니다." >&2; fi; exit "$status"' ERR

require_tag "$BACKEND_IMAGE"
require_tag "$FRONTEND_IMAGE"
acquire_deploy_lock
echo "deploy: script=${ROOT} project=${PROJECT_DIR} env=${ENV_FILE} lock=${LOCK_FILE}" >&2
for required in \
  "$ROOT/ops/lib/frontend_run.py" \
  "$ROOT/ops/nginx/rewrite_api_proxy.py" \
  "$ROOT/ops/nginx/apply-api-upstream.sh" \
  "$ROOT/ops/nginx/recover-service.sh"
do
  [[ -f "$required" ]] || die "같은 배포 폴더의 파일이 없습니다: $required"
done

[[ -f "$ENV_FILE" ]] || die ".env 파일이 없습니다: $ENV_FILE"
docker network inspect "$NETWORK" >/dev/null 2>&1 || die "Docker 네트워크가 없습니다: $NETWORK"

backup_root="$(readlink -f "$BACKUP_DIR" 2>/dev/null || echo "$BACKUP_DIR")"
case "$backup_root" in
  /etc/nginx | /etc/nginx/*)
    die "Nginx 백업 경로는 /etc/nginx 밖이어야 합니다."
    ;;
esac

dump="$(run_nginx -T 2>&1)" || die "nginx -T 실패"
printf '%s\n' "$dump" | python3 "$ROOT/ops/nginx/rewrite_api_proxy.py" assert-ready --include "$SERVICE_URL_INC" \
  || die "Nginx /api 가 service-url.inc 와 proxy_pass \$service_url 을 사용하지 않습니다. 배포 전에 ops/nginx/apply-api-upstream.sh 를 적용하세요."

active_port="$(read_active_port "$SERVICE_URL_INC")" || die "활성 포트가 8081 또는 8082로 확인되지 않아 중단합니다."
active_slot="$(slot_for_port "$active_port")"
target_slot="$(other_slot "$active_slot")"
target_port="$(port_for_slot "$target_slot")"
TARGET_CONTAINER="$(container_for_slot "$target_slot")"
OLD_BACKEND="$(container_for_slot "$active_slot")"
container_exists "$OLD_BACKEND" || die "활성 백엔드 컨테이너가 없습니다: $OLD_BACKEND"

if container_exists portfolio-backend-api-1; then
  echo "CLEANUP_LATER portfolio-backend-api-1 는 호스트 8080 Compose 백엔드입니다. blue/green 전환에서 삭제하거나 재시작하지 않습니다." >&2
fi

refuse_ambiguous_target
if container_exists "$TARGET_CONTAINER"; then
  if container_in_use "$TARGET_CONTAINER" "$target_port"; then
    die "대상 슬롯 ${TARGET_CONTAINER}가 이미 사용 중입니다. 확인 전에 삭제하지 않습니다."
  fi
fi

echo "deploy: pull ${BACKEND_IMAGE} and ${FRONTEND_IMAGE}" >&2
docker pull "$BACKEND_IMAGE"
docker pull "$FRONTEND_IMAGE"
PHASE="pulled"

refuse_ambiguous_target
if container_exists "$TARGET_CONTAINER"; then
  if container_in_use "$TARGET_CONTAINER" "$target_port"; then
    die "pull 이후 대상 슬롯이 사용 중이 되었습니다. 삭제하지 않습니다."
  fi
  retired="${TARGET_CONTAINER}-retired-$(date +%Y%m%d%H%M%S)"
  docker rename "$TARGET_CONTAINER" "$retired"
  docker stop "$retired" >/dev/null
  echo "deploy: PRESERVED unused ${TARGET_CONTAINER} as ${retired}" >&2
fi

NEW_BACKEND="$TARGET_CONTAINER"
docker run -d \
  --name "$NEW_BACKEND" \
  --restart unless-stopped \
  --network "$NETWORK" \
  --env-file "$ENV_FILE" \
  -p "${target_port}:8080" \
  "$BACKEND_IMAGE"
PHASE="backend"
wait_http "http://127.0.0.1:${target_port}${HEALTH_PATH}" || die "새 백엔드 준비 확인에 실패했습니다. 기존 서비스는 유지됩니다."

container_exists "$FRONTEND_NAME" || die "프런트엔드 컨테이너가 없습니다: $FRONTEND_NAME"
pending_previous="${FRONTEND_NAME}-previous"
if container_exists "$pending_previous"; then
  pending_previous="${FRONTEND_NAME}-previous-$(date +%Y%m%d%H%M%S)"
fi
docker rename "$FRONTEND_NAME" "$pending_previous"
FRONTEND_PREVIOUS="$pending_previous"
docker stop "$FRONTEND_PREVIOUS" >/dev/null
PHASE="frontend"

spec_dir="$(mktemp -d)"
docker container inspect "$FRONTEND_PREVIOUS" | python3 "$ROOT/ops/lib/frontend_run.py" \
  --name "$FRONTEND_NAME" \
  --image "$FRONTEND_IMAGE" \
  --internal-api-url "http://${TARGET_CONTAINER}:8080" \
  --network "$NETWORK" \
  --out-dir "$spec_dir"
mapfile -d '' -t run_args <"$spec_dir/args.nul"
cleaned=()
for item in "${run_args[@]}"; do
  [[ -n "$item" ]] && cleaned+=("$item")
done
api_args=0
for item in "${cleaned[@]}"; do
  if [[ "$item" == "--env-file" ]]; then
    die "프런트 실행 인수에 --env-file이 있습니다. .env의 INTERNAL_API_URL을 다시 넣지 않습니다."
  fi
  if [[ "$item" == INTERNAL_API_URL=* ]]; then
    [[ "$item" == "INTERNAL_API_URL=http://${TARGET_CONTAINER}:8080" ]] \
      || die "프런트 INTERNAL_API_URL이 대상 백엔드가 아닙니다."
    api_args=$((api_args + 1))
  fi
done
[[ "$api_args" -eq 1 ]] || die "프런트 실행 인수에 INTERNAL_API_URL이 하나가 아닙니다."
"${cleaned[@]}"
if [[ -f "$spec_dir/networks.txt" ]]; then
  while IFS= read -r extra_net; do
    [[ -n "$extra_net" ]] || continue
    docker network connect "$extra_net" "$FRONTEND_NAME"
  done <"$spec_dir/networks.txt"
fi
rm -rf "$spec_dir"

wait_http "http://127.0.0.1:3000/" || die "새 프런트엔드 준비 확인에 실패했습니다. 이전 컨테이너로 복구합니다."
ssr_status="$(frontend_api_status "$FRONTEND_NAME")" || die "새 프런트의 INTERNAL_API_URL을 확인하지 못했습니다."
[[ "$ssr_status" == "ok ${TARGET_CONTAINER} single" ]] \
  || die "새 프런트의 INTERNAL_API_URL이 대상 백엔드 하나로 확인되지 않았습니다."

stamp="$(date +%Y%m%d%H%M%S)"
NGINX_BACKUP="$BACKUP_DIR/$stamp"
begin_nginx_backup "$NGINX_BACKUP"
record_backup_file "$NGINX_BACKUP" "$SERVICE_URL_INC"
write_nginx_restore_script "$NGINX_BACKUP"
write_recovery_state "$NGINX_BACKUP" \
  frontend_name "$FRONTEND_NAME" \
  frontend_previous "$FRONTEND_PREVIOUS" \
  active_backend "$OLD_BACKEND" \
  active_port "$active_port" \
  active_slot "$active_slot" \
  new_backend "$NEW_BACKEND"
PHASE="nginx"
write_service_url "$SERVICE_URL_INC" "$target_port"
run_nginx -t || die "nginx -t 실패. 이전 설정과 서비스로 복구합니다."
run_nginx -s reload || die "nginx reload 실패. 이전 설정과 서비스로 복구합니다."

wait_http "$PUBLIC_ORIGIN/" || die "메인 페이지 응답 확인에 실패했습니다."
wait_http "${PUBLIC_ORIGIN}${HEALTH_PATH}" || die "공개 API 응답 확인에 실패했습니다."
wait_http "http://127.0.0.1:${target_port}${HEALTH_PATH}" || die "슬롯 API 응답 확인에 실패했습니다."
switched="$(read_active_port "$SERVICE_URL_INC")" || die "전환 후 활성 포트를 확인하지 못했습니다."
[[ "$switched" == "$target_port" ]] || die "Nginx 활성 포트가 새 슬롯과 다릅니다."

PHASE="stopped-old"
docker stop "$OLD_BACKEND" >/dev/null
wait_http "${PUBLIC_ORIGIN}${HEALTH_PATH}" || die "이전 백엔드를 멈춘 뒤 공개 API가 새 슬롯을 보지 못했습니다."

trap - ERR
ROLLBACK_DONE=1
if [[ "$(readlink -f "$0" 2>/dev/null || echo "$0")" != "$(readlink -f "$PROJECT_DIR/deploy.sh" 2>/dev/null || echo missing)" ]]; then
  cp "$0" "$PROJECT_DIR/deploy.sh"
  chmod +x "$PROJECT_DIR/deploy.sh"
  mkdir -p "$PROJECT_DIR/ops/lib" "$PROJECT_DIR/ops/nginx"
  cp -a "$ROOT/ops/lib/." "$PROJECT_DIR/ops/lib/"
  cp -a "$ROOT/ops/nginx/." "$PROJECT_DIR/ops/nginx/"
fi
echo "deploy: ${target_slot} 포트 ${target_port} / SSR http://${TARGET_CONTAINER}:8080" >&2
echo "deploy: 프런트엔드 3000 교체 구간에 짧은 공백이 있습니다. 이전 백엔드 ${OLD_BACKEND}는 중지했고 삭제하지 않았습니다." >&2
echo "CLEANUP_LATER portfolio-backend-api-1 이 아직 8080에서 실행 중이면 연결이 없는지 확인한 뒤 별도로 정리하세요." >&2
