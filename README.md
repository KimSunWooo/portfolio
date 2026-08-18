# Portfolio Fullstack + Resume CMS

구성:
- `frontend`: Next.js
- `backend`: Spring Boot + JPA + MySQL

## 추가된 기능

### 메인 페이지 DB 연동
메인 `/`는 `GET /api/resume`를 호출해 아래 데이터를 표시합니다.

- profile
- skills
- experiences
- educations
- introductions

백엔드가 개발 중 꺼져 있는 경우에는 화면 확인을 위해 기존 포트폴리오 내용을 fallback으로 표시합니다.

### Resume 관리자
직접 주소로 접속:

```text
http://localhost:3000/admin/resume
```

관리할 수 있는 항목:

- PROFILE: 수정
- SKILLS: 추가 / 수정 / 삭제
- EXPERIENCE: 추가 / 수정 / 삭제
- EDUCATION: 추가 / 수정 / 삭제
- INTRODUCTION: 추가 / 수정 / 삭제

저장 후 메인 페이지를 새로고침하면 DB 값이 표시됩니다.

## Resume API

```text
GET    /api/resume

GET    /api/resume/profile
PUT    /api/resume/profile

GET    /api/resume/skills
POST   /api/resume/skills
PUT    /api/resume/skills/{id}
DELETE /api/resume/skills/{id}

GET    /api/resume/experiences
POST   /api/resume/experiences
PUT    /api/resume/experiences/{id}
DELETE /api/resume/experiences/{id}

GET    /api/resume/educations
POST   /api/resume/educations
PUT    /api/resume/educations/{id}
DELETE /api/resume/educations/{id}

GET    /api/resume/introductions
POST   /api/resume/introductions
PUT    /api/resume/introductions/{id}
DELETE /api/resume/introductions/{id}
```

## Community API

```text
GET  /api/community/posts
GET  /api/community/posts/{id}
POST /api/community/posts
```

프론트 작성 페이지:

```text
/community/write
```

## 실행

### Backend

```bash
cd backend

export JAVA_HOME=/usr/lib/jvm/java-21-openjdk-amd64
export DB_PASSWORD='YOUR_PASSWORD'

./gradlew clean bootRun
```

백엔드는 기본적으로 `http://localhost:8080`에서 실행됩니다.

### Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

`.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api
```

프론트는 기본적으로 `http://localhost:3000`에서 실행됩니다.

## Hibernate TEXT mapping

`community_posts.content`, `experiences.description`, `introductions.content`,
`product_details`의 TEXT 필드들은 MySQL `TEXT`와 맞도록 `columnDefinition = "TEXT"`로 매핑했습니다.

`spring.jpa.hibernate.ddl-auto=validate`를 유지해 기존 DB 스키마를 Hibernate가 임의로 변경하지 않도록 했습니다.
## 추가 동작

### 없는 URL 처리

Next.js `src/app/not-found.tsx`에서 존재하지 않는 URL을 `/`로 리다이렉트합니다.

예:

```text
/abc
/not-exists
/product/99999 -> notFound() 호출 시
```

위와 같은 404 흐름은 메인 페이지 `/`로 이동합니다.

### 관리자 알림 모달

`/admin/resume`에서 저장/추가/삭제/API 오류가 발생하면 기존 상단 메시지 대신 중앙 모달 알림이 표시됩니다.

- 성공: SUCCESS
- 실패: ERROR
- 약 2.2초 후 자동 닫힘
- 배경 클릭으로 닫기
- X 버튼으로 닫기


## Dynamic Projects

DB에 먼저 실행:

```bash
mysql ... < backend/src/main/resources/sql/projects.sql
```

관리 페이지:

```text
/admin/projects
```

메인 Selected Work에는 `is_featured=true` 프로젝트만 표시됩니다.

API:

```text
GET    /api/projects
GET    /api/projects?featured=true
GET    /api/projects/{id}
POST   /api/projects
PUT    /api/projects/{id}
DELETE /api/projects/{id}
```

## Cafe24 integration readiness

아직 Cafe24에 실제 요청을 보내지는 않습니다. 다음 환경변수와 구조만 준비되어 있습니다.

```bash
export CAFE24_MALL_ID=''
export CAFE24_CLIENT_ID=''
export CAFE24_CLIENT_SECRET=''
export CAFE24_REDIRECT_URI=''
```

연동 준비 상태 확인:

```text
GET /api/integrations/cafe24/status
```

Cafe24 secret은 Next.js 환경변수에 넣지 않고 반드시 Spring Boot 서버 환경변수로만 관리합니다.

향후 추가 위치:

```text
backend/.../config/cafe24/Cafe24Properties.java
backend/.../service/cafe24/
backend/.../controller/cafe24/
```

다음 Cafe24 구현 단계:
1. OAuth authorization URL
2. authorization code callback
3. access/refresh token 저장 및 갱신
4. 회원 인증
5. 상품 번호 매핑
6. 장바구니/Checkout 연결
