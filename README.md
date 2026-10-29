# Java / Spring Boot 기반 Web Backend & Full-Stack Portfolio

> **Java · Spring Boot를 중심으로 REST API, 인증/인가, 데이터베이스, 캐싱, Next.js, Docker/AWS까지 서비스 전체 흐름을 구현한 Full-Stack Web Application**

기존 웹 서비스 개발 및 유지보수 경험을 바탕으로,
**기획 → DB 설계 → Backend API → Frontend → 인증/인가 → 성능 최적화 → Docker → AWS → CI/CD**까지 하나의 서비스 흐름으로 직접 구현한 개인 프로젝트입니다.

단순한 기능 구현보다 실제 개발 과정에서 발생할 수 있는 **인증 오류, SSR/CSR 환경 차이, 캐시 직렬화 문제, Multipart 처리, Docker 네트워크 문제, 불필요한 API 요청** 등을 직접 분석하고 해결하는 데 집중했습니다.

---

## 로컬에서 보강한 설명 범위

이 저장소는 이력·프로젝트·기술 기록을 관리하는 콘텐츠 서비스이고, 상품·장바구니·100원 테스트 결제는 인증, 소유권, 재전송, 캐시 최신성, 외부 연동을 보여주는 모듈이다. 이커머스 회사 전용 포트폴리오로 한정하지 않는다.

기본 소개는 백엔드 중심 풀스택이다. 지원 직무에 따라 강조 순서만 바꾼다.

- Backend: `SecurityConfig`의 `/api/admin/**`, `CartService`, `ProductListCache`, `PaymentService`와 `backend/src/test/java`의 단위 테스트
- Frontend: 인증 복구(`ensureAccessToken`), 로그인 목적지, 검색의 최신 응답, 결제 결과 화면
- Full-stack: 프로젝트 미디어 JSON 수정이 저장 후 재조회되는지, 결제 승인 실패 시 DONE을 쓰지 않는지

자동매매 프로젝트 소개 원본은 `docs/projects/auto-trading-project.json`이다. Cursor를 활용한 바이브코딩 개인 프로젝트이며, 공유 RDS `projects` id 3에 등록되어 있다. 같은 `github_url`이 있으면 다시 넣지 않는다.

콘텐츠 초안·수정 충돌·변경 이력은 현재 스키마로 기본 경로에 넣지 않았다. 절차는 `docs/follow-up-content-workflow.md`에 있다.

시연용 관리자 계정은 저장소에 적지 않는다. 비밀번호는 별도로 전달하고, 이 문서나 커밋에 다시 넣지 않는다. 결제는 100원 승인 후 자동 취소하는 데모이며 일반 실결제로 바꾸지 않는다.

---

## 🌐 Project Overview

**Portfolio + Commerce Platform**

정적인 포트폴리오 페이지가 아닌, Spring Boot REST API와 MySQL을 기반으로 데이터를 관리하고 Next.js에서 동적으로 렌더링하는 웹 서비스입니다.

여기에 실제 서비스 구조를 경험하기 위해 **상품 조회, 장바구니, 주문/결제 관련 기능**을 추가하여 Commerce Platform 형태로 확장했습니다.

### 핵심 구현

* Spring Boot REST API
* Spring Security + JWT 인증/인가
* MySQL + JPA 기반 데이터 관리
* Redis Cache를 활용한 상품 조회 성능 개선
* Next.js App Router 기반 SSR / CSR
* 관리자 Dashboard
* 이미지 / 영상 Multipart Upload
* AWS RDS / S3
* Docker / Docker Compose
* GitHub Actions 기반 CI/CD
* k6 기반 API 부하 테스트

---

## 🎯 What I Focused On

이 프로젝트에서 단순히 여러 기술을 사용하는 것보다 다음과 같은 **실제 개발 문제를 해결하는 경험**에 집중했습니다.

### 1. Backend

