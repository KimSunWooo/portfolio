# 구현과 설명 대조

조사 기준은 2026-10-29 로컬 `main` `3226b1061dcac92bf1fc093a97a4ed5fe15fbc1a`이다. 이 커밋은 `origin/main`과 같고 작업 트리는 비어 있었다. 같은 커밋의 Actions 실행 [40869105357](https://github.com/KimSunWooo/portfolio/actions/runs/40869105357)은 `verify-deploy`, `backend-tests`, `frontend-checks`, `build-and-push`, `deploy`가 모두 성공했다. Actions 성공은 배포 job이 끝났다는 기록이지, 아래 기능이 운영에서 켜져 있거나 화면 동작까지 확인됐다는 뜻은 아니다. 운영 `.env`와 EC2는 보지 않았다.

## 사실 확인

| 주장 | 상태 | 근거 |
| --- | --- | --- |
| 콘텐츠 서비스에 상품·장바구니·테스트 결제가 붙어 있다 | 구현 및 검증 확인 | 화면 경로와 `CartService`, `PaymentService`. 결제는 100원 승인 후 취소 |
| 구매 분석이 DB에서 집계한 값을 반환한다 | 과거 기록으로 현재 상태와 불일치 | `PurchaseAnalyticsService.load`가 행을 읽고 `aggregate`가 Java에서 합산한다. SQL `GROUP BY`가 아니다 |
| 결제 성공이 `purchase_*`로 자동 적재된다 | 계획 또는 미구현 | `PaymentService`는 `payment_histories`만 다룬다. `purchase_orders` 참조가 없다 |
| 차트 데이터는 시연 삽입과 실제 결제를 구분한다 | 구현 확인, 실행 검증 없음 | `record_source`가 `DEMO`/`LIVE`. 시드 스크립트는 DEMO만 넣는다. 운영 DB에 어떤 행이 있는지는 미확인 |
| RabbitMQ·Kafka가 기본으로 동작한다 | 과거 기록으로 현재 상태와 불일치 | `application.properties`에서 둘 다 `enabled=false`이고 자동 설정이 빠져 있다 |
| 운영에서 메시징이 켜져 있다 | 운영 활성화 미확인 | `application-prod.properties`는 플래그를 덮어쓰지 않는다. 운영 환경변수는 보지 않았다 |
| Kafka 발행이 API와 완전히 분리된 비동기이다 | 과거 기록으로 현재 상태와 불일치 | 상품 상세 성공 후 `send(...).get(1, SECONDS)`. 브로커 메타데이터 대기 `max.block.ms=200`은 이 1초와 별도다 |
| 비밀번호 변경과 Outbox가 한 트랜잭션이다 | 구현 확인, 실행 검증 없음 | `PasswordChangeOutbox.record`는 호출자 트랜잭션에 기록한다. 발행 확인은 그 다음 스케줄이다 |
| 메일 발송 완료와 발행 확인이 같다 | 과거 기록으로 현재 상태와 불일치 | Outbox `PUBLISHED`는 publisher confirm이다. 메일 행은 소비자 쪽 `SENT`다 |
| Access Token은 로그아웃 즉시 폐기된다 | 과거 기록으로 현재 상태와 불일치 | 코드상 Access는 30분(`JwtTokenProvider`). 폐기는 Refresh와 `users.session_epoch` |
| 결제 중복 승인을 모든 인스턴스에서 막는다 | 구현 확인, 실행 검증 없음 | 같은 프로세스의 `paymentKey` 잠금과 이력 조회. 프로세스 사이 잠금은 없다 |
| 캐시 적용으로 138ms가 21ms가 됐다 | 근거 부족 | 과거 수치의 원본은 없다. 순차 관측은 `ops/perf/2026-10-29-product-list.json`이다. 같은 날 캐시 비활성과 워밍을 교차한 관측은 `ops/perf/2026-10-29-cache-ab/summary.json`이며, 격리 결과를 운영 처리량으로 확대하지 않는다 |
| 2026-10-13 문서의 “push하지 않았다”가 현재 상태다 | 과거 기록으로 현재 상태와 불일치 | 그 문장은 `docs/incidents/2026-10-13-backend-readiness.md`의 시점이다. 2026-10-29 `3226b10` 실행은 배포 job까지 성공했다 |

## 구매 분석

조회는 `purchase_lines`와 `purchase_orders`를 기간으로 읽고, 상품·카테고리·연령 필터와 합계는 Java에서 계산한다. 최대 366일이다. 결제 성공에서 이 테이블로 복사하는 코드는 없다. DEMO 행은 `backend/scripts/seed-demo-purchases.sh`와 `seed-bulk-demo-purchases.sh`로 넣고, clear 스크립트는 DEMO 또는 해당 배치만 지운다. 건수와 금액의 대조 값은 스크립트 주석과 `PurchaseAnalyticsMySqlTest`에 있다.

## 메시징

RabbitMQ는 비밀번호 변경 알림을 요청 트랜잭션 밖으로 보내려고 붙였다. 변경과 Outbox insert가 같이 커밋되고, 발행 실패가 비밀번호 변경을 롤백하지는 않는다. 기본은 꺼져 있다. 켤 때는 `app.notification.password-changed.enabled=true`와 `RABBITMQ_*`가 필요하다. 재시도는 최대 3회이고 그 다음은 실패 상태로 남긴다. 메일 서버가 수락한 뒤 배달 행을 쓰기 전에 프로세스가 죽으면 같은 메일이 다시 나갈 수 있다.

Kafka는 백엔드 상품 상세 조회가 성공한 뒤의 `ProductDetailRead`이다. 브라우저 페이지 조회나 구매 이벤트가 아니다. 기본은 꺼져 있다. `send`의 `get`은 1초이고, 프로듀서 `max.block.ms`는 200, `delivery.timeout.ms`는 1000, `retries`는 1이다. 이 값들을 더해 한 번의 최대 시간으로 단정하지 않는다. Outbox가 없어서 브로커 장애나 저장 전 종료는 이벤트를 잃을 수 있다. 소비자는 `event_id`로 중복 가산을 피한다. 그 이력 테이블을 비우지 않으면 같은 기록을 다시 읽어도 횟수가 늘지 않는다.

현재 트래픽에서 브로커가 필수였다고 보지 않는다. 트랜잭션 경계와 실패를 시험한 구성이고, 브로커 운영 비용이 따로 있다.

## 인증과 결제

Refresh는 계정당 현재 세션과 10초 유예이다. 세대는 DB `users.session_epoch`이다. 로그아웃과 비밀번호 변경은 세대를 올린 뒤 Redis를 지운다. Redis 삭제가 실패해도 세대가 올라간 Refresh는 거절된다. 그 응답을 로그아웃 완료로 다루지 않는다. 쿠키가 있어도 서버 세대와 세션이 맞지 않으면 Refresh는 거절된다. Access Token에는 세대가 없고 만료 전까지 유효하다. `application.properties`의 `jwt.expiration=86400000`은 `JwtTokenProvider`가 읽지 않는다.

테스트 결제는 같은 JVM 안에서만 잠긴다. 승인 전에는 `DONE`을 쓰지 않고, 취소 실패는 성공 화면으로 처리하지 않는다. 실제 결제사 호출은 운영 키가 있을 때의 경로이며, 이 조사에서 호출하지 않았다.

## README에서 옮긴 기록

자동매매 소개 원본은 `docs/projects/auto-trading-project.json`이다. 작성 당시 메모에는 공유 RDS `projects` id 3에 있고 같은 `github_url`이면 다시 넣지 않는다고 되어 있었다. 그 id가 아직 그 행인지는 이 조사에서 DB로 확인하지 않았다.

2026-10-13 작업 트리의 로컬 검증 문장과 “workflow를 push하지 않았다”는 `docs/incidents/2026-10-13-backend-readiness.md`의 시점이다.
