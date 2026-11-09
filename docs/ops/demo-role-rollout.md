# 공개 시연 권한(`ROLE_DEMO`) 운영 적용

저장소 코드는 `ROLE_DEMO`로 샘플(DEMO) 구매 집계만 조회하고, 회원 목록·관리자 쓰기를 서버에서 거절한다. 아래는 운영 DB·세션에 적용할 절차다. 이 문서의 절차는 배포 파이프라인이 자동 실행하지 않는다.

## 적용 전 확인

1. `V8__demo_role.sql`이 운영 Flyway 이력에 반영됐는지 확인한다.
2. 공개 README에 `ROLE_ADMIN` 비밀번호가 남아 있지 않은지 확인한다.
3. 시연용 계정 이메일·비밀번호를 새로 정하고 README나 공개 문서에 관리자 권한으로 적지 않는다.

## 계정·세션

1. 공개됐던 관리자 계정이 아직 활성이면 비밀번호를 교체하거나 계정을 폐기한다.
2. 시연 전용 사용자를 `ROLE_DEMO`로 생성하거나, 기존 시연 계정의 `users.role`을 `ROLE_DEMO`로 바꾼다.
3. 해당 사용자의 `users.session_epoch`를 1 이상 올려 기존 Refresh Token을 거절한다.
4. Redis 세션 키를 정리해 활성 Refresh 세션을 제거한다.

## Access Token 범위

로그아웃·`session_epoch` 증가·Redis 삭제는 Refresh를 무효화한다. 이미 발급된 Access Token은 만료(현재 30분)까지 유효하다. 공개 관리자 계정을 폐기한 직후에는 Access Token 잔여 수명 동안 관리자 API가 호출될 수 있으므로, 비밀번호 교체와 epoch 증가 후 30분이 지났는지 확인한다.

## 배포 후 검증

1. `ROLE_DEMO`로 `/api/admin/purchase-analytics` 샘플 조회가 성공하는지 확인한다.
2. 같은 토큰으로 `/api/admin/users`와 관리자 쓰기 API가 403인지 확인한다.
3. `recordSource=LIVE` 또는 `ALL`을 요청해도 응답이 DEMO만인지 확인한다.
4. `ROLE_ADMIN`으로 기존 조회·수정이 유지되는지 확인한다.