* REST API 설계
* Spring Security 기반 인증/인가
* JWT Stateless Authentication
* JPA / Hibernate 기반 데이터 접근
* 관리자 Role 기반 API 접근 제어
* Multipart 파일 업로드

### 2. Performance

* 상품 목록 API Redis Cache 적용
* Cache Key 설계
* Redis Serialization / Deserialization 문제 해결
* k6 기반 부하 테스트
* Cache 적용 전후 성능 비교

### 3. Full-Stack Integration

* Next.js SSR / CSR과 Spring Boot API 연동
* Browser와 Docker Container의 네트워크 환경 차이 해결
* Public API / Internal API Endpoint 분리
* 인증 Token Source 통일
* 페이지별 API Lifecycle 분리

### 4. Deployment

* Frontend / Backend Dockerization
* Docker Compose
* AWS EC2 / RDS / S3
* GitHub Actions CI/CD
* Production 환경 설정 분리

---

# 🏗️ Architecture

```text
                         User
                           │
                           ▼
                ┌───────────────────┐
                │     Next.js       │
                │ React / TypeScript│
                │    App Router     │
                │     SSR / CSR     │
                └─────────┬─────────┘
                          │
                       REST API
                          │
                          ▼
                ┌───────────────────┐
                │    Spring Boot    │
                │ Spring Security   │
                │   JWT / REST API  │
                └───────┬─────┬─────┘
                        │     │
                   Cache│     │Persistence
                        ▼     ▼
                   ┌──────┐ ┌──────────┐
                   │Redis │ │ AWS RDS  │
                   │Cache │ │  MySQL   │
                   └──────┘ └──────────┘
                             
                          AWS S3
                       Image / Media
```

---

# 🛠️ Tech Stack

### Backend

`Java 21` `Spring Boot` `Spring Security` `Spring Data JPA` `Hibernate`

`MySQL` `REST API` `JWT` `Spring Cache` `Redis`

### Frontend

`Next.js` `React` `TypeScript` `App Router`

`SSR` `CSR` `Tailwind CSS` `Zustand` `Axios`

### Infrastructure

`Docker` `Docker Compose`

`AWS EC2` `AWS RDS` `AWS S3`

`Docker Hub` `GitHub Actions`

### Testing / Performance

`k6`

---

# ✨ Main Features

## 1. Dynamic Portfolio

Backend API와 Database를 기반으로 동작하는 동적 포트폴리오입니다.

* 경력 / 교육 / 기술 스택 관리
* 프로젝트 정보 관리
* 관리자 페이지를 통한 데이터 수정
* SSR 기반 동적 렌더링

```text
Admin
  ↓
Spring Boot API
  ↓
MySQL / AWS RDS
  ↓
Next.js SSR
  ↓
Portfolio
```

---

## 2. E-Commerce

포트폴리오 서비스 내부에 Commerce 기능을 구성했습니다.

* 상품 목록 / 상세
* 장바구니
* 로그인 사용자 / 비회원 장바구니 분리
* 로그인 이후 장바구니 동기화
* 주문 / 결제 관련 기능

목록과 상세는 같은 담기 정책을 쓴다. 비회원은 Local Storage에 담고, 로그인 사용자는 서버 장바구니에 담는다. 수량은 1개 이상 99개 이하다. 저장된 수량이 이 범위를 벗어나면 항목을 지우지 않고 범위 안으로 맞춘다. 색상은 선택 사항이며, 같은 상품의 다른 색은 다른 줄이다. 색이 없는 기존 줄은 그대로 둔다.

로그인 이후에는 비회원 장바구니를 서버 장바구니와 한 번 병합한다. 같은 내용의 재시도는 같은 Idempotency-Key를 쓰고, 병합이 실패하면 로컬 장바구니는 남긴다.

