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
- Actions 로그 본문은 이 환경에서 받지 못했다. 로그 API는 403이었고, 웹 페이지는 로그인해야 로그가 보였다. EC2 SSH로 보존 컨테이너 로그도 읽지 못했다.

작업 시작 시 로컬 `HEAD`는 `9fbcd64`였고, fetch 뒤 `origin/main`은 `350590a`였다. 작업 트리는 깨끗해서 fast-forward했다.

같은 저장소의 이전 실행 https://github.com/KimSunWooo/portfolio/actions/runs/38222824863 (`9fbcd64`)도 실패로 끝나 있다. 그 커밋에는 `CartSyncRequest`가 없고 로그를 읽지 못했으므로, 이번 준비 검사 실패와 같은 원인으로 보지 않는다.

## 근본 원인

운영 프로파일은 `spring.jpa.hibernate.ddl-auto=validate`다. `350590a`는 `cart_sync_requests`에 매핑되는 `CartSyncRequest`를 추가했지만, Flyway 의존성은 없었고 `V1__cart_sync_requests.sql`은 애플리케이션이나 `deploy.sh`가 실행하지 않는 수동 SQL이었다.

2026-10-22 읽기 전용 조회로 `portfolio_db`에는 테이블 17개가 있고, `cart_sync_requests`와 `flyway_schema_history`는 없었다. 같은 서버에서 이 계정으로 보이는 다른 스키마에도 그 두 테이블은 없었다. 로컬 `.env`의 `AWS_RDS_DB_NAME`은 `portfolio_db`가 아니고, 그 스키마에도 두 테이블은 없었다. 테스트가 운영 DB에 이 테이블을 만들지는 않았다. 테스트 후에 다시 조회해도 두 테이블은 없었다.

`CartSyncRequest.java`는 `350590a`와 이 수정 사이에서 내용 차이가 없다. 같은 엔티티로 운영 프로파일, Flyway 끔, `ddl-auto=validate`, 기존 테이블과 합성 행만 있는 MySQL을 기동하면 컨텍스트가 `cart_sync_requests` 누락으로 실패했다. Flyway를 켠 수정 설정은 그 다음 기동에서 통과했다. 이것은 `350590a` 이미지 자체를 다시 실행한 것은 아니다. 보존 컨테이너의 스택트레이스는 아직 없다.

## 가설

| 가설 | 확인 | 판단 |
| --- | --- | --- |
| 스키마 검증 실패 | 엔티티, `validate`, 미실행 SQL, 운영 DB에 테이블 없음, 같은 조건의 Spring Boot 기동 실패 | 채택 |
| 빈 DB용 Flyway만으로 충분 | 이력이 없는 비어 있지 않은 스키마에서 기본 설정은 migrate를 거부한다. baseline 1은 `V1`을 실행하지 않는다 | 배제. 아래 최초 도입 설정이 필요했다 |
| Nginx 업스트림 또는 SSR 주소 불일치 | 그 검사는 백엔드 기동 전에 있다. 보고된 단계는 `backend` | 이번 실패 지점으로는 배제. 서버의 Nginx 원문은 미확인 |
| `INTERNAL_API_URL` 중복 | 프런트 교체 전에 실패 | 이번 단계의 원인으로는 배제 |
| 준비 검사 시간 부족 | 기동 시간을 측정하지 못함. 누락 테이블이면 프로세스가 준비 응답 전에 실패한다 | 배제. 제한 시간은 늘리지 않음 |
| 이미지와 커밋 불일치 | workflow는 `github.sha` 태그를 배포한다 | 배제 |
| 메모리, 포트, Redis, 컨테이너 종료 코드 | EC2와 Actions 로그 본문 미확인 | 남음. 위 스키마 조건만으로도 기동은 실패한다 |

## Flyway 최초 도입

Spring Boot `4.1.0`이 가져오는 Flyway는 `12.4.0`이다. Hibernate는 `7.4.1.Final`이다.

패키지에 값을 적지 않았을 때의 Flyway 기본값은 테스트로 확인했다.

