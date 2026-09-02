Full-Stack Portfolio & Commerce Platform

«Next.js + Spring Boot 기반의 풀스택 포트폴리오 & 커머스 플랫폼

포트폴리오 관리 시스템과 이커머스 기능을 하나의 서비스로 통합하고,
Frontend → Backend → Database → Docker → AWS EC2 → CI/CD까지 전체 서비스 라이프사이클을 직접 설계하고 구현했습니다.»

<br>🌐 Project Overview

개인 포트폴리오를 단순 정적 페이지로 구성하지 않고, 관리자에서 이력·기술 스택·프로젝트 정보를 직접 관리할 수 있는 동적 웹 서비스로 구현했습니다.

또한 동일한 서비스 내에 상품 조회, 장바구니 등의 이커머스 기능을 추가하여 실제 웹 서비스에 가까운 구조로 확장했습니다.

핵심 목표

- Next.js App Router 기반 SSR/CSR 구조 설계
- Spring Boot REST API 서버 구축
- Spring Security + JWT 기반 인증/인가
- JPA/MySQL 기반 데이터 관리
- Docker 기반 개발/배포 환경 구성
- GitHub Actions 기반 CI/CD 자동화
- AWS EC2 Production 환경 배포
- 실제 개발 과정에서 발생한 Frontend / Backend / Infrastructure 문제 해결

---

🏗️ Architecture

                         User
                           │
                           ▼
                  ┌─────────────────┐
                  │     Next.js     │
                  │ React / TS      │
                  │ App Router      │
                  │ SSR / CSR       │
                  └────────┬────────┘
                           │
                       REST API
                           │
                           ▼
                  ┌─────────────────┐
                  │   Spring Boot   │
                  │ Spring Security │
                  │ JWT / REST API  │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │      MySQL      │
                  │ Spring Data JPA │
                  └─────────────────┘

                 Docker / Docker Compose
                           │
                           ▼
                       AWS EC2


Git Push
   │
   ▼
GitHub Actions
   │
   ├── Backend Docker Build
   ├── Frontend Docker Build
   ├── Docker Hub Push
   │
   ▼
EC2 Deployment
   │
   ├── docker compose pull
   └── docker compose up -d

---

🛠️ Tech Stack

Frontend

- Next.js 14
- React
- TypeScript
- Tailwind CSS
- App Router
- Server / Client Components
- SSR / CSR
- Fetch API

Backend

- Java
- Spring Boot
- Spring Security
- Spring Data JPA / Hibernate
- MySQL
- REST API
- JWT Authentication / Authorization

Infrastructure

- Docker
- Docker Compose
- AWS EC2
- Docker Hub
- GitHub Actions

---

✨ Main Features

1. Portfolio

Dynamic Portfolio

- 경력 / 교육 / 기술 스택 관리
- 프로젝트 정보 관리
- 관리자 페이지를 통한 데이터 수정
- SSR 기반 동적 포트폴리오 렌더링

Admin
  ↓
Spring Boot API
  ↓
MySQL
  ↓
Next.js SSR
  ↓
Portfolio

---

2. E-Commerce

Shopping

- 상품 목록
- 상품 상세
- 장바구니
- 로그인 사용자 / 비회원 장바구니 분리
- 로그인 이후 장바구니 동기화
- 주문/결제 관련 기능

비회원 사용자는 Local Storage 기반 장바구니를 사용하고, 로그인 이후 DB 기반 장바구니와 동기화하도록 구현했습니다.

---

3. Admin Dashboard

관리자 권한을 기반으로 포트폴리오와 상품 데이터를 관리합니다.

주요 기능

- 관리자 인증
- 포트폴리오 데이터 관리
- 상품 데이터 관리
- 이미지/영상 등 Multipart 파일 업로드
- 관리자 전용 API 접근 제어

Spring Security의 Authority 기반 접근 제어를 적용했습니다.

.hasAuthority("ADMIN")

---

🔐 Authentication & Authorization

Spring Security와 JWT를 이용해 Stateless 인증 구조를 구성했습니다.

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
Authentication Filter
  ↓
Authorization

관리자 API는 "ADMIN" authority를 기반으로 접근을 제한합니다.

---

🚀 CI/CD

