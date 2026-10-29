# 포트폴리오 주장별 근거

분석 시점: 2026-10-13.

- 웹 포트폴리오 로컬 HEAD: `9fbcd64` (2026-10-12, Modify deploy.sh). 그 위에 커밋되지 않은 장바구니 동기화 변경이 있다.
- 자동매매 shallow clone HEAD: `52d1aaf` (2026-10-12).
- `Auto_Trading_AI_Agent`는 인증 없는 GitHub API에서 HTTP 404. 소스 미확인.
- 이번 세션에서 Gradle 테스트, `npm test`, GitHub Actions, KIS 주문은 실행하지 않았다.

기여도: 공개 저장소의 커밋 작성자는 Git 기록상 KimSunWooo다. 줄 단위 작성 비율과 웹 포트폴리오의 AI 도구 사용 범위는 저장소만으로 확정하지 않는다. 자동매매·에이전트의 바이브코딩 표기는 지원자 명시와 운영 사이트 프로젝트 카드에 근거한다.

## 웹 포트폴리오 서비스

| 기능 | 역할 | 기술 | 코드 근거 | 구현 이유 | 검증 | 현재 상태 |
|---|---|---|---|---|---|---|
| 로그인 Access/Refresh 분리 | 계정 KimSunWooo 저장소. 개인 구현 비율은 미확정 | jjwt 0.12.3, Spring Security | `JwtTokenProvider`, `UserController`, `TokenUse` | 호출 권한 30분과 갱신 수단 14일을 분리. Refresh는 HttpOnly | `TokenUseTest` 존재. 재실행 안 함 | 코드·로그인 화면 확인 |
| 새로고침 후 세션 복구 | 동일 | 메모리 Access + 쿠키 Refresh | `frontend/src/lib/api.ts` `inMemoryAccessToken`, `POST /api/users/refresh` | 새로고침 시 메모리 토큰이 사라짐 | 코드 확인. 브라우저로 로그인 복구는 비밀번호 입력 차단으로 미실시 | 코드상 구현 |
| 관리자 API 서버 인가 | 동일 | `hasRole("ADMIN")` | `SecurityConfig` `/api/admin/**` | 화면 역할만으로 관리 API를 열지 않음 | `AdminAccessWebTest` | 코드·테스트 존재. 관리자 화면 캡처 없음 |
| Refresh로 API 인증 거부 | 동일 | `JwtAuthenticationFilter` | Access일 때만 SecurityContext | Refresh 탈취만으로 호출 권한이 생기면 안 됨 | `AdminAccessWebTest.refreshTokenDoesNotAuthenticate` | 테스트 코드 확인 |
| 상품 목록 Redis | 동일 | Spring Cache, Redis, Jackson | `ProductService.getProducts`, `RedisConfig`, `ProductListCache` | 반복 조회와 제네릭 역직렬화 | `ProductListCacheTest`. 속도 수치 원본 없음 | TTL 10분, 커밋 후 evict. 개선율 미기재 |
| 비밀번호 코드 | 동일 | Redis `AUTH_CODE:` 3분 | `UserService` | 짧은 일회성 코드 | 코드 확인 | 구현. 메일 발송 성공은 미측정 |
| 비회원/회원 장바구니 | 동일 | localStorage `guestCart`, JPA carts | `api.ts`, `Cart`, `CartService` | 로그인 전후 저장소가 다름 | 브라우저에서 비회원 담기·카트 화면 확인 | 운영 화면에서 비회원 담기 확인 |
| 동기화 멱등, main | 동일 | 프로세스 메모리 | HEAD `CartService` 주석: 단일 프로세스 | 재전송 시 수량 재합산 방지 | HEAD 소스 | 프로세스 범위. 다중 인스턴스 미보장 |
| 동기화 멱등, 작업 트리 | 동일 | `cart_sync_requests` unique, 본문 해시 | 미커밋 `CartService`, `V1__cart_sync_requests.sql`, `CartSyncMySqlTest` | 재시작·경합 이후에도 한 번만 반영 | 테스트 파일 존재. 운영 DB 적용 미확인 | 미커밋. 완료로 쓰지 않음 |
| 100원 테스트 결제 | 동일 | Toss 연동 게이트웨이, `payment_histories` | `PaymentService` | 승인·취소·소유권을 상태 이력으로 남김 | `PaymentServiceTest`. 체크아웃 문구를 브라우저에서 확인 | 테스트 결제. 운영 매출 아님 |
| SSR/CSR API 주소 | 동일 | `INTERNAL_API_URL`, `NEXT_PUBLIC_API_URL` | `frontend/src/lib/api.ts` | 컨테이너 localhost와 브라우저 localhost가 다름 | 코드와 `deploy.sh` | 구현 |
| Nginx 슬롯 전환 | 동일 | Docker, Nginx | `deploy.sh`, `ops/nginx/*`, `.github/workflows/deploy.yml` | 배포 중 API upstream 교체 | 스크립트 확인. 이번 세션에 배포 안 함 | 스크립트상 구현 |
| Multipart boundary | 동일 | FormData | `api.ts`가 FormData이면 Content-Type 삭제 | 415의 원인인 수동 Content-Type | 코드 확인 | 구현 |
| 공개 화면 | 캡처 | 운영 사이트 | shop, cart, checkout, product, community, home | 실제 렌더 확인 | 2026-10-13 브라우저 | 관리자·결제 완료 화면은 없음 |