Refresh Token은 계정당 하나다. Redis에는 현재 세션과 10초 유예의 이전 세션이 있고, 계정 세대는 DB `users.session_epoch`에 있다. 로그아웃과 비밀번호 변경은 세대를 올린 뒤에 Redis를 지운다. Redis 삭제가 실패해도 이전 Refresh는 거절된다. 그 응답은 로그아웃 완료와 다르다. Access Token은 만료 전까지 상태 없이 유효하다. Refresh와 로그아웃은 허용된 Origin이 있을 때만 받는다.

---

## 3. Admin Dashboard

관리자 권한을 기반으로 포트폴리오와 상품 데이터를 관리합니다.

* 관리자 인증
* 포트폴리오 데이터 관리
* 상품 데이터 관리
* 이미지 / 영상 Multipart Upload
* 관리자 전용 API 접근 제어

---

# 🔐 Authentication & Authorization

Spring Security와 JWT를 이용한 Stateless 인증 구조를 구현했습니다.

```text
Login
  ↓
Spring Security
  ↓
JWT 발급
  ↓
Client
  ↓
API Request + JWT
  ↓
JwtAuthenticationFilter
  ↓
JwtTokenProvider
  ↓
SecurityContext
  ↓
Authorization
```

세션 기반 인증 대신:

```java
SessionCreationPolicy.STATELESS
```

를 적용했습니다.

관리자 API는:

```java
.hasRole("ADMIN")
```

을 기반으로 접근을 제한합니다.

JWT 인증 필터에서 Access Token을 검증하고 `SecurityContext`에 Authentication을 설정하여 이후 Spring Security의 권한 검사를 수행하도록 구성했습니다.

---

# ⚡ Performance Optimization

## Redis Cache

상품 목록 조회 API에 Spring Cache와 Redis를 적용했습니다.

반복적인 상품 목록 조회 요청에 대해 DB를 매번 조회하지 않고 Redis Cache를 활용하도록 구성했습니다.

```text
API Request
     │
     ▼
Redis Cache
     │
 ┌───┴───┐
Hit     Miss
 │        │
 ▼        ▼
Response MySQL
          │
          ▼
        Redis
          │
          ▼
       Response
```

### Cache Policy

* TTL: 10분
* Null Value Cache 비활성화
* String 기반 Cache Key
* `GenericJackson2JsonRedisSerializer`
* Java Time 처리를 위한 `JavaTimeModule`

### Performance Result

캐시 전후 응답 시간으로 적혀 있던 138ms → 21ms는 측정 원본과 환경이 이 저장소에 남아 있지 않아, 이번 문서의 확정 결과로 사용하지 않는다.

k6 스크립트 조건은 아래에 남아 있다. 이번 작업에서 부하 테스트를 다시 실행하지는 않았다.

```text
Virtual Users : 50
Duration      : 30 seconds
Target        : /api/products
```

---

# 🔥 Troubleshooting

이 프로젝트에서 가장 중요하게 생각한 부분입니다.

단순히 기능을 구현하는 데서 끝내지 않고, **문제 발생 → 원인 분석 → 해결 → 구조 개선**의 과정을 기록했습니다.

---

## 01. Redis Serialization / Generic Type 문제

### Problem

`List<DTO>` 형태의 응답을 Redis에 저장하는 과정에서 Jackson 역직렬화 시 타입 정보가 기대한 형태로 복원되지 않는 문제가 발생했습니다.

### Solution

응답 구조를 명시적인 Wrapper 객체로 변경했습니다.

```text
List<ProductListResponse>
        ↓
ProductListWrapper
        ↓
Redis Serialization
        ↓
Deserialization
```

또한 Redis 전용 `ObjectMapper`와 `GenericJackson2JsonRedisSerializer`를 구성하여 Cache Value의 직렬화 / 역직렬화 방식을 명시적으로 관리했습니다.

---

## 02. Spring Security ROLE_ADMIN 문제

### Problem

DB / JWT의 권한 값과 Spring Security의 Role 기반 접근 제어 방식이 일치하지 않아 관리자 API 호출 시 `403 Forbidden`이 발생했습니다.