- `baselineOnMigrate=false`
- `baselineVersion=1`
- location은 `classpath:db/migration`
- `schemas`, `default-schema`는 지정하지 않는다. 테이블은 JDBC URL의 카탈로그에 만들어졌다.

Spring Boot 설정 우선순위는 테스트로 확인했다. 패키지의 `application-prod.properties` 값보다 시스템 프로퍼티가 우선하고, 명령행 인자는 시스템 프로퍼티보다 우선한다. OS 환경변수는 그 사이라서, 컨테이너의 `SPRING_FLYWAY_BASELINE_VERSION`이 있으면 jar의 baseline을 덮어쓴다. Dockerfile은 `-Dspring.profiles.active=prod`만 추가한다. 로컬 `.env`에는 `SPRING_FLYWAY_*`와 `SPRING_DATASOURCE_*` 키가 없었다. 운영 `.env`는 읽지 못했다. `deploy.sh`는 `.env` 전체를 백엔드에 넘기므로, 그 파일에 같은 키가 있으면 jar 설정보다 우선한다.

`application.properties`의 `spring.profiles.active=local`과 gitignore된 `application-local.properties`의 `spring.jpa.hibernate.ddl-auto=update`는 로컬 파일이다. 운영 이미지는 프로파일을 `prod` 하나로 고정하므로 그 파일을 읽지 않는다.

격리된 MySQL 8.4에 합성 테이블과 행만 두고 확인한 결과:

- 기본 설정은 `non-empty schema` 오류로 migrate하지 않고, 두 테이블을 만들지 않았다.
- `baseline-on-migrate=true`와 baseline `1`은 이력에 `1|BASELINE`만 남기고 `V1`을 실행하지 않았다. `cart_sync_requests`는 생기지 않았다.
- baseline `0`은 이력 `0|BASELINE` 다음에 `1|SQL`(`V1__cart_sync_requests.sql`, checksum 있음)을 실행했다.
- 빈 스키마에서는 baseline 행 없이 `V1`만 한 번 실행됐다.
- 두 번째 migrate의 `migrationsExecuted`는 0이었다.
- 합성 행과 기존 컬럼 스냅샷은 그대로였다.
- `created_at`은 `DATETIME(6)`이다. Hibernate 7이 `LocalDateTime`을 `datetime(6)`으로 검증하기 때문이다.

그래서 운영 프로파일만 `baseline-on-migrate=true`, `baseline-version=0`이다. baseline 1은 `V1`을 건너뛰므로 쓰지 않는다. `schemas`와 `default-schema`는 비운다.

## 수정

운영 기동은 baseline 0을 기록한 뒤 `V1`으로 `cart_sync_requests`를 만들고, 그 다음 기존처럼 `validate`한다. 다른 프로파일은 `spring.flyway.enabled=false`다. 기존 테이블의 행은 읽거나 바꾸지 않는다. 새로 생기는 테이블은 `cart_sync_requests`와 `flyway_schema_history`다.

준비 검사 실패 시 컨테이너 실행 여부와 최근 로그를 남긴다. 비밀번호, 시크릿, 토큰, API 키 형태는 `<redacted>`로 바꾼다. 검사 조건은 그대로다.

`deploy.sh`의 `rollback`은 컨테이너를 멈추고 이름을 바꿀 뿐 SQL을 실행하지 않는다. 앱을 되돌려도 새 테이블을 지우지 않는다. 테이블을 지우면 그 다음 새 이미지가 다시 `V1`을 적용하기 전에 검증에 실패할 수 있으므로, 앱 롤백과 DB 롤백을 묶지 않는다.

`ERR` 트랩은 명령 실패를 롤백한다. `SIGKILL`이나 호스트 재시작은 이 트랩으로 복구되지 않는다. 다음 배포는 잠금과 슬롯 사용 여부를 다시 확인한다.

이전 애플리케이션 매핑은 `CartSyncRequest`가 없다. `9fbcd64`에는 그 클래스가 없다. 새 테이블이 있는 스키마에 그 엔티티를 빼고 `validate`하면 통과했다. 매핑되지 않은 테이블은 이전 앱의 검증을 깨지 않는다.

## 테스트

