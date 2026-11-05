# 인증·장바구니 정합성과 배포 복구를 구현한 풀스택 웹 서비스

Next.js와 Spring Boot로 이력·프로젝트·콘텐츠 관리, 상품 조회, 장바구니, 테스트 결제를 구현하고 AWS에 배포한 개인 프로젝트입니다. 화면부터 API·DB·캐시·배포까지 연결하며, **장바구니 재전송에 따른 중복 반영, 인증 갱신과 로그아웃의 경쟁, 배포 실패 시 복구**를 코드와 테스트로 다뤘습니다.

**[서비스 바로가기](https://swportfolioservices.com) · [핵심 문제 해결](#핵심-문제-해결) · [성능 측정](#상품-목록-캐시-성능-측정) · [로컬 실행](#로컬-실행)**

| 대표 구현 | 해결한 문제 | 확인할 근거 |
| --- | --- | --- |
| DB 기반 장바구니 병합 멱등성 | 동일 요청 재전송 시 수량이 중복 합산되는 문제 | [서비스](backend/src/main/java/com/project/backend_api/service/CartService.java), [MySQL 통합 테스트](backend/src/test/java/com/project/backend_api/service/CartSyncMySqlTest.java) |
| 인증 복구와 세션 폐기 | 동시 Refresh와 로그아웃 이후 늦게 도착한 응답의 상태 충돌 | [프런트 인증 처리](frontend/src/lib/api.ts), [세션 통합 테스트](backend/src/test/java/com/project/backend_api/security/SessionLifecycleMySqlTest.java) |
| 배포 준비 검사와 복구 | 새 컨테이너 또는 Nginx 전환 실패 시 이전 서비스로 복구 | [배포 스크립트](deploy.sh), [실패 조건 테스트](ops/tests/run-deploy-checks.sh) |
| 상품 목록 Redis 캐시 | 반복 조회의 DB 접근과 응답 지연 감소 | [캐시 구현](backend/src/main/java/com/project/backend_api/service/ProductListCache.java), [측정 원본](ops/perf/2026-10-29-cache-ab/summary.json) |

## 서비스와 구현 범위

| 사용자 | 주요 기능 |
| --- | --- |
| 방문자 | 이력·프로젝트·커뮤니티·상품 목록 및 상세 조회, 브라우저에 비회원 장바구니 저장 |
| 회원 | 로그인과 세션 복구, 비회원·회원 장바구니 병합, 수량·색상 관리, 100원 테스트 결제 및 자동 취소 |
| 관리자 | 이력·프로젝트·상품 관리, 기간·상품·카테고리·연령대별 구매 분석 조회 |

서비스를 확인하려면 [상품 목록](https://swportfolioservices.com/shop)에서 상품을 담고 장바구니를 확인할 수 있습니다. [로그인](https://swportfolioservices.com/login) 후에는 서버 장바구니와 병합합니다. 관리자 데이터 API는 서버에서 `ROLE_ADMIN` 권한을 검사합니다.

### 테스트용 관리자 계정

[로그인 페이지](https://swportfolioservices.com/login)에서 아래 계정으로 시연 기능을 확인할 수 있습니다.

| 항목 | 값 |
| --- | --- |
| 아이디 | `test@test.com` |
| 비밀번호 | `test147@` |
| 권한 | 관리자 (`ROLE_ADMIN`) |

| 홈 | 상품 목록 |
| --- | --- |
| ![홈 화면](career-portfolio/assets/screenshots/home.png) | ![상품 목록](career-portfolio/assets/screenshots/shop.png) |

| 상품 상세 | 장바구니 |
| --- | --- |
| ![상품 상세](career-portfolio/assets/screenshots/product.png) | ![장바구니](career-portfolio/assets/screenshots/cart.png) |

### 담당 범위와 개발 방식

Spring Boot API, Next.js 화면, MySQL 스키마와 Flyway 마이그레이션, Redis 캐시, Docker 이미지, GitHub Actions와 배포 스크립트를 구현했습니다. 기능 구현과 리팩터링에 Cursor를 활용했으며, 요구사항 정의·설계 선택·생성 코드 검토와 수정·테스트를 통해 결과를 검증했습니다.

## 핵심 문제 해결

### 1. 장바구니 병합 재전송으로 인한 수량 중복 반영 방지

**문제:** 로그인 후 비회원 장바구니를 병합할 때, 응답을 받지 못해 같은 요청을 다시 보내면 수량이 중복 합산될 수 있었습니다. 프로세스 메모리에 완료 여부를 기록하는 방식은 재시작과 여러 인스턴스에서 같은 요청을 구분하기 어려웠습니다.

**해결:** `cart_sync_requests`에 `(사용자, 작업 종류, 요청 키)` UNIQUE 제약을 두고, 요청 기록과 장바구니 변경을 같은 DB 트랜잭션에서 처리했습니다.

- 같은 키·같은 본문은 수량을 다시 더하지 않습니다. 같은 키에 다른 본문을 보내면 `409 Conflict`로 거절합니다.
- 상품·색상·수량을 정규화한 SHA-256 해시로 요청 내용을 비교합니다.
- 합산 수량이 99개를 넘으면 병합 전체를 롤백합니다. 프런트는 실패한 비회원 장바구니를 유지하고 수량 조정 후 재시도를 지원합니다.
- 프런트는 동일한 내용의 재시도에 같은 `Idempotency-Key`를 사용합니다.

**검증:** MySQL 통합 테스트에서 같은 키 재전송, 새 서비스 인스턴스에서의 재요청, 동시 요청, 전체 롤백, 본문 충돌, 다른 사용자 접근 거부를 검사합니다. 브라우저 테스트는 병합 상한 초과 후 수량을 줄여 재시도하는 흐름과 DB 결과를 확인합니다.

[구현](backend/src/main/java/com/project/backend_api/service/CartService.java) · [MySQL 테스트](backend/src/test/java/com/project/backend_api/service/CartSyncMySqlTest.java) · [브라우저 테스트](frontend/e2e/merge-retry.spec.ts)

**처리 경계:** 멱등성은 요청 키가 있는 병합에 적용됩니다. 서버 반영과 브라우저 로컬 데이터 삭제는 별도 단계입니다.

### 2. 인증 갱신과 로그아웃의 경쟁으로 인한 세션 상태 불일치 해결

**문제:** 만료된 Access Token으로 요청할 때 로그인 사용자를 비회원으로 처리하거나, 로그아웃 전에 시작한 Refresh 응답이 늦게 도착해 로그인 상태를 복원할 수 있었습니다.

**해결:** 프런트의 인증 복구와 서버의 Refresh 폐기 경계를 함께 정리했습니다.

- Access Token은 메모리, Refresh Token은 HttpOnly 쿠키에 저장합니다.
- 동시에 발생하는 Refresh 요청은 하나의 Promise로 합칩니다. 로그아웃 시 `authGeneration`을 올려 이전 세대의 갱신 결과를 버립니다.
- 인증 복구 실패와 비회원 상태를 구분하고, 인증 실패 후 변경 요청을 자동 재전송하지 않습니다.
- 서버는 DB의 `users.session_epoch`와 Redis 세션을 함께 검사합니다. Redis Lua로 현재 세션과 10초 유예 세션을 원자적으로 회전합니다.
- 로그아웃 시 세대 번호를 올려 기존 Refresh를 거절합니다. Redis 정리 실패는 로그아웃 완료와 구분합니다.

**검증:** 로그아웃과 Refresh의 경쟁, Redis 정리 실패 이후 Refresh 거부, 늦은 Refresh 응답 무시, 로그인 사용자의 비회원 장바구니 오인 방지를 테스트합니다.

[프런트 구현](frontend/src/lib/api.ts) · [Redis 세션 구현](backend/src/main/java/com/project/backend_api/security/RefreshSessionService.java) · [서버 테스트](backend/src/test/java/com/project/backend_api/security/SessionLifecycleMySqlTest.java) · [프런트 테스트](frontend/src/lib/authSession.test.mts)

**처리 경계:** Refresh 폐기와 별개로 이미 발급된 Access Token은 만료 전까지 유효합니다. 현재 Access Token 유효 시간은 30분입니다.

### 3. 배포 준비 검사 실패 시 이전 서비스 복구와 실패 컨테이너 보존

**문제:** 새 이미지가 기동되지 않거나 Nginx 전환 이후 확인에 실패하면, 이전 서비스를 복구하면서 원인 분석 자료도 남겨야 했습니다.

**해결:** 커밋 SHA로 이미지를 지정하고, 준비 검사·백엔드 슬롯 전환·실패 단계별 복구를 배포 스크립트에 구성했습니다.

- 새 백엔드의 준비 검사를 통과한 뒤 Nginx upstream을 전환합니다.
- 준비 검사에 실패한 컨테이너는 중지 후 이름을 바꿔 보존합니다. 이미 멈춘 이전 백엔드가 있으면 다시 시작합니다.
- Nginx 전환 이후 실패는 백업의 복구 스크립트와 manifest로 되돌립니다.
- 배포 잠금으로 중복 실행을 막고, 복구 실패 시 컨테이너와 백업을 남깁니다.

**검증:** 셸 mock 테스트로 이미지 pull 실패, 백엔드·프런트 준비 실패, Nginx 검사 실패, 공개 응답 확인 실패, 이전 컨테이너 재시작과 manifest 복구 등을 검사합니다. 2026-10-29 코드 커밋 `83eaae3`의 [Actions 실행](https://github.com/KimSunWooo/portfolio/actions/runs/40907382291)은 배포 검사·백엔드 테스트·프런트 검사·이미지 빌드·배포의 5개 job이 성공했습니다.

[배포 구현](deploy.sh) · [실패 조건 테스트](ops/tests/run-deploy-checks.sh) · [배포 실패 조사 기록](docs/incidents/2026-10-13-backend-readiness.md)

**처리 경계:** 실패 조건 테스트는 mock 환경에서 실행합니다. 배포 복구는 DB 마이그레이션을 되돌리지 않으며, 프런트 컨테이너 교체 중에는 짧은 중단이 있습니다.

## 상품 목록 캐시 성능 측정

상품 목록에 카테고리·검색어 기반 캐시를 적용하고, 상품 변경 트랜잭션이 커밋된 뒤 목록 캐시를 비우도록 했습니다. TTL은 10분입니다.

2026-10-29, 격리된 MySQL·Redis 환경에서 SALE 상품 54개를 대상으로 `GET /api/products`를 측정했습니다. k6 **10 VU·30초·요청 간 대기 0.5초**, 캐시 OFF와 캐시 워밍 상태를 각각 3회 교차 비교했습니다.

| 지표 | 캐시 OFF: 3회 범위 | 캐시 워밍: 3회 범위 |
| --- | --- | --- |
| p50 | 5.47–5.63ms | 3.05–3.30ms |
| p95 | 7.99–11.12ms | 5.26–6.78ms |
| HTTP 오류율 | 매 회차 0% | 매 회차 0% |
| 상품 목록 SELECT: 회차별 digest 관측값 | 594 / 595 / 591 | 0 / 0 / 0 |

응답 내용은 캐시 비활성·미스·히트 간 SHA-256으로 대조했습니다. 위 수치는 로컬 검증 환경의 결과이며, 대기 시간이 포함된 부하이므로 최대 처리량을 뜻하지 않습니다. SQL digest 관측값과 HTTP 요청 수의 차이는 [후속 계측 원본](ops/perf/2026-10-30-sql-gap/probe.json)에 남겼습니다.

[측정 조건·회차별 원본](ops/perf/2026-10-29-cache-ab/summary.json) · [측정 스크립트](ops/perf/run_cache_ab.py) · [캐시 테스트](backend/src/test/java/com/project/backend_api/service/ProductListCacheProxyTest.java)

## 아키텍처와 기술 선택

```mermaid
flowchart TD
    Browser["브라우저"] --> Nginx["Nginx / TLS"]
    Nginx --> Web["Next.js"]
    Nginx -->|/api| API["Spring Boot API"]
    Web -->|SSR: INTERNAL_API_URL| API
    API --> DB["MySQL / RDS"]
    API --> Redis["Redis"]
    API --> S3["S3"]
```

| 영역 | 기술과 용도 |
| --- | --- |
| Frontend | Next.js App Router, React, TypeScript, Zustand — SSR 상품 조회, 인증 상태, 장바구니, 관리자 화면 |
| Backend | Java 21, Spring Boot, Spring Security, JPA — API, 권한·소유권 검사, 트랜잭션 처리 |
| Database | MySQL, Flyway — 도메인 데이터, 멱등 요청 기록, 스키마 마이그레이션 |
| Redis | 상품 목록 캐시, Refresh 세션, 만료 시간이 있는 비밀번호 재설정 코드 |
| Infrastructure | AWS EC2·RDS·S3, Docker, Nginx — 실행·DB·파일 저장·요청 라우팅 |
| CI/CD | GitHub Actions — 검사 후 이미지 생성, 커밋 SHA 기준 배포와 복구 |
| Test | JUnit, Testcontainers, Node.js Test Runner, Playwright, k6, 셸 mock |

브라우저 요청은 `NEXT_PUBLIC_API_URL`, Next.js 서버 렌더링은 `INTERNAL_API_URL`을 사용합니다. 렌더 위치별 API 주소를 분리해 컨테이너 내부의 `localhost`가 브라우저와 다르게 해석되는 문제를 처리했습니다.

RabbitMQ와 Kafka는 **선택적으로 활성화하는 학습·검증 구성**입니다. RabbitMQ는 비밀번호 변경 알림의 Outbox·재시도를, Kafka는 상품 상세 조회 이벤트의 발행·중복 소비 처리를 다룹니다. 기본 설정에서는 둘 다 꺼져 있습니다.

## 테스트와 자동화

| 검증 계층 | 주요 확인 사항 | 실행 위치 |
| --- | --- | --- |
| 백엔드 단위·통합 | 장바구니 정합성, 인증·인가, 결제 상태, Flyway, 캐시, 구매 집계, 메시징 | `./gradlew test` / Actions |
| 프런트 단위 | 인증 복구, 늦은 Refresh, 병합 요청 키, 비회원 장바구니 | `npm test` / Actions |
| 브라우저 | 상품 네트워크 오류, 장바구니 병합 재시도, 늦은 Refresh, 구매 분석 | Playwright / 로컬 별도 실행 |
| 배포·복구 | 실패 단계별 복구, 컨테이너 보존, 슬롯·포트 검사 | 셸 mock / Actions |
| 성능 | 캐시 OFF·워밍 비교, SQL 관측, 응답 일치 | k6 / 격리 환경 |

현재 [워크플로](.github/workflows/deploy.yml)는 `main`의 대상 경로 push 또는 수동 실행 시 동작합니다. 프런트 lint·타입 검사·단위 테스트·빌드, 백엔드 테스트, 배포 스크립트 검사를 통과한 뒤 이미지를 생성하고 배포합니다. 브라우저 테스트는 별도 실행이며, 위 Actions 성공 기록은 해당 실행의 검사와 배포 결과입니다.

## 로컬 실행

필수 환경은 **Java 21, Node.js 22, Docker Compose**입니다. 아래 명령은 저장소 루트를 기준으로 실행합니다.

```bash
git clone https://github.com/KimSunWooo/portfolio.git
cd portfolio
docker compose -f compose.verify.yml up -d
```

MySQL이 연결 가능한 상태가 되면 각 터미널에서 백엔드와 프런트를 실행합니다. `verify` 프로파일은 로컬 MySQL `3307`, Redis `6380`을 사용하고 Flyway로 스키마를 준비합니다. Compose의 MySQL 데이터는 임시 저장소이므로 컨테이너를 중지하면 사라집니다.

**터미널 1 — 백엔드**

```bash
(cd backend && ./gradlew bootRun --args='--spring.profiles.active=verify --spring.datasource.url=jdbc:mysql://127.0.0.1:3307/portfolio_verify?serverTimezone=Asia/Seoul&characterEncoding=UTF-8 --spring.data.redis.port=6380')
```

**터미널 2 — 프런트**

```bash
(cd frontend && npm ci && npm run dev)
```

[http://localhost:3000](http://localhost:3000)에서 확인합니다. 로컬 API 기본 주소는 `http://localhost:8080`입니다. `verify`의 외부 연동 키는 검증용 값이므로 실제 결제·S3 업로드·메일 발송에는 별도 설정이 필요합니다. 환경변수 항목은 [`.env.example`](.env.example)을 참고합니다.

구매 분석 시연 데이터는 앱 실행 후 저장소 루트에서 `bash backend/scripts/seed-demo-purchases.sh`로 넣습니다. 로컬 관리자는 회원가입 후 해당 사용자의 DB 역할을 `ROLE_ADMIN`으로 설정합니다.

**테스트 — 저장소 루트의 별도 터미널**

```bash
(cd backend && ./gradlew test --no-daemon)
(cd frontend && npm ci && npm run lint && npm run typecheck && npm test && npm run build)
bash ops/tests/run-deploy-checks.sh
```

백엔드 통합 테스트에는 Docker가 필요합니다. 브라우저 테스트는 위 백엔드·프런트와 verify 컨테이너를 실행한 Linux 환경에서 아래 명령으로 진행합니다. 테스트 도구는 `/proc`와 `pgrep`로 verify 백엔드 프로세스를 확인합니다.

```bash
(cd frontend && npx playwright install chromium && npm run test:browser)
```

## 현재 범위와 후속 개선

| 항목 | 현재 구현 | 후속 개선 |
| --- | --- | --- |
| 결제 | 100원 승인·자동 취소, 결제 이력과 소유권 검사, 같은 JVM의 중복 호출 제어 | 주문·상품 스냅샷과 구매 분석 적재 연결, 다중 인스턴스·실패 후 재시도 처리 |
| 구매 분석 | 별도 `purchase_orders`·`purchase_lines`를 조회해 Java에서 집계. DEMO/LIVE 출처 구분 | SQL 집계와 조회 계획 비교. 현재 결제 결과의 자동 적재는 미구현 |
| 관리자 상품 목록 | 전체 상품 조회 후 상품별 색상 조회 | 페이지네이션·색상 일괄 조회, SQL 수와 지연 비교 |
| 프런트 API 모듈 | 인증·상품·장바구니 등의 API가 `api.ts`에 함께 위치 | 인증 상태의 단일 소유를 유지하며 도메인별 분리 |
| CI | `main` push 검사 후 배포, 브라우저 테스트는 별도 실행 | PR 검사와 격리된 브라우저 테스트 자동화 |

구현 범위의 상세 기록은 [구현·설명 대조 문서](docs/implementation-scope.md), 콘텐츠 초안·이력 관리의 확장 방향은 [후속 설계](docs/follow-up-content-workflow.md)에 있습니다. 날짜가 있는 문서와 측정 원본은 해당 시점의 기록입니다.