### Solution

Role 체계를 일관되게 맞추고 관리자 API에:

```java
.hasRole("ADMIN")
```

을 적용했습니다.

이를 통해 인증(Authentication)과 인가(Authorization)의 역할을 분리하고 관리자 API 접근 제어를 일관되게 구성했습니다.

---

## 03. Docker + Next.js SSR `localhost` 문제

### Problem

CSR에서는 API 요청이 정상적으로 동작하지만 SSR 환경에서 `Connection Refused`가 발생했습니다.

### Root Cause

Browser의 `localhost`와 Docker Container 내부의 `localhost`가 서로 다른 실행 환경을 가리키기 때문이었습니다.

```text
Browser
localhost:8080
    ↓
사용자 PC

Next.js Container
localhost:8080
    ↓
Next.js Container 자신
```

### Solution

실행 환경에 따라 API Endpoint를 분리했습니다.

```text
Browser
  ↓
NEXT_PUBLIC_API_URL
  ↓
Public API


Next.js SSR
  ↓
INTERNAL_API_URL
  ↓
Docker Internal Network
  ↓
Backend
```

---

## 04. SSR Image `ERR_NAME_NOT_RESOLVED`

### Problem

SSR 과정에서 Docker 내부 hostname을 포함한 이미지 URL이 Browser로 전달되어 이미지가 표시되지 않는 문제가 발생했습니다.

### Root Cause

`backend-api`와 같은 Docker 내부 hostname은 Browser 환경에서 해석할 수 없습니다.

### Solution

Server와 Browser의 Asset URL을 분리했습니다.

```text
Server
  ↓
Internal API URL

Browser
  ↓
Public API URL
```

`resolveAssetUrl()`을 통해 Browser에 전달되는 Asset URL을 Public URL 기준으로 처리하도록 구성했습니다.

---

## 05. Multipart Upload `415 / 403`

### Problem

관리자 페이지의 이미지 / 영상 업로드 과정에서:

* `415 Unsupported Media Type`
* `403 Forbidden`

오류가 발생했습니다.

### Root Cause

Frontend에서 FormData 요청의 `Content-Type`을 직접 지정하면서 Multipart Boundary 처리에 문제가 발생했고, Backend에서도 Multipart 데이터를 JSON 요청과 동일한 방식으로 처리하는 문제가 있었습니다.

### Solution

Frontend에서는 FormData 전송 시 `Content-Type`을 직접 지정하지 않도록 수정했습니다.

Backend에서는 `MultipartFile` 기반으로 Multipart 요청을 처리하도록 변경했습니다.

---

## 06. JWT Token Source 불일치

### Problem

일반 API는 정상적으로 인증되지만 특정 파일 업로드 API에서만 `403`이 발생했습니다.

### Root Cause

일부 API는 메모리의 Access Token을 사용하고, 다른 로직은 Cookie를 기준으로 Token을 조회하는 등 인증 Token Source가 일관되지 않았습니다.

### Solution

공통 인증 함수:

```text
getAccessToken()
```

를 사용하도록 인증 흐름을 통일했습니다.

---

## 07. Next.js App Router Cache

### Problem

관리자 페이지에서 데이터를 수정했지만 메인 페이지에 변경 사항이 즉시 반영되지 않는 문제가 발생했습니다.

### Solution

동적 데이터가 필요한 요청에는:

```text
cache: "no-store"
```

를 적용하고 필요한 페이지에는:

```text
dynamic = "force-dynamic"
```

을 사용하여 최신 데이터를 조회하도록 구성했습니다.

---

## 08. 불필요한 API Request 제거

### Problem

Portfolio 페이지에서도 Shopping Cart API가 호출되는 문제가 발생했습니다.

### Root Cause

Global Header가 모든 페이지에서 Mount되고 내부 `useEffect`가 페이지 종류와 관계없이 실행되고 있었습니다.

### Solution

