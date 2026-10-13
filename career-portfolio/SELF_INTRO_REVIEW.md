# 자기소개서 개선 검토

작성일: 2026-10-13  
기준 커밋: portfolio `main` `9fbcd64` (2026-10-12)  
원본은 덮어쓰지 않았다.

산출물:

- `/home/sw/Downloads/김선우_프론트엔드_개발자_자기소개서_개선본.docx`
- `/home/sw/Downloads/김선우_프론트엔드_개발자_자기소개서_개선본.pdf`
- `/home/sw/Downloads/김선우_백엔드_개발자_자기소개서_개선본.docx`
- `/home/sw/Downloads/김선우_백엔드_개발자_자기소개서_개선본.pdf`
- `/home/sw/Downloads/김선우_풀스택_개발자_자기소개서_개선본.docx`
- `/home/sw/Downloads/김선우_풀스택_개발자_자기소개서_개선본.pdf`

## 1. 줄이거나 뺀 내용

세 문서 공통으로 다음을 줄였다.

- 기술 이름을 나열하며 “연결해 봤다”로 끝나는 문단
- “앞으로 더 깊게 학습하겠습니다”처럼 직무와 바로 연결되지 않는 성장 문장
- 자동매매를 대표 사례처럼 길게 쓰던 부분. 한 단락으로 줄이고, Cursor 바이브코딩이며 코드를 전부 직접 작성하지 않았다고 적었다.
- 캐시를 넣었다는 사실만 있고 측정과 역직렬화 수정이 없던 설명

프론트엔드 문서에서는 Next.js 학습 의지와 컴포넌트·렌더링 최적화 포부를 줄였다. 백엔드 문서에서는 트랜잭션·인덱스 학습 계획을 줄이고, 측정 조건을 확인한 뒤 수치를 쓰겠다는 문장으로 바꿨다. 풀스택 문서에서는 “프론트부터 배포까지 경험했다”는 요약을 배포 중 연결 오류 사례로 바꿨다.

## 2. 새로 앞에 둔 문제 해결

| 문서 | 대표 | 보조 |
|---|---|---|
| 프론트엔드 | 비회원 장바구니 삭제가 회원 API로 나가 403이 난 일. Zustand 표시와 메모리 Access Token의 불일치 | Docker에서 SSR이 `127.0.0.1:8080`으로 실패한 일 |
| 백엔드 | k6로 본 상품 목록 응답과 Redis 캐시, Jackson 역직렬화 | 장바구니 fetch join. SQL 횟수는 수치로 쓰지 않음 |
| 풀스택 | 컨테이너 localhost와 브라우저 localhost를 나눈 일 | 같은 서비스 안의 캐시 기록과 인증 상태 불일치를 층으로 구분 |

회사 경력(조이튠, JWT 로그인·회원가입, 관리자 페이지, 대시보드 차트, JavaScript와 API 연동)은 세 문서의 첫 항목에 남겼다. 개인 프로젝트 문제를 회사 성과로 쓰지 않았다.

## 3. 직무별 차이

- 프론트엔드는 화면 상태와 요청 분기가 중심이다. 서버 권한 검사는 “화면 해석과 다르다”는 한 문장으로만 둔다.
- 백엔드는 응답 시간 기록, 캐시 키·TTL·커밋 후 삭제, fetch join과 배치 크기의 차이가 중심이다.
- 풀스택은 요청이 어느 프로세스에서 나가는지가 중심이고, 캐시 수치와 403은 같은 기능의 다른 층으로만 짧게 잇는다.

## 4. 코드 근거

| 주장 | 근거 |
|---|---|
| 상품 목록 캐시 | `ProductService.getProducts`의 `@Cacheable`, 반환 `ProductListWrapper` |
| 캐시 키·TTL·삭제 | `ProductListCache` 키 `category_search`, `RedisConfig` TTL 10분, 커밋 후 `evictAfterCommit` |
| 역직렬화 설정 | `RedisConfig`의 `JavaTimeModule`, default typing, `GenericJackson2JsonRedisSerializer` |
| 장바구니 fetch join | `CartRepository.findByUserEmailWithProducts`. `CartService.getCartItems`가 이 메서드를 호출. HEAD와 동일 |
| 배치 크기 | `application.properties`의 `hibernate.default_batch_fetch_size=100`. fetch join과 별개 |
| 비회원 삭제 분기 | `frontend/src/app/cart/page.tsx` `handleRemove`. 주석에 예전 `isLoggedIn` 기준 호출이 적혀 있음 |
| guestCart 단일 키 | `frontend/src/lib/api.ts` `GUEST_CART_KEY = "guestCart"` |
| 갱신 후 화면 상태 | `resolveAuthState`, `ensureAccessToken`. `Header.tsx`, `admin/layout.tsx` |
| 서버 권한 | `SecurityConfig`의 `/api/admin/**` `hasRole("ADMIN")` |
| SSR 주소 분리 | `api.ts`의 `INTERNAL_API_URL` / `NEXT_PUBLIC_API_URL` |
| 배포 프록시 | `.github/workflows/deploy.yml`, `deploy.sh`의 Nginx `/api` upstream |
| k6 조건 | `load-test.js`: 50 VU, 30초, `GET http://localhost:8080/api/products`, `sleep(0.5)` |
| 자동매매 상태 문구 | `Auto-Trading-system` `components/orders-panel.tsx`. 바이브코딩은 지원자 명시와 운영 사이트 카드. 저장소 README에는 그 단어가 없음 |

