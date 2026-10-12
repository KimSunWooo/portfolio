#!/usr/bin/env bash
# Inspect or restore a portfolio deploy backup.
# Check mode prints the manifest and recorded container names and does not stop anything.
# --apply refuses while the public site still responds, unless --force is given.
# Container names come only from recovery-state. This script does not guess a slot.
set -Eeuo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# shellcheck source=../lib/slots.sh
source "$ROOT/ops/lib/slots.sh"
use_shared_project_paths

PUBLIC_ORIGIN="${PUBLIC_ORIGIN:-https://swportfolioservices.com}"
BACKUP=""
APPLY=0
FORCE=0

usage() {
  echo "usage: $0 --backup DIR [--apply] [--force]" >&2
  exit 2
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --backup)
      BACKUP="$2"
      shift 2
      ;;
    --apply)
      APPLY=1
      shift
      ;;
    --force)
      FORCE=1
      shift
      ;;
    -h | --help) usage ;;
    *) usage ;;
  esac
done

[[ -n "$BACKUP" && -d "$BACKUP" ]] || usage
[[ -f "$BACKUP/manifest.tsv" ]] || {
  echo "recover: manifest가 없습니다: $BACKUP/manifest.tsv" >&2
  exit 1
}
[[ -f "$BACKUP/recovery-state" ]] || {
  echo "recover: recovery-state가 없습니다. 컨테이너 이름을 추측하지 않고 중단합니다." >&2
  exit 1
}

state_value() {
  local key="$1" line
  line="$(grep -E "^${key}=" "$BACKUP/recovery-state" | head -n 1 || true)"
  [[ -n "$line" ]] || return 1
  printf '%s\n' "${line#*=}"
}

container_name_ok() {
  [[ "$1" =~ ^[A-Za-z0-9][A-Za-z0-9_.-]*$ ]]
}

echo "recover: backup=$BACKUP lock=$LOCK_FILE" >&2
echo "recover: manifest" >&2
cat "$BACKUP/manifest.tsv" >&2
echo "recover: recovery-state" >&2
cat "$BACKUP/recovery-state" >&2

frontend_name="$(state_value frontend_name || true)"
frontend_previous="$(state_value frontend_previous || true)"
active_backend="$(state_value active_backend || true)"
active_port="$(state_value active_port || true)"
active_slot="$(state_value active_slot || true)"

echo "recover: 기록된 프런트=${frontend_name:-<없음>} 보존프런트=${frontend_previous:-<없음>} 이전백엔드=${active_backend:-<없음>} 포트=${active_port:-<없음>} 슬롯=${active_slot:-<없음>}" >&2

healthy=0
if curl -fsS --max-time 20 -o /dev/null "$PUBLIC_ORIGIN/" \
  && curl -fsS --max-time 20 -o /dev/null "${PUBLIC_ORIGIN}/api/products"; then
  healthy=1
fi

if [[ "$healthy" == "1" ]]; then
  echo "recover: 공개 메인과 API가 응답합니다. 컨테이너를 중지하지 않습니다." >&2
  if [[ "$APPLY" == "1" && "$FORCE" != "1" ]]; then
    exit 0
  fi
fi

if [[ "$APPLY" != "1" ]]; then
  echo "recover: --apply 없이는 Nginx와 컨테이너를 변경하지 않습니다." >&2
  echo "recover: 파일별 복구 명령: bash $BACKUP/restore.sh" >&2
  exit 0
fi

acquire_deploy_lock

if [[ -z "$active_backend" ]] || ! container_name_ok "$active_backend"; then
  echo "recover: recovery-state의 active_backend가 없습니다. 슬롯을 추측하지 않습니다." >&2
  exit 1
fi
if ! docker container inspect "$active_backend" >/dev/null 2>&1; then
  echo "recover: 기록된 백엔드 컨테이너가 없습니다: $active_backend" >&2
  echo "recover: 프런트엔드를 중지하지 않습니다." >&2
  exit 1
fi

if [[ -n "$frontend_previous" ]]; then
  if ! container_name_ok "$frontend_previous"; then
    echo "recover: 보존 프런트 이름이 올바르지 않습니다: $frontend_previous" >&2
    exit 1
  fi
  if ! docker container inspect "$frontend_previous" >/dev/null 2>&1; then
    echo "recover: 보존 프런트 컨테이너가 없습니다: $frontend_previous" >&2
    echo "recover: 프런트엔드를 중지하지 않습니다." >&2
    exit 1
  fi
fi

[[ -x "$BACKUP/restore.sh" ]] || {
  echo "recover: restore.sh가 없습니다: $BACKUP/restore.sh" >&2
  exit 1
}
if ! "$BACKUP/restore.sh"; then
  echo "recover: Nginx 복구가 실패했습니다. 백업 $BACKUP 을 유지하고 컨테이너는 중지하지 않습니다." >&2
  exit 1
fi

if [[ -z "$frontend_previous" ]]; then
  if ! docker start "$active_backend" >/dev/null; then
    echo "recover: $active_backend 시작에 실패했습니다. 컨테이너는 삭제하지 않았습니다." >&2
    exit 1
  fi
  echo "recover: 보존 프런트 기록이 없어 프런트엔드는 중지하지 않았습니다." >&2
  exit 0
fi

if [[ -z "$frontend_name" ]] || ! container_name_ok "$frontend_name"; then
  echo "recover: recovery-state의 frontend_name이 없습니다. 프런트를 중지하지 않습니다." >&2
  exit 1
fi

if docker container inspect "$frontend_name" >/dev/null 2>&1; then
  if ! docker stop "$frontend_name" >/dev/null; then
    echo "recover: $frontend_name 중지에 실패했습니다. 컨테이너를 삭제하지 않았습니다." >&2
    exit 1
  fi
  failed="${frontend_name}-failed-$(date +%Y%m%d%H%M%S)"
  if ! docker rename "$frontend_name" "$failed" >/dev/null; then
    echo "recover: $frontend_name 이름 변경에 실패했습니다. 컨테이너를 삭제하지 않았습니다." >&2
    exit 1
  fi
  echo "recover: PRESERVED $failed" >&2
fi

if ! docker rename "$frontend_previous" "$frontend_name" >/dev/null; then
  echo "recover: $frontend_previous 를 $frontend_name 으로 바꾸지 못했습니다. 컨테이너를 삭제하지 않았습니다." >&2
  exit 1
fi
if ! docker start "$frontend_name" >/dev/null; then
  echo "recover: $frontend_name 시작에 실패했습니다. 컨테이너는 보존되어 있습니다." >&2
  exit 1
fi
if ! docker start "$active_backend" >/dev/null; then
  echo "recover: $active_backend 시작에 실패했습니다. 컨테이너는 보존되어 있습니다." >&2
  exit 1
fi
echo "recover: 기록된 컨테이너 ${frontend_previous} 와 ${active_backend} 로 되돌렸습니다." >&2