`usePathname()`을 이용해 현재 경로를 확인하고 필요한 페이지에서만 Cart API를 호출하도록 분리했습니다.

```text
Portfolio
 └── Cart API 호출 X

Shop
 └── Cart API 호출 O
```

페이지별 데이터 Lifecycle을 분리하여 불필요한 API Request를 제거했습니다.

---

# ☁️ AWS / Production

## AWS RDS

Production 환경에서는 AWS RDS의 MySQL을 사용합니다.

Production 설정에서는:

```properties
spring.jpa.hibernate.ddl-auto=validate
```

를 적용하여 애플리케이션 실행 과정에서 DB Schema가 임의로 변경되지 않도록 구성했습니다.

## AWS S3

상품 이미지 및 프로필 이미지 등의 파일을 AWS S3에 저장합니다.

파일 업로드 시 UUID 기반 파일명을 생성하고 DB에는 Asset URL을 저장하도록 구성했습니다.

---

# 🚀 CI/CD

GitHub Actions workflow(`.github/workflows/deploy.yml`)는 `main`에 backend, frontend, `deploy.sh`, `ops`, workflow 변경이 push되거나 `workflow_dispatch`로 실행할 때 동작한다. Markdown만 바꾼 push는 배포하지 않는다. 같은 workflow의 실행은 `concurrency`로 직렬화하고, 진행 중인 배포는 `cancel-in-progress: false`로 취소하지 않는다.

Runner는 `ubuntu-24.04`다. `actions/checkout@v5`, `actions/setup-java@v5`, `actions/setup-node@v5`, Docker Buildx/login/build-push의 Node 24용 안정 버전을 쓴다. Java는 Temurin 21, 프런트 검사는 Node 22다. 이 Node 버전은 Actions job의 검사용이고, 운영 프런트 이미지의 `node:20-alpine`과는 따로다. EC2 OS는 이 경고 때문에 바꾸지 않는다.

`verify-deploy`, `backend-tests`, `frontend-checks`가 모두 통과해야 `build-and-push`가 실행된다. `deploy`는 그 이미지 빌드가 성공한 뒤에만 실행된다. 하나라도 실패하면 이미지 push와 EC2 배포는 시작되지 않는다. 백엔드 이미지 빌드 자체는 계속 `./gradlew clean build -x test`다. 업무 테스트는 이미지 빌드 안이 아니라 `backend-tests` job에서 `./gradlew test`로 실행한다. 그 테스트는 운영 RDS, Redis, S3, 메일, 결제에 연결하지 않고 Testcontainers MySQL과 Redis, Fake 결제 게이트웨이를 쓴다.

이미지는 `github.sha`와 호환용 `latest`로 빌드한다. EC2는 `~/portfolio-release/<sha>`에 그 커밋의 `deploy.sh`, `ops/lib`, `ops/nginx`를 두고 그 스크립트를 `sha` 태그로 실행한다. `latest`는 배포 대상으로 쓰지 않는다. `.env`와 `.deploy.lock`은 릴리스 폴더가 아니라 `~/portfolio`를 쓴다. Nginx 백업은 `manifest.tsv`에 원본 경로와 백업 경로를 남기고, 복구는 그 백업 디렉터리의 `restore.sh`로 한다.

Nginx `/api`는 `/etc/nginx/conf.d/service-url.inc`의 `$service_url`을 사용해야 한다. blue는 호스트 8081, green은 호스트 8082다. 프런트엔드는 호스트 3000 하나라서 교체 구간에 짧은 공백이 있다. 브라우저 API와 Next.js 서버 렌더링은 같은 blue/green 백엔드를 본다.

이 workflow 수정은 작업 트리에만 있다. push하지 않았고 GitHub Actions도 이 개정으로 실행하지 않았다. 로컬 명령 통과를 운영 배포 완료로 보지 않는다.

