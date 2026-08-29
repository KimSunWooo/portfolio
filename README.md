# 🚀 Full-Stack Portfolio & Commerce Platform

> **개인 포트폴리오(이력 및 프로젝트)와 이커머스(쇼핑몰) 기능을 결합한 풀스택 웹 애플리케이션입니다.**  
> 기획부터 백엔드 아키텍처 설계, 프론트엔드 UI/UX 구현, 그리고 Docker 기반의 인프라 구축까지 서비스의 전체 라이프사이클을 직접 설계하고 개발했습니다.

<br>

## 🛠 Tech Stack (기술 스택)

### Frontend
- **Framework:** React, Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS

### Backend
- **Framework:** Spring Boot, Spring Security
- **Language:** Java
- **Database:** MySQL, Spring Data JPA (Hibernate)
- **Auth:** JWT (JSON Web Token), OAuth

### Infrastructure & DevOps
- **Container:** Docker, Docker Compose
- **Etc:** AWS (예정)

<br>

## ✨ Key Features (주요 기능)

### 1. Portfolio & Resume (`/`)
- 서버 사이드 렌더링(SSR)을 활용한 동적 포트폴리오 노출 (`force-dynamic`).
- 관리자 페이지를 통한 이력(기술 스택, 경력, 교육) 및 프로젝트 실시간 업데이트 기능.

### 2. E-Commerce (`/shop`)
- 상품 목록 및 상세 조회, 장바구니, 결제 확인 등 실제 커머스 플로우 구현.
- 비회원(Local Storage)과 회원(DB)의 장바구니 데이터 분리 및 로그인 시 동기화 처리.

### 3. Admin Dashboard (`/admin`)
- `hasAuthority("ADMIN")` 권한 기반의 관리자 전용 라우팅 보호.
- 다중 미디어(이미지/영상) 폼 데이터(FormData) 업로드 및 에셋 관리.

<br>

---

<br>

## 🔥 Troubleshooting & Problem Solving

> 프론트엔드, 백엔드, 인프라(Docker) 계층 간에 발생한 연동 이슈들을 근본적으로 추적하고 해결한 기록입니다. 단편적인 에러 수정을 넘어, **클라이언트 - SSR(프론트 서버) - API(백엔드)** 간의 생명주기와 데이터 흐름을 이해하며 문제를 해결했습니다.

### 📍 1. 데이터 통신 및 포맷 (HTTP & API)

**💡 Issue 1: 다중 미디어 파일 업로드 실패 (HTTP 415 & 403 에러)**
* **현상:** 프론트엔드에서 폼 데이터를 전송할 때 `415 Unsupported Media Type` 및 `403 Forbidden` 발생.
* **원인:** 
  * 프론트엔드에서 `FormData` 전송 시 `Content-Type`을 수동 지정하여 브라우저의 자동 `boundary` 설정이 누락됨.
  * 백엔드 컨트롤러에 `@RequestBody`가 남아있어 `multipart/form-data`를 JSON으로 강제 파싱하려 함.
* **해결:** 프론트엔드 `fetch` 헤더에서 `Content-Type`을 제거하고, 백엔드는 `@ModelAttribute`를 사용하여 정상적으로 바인딩하도록 수정.

**💡 Issue 2: 토큰 참조 위치 불일치로 인한 권한 에러**
* **현상:** 일반 API는 정상 작동하나, 특정 API(업로드) 호출 시에만 인증 실패(403) 발생.
* **원인:** 메인 API들은 메모리 변수(`inMemoryAccessToken`)에서 토큰을 읽고 있었으나, 업로드 로직만 쿠키에서 토큰을 찾도록 파편화되어 있어 백엔드로 토큰이 전달되지 않음.
* **해결:** 파일 전송 로직도 공통 함수인 `getAccessToken()`을 참조하도록 변경하여 인증 로직 일원화.

<br>

### 📍 2. 보안 및 권한 설정 (Spring Security)

**💡 Issue 1: POST 요청 시 보안 필터 차단**
* **현상:** 올바른 토큰과 데이터 포맷을 맞춰도 POST/PUT/DELETE API 접근이 차단됨.
* **원인:** Spring Security의 기본 CSRF 방어 기능이 켜져 있어 Stateless REST API 요청을 차단함.
* **해결:** `SecurityConfig`에서 `csrf().disable()` 처리 및 도메인 간 통신을 위한 CORS 정책(`allowCredentials(true)`) 추가.

