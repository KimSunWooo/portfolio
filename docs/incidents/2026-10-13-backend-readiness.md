# 2026-10-13 새 백엔드 준비 검사 실패

## 발생 조건과 영향

`350590a`를 `main`에 push한 GitHub Actions 배포가 새 백엔드의 `GET /api/products` 준비 검사에서 실패했다. 스크립트는 `phase backend`에서 롤백했고, 실패 컨테이너를 삭제하지 않고 이름을 바꿨다. 이 단계는 프런트엔드 교체와 Nginx 전환보다 앞이다. 따라서 이 실패만으로 공개 프런트가 새 이미지로 바뀌지는 않는다.

프런트 교체가 진행되는 배포에서는 호스트 3000을 잠시 비운다. 이번 실패 실행은 그 단계에 들어가지 않았다.

## 기준 기록

- 실패 커밋: `350590a3390b87574fc8ce62142596345cf13e73` (`handling deploy, auth issue`)
- 실패 실행: https://github.com/KimSunWooo/portfolio/actions/runs/38419456626
- 성공한 job: `frontend-checks`, `backend-tests`, `verify-deploy`, `build-and-push`
- 실패한 job: `deploy` (job `115374998147`)
- 이전 검토에서 전달된 로그 문구: `rollback from phase backend`, 보존 이름 `portfolio-backend-blue-failed-20261013151545`
- 이 세션에서 Actions 로그 본문은 받지 못했다. 로그 API는 403이었고, 웹 페이지는 로그인해야 로그가 보였다. EC2 SSH 키도 없어 보존 컨테이너 로그는 읽지 못했다.

작업 시작 시 로컬 `HEAD`는 `9fbcd64`였고, fetch 뒤 `origin/main`은 `350590a`였다. 작업 트리는 깨끗해서 fast-forward했다.

같은 저장소의 이전 실행 https://github.com/KimSunWooo/portfolio/actions/runs/38222824863 (`9fbcd64`)도 실패로 끝나 있다. 그 커밋에는 `CartSyncRequest`가 없고 로그를 읽지 못했으므로, 이번 준비 검사 실패와 같은 원인으로 보지 않는다.

## 근본 원인

운영 프로파일은 `spring.jpa.hibernate.ddl-auto=validate`다. `350590a`는 `cart_sync_requests`에 매핑되는 `CartSyncRequest`를 추가했지만, Flyway 의존성은 없었고 `V1__cart_sync_requests.sql`은 애플리케이션이나 `deploy.sh`가 실행하지 않는 수동 SQL이었다.

이 세션의 읽기 전용 조회로 `portfolio_db`에 `cart_sync_requests`와 `flyway_schema_history`가 없었다. 새 이미지는 검증 단계에서 없는 테이블 때문에 기동을 끝내지 못하고, 호스트 포트의 `/api/products`가 제한 시간 안에 성공하지 않는다. `deploy.sh`는 그 실패를 `phase backend`로 롤백한다.

## 가설

| 가설 | 확인 | 판단 |
| --- | --- | --- |
| 스키마 검증 실패 | 엔티티, `validate`, 미실행 SQL, 운영 DB에 테이블 없음 | 채택 |
| Nginx 업스트림 또는 SSR 주소 불일치 | 그 검사는 백엔드 기동 전에 있다. 보고된 단계는 `backend` | 이번 실패 지점으로는 배제. 서버의 Nginx 원문은 미확인 |
| `INTERNAL_API_URL` 중복 | 프런트 교체 전에 실패 | 이번 단계의 원인으로는 배제 |
| 준비 검사 시간 부족 | 기동 시간을 측정하지 못함. 프로세스 기동 예외가 먼저 설명된다 | 배제. 제한 시간은 늘리지 않음 |
| 이미지와 커밋 불일치 | workflow는 `github.sha` 태그를 배포한다 | 배제 |
| 메모리, 포트, Redis, 컨테이너 종료 코드 | EC2와 Actions 로그 본문 미확인 | 남음. 위 스키마 조건만으로도 기동은 실패한다 |

## 수정

운영 프로파일에서만 Flyway를 켠다. 기본 프로파일은 `spring.flyway.enabled=false`라서 로컬과 테스트가 공유 DB를 마이그레이션하지 않는다. 운영 기동은 `V1`으로 `cart_sync_requests`를 만든 뒤 기존처럼 `validate`한다. 기존 테이블의 행은 읽거나 바꾸지 않는다. `flyway_schema_history`도 새로 생긴다.

준비 검사 실패 시 컨테이너 실행 여부와 최근 로그를 남긴다. 비밀번호, 시크릿, 토큰, API 키 형태는 `<redacted>`로 바꾼다. 검사 실패를 성공으로 바꾸지는 않는다.

`ERR` 트랩은 명령 실패를 롤백한다. `SIGKILL`이나 호스트 재시작은 이 트랩으로 복구되지 않는다. 다음 배포는 잠금과 슬롯 사용 여부를 다시 확인한다.

## 테스트

- `bash ops/tests/run-deploy-checks.sh`: 통과. 백엔드 준비 실패 시 기존 서비스 유지, 스키마 로그 출력, 비밀값 제거를 포함한다.
- `./gradlew test --tests com.project.backend_api.db.CartSyncFlywayMigrationTest`: 통과. 빈 MySQL에 `V1`을 두 번 적용하고, `cart_sync_requests`만 생기고 `carts`는 생기지 않는지 확인했다.
- 샌드박스 안의 `flock` 대기는 잠금 헬퍼가 준비되기 전에 끊겼다. 같은 검사를 샌드박스 밖에서 다시 실행하면 통과했다. GitHub `verify-deploy`가 이 커밋에서 이미 통과한 잠금 검사와 같은 종류의 제한이다.

## 배포 결과

이 문서를 포함한 수정 커밋의 Actions 실행이 끝나기 전에는 배포 성공으로 적지 않는다. 결과 절은 실행 확인 뒤에 갱신한다.

수정 전 공개 확인(2026-10-22, 롤백된 서비스):

- `https://swportfolioservices.com/` HTTP 200
- `https://swportfolioservices.com/api/products` HTTP 200, 상품 객체 38개. 필드에 `id`, `name`, `price`, `stock`, `thumbnail`이 있었다.

## 복구

자동 롤백은 새 백엔드를 멈추고 `portfolio-backend-blue-failed-<시각>`처럼 남긴 뒤 기존 백엔드를 유지한다. 프런트와 Nginx는 이 단계에서 바꾸지 않는다.

Flyway가 적용된 뒤 새 이미지를 되돌릴 때 기존 테이블은 그대로 둔다. 마이그레이션만 취소하려면 새 백엔드를 멈춘 다음 `cart_sync_requests`와 `flyway_schema_history`만 제거한다. `carts`와 `cart_items`는 지우지 않는다.

## 이력서·PT용 사실

1. `validate` 운영 DB에 없는 `cart_sync_requests` 때문에 새 백엔드가 `/api/products` 준비 검사에 실패했다.
2. 운영 프로파일에만 Flyway `V1`을 넣어 그 테이블을 만든 뒤 검증하게 했다. 기존 테이블은 변경하지 않는다.
3. 빈 MySQL 마이그레이션 테스트와 배포 스크립트 모의 검사로 확인했다.
4. 실패 당시 공개 서비스는 롤백된 뒤 메인과 상품 API가 응답했다. 수정 커밋의 배포 성공 여부는 그 Actions 실행으로 따로 확인한다.
5. 보존 컨테이너 로그와 EC2 Nginx 원문은 이 환경에서 읽지 못했다. 무중단이나 시간 개선은 측정하지 않았다.