```text
Git Push main
      ↓
GitHub Actions
      ↓
Backend Docker Build
      ↓
Frontend Docker Build
      ↓
Docker Hub Push
      ↓
EC2 SSH
      ↓
Deployment Script
      ↓
Docker Image Pull
      ↓
Container Deployment
```

민감한 Docker Hub / AWS / EC2 관련 정보는 GitHub Secrets를 통해 관리합니다.

이미지 빌드 job에는 Redis 서비스 컨테이너를 두지 않는다. Redis가 필요한 검증은 `backend-tests`의 Testcontainers가 격리된 Redis를 띄운다.

---

# 🐳 Docker

Frontend와 Backend를 각각 Docker Image로 구성하고 Docker Compose를 통해 함께 실행할 수 있도록 구성했습니다.

```text
Docker Compose
├── Frontend
│   └── Next.js
│
└── Backend
    └── Spring Boot
```

Production Database는 AWS RDS를 사용하며 Redis Endpoint 역시 환경변수를 통해 주입할 수 있도록 구성했습니다.

운영 백엔드 이미지는 Amazon Corretto 21이다. 운영 프런트 이미지는 빌드와 실행 모두 `node:20-alpine`이다. Node 20 지원 종료 이후의 이미지 교체는 이 변경에 포함하지 않았다. 이미지 런타임을 바꾸려면 별도로 빌드와 화면 동작을 확인해야 한다.

---

# 📈 Performance Test

`k6` 기반 부하 테스트 스크립트를 포함하고 있습니다.

```javascript
export const options = {
    vus: 50,
    duration: '30s',
};
```

상품 목록 API를 대상으로 반복 요청을 발생시켜 Cache 적용 전후의 성능을 비교할 수 있도록 구성했습니다.

---

# 📌 Project Summary

이 프로젝트를 통해 다음 영역을 하나의 서비스 흐름으로 경험했습니다.

| 영역              | 구현 경험                                            |
| --------------- | ------------------------------------------------ |
| Backend         | Java, Spring Boot, REST API                      |
| Security        | Spring Security, JWT, Role 기반 Authorization      |
| Database        | MySQL, JPA / Hibernate                           |
| Cache           | Spring Cache, Redis                              |
| Frontend        | Next.js, React, TypeScript                       |
| Rendering       | SSR, CSR, App Router                             |
| File            | Multipart Upload, AWS S3                         |
| Infrastructure  | Docker, Docker Compose                           |
| Cloud           | AWS EC2, RDS, S3                                 |
| CI/CD           | GitHub Actions, Docker Hub                       |
| Performance     | Redis Cache, k6                                  |
| Troubleshooting | 인증 / 캐시 / SSR / 네트워크 / Multipart / API Lifecycle |

---

# 💡 Key Takeaways

이 프로젝트에서 가장 중요하게 생각한 것은 **사용한 기술의 개수보다 문제를 해결하는 과정**이었습니다.

특히 다음과 같은 문제를 직접 분석하고 해결했습니다.

* Redis Cache 적용 과정의 Serialization 문제
* Spring Security Role Mapping 문제
* JWT Token Source 불일치
* Next.js SSR과 Docker Network 차이
* SSR Asset URL 문제
* Multipart `415 / 403` 문제
* Next.js App Router Cache 문제
* 불필요한 API Request 문제

이를 통해 **Frontend → Backend → Database → Cache → Container → Cloud**로 이어지는 Web Service의 전체 Request Lifecycle을 이해하고 문제를 추적하는 경험을 쌓았습니다.

---

## 🔗 Repository

**GitHub:** https://github.com/KimSunWooo/portfolio