**💡 Issue 2: 접두사 매칭 에러 (Role vs Authority)**
* **현상:** 관리자 계정(DB role: `ADMIN`)으로 로그인해도 권한 에러 발생.
* **원인:** `.hasRole("ADMIN")` 사용 시 내부적으로 `ROLE_ADMIN`을 기대하지만, DB와 토큰에는 `ADMIN`으로 저장되어 있어 매칭 실패.
* **해결:** 검증 로직을 `.hasAuthority("ADMIN")`으로 변경하여 정확한 권한명으로 매칭.

<br>

### 📍 3. 인프라 및 SSR 통신망 분리 (Docker & Next.js)

**💡 Issue 1: SSR 렌더링 시 API Connection Refused 에러**
* **현상:** 관리자 페이지(CSR)에서는 보이나, 메인 페이지(SSR)에서는 추가된 데이터가 보이지 않음.
* **원인:** SSR 환경(Next.js 도커 컨테이너 내부)에서 `localhost:8080`을 호출하면 브라우저가 아닌 컨테이너 자기 자신을 가리키게 되어 연결이 거부됨.
* **해결:** 환경(서버/클라이언트)에 따라 API 호출 URL을 동적으로 분기 처리. (서버일 때는 도커 내부망 호스트, 클라이언트일 때는 퍼블릭 주소 맵핑)

**💡 Issue 2: 이미지 리소스 ERR_NAME_NOT_RESOLVED 에러**
* **현상:** SSR 통신 해결 후 데이터는 넘어오나 이미지가 엑스박스로 깨짐.
* **원인:** 서버에서 렌더링 된 이미지 태그(`src="http://backend-api:8080/..."`)를 브라우저가 해석하지 못함.
* **해결:** 에셋 경로 변환 함수(`resolveAssetUrl`)를 구현하여, 파일 리소스 경로만큼은 **퍼블릭 주소(`localhost:8080`)** 로 강제 고정.

<br>

### 📍 4. 프론트엔드 최적화 (Rendering & Performance)

**💡 Issue 1: Next.js 정적 캐싱 무효화**
* **현상:** DB에 새 데이터를 추가해도 메인 페이지에 반영되지 않음.
* **원인:** Next.js App Router의 강력한 캐싱 정책.
* **해결:** `fetch` 옵션에 `{ cache: "no-store" }`를 추가하고, 컴포넌트 최상단에 `export const dynamic = "force-dynamic"`을 선언하여 SSR 동적 렌더링 강제화.

**💡 Issue 2: 도메인 별 UI 및 백그라운드 API 분리 최적화**
* **현상:** 포트폴리오 메인 화면에서도 쇼핑몰 장바구니 데이터를 불러오는 불필요한 네트워크 트래픽 발생.
* **원인:** Header 컴포넌트가 모든 페이지에 마운트되면서 내부의 `useEffect`가 무조건 실행됨.
* **해결:** 
  * `usePathname()`을 활용해 현재 경로를 식별(`isShopArea`).
  * 권한 체크(`restoreAuth`)는 어드민 관리를 위해 **글로벌하게 유지**.
  * 장바구니 갱신 로직은 `!isShopArea` 방어막을 쳐 **호출 원천 차단**.
  * 포트폴리오 ➔ 쇼핑몰 진입 시점을 감지하는 별도의 `useEffect`를 추가하여 생명주기 완벽 제어 및 네트워크 리소스 절약.

<br>

---

<br>

## 🚀 How to Run (실행 방법)

본 프로젝트는 Docker 환경으로 구성되어 있어 단일 명령어로 전체 서비스를 실행할 수 있습니다.

**1. 저장소 클론**
```bash
$ git clone https://github.com/KimSunWooo/[리포지토리이름].git
$ cd [리포지토리이름]

**2. 전체 서비스 백그라운드 실행 (DB, Backend, Frontend)**
`$ docker compose up -d`

**3. (코드 수정 후) 빌드하여 재실행**
`$ docker compose up -d --build`

* **Frontend 접속:** `http://localhost:3000`
* **Backend API 접속:** `http://localhost:8080`

<br>

## 📈 Current Progress (진행 현황)

- [x] 프론트/백엔드/DB Docker 인프라 구성 완료
- [x] Next.js App Router 기반 UI 라우팅 및 SSR 설계 완료
- [x] Spring Boot Security (JWT) 인증 및 CORS 권한 설정 완료
- [x] 프로젝트 미디어 다중 파일 업로드(FormData) 구현 및 연동 성공
- [x] 포트폴리오 / 쇼핑몰 도메인 간 UI 및 API 호출 분리 최적화 완료
- [ ] 쇼핑몰 상품 결제(PG) 및 주문 내역 고도화 진행 중
- [ ] 배포 서버(AWS) 세팅 및 CD/CI 파이프라인 구축 예정
