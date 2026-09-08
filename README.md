# Full-Stack Portfolio & Commerce Platform

### Next.js + Spring Boot 기반의 풀스택 포트폴리오 & 커머스 플랫폼

개인 포트폴리오 관리 시스템과 이커머스 기능을 하나의 서비스로 통합한 풀스택 웹 애플리케이션입니다.

Frontend → Backend → Database → Cache → Docker → AWS EC2 → CI/CD까지 전체 서비스 라이프사이클을 직접 설계하고 구현했으며, 단순 기능 구현을 넘어 **인증·인가, SSR/CSR 환경 차이, 캐싱, 컨테이너 네트워크, 배포 자동화 및 운영 환경 트러블슈팅**에 집중했습니다.

특히 Redis 기반 캐싱을 적용하여 반복 조회 API의 응답 성능을 개선했으며, 실제 Docker 기반 Production 환경에서 발생한 문제를 요청 Lifecycle과 실행 환경 관점에서 분석하고 해결했습니다.

---

## 🌐 Project Overview

정적인 포트폴리오 페이지가 아닌 **관리자가 직접 데이터를 관리할 수 있는 동적 포트폴리오 서비스**를 구축했습니다.

관리자 페이지에서 경력, 교육, 기술 스택, 프로젝트 등의 정보를 관리하고, Spring Boot REST API와 MySQL을 통해 데이터를 저장합니다.

또한 동일한 서비스에 상품 조회, 장바구니, 주문/결제 관련 기능을 추가하여 실제 웹 서비스에 가까운 **Commerce Platform 구조**로 확장했습니다.

### 핵심 목표

* **Full-Stack Architecture**

  * Next.js App Router 기반 SSR / CSR 구조 설계
  * Spring Boot REST API 서버 구축

* **Authentication & Authorization**

  * Spring Security + JWT 기반 Stateless 인증
  * 사용자 / 관리자 권한 분리

* **Performance Optimization**

  * Redis 기반 API Cache 적용
  * 반복적인 DB 조회 최소화
  * 캐시 적용 전후 성능 비교 및 응답 시간 개선

* **Environment-Aware Development**

  * Browser / Next.js SSR / Docker Container 간 네트워크 차이 해결
  * Public URL과 Internal URL 분리

* **Deployment Automation**

  * Docker / Docker Compose 기반 컨테이너화
  * GitHub Actions 기반 CI/CD
  * AWS EC2 Production 배포

* **Troubleshooting**

  * Multipart Upload
  * JWT 인증 Lifecycle
  * Spring Security
  * Docker Network
  * Next.js App Router Cache
  * Redis Cache
  * SSR Asset URL
  * 불필요한 API Request

---

# 🏗️ Architecture

```text
                              User
                               │
                               ▼
                    ┌────────────────────┐
                    │      Next.js       │
                    │ React / TypeScript │
                    │    App Router      │
                    │     SSR / CSR      │
                    │      Zustand       │
                    └─────────┬──────────┘
                              │
                         REST API
                              │
                              ▼
                    ┌────────────────────┐
                    │       Nginx        │
                    │ Reverse Proxy /    │
                    │ Routing            │
                    └─────────┬──────────┘
                              │
                              ▼
                    ┌────────────────────┐
                    │    Spring Boot     │
                    │ Spring Security    │
                    │ JWT / REST API     │
                    └──────┬───────┬─────┘
                           │       │
                    Cache  │       │ Persistence
                           ▼       ▼
                    ┌─────────┐ ┌──────────┐
                    │  Redis  │ │  MySQL   │
                    │  Cache  │ │   JPA    │
                    └─────────┘ └──────────┘
```

### CI/CD

```text
Git Push
   │
   ▼
GitHub Actions
   │
   ├── Backend Build
   ├── Frontend Build
   ├── Docker Image Build
   └── Docker Hub Push
            │
            ▼
         AWS EC2
            │
            ├── Docker Image Pull
            ├── Docker Compose
            └── Service Restart / Deployment
```

---

# 🛠️ Tech Stack

## Frontend