관련 개인 프로젝트: [미리매수](https://github.com/KimSunWooo/Auto-Trading-system)  
Cursor를 활용한 바이브코딩으로 개발했다. 포트폴리오 화면 등록 상태는 `docs/projects/auto-trading-project.json`의 `registration`을 본다.

## 로컬 검증

아래 명령은 이 작업 트리에서 확인하는 방법이다. GitHub Actions 성공이나 운영 반영은 push와 운영 DB 적용 이후에만 말할 수 있다.

```bash
bash ops/tests/run-deploy-checks.sh
bash -n deploy.sh ops/nginx/apply-api-upstream.sh ops/nginx/recover-service.sh ops/lib/slots.sh ops/tests/run-deploy-checks.sh
cd backend && ./gradlew test --no-daemon
cd frontend && npm run lint && npm run typecheck && npm test && npm run build
git diff --check
```

백엔드 테스트는 격리된 MySQL과 Redis를 띄운다. 운영 RDS, Redis, S3, 메일, 결제에는 연결하지 않는다. 프런트 인증 테스트는 `frontend/src/lib/authSession.test.mts`다.

2026-10-13 작업 트리에서 로컬로 확인한 결과는 다음과 같다. 배포 모의 검사 27개는 연속 두 번 통과했고, 검사가 만든 flock 프로세스는 남지 않았다. 수정한 셸의 `bash -n`과 workflow YAML 파싱은 통과했다. `./gradlew test`는 32개 통과했다. 프런트 lint는 오류 0건과 `<img>` 경고 16건, `tsc --noEmit`은 통과, 인증 테스트는 7개 통과, `next build`는 정적 페이지 54개를 만들었다. `git diff --check`도 통과했다. GitHub Actions, EC2, 운영 컨테이너, 운영 DB 마이그레이션은 실행하지 않았다.

## 대표 수정

### 관리자 API 인가

`/api/admin/products`는 `/api/products/**` 규칙과 일치하지 않아 로그인 사용자에게 열려 있었다. `/api/admin/**`를 `ROLE_ADMIN`으로 막았다. 공개 조회 경로는 그대로다. Access Token으로 만든 인증 정보는 `SecurityContext`와 요청에 함께 저장한다. Refresh Token은 Access Token으로 쓰지 않는다.

### 빈 장바구니와 병합 재전송

상품이 없는 Cart는 INNER JOIN으로 조회되지 않아 다시 담을 때 Cart가 새로 생길 수 있었다. 조회는 LEFT JOIN, 변경은 장바구니 행 잠금으로 나눴다. 같은 사용자, 같은 작업, 같은 `Idempotency-Key`의 병합은 `cart_sync_requests`의 UNIQUE 제약과 같은 DB 트랜잭션에서 한 번만 수량을 더한다. 같은 키에 다른 내용이 오면 409다. 트랜잭션이 롤백되면 그 키로 다시 시도할 수 있다. 키가 없으면 매번 병합한다. 프로세스 메모리에만 두던 완료 기록은 쓰지 않으므로 재시작 뒤에도 같은 키는 다시 더하지 않는다.

운영 `ddl-auto`는 `validate`다. `CartSyncRequest`가 들어 있는 이미지를 올리기 전에 `backend/src/main/resources/db/migration/V1__cart_sync_requests.sql`을 운영 DB에 한 번 적용해야 한다. 이 파일은 기존 `carts`, `cart_items`를 바꾸지 않는다. 되돌릴 때는 `cart_sync_requests`만 삭제하고 이전 이미지로 돌아간다. 이 마이그레이션은 운영 DB에 실행하지 않았다. 테이블이 없는 상태에서 새 이미지를 배포 가능하다고 보지 않는다.

### 테스트 결제

승인 응답을 확인하기 전에 DONE을 저장하지 않는다. 금액은 100원만 받고, 승인 뒤에 취소한다. 취소에 실패하면 성공 화면으로 처리하지 않는다. 장바구니는 비우지 않는다. 같은 프로세스 안에서는 승인 트랜잭션이 끝난 뒤에 잠금을 풀어 중복 승인을 막는다. 인스턴스가 둘 이상이면 그 잠금만으로는 중복 승인을 막지 못한다. 외부 호출은 운영 키가 아닌 테스트의 FakePaymentGateway로만 검증했다. 실제 결제 API에는 연결하지 않는다.