## 자동매매

| 기능 | 역할 | 기술 | 코드 근거 | 구현 이유 | 검증 | 현재 상태 |
|---|---|---|---|---|---|---|
| 바이브코딩 표기 | 지원자 명시. 사이트 프로젝트 카드 문구 | Cursor | 운영 사이트 홈 프로젝트 카드. README에는 해당 단어 없음 | 생성 코드와 설계·검증을 구분하기 위한 공개 | 카드 텍스트를 페이지에서 확인 | 개발 방식으로 명시. 줄 단위 비율은 미확인 |
| 로그인·PAPER 계좌 | 저장소 소유 계정 | Next.js Route, 세션 쿠키 | `app/api/auth/*`, `app/mypage`, `src/auth/session.ts` | 사용자와 증권 계좌 연결 | 소스. 화면 미캡처 | 코드 확인 |
| Intent와 주문 분리 | 동일 | Drizzle unique | `src/runtime/intents.ts`, `src/db/schema` `uq_order_intents_key` | 의도와 제출을 구분 | 스키마·테스트 파일 | PAPER 개발 중 |
| 접수와 체결 | 동일 | 상태 매핑 | `mapOrderStatus`, `orders-panel.tsx` | ODNO를 체결로 보이지 않음 | UI 분기 코드 | 배지는 분리. 빈 목록 문구는 체결 중심 |
| unknown | 동일 | 브로커 타임아웃 | `kis-client.ts`, `KisBroker.ts` | 타임아웃을 성공으로 두지 않음 | `broker.test.ts` 등 존재 | 코드·테스트 파일 |
| Worker lock | 동일 | 파일 lock TTL 8초 | `src/runtime/worker-lock.ts` | 이중 루프 주문 방지 | `worker-lock.test.ts` | 코드 확인 |
| Startup sync | 동일 | reconciliation 테이블 | `src/runtime/startup-sync.ts` | 재시작 후 로컬과 증권사 불일치 분류 | `startup-sync.test.ts` | 코드 확인 |
| REAL 잠금 | 동일 | 다중 플래그 | README, `kis-config.test.ts` | 실전 주문 기본 거부 | 테스트 파일. 운영 증거 없음 | LOCKED로 기술 |
| 일괄 테스트 수치 | 문서 기록 | `npm test` | `docs/VERIFICATION_WORKER_ALLOCATION_2026-10-12.md` | 회귀 확인 | 8f76b69 기준 642 pass 기록. 미재실행 | 기록이지 현재 HEAD 실행 결과가 아님 |
| PAPER 주문번호 | README·스크립트 | KIS VTS | README, `scripts/vts-domestic-balance-audit.ts` | 모의 체결 추적 | 클론에 실행 로그 없음 | 실전 성과로 쓰지 않음 |
| AI 주문 거부 | 소비 측 | `docs/AI_CONTRACT.md` | `autoOrderEnabled` 기본 false | 판단과 주문 분리 | 계약 문서와 테스트 파일명 `ai-foundation.test.ts` | 자동 주문 비활성 |

## AI 에이전트