* Next.js 14
* React
* TypeScript
* Tailwind CSS
* App Router
* Server Components
* Client Components
* SSR / CSR
* Fetch API
* Zustand

## Backend

* Java 21
* Spring Boot
* Spring Security
* Spring Data JPA
* Hibernate
* REST API
* JWT Authentication / Authorization

## Database & Cache

* MySQL
* Redis

## Infrastructure

* Docker
* Docker Compose
* Nginx
* AWS EC2
* Docker Hub
* GitHub Actions

---

# ✨ Main Features

## 1. Dynamic Portfolio

정적 HTML 기반 포트폴리오가 아닌 **Backend API와 Database를 기반으로 동작하는 Dynamic Portfolio**를 구현했습니다.

### 주요 기능

* 경력 관리
* 교육 관리
* 기술 스택 관리
* 프로젝트 관리
* 관리자 페이지를 통한 데이터 수정
* SSR 기반 포트폴리오 렌더링
* 관리자 전용 API 접근 제어

```text
Admin
  │
  ▼
Spring Boot API
  │
  ├──── Redis Cache
  │
  ▼
MySQL
  │
  ▼
Next.js SSR
  │
  ▼
Portfolio
```

---

# 2. E-Commerce

포트폴리오 서비스 내부에 실제 커머스 서비스를 구성했습니다.

### Shopping

* 상품 목록
* 상품 상세
* 장바구니
* 비회원 장바구니
* 로그인 사용자 장바구니
* 로그인 이후 장바구니 동기화
* 주문 / 결제 관련 기능

비회원 사용자는 Local Storage 기반 장바구니를 사용하고, 로그인 이후 서버의 DB 기반 장바구니와 동기화하도록 구성했습니다.

```text
Guest
 │
 ▼
Local Storage Cart
 │
 │ Login
 ▼
Server Cart
 │
 ▼
Database
```

---

# 3. Admin Dashboard

관리자 권한을 기반으로 포트폴리오 및 상품 데이터를 관리합니다.

### 주요 기능

* 관리자 인증
* 포트폴리오 데이터 관리
* 상품 데이터 관리
* 이미지 / 영상 Multipart Upload
* 관리자 전용 API
* 권한 기반 접근 제어

Spring Security의 Authority 기반 접근 제어를 사용했습니다.

```java
.hasRole("ADMIN")
```

---

# 🔐 Authentication & Authorization

Spring Security와 JWT를 이용하여 Stateless 인증 구조를 구성했습니다.

```text
Login
  │
  ▼
Spring Security
  │
  ▼
JWT 발급
  │
  ▼
Client
  │
  ▼
API Request + JWT
  │
  ▼
Authentication Filter
  │
  ▼
Authorization
```

관리자 API는 `ADMIN` Authority를 기반으로 접근을 제한합니다.

또한 인증 정보를 조회하는 로직을 공통화하여 API마다 서로 다른 Token Source를 사용하는 문제를 제거했습니다.

---

# ⚡ Redis Cache & Performance Optimization

반복적으로 조회되는 데이터를 대상으로 Redis Cache를 적용했습니다.

### 기존 구조

```text
Client
  │
  ▼
Spring Boot
  │
  ▼
MySQL
  │
  ▼
Response
```

동일한 데이터를 반복 요청할 때마다 Database Query가 발생하는 구조였습니다.

### Redis 적용 후

```text
Client
  │
  ▼
Spring Boot
  │
  ▼
Redis
 │
 ├── Cache Hit → Response
 │
 └── Cache Miss
          │
          ▼
        MySQL
          │
          ▼
       Redis 저장
          │
          ▼
       Response
```

### 적용 효과

* 반복적인 Database Query 감소
* 읽기 중심 API 응답 성능 개선
* Database 부하 감소
* 자주 조회되는 Portfolio 데이터의 빠른 응답

Redis Cache 적용 후 측정 환경에서 **API 응답 성능을 약 85% 개선**했습니다.

> ※ 성능 수치는 동일 조건에서 Cache 적용 전후를 비교한 측정 결과를 기준으로 작성했습니다.

---

# 🚀 CI/CD

