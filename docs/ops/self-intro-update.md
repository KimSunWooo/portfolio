# 운영 자기소개 문안 보강

운영 `GET /api/resume`의 `introductions[0]`(id=1, title=`자기소개`)을 기준으로 보강한 전문은 다음 파일에 있습니다.

- `docs/content/self-intro-augmented.md`
- `docs/content/self-intro-augmented.json`
- verify 시드: `backend/src/main/resources/verify/self-intro-augmented.md`

## 추가한 문단 위치

1. 「개인 프로젝트로 넓힌 개발 경험」 — 관리자·구매 분석 시연 문장 뒤  
2. 「인증과 데이터 처리에서 보완한 부분」 — Fetch Join·Redis 문장 뒤, 캐시 측정 수치 한 문장  
3. 「배포 환경과 복구 절차」 — GitHub Actions 문장 뒤 (PR 시나리오 정의. Actions 성공 기록은 이 문서에서 주장하지 않음)

## 운영 반영

관리자 JWT로 아래를 실행하거나 `/admin/resume`에서 CONTENT를 교체 저장합니다. 이 저장소 작업만으로는 운영 DB를 수정하지 않습니다.

```bash
curl -X PUT "$API/api/admin/resume/introductions/1" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary @docs/content/self-intro-augmented.json
```

`self-intro-augmented.json`은 배열이므로 단일 객체 본문으로 바꿔 보내야 합니다.