| 기능 | 역할 | 기술 | 코드 근거 | 구현 이유 | 검증 | 현재 상태 |
|---|---|---|---|---|---|---|
| 독립 저장소 | 지원자가 바이브코딩으로 명시 | 미확인 | GitHub API 404 | 주문 시스템과 분리 | 소스 없음 | 미검증. 공개 범위 승인 전 본문 확대 안 함 |
| 소비 측 계약 | 자동매매 저장소 문서 | JSON 스키마 이름 `ai.trade-proposal.v1` | `Auto-Trading-system/docs/AI_CONTRACT.md` | 잘못된 제안이 주문이 되지 않게 | 문서만 | 생산 측 구현은 미확인 |

## Python 보조

| 기능 | 역할 | 기술 | 코드 근거 | 구현 이유 | 검증 | 현재 상태 |
|---|---|---|---|---|---|---|
| 최신 프레임만 유지 | 공개 저장소 | `threading.Lock` | `Motion-detected-system` `LatestFrameBuffer` | 프레임 적체 방지 | 소스. 라이브 CCTV 미실행 | 프로토타입 |
| UI/제어 분리 | 공개 저장소 | TCP JSON, UDP JPEG | `DolBom` `protocol.py`, `ControlClient`, `StreamSender` | 화면과 분석 분리 | 소스. 프로토콜 draft | 데모 기본 |
| 다중 카메라 HTTP/WS | 공개 저장소 | WebSocket, HTTP | `deep-learning-project` `main_server` | 카메라·판단·UI 경계 | 소스. DolBom 뷰어는 선택 연동 | 통합 운영 완료로 쓰지 않음 |
| OCR 실패를 빈 결과로 | 공개 저장소 | JSON 파일 | `vehicle_detect_system` `detect_pipeline.py` | 단계 실패가 전체를 잘못된 성공으로 만들지 않게 | 소스. HTTP 서버 없음 | CLI 파이프라인 |

## 의도적으로 빼거나 약하게 쓴 주장

- Redis 85% 개선, 138ms → 21ms: 커뮤니티 제목 또는 과거 README 흔적. 측정 원본이 없어 성과로 쓰지 않음. README도 그 수치를 확정 결과로 쓰지 말라고 적혀 있음.
- 관리자 CRUD 화면: 코드는 `/api/admin/**`가 있으나 로그인 캡처를 하지 않음.
- 실거래, 수익률, 장애 제로, 전체 코드를 단독 작성: 근거 없음.

## 2026-10-29 작업 트리 추가

기준은 `main` `0b385f525261763ef9b3752f7472f22903862438`다. 작업 브랜치는 `portfolio-flow-consistency`이고 커밋·push·배포는 하지 않았다. 위 2026-10-13 표는 당시 기록으로 둔다.

- 목록과 상세 담기는 `addCartItem`으로 같다. 비회원은 `guestCart`, 로그인 사용자는 `POST /api/cart`다. 색상은 선택 필드로 전달하고, 색이 없는 기존 줄은 `color_id`가 비어 있다.
- 저장 수량이 1~99 밖이면 항목을 삭제하지 않고 범위 안으로 맞춘다. `frontend/src/lib/guestCart.test.mts`.
- 상품 404만 `notFound()`다. 그 외 조회 실패는 `frontend/src/app/product/[id]/error.tsx`다.
- Refresh는 계정당 하나다. Redis Lua가 현재 세션과 10초 유예를 원자적으로 회전하고, 폐기 경계는 DB `users.session_epoch`다. Redis 삭제가 실패해도 이전 세대는 거절된다. `RefreshSessionRedisTest`, `SessionLifecycleMySqlTest`. Access Token은 만료 전까지 유효하다. 구버전 인스턴스는 이 세대를 보지 않는다.
- 비밀번호 코드는 `SecureRandom`이고, 계정이 없어도 같은 안내를 반환한다. 발송은 시간당 5회를 넘기면 거절한다.
- `V1__cart_sync_requests.sql`은 수정하지 않았다. `V2__AddCartItemColor`는 `cart_items`가 있고 `color_id`가 없을 때만 컬럼을 추가한다. 빈 DB에서는 기록만 남긴다.
- 인증 수명주기 수정 뒤 `backend ./gradlew test`는 50건, 실패 0이다. 프론트 테스트·타입·lint·빌드 결과는 같은 작업의 최종 확인에 적는다. 브라우저 로그인 흐름, 부하, 운영 배포는 실행하지 않았다.
- 관리자 주문 표는 샘플이고, 상점 설정 저장 버튼은 저장하지 않는다고 알린다.