GitHub Actions를 이용하여 `main` 브랜치 Push 이후 자동 배포가 수행되도록 구성했습니다.

```text
git push main
      │
      ▼
GitHub Actions
      │
      ├───────────────┐
      ▼               ▼
Backend Build     Frontend Build
      │               │
      └───────┬───────┘
              ▼
        Docker Image
              │
              ▼
          Docker Hub
              │
              ▼
           AWS EC2
              │
              ▼
      docker compose pull
              │
              ▼
      docker compose up -d
```

### Deployment Pipeline

1. GitHub `main` Branch Push
2. GitHub Actions 실행
3. Backend Docker Image Build
4. Frontend Docker Image Build
5. Docker Hub Push
6. EC2 SSH 접속
7. Docker Image Pull
8. Docker Compose 재배포
9. 불필요한 Docker Image 정리

민감한 인증 정보는 GitHub Actions Secrets를 이용하여 관리합니다.

---

# 🐳 Docker

Frontend와 Backend를 Docker 기반으로 컨테이너화하여 개발 환경과 Production 환경의 차이를 줄였습니다.

```text
Docker Compose
│
├── Frontend
│   └── Next.js
│
├── Backend
│   └── Spring Boot
│
├── Database
│   └── MySQL
│
└── Cache
    └── Redis
```

Docker Container 간 Internal Network를 활용하여 SSR 환경에서 Backend API와 통신할 수 있도록 구성했습니다.

---

# 🔥 Troubleshooting

이 프로젝트에서 가장 많은 시간을 투자한 부분은 단순 기능 구현보다 **Frontend → SSR → Backend → Docker → Database / Cache 사이에서 발생하는 실행 환경 차이와 상태 불일치를 추적하는 과정**이었습니다.

---

## 1. Multipart Upload - HTTP 415 / 403

### 문제

관리자 페이지에서 이미지 / 영상 업로드 시:

```text
415 Unsupported Media Type
403 Forbidden
```

발생.

### 원인

Frontend에서 `FormData`를 전송하면서 `Content-Type`을 직접 지정하여 Multipart Boundary가 정상적으로 생성되지 않았습니다.

또한 Backend에서는 `@RequestBody`를 사용하고 있어 Multipart 데이터를 JSON 형태로 처리하려는 문제가 있었습니다.

### 해결

Frontend:

```text
Content-Type 수동 지정 제거
```

Backend:

```text
@RequestBody
      ↓
@ModelAttribute
```

로 변경하여 Multipart 데이터를 정상적으로 처리했습니다.

---

# 2. JWT Token Source 불일치

### 문제

일반 API는 정상적으로 인증되지만 특정 파일 Upload API에서만:

```text
403 Forbidden
```

발생.

### 원인

일반 API:

```text
inMemoryAccessToken
```

Upload API:

```text
Cookie
```

처럼 서로 다른 위치에서 JWT를 참조하고 있었습니다.

### 해결

공통 인증 함수:

```text
getAccessToken()
```

을 사용하도록 인증 로직을 통일했습니다.

이를 통해 API별 Token Source 차이로 발생하는 인증 오류를 제거했습니다.

---

# 3. Spring Security CSRF / REST API

### 문제

정상적인 JWT를 포함한 POST / PUT / DELETE 요청이 차단되었습니다.

### 원인

Stateless REST API 환경에서도 Spring Security의 기본 CSRF 정책이 적용되어 요청이 차단되고 있었습니다.

### 해결

REST API 인증 구조에 맞게 CSRF 정책을 조정하고 CORS 설정을 구성했습니다.

---

# 4. ROLE_ADMIN vs ADMIN

### 문제

DB와 JWT에는 `ADMIN` 권한이 존재하지만 관리자 API 접근 시 권한 오류가 발생했습니다.

### 원인

Spring Security:

```java
hasRole("ADMIN")
```

사용 시 내부적으로:

```text
ROLE_ADMIN
```

형태를 기대합니다.

하지만 실제 시스템에서는:

```text
ADMIN
```

권한을 사용하고 있었습니다.

### 해결

```java
hasRole("Admin") 으로 통일
```