## 5. 수치 검증

제공된 요약과 스크립트 조건은 이렇게 맞다.

- 대상: 상품 목록 GET
- 50 VU, 30초
- 실패율 0%은 제공 기록의 값이며, 스크립트는 HTTP 200을 check한다

제공 기록:

| | 평균 | 중앙값 | p95 | 처리량 | 실패 |
|---|---:|---:|---:|---:|---:|
| AS-IS | 138.54ms | 146.64ms | 179.83ms | 77.48 RPS | 0% |
| TO-BE | 20.96ms | 2.05ms | 4.35ms | 95.16 RPS | 0% |

평균 약 84.9% 감소, 중앙값 약 98.6% 감소, p95 약 97.6% 감소, 처리량 약 22.8% 증가는 위 표로 계산하면 맞다. 스크립트의 `sleep(0.5)` 때문에 50 VU의 이론상 상한은 초당 100회 근처다. 77.48에서 95.16으로 오른 것은 그 상한 안의 값이다.

확정 성과로 쓰지 않은 이유:

- 저장소에 k6 원본 로그가 없다. README도 과거 138ms대 21ms 수치를 측정 원본이 없어 확정 결과로 쓰지 말라고 적혀 있다.
- 두 실행의 장비, 데이터 건수, 캐시 예열이 같은지 로그로 대조하지 못했다. TO-BE 중앙값 2.05ms는 캐시가 이미 찬 요청이 많았을 때 나오는 값에 가깝다.
- 스크립트 주소는 `localhost:8080`이다. 운영 서버 측정이 아니다.
- 커넥션 풀 고갈이 실제로 났다는 자료는 없다.

자기소개서에는 평균·중앙값·p95와 실패 없음을 “정리한 기록”으로 적고, 원본 로그와 운영 지표가 아니라고 한 문장으로 제한했다. 처리량 증가율은 본문에 넣지 않았다. 비교 조건이 로그로 닫히지 않았기 때문이다.

## 6. 아직 확인이 필요한 것

- k6 원본 로그의 보관 위치. 있으면 AS-IS와 TO-BE의 실행 시각, 대상 호스트, 캐시 예열 여부를 대조할 수 있다.
- 장바구니 N+1의 쿼리 개수 전후. 코드의 fetch join은 확인했고, SQL 횟수 로그는 없다.
- 운영 서버가 `9fbcd64`와 같은 캐시 코드로 떠 있는지는 이번 작업에서 배포를 다시 확인하지 않았다. 자기소개서는 운영 적용 성과로 쓰지 않았다.
- 웹 포트폴리오에서 AI 코딩 도구를 얼마만큼 썼는지는 저장소만으로 확정하지 않아 단정하지 않았다.
- `Auto_Trading_AI_Agent`는 이번 문서에 넣지 않았다. 저장소를 열지 못했고, 대표 사례도 포트폴리오 트러블슈팅으로 한정했다.

## 7. 품질

- PDF 3종 모두 A4 2페이지다. 증명사진, 상단 인적사항, 회색 소제목, 하단 구분선이 원본 위치를 유지한다.
- 글꼴은 원본 문단의 Noto Sans CJK KR, 본문 9.5pt, 소제목 11pt를 그대로 썼다.
- 페이지가 잘리거나 문단이 겹치지는 않았다. 프론트엔드와 풀스택 2페이지 하단에 여백이 남는다. 문단을 늘려 채우지는 않았다.
- 금지 표현(획기적, 완벽, 원천 차단, 무중단 보장, 압도적, 전문가 수준)은 넣지 않았다.

한계는 수치의 원본 로그가 없다는 점이다. 그 한계를 본문에 남긴 상태라, 로그가 생기면 평균 문장만 확정 표현으로 바꿀 수 있다.