- `CartSyncFlywayExistingSchemaTest`: 기존 테이블과 합성 행, Flyway 이력 없음. 기본 설정 실패, baseline 1은 `V1`을 건너뜀, baseline 0은 `V1`을 실행, 두 번째 migrate는 재실행하지 않음, 컬럼과 키가 엔티티와 일치, 합성 행 유지.
- `CartSyncFlywayMigrationTest`: 빈 MySQL에서는 baseline 행 없이 `V1`만 한 번 적용되고 `carts`는 생기지 않음.
- `FlywayProdSettingsTest`: 운영 프로파일의 baseline 0, location, `validate`, Flyway 켜짐. 비운영 프로파일은 Flyway가 꺼짐. 시스템 프로퍼티와 명령행이 패키지 값보다 우선함.
- `ProdProfileExistingSchemaStartupTest`: Flyway를 끄면 누락 테이블로 기동 실패. 운영 프로파일은 Flyway 후 `validate`를 통과하고 합성 상품과 합성 행을 유지. 이전 엔티티 집합의 `validate`도 통과. 연결 URL은 운영 RDS가 아니었다.
- `./gradlew test`: BUILD SUCCESSFUL. 38개 테스트, 실패 0, 오류 0, 건너뜀 0.
- `bash ops/tests/run-deploy-checks.sh`: `all deploy checks passed`. 여기에는 백엔드 준비 실패 시 기존 서비스 유지와 진단 로그의 비밀값 제거가 들어 있다.

## 배포 결과

이 수정은 아직 push하지 않았다. 수정 전 공개 확인(2026-10-22, 롤백된 서비스)을 이 수정의 성공으로 쓰지 않는다.

- `https://swportfolioservices.com/` HTTP 200
- `https://swportfolioservices.com/api/products` HTTP 200, 상품 객체 38개. 필드에 `id`, `name`, `price`, `stock`, `thumbnail`이 있었다.

## 복구

자동 롤백은 새 백엔드를 멈추고 `portfolio-backend-blue-failed-<시각>`처럼 남긴 뒤 기존 백엔드를 유지한다. 프런트와 Nginx는 이 단계에서 바꾸지 않는다. DB는 되돌리지 않는다.

Flyway가 적용된 뒤 이전 이미지로 컨테이너만 되돌리면, 이전 매핑은 추가된 테이블을 검증하지 않으므로 기동할 수 있다. 마이그레이션까지 취소하려면 새 백엔드를 멈춘 다음 `cart_sync_requests`와 `flyway_schema_history`만 제거한다. `carts`와 `cart_items`는 지우지 않는다. 그 삭제는 앱 롤백에 들어 있지 않다.

## 이력서·PT용 사실

1. `validate` 운영 DB에 없는 `cart_sync_requests` 때문에 새 백엔드가 `/api/products` 준비 검사에 실패했다.
2. 운영 프로파일에서만 Flyway baseline 0 뒤에 `V1`을 실행하게 했다. baseline 1은 그 SQL을 건너뛰므로 쓰지 않았다. 기존 테이블은 변경하지 않는다.
3. 기존 테이블이 있는 MySQL과 빈 MySQL, 운영 프로파일 Spring Boot 기동으로 확인했다.
4. 실패 당시 공개 서비스는 롤백된 뒤 메인과 상품 API가 응답했다. 수정 커밋의 배포는 아직 확인하지 않았다.
5. 보존 컨테이너 로그와 EC2 Nginx 원문은 읽지 못했다. 무중단이나 시간 개선은 측정하지 않았다.

## 이 문서의 시점

위의 “이 수정은 아직 push하지 않았다”와 “수정 커밋의 배포는 아직 확인하지 않았다”는 2026-10-13 작업 트리 기준이다. 2026-10-29에 다시 조회한 `origin/main`은 `3226b1061dcac92bf1fc093a97a4ed5fe15fbc1a`이고, Actions [40869105357](https://github.com/KimSunWooo/portfolio/actions/runs/40869105357)은 `deploy` job까지 성공했다. 그 성공으로 이 문서의 장애 원인까지 재확인하거나, 운영 화면 동작을 확인한 것은 아니다.