으로 변경하여 실제 권한 값과 일치시켰습니다.

---

# 5. Docker + Next.js SSR localhost 문제

### 문제

CSR 환경에서는 API 요청이 정상적으로 동작하지만 SSR 환경에서:

```text
Connection Refused
```

발생.

### 원인

Browser에서:

```text
localhost:8080
```

은 사용자의 PC를 의미하지만,

Next.js Docker Container 내부에서:

```text
localhost:8080
```

은 Next.js Container 자신을 의미합니다.

### 해결

실행 환경에 따라 API Endpoint를 분리했습니다.

```text
Browser
   │
   ▼
Public API URL


Next.js SSR
   │
   ▼
Docker Internal Network
   │
   ▼
Backend Container
```

이를 통해 Browser와 Server가 서로 다른 네트워크 경로를 사용하도록 구성했습니다.

---

# 6. SSR Image ERR_NAME_NOT_RESOLVED

### 문제

SSR 데이터는 정상적으로 받아왔지만 이미지가 브라우저에서 표시되지 않았습니다.

### 원인

SSR 과정에서 생성된 이미지 URL이:

```text
http://backend-api:8080/...
```

형태로 브라우저에 전달되었습니다.

`backend-api`는 Docker 내부 Network에서만 해석 가능한 hostname이기 때문에 Browser에서는 접근할 수 없습니다.

### 해결

Asset URL 변환 로직을 구현하여:

```text
Server
  ↓
Internal URL


Browser
  ↓
Public URL
```

형태로 분리했습니다.

---

# 7. Next.js App Router Cache

### 문제

관리자 페이지에서 데이터를 수정했지만 메인 페이지에 즉시 반영되지 않았습니다.

### 원인

Next.js App Router의 Cache 동작으로 인해 Server에서 기존 데이터를 재사용하고 있었습니다.

### 해결

동적 데이터가 필요한 영역에:

```text
cache: "no-store"
```

및

```text
dynamic = "force-dynamic"
```

을 적용하여 최신 데이터를 조회하도록 구성했습니다.

---

# 8. 불필요한 API Request 제거

### 문제

Portfolio 페이지에서도 Shopping Cart API가 호출되는 문제가 발생했습니다.

### 원인

Global Header가 모든 페이지에서 Mount되고 내부 `useEffect`가 페이지 종류와 관계없이 실행되고 있었습니다.

### 해결

`usePathname()`을 이용하여 현재 경로를 판단하도록 수정했습니다.

```text
Portfolio
   └── Cart API 호출 X

Shop
   └── Cart API 호출 O
```

이를 통해 불필요한 API 요청을 제거하고 페이지별 Data Lifecycle을 명확하게 분리했습니다.

---

# 9. Redis Cache 적용

### 문제

Portfolio와 같이 읽기 비중이 높은 데이터에 대해 동일한 Database Query가 반복적으로 발생했습니다.

### 원인

동일한 데이터를 요청할 때마다:

```text
API
 ↓
JPA
 ↓
MySQL
```

과정을 반복하고 있었습니다.

### 해결

Redis를 Cache Layer로 추가했습니다.

```text
API Request
    │
    ▼
Redis
    │
    ├── HIT ──────→ Response
    │
    └── MISS
          │
          ▼
        MySQL
          │
          ▼
        Redis
          │
          ▼
       Response
```

이를 통해 반복 조회 요청에서 Database 접근을 줄이고 응답 성능을 개선했습니다.

---

# 📁 Repository Structure

```text
portfolio/
│
├── .github/
│   └── workflows/
│       └── deploy.yml
│
├── frontend/
│   ├── public/
│   ├── src/
│   ├── Dockerfile
│   ├── next.config.ts
│   ├── package.json
│   └── README.md
│
├── backend/
│   ├── src/
│   ├── uploads/
│   ├── Dockerfile
│   ├── build.gradle
│   ├── docker-compose.yml
│   └── README_API.md
│
├── docker-compose.yml
├── crawl_hince_images.py
└── README.md
```

---

# ▶️ Local Development

## Requirements

* Docker
* Docker Compose
* Git