GitHub Actions를 이용하여 "main" 브랜치 push 이후 자동 배포가 수행되도록 구성했습니다.

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
          Docker Hub
              │
              ▼
           AWS EC2
              │
       docker compose pull
              │
       docker compose up -d

Deployment Pipeline

1. GitHub "main" push
2. GitHub Actions 실행
3. Backend Docker Image Build
4. Frontend Docker Image Build
5. Docker Hub Push
6. EC2 SSH 접속
7. Docker Image Pull
8. Docker Compose 재배포
9. 사용하지 않는 Docker Image 정리

민감한 인증 정보는 GitHub Actions Secrets를 통해 관리합니다.

---

🐳 Docker

Frontend / Backend / Database를 Docker 기반으로 구성하여 개발 환경과 배포 환경의 차이를 줄였습니다.

Docker Compose
│
├── Frontend
│   └── Next.js
│
├── Backend
│   └── Spring Boot
│
└── Database
    └── MySQL

---

🔥 Troubleshooting

이 프로젝트에서 가장 많은 시간을 투자한 부분은 단순 기능 구현보다 Frontend → SSR → Backend → Docker 간 실행 환경 차이에서 발생하는 문제를 추적하고 해결하는 과정이었습니다.

---

1. Multipart Upload - HTTP 415 / 403

문제

관리자 페이지에서 이미지/영상 업로드 시:

415 Unsupported Media Type
403 Forbidden

발생.

원인

Frontend에서 "FormData"를 전송하면서 "Content-Type"을 직접 지정하여 Multipart Boundary가 정상적으로 생성되지 않았습니다.

또한 Backend에서 "@RequestBody"를 사용하고 있어 Multipart 데이터를 JSON 형태로 처리하려는 문제가 있었습니다.

해결

Frontend:

Content-Type 수동 지정 제거

Backend:

@RequestBody
      ↓
@ModelAttribute

로 변경하여 Multipart 데이터를 정상적으로 처리했습니다.

---

2. JWT Token Source 불일치

문제

일반 API는 정상적으로 인증되지만 특정 파일 업로드 API에서만 "403 Forbidden" 발생.

원인

일반 API:

inMemoryAccessToken

업로드 API:

Cookie

처럼 서로 다른 위치에서 JWT를 참조하고 있었습니다.

해결

공통 인증 함수:

getAccessToken()

을 사용하도록 인증 로직을 통일했습니다.

---

3. Spring Security CSRF / REST API

문제

정상적인 JWT를 포함한 POST / PUT / DELETE 요청이 차단됨.

원인

Stateless REST API 환경에서 Spring Security의 기본 CSRF 설정이 요청을 차단하고 있었습니다.

해결

REST API 인증 구조에 맞게 CSRF 정책을 조정하고 CORS 설정을 구성했습니다.

---

4. "ROLE_ADMIN" vs "ADMIN"

문제

DB와 JWT에 "ADMIN" 권한이 존재하지만 관리자 API 접근 시 권한 오류 발생.

원인

Spring Security:

hasRole("ADMIN")

사용 시 내부적으로:

ROLE_ADMIN

형태를 기대합니다.

하지만 실제 시스템에서는:

ADMIN

을 사용하고 있었습니다.

해결

hasAuthority("ADMIN")

으로 변경하여 실제 권한 값과 일치시켰습니다.

---

5. Docker + Next.js SSR "localhost" 문제

문제

CSR 환경에서는 API 요청이 정상적으로 동작하지만 SSR 환경에서:

Connection Refused

발생.

원인

브라우저에서:

localhost:8080

은 사용자의 PC를 의미하지만,

Next.js Docker Container 내부에서:

localhost:8080

은 Next.js Container 자신을 의미합니다.

해결

실행 환경에 따라 API Endpoint를 분리했습니다.

Browser
   ↓
Public API URL

Next.js SSR
   ↓
Docker Internal Network
   ↓
Backend Container

이를 통해 Browser와 Server에서 서로 다른 네트워크 경로를 사용하도록 구성했습니다.

---

6. SSR 이미지 "ERR_NAME_NOT_RESOLVED"

문제

SSR 데이터는 정상적으로 받아왔지만 이미지가 브라우저에서 표시되지 않는 문제 발생.

원인

SSR 과정에서 생성된 이미지 URL이:

http://backend-api:8080/...

형태로 브라우저에 전달되었습니다.

"backend-api"는 Docker 내부에서만 해석 가능한 hostname이기 때문에 브라우저에서는 접근할 수 없었습니다.

해결

Asset URL 변환 로직을 구현하여:

Server → Internal URL
Browser → Public URL

로 변환했습니다.

---

7. Next.js App Router Cache

문제

관리자 페이지에서 데이터를 수정했지만 메인 페이지에 즉시 반영되지 않는 문제 발생.

원인

Next.js App Router의 caching 동작으로 인해 서버에서 기존 데이터를 재사용하고 있었습니다.

해결

동적 데이터에 대해:

cache: "no-store"

및

dynamic = "force-dynamic"

을 적용하여 필요한 페이지에서 최신 데이터를 가져오도록 구성했습니다.

---

8. 불필요한 API Request 제거

문제

Portfolio 페이지에서도 Shopping Cart API가 호출되는 문제 발생.

원인

Global Header가 모든 페이지에서 Mount되고 내부의 "useEffect"가 페이지 종류와 관계없이 실행되었습니다.

해결

"usePathname()"을 이용하여 현재 경로를 판단하고:

Portfolio
   └── Cart API 호출 X

Shop
   └── Cart API 호출 O

로 분리했습니다.

이를 통해 불필요한 API 요청을 제거하고 페이지별 데이터 lifecycle을 명확하게 분리했습니다.

---

📁 Repository Structure

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

---

▶️ Local Development

Requirements

- Docker
- Docker Compose
- Git

별도의 Java / Node.js / MySQL 설치 없이 Docker 환경에서 실행할 수 있도록 구성했습니다.

Clone

git clone https://github.com/KimSunWooo/portfolio.git
cd portfolio

Run

docker compose up -d

Rebuild

docker compose up -d --build

Stop

docker compose down

---

📌 Project Status

Feature| Status
Next.js App Router| ✅
React / TypeScript| ✅
SSR / CSR| ✅
Spring Boot REST API| ✅
Spring Security| ✅
JWT Authentication| ✅
JPA / MySQL| ✅
Admin Dashboard| ✅
Multipart Upload| ✅
E-Commerce| ✅
Docker| ✅
Docker Compose| ✅
AWS EC2 Deployment| ✅
GitHub Actions CI/CD| ✅
Automated Docker Deployment| ✅
Redis| Planned
Kafka| Planned
Advanced Monitoring| Planned
PG Payment Integration| In Progress

---

🎯 What I Focused On

이 프로젝트에서 단순히 기능을 구현하는 것보다 다음 문제를 직접 해결하는 데 집중했습니다.

01. Full-Stack Architecture

Frontend와 Backend를 분리하고 REST API를 기반으로 데이터 흐름을 설계했습니다.

02. Authentication & Authorization

Spring Security와 JWT를 이용해 사용자 / 관리자 권한을 분리했습니다.

03. Environment-Aware Development

Local / Docker / Production 환경에서 발생하는 네트워크 및 URL 차이를 직접 분석했습니다.

04. Deployment Automation

Docker와 GitHub Actions를 이용하여 코드 변경부터 Production 배포까지 자동화했습니다.

05. Troubleshooting

단순히 에러 메시지를 해결하는 것이 아니라 요청 lifecycle과 실행 환경을 추적하여 원인을 해결하는 것을 목표로 했습니다.

---

📈 Future Improvements

현재 서비스의 기본 기능과 Production 배포 환경을 구축했으며, 이후에는 다음 영역을 고도화할 계획입니다.

- Redis 기반 Cache 도입
- Kafka 기반 비동기 이벤트 처리
- 테스트 코드 확대
- Application Monitoring / Logging
- CI/CD Pipeline 고도화
- Docker Image Versioning
- Rollback 전략 구축
- 결제 / 주문 시스템 고도화
- 서비스 규모 증가에 따른 성능 최적화

---

👨‍💻 Developer

김선우

Full-Stack / Backend / Frontend

주요 관심 분야:

- Web Application
- Full-Stack Development
- Backend Architecture
- Cloud / DevOps
- AI / Robotics

---

🔗 Links

- GitHub: https://github.com/KimSunWooo/portfolio