Java / Node.js / MySQL을 별도로 설치하지 않아도 Docker 환경에서 실행할 수 있도록 구성했습니다.

## Clone

```bash
git clone https://github.com/KimSunWooo/portfolio.git

cd portfolio
```

## Run

```bash
docker compose up -d
```

## Rebuild

```bash
docker compose up -d --build
```

## Stop

```bash
docker compose down
```

---

# 📌 Project Status

| Feature                     | Status      |
| --------------------------- | ----------- |
| Next.js App Router          | ✅           |
| React / TypeScript          | ✅           |
| SSR / CSR                   | ✅           |
| Spring Boot REST API        | ✅           |
| Spring Security             | ✅           |
| JWT Authentication          | ✅           |
| JPA / MySQL                 | ✅           |
| Redis Cache                 | ✅           |
| Admin Dashboard             | ✅           |
| Multipart Upload            | ✅           |
| E-Commerce                  | ✅           |
| Docker                      | ✅           |
| Docker Compose              | ✅           |
| AWS EC2 Deployment          | ✅           |
| GitHub Actions CI/CD        | ✅           |
| Automated Docker Deployment | ✅           |
| Nginx                       | ✅           |
| Performance Optimization    | ✅           |
| Kafka                       | Planned     |
| Advanced Monitoring         | Planned     |
| Payment Integration         | In Progress |

---

# 🎯 What I Focused On

## 01. Full-Stack Architecture

Frontend와 Backend를 분리하고 REST API를 기반으로 데이터 흐름을 설계했습니다.

Next.js의 SSR / CSR 특성을 고려하여 Browser와 Server 환경에서 서로 다른 API 접근 경로를 사용하도록 구성했습니다.

---

## 02. Authentication & Authorization

Spring Security와 JWT를 이용해 Stateless 인증 구조를 구축했습니다.

사용자와 관리자 권한을 분리하고 관리자 API에는 Authority 기반 접근 제어를 적용했습니다.

---

## 03. Performance Optimization

Redis를 Cache Layer로 도입하여 반복적인 Database Query를 줄이고 읽기 중심 API의 응답 성능을 개선했습니다.

Cache 적용 전후 성능을 비교하여 약 **85%의 응답 성능 개선**을 확인했습니다.

---

## 04. Environment-Aware Development

Local / Browser / Next.js SSR / Docker / Production 환경에서 발생하는 네트워크 차이를 직접 분석했습니다.

특히 Docker Internal Network와 Public Network를 구분하여 SSR API 및 Asset URL 문제를 해결했습니다.

---

## 05. Deployment Automation

Docker와 GitHub Actions를 이용하여:

```text
Code Push
   ↓
Build
   ↓
Docker Image
   ↓
Docker Hub
   ↓
AWS EC2
   ↓
Deployment
```

까지 이어지는 자동화된 배포 Pipeline을 구축했습니다.

---

## 06. Troubleshooting

단순히 Error Message를 해결하는 것이 아니라:

```text
Request
 ↓
Frontend
 ↓
Network
 ↓
SSR / CSR
 ↓
Backend
 ↓
Security
 ↓
Cache
 ↓
Database
```

전체 Lifecycle을 추적하여 문제의 원인을 파악하고 해결하는 것을 목표로 했습니다.

---

# 📈 Future Improvements

현재 핵심 기능과 Production 배포 환경을 구축했으며, 이후 다음 영역을 고도화할 계획입니다.

* Kafka 기반 비동기 Event Processing
* Application Monitoring / Logging
* 테스트 코드 확대
* CI/CD Pipeline 고도화
* Docker Image Versioning
* Rollback 전략 구축
* 주문 / 결제 시스템 고도화
* Cache 전략 고도화
* 서비스 규모 증가에 따른 성능 최적화

---

# 👨‍💻 Developer

### 김선우

**Full-Stack / Backend / Frontend Developer**

### 주요 관심 분야

* Web Application
* Full-Stack Development
* Backend Architecture
* Cloud / DevOps

---

# 🔗 Links

* GitHub: https://github.com/KimSunWooo/portfolio
