# Java / Spring Boot 기반 Web Backend & Full-Stack Portfolio

> **Java · Spring Boot를 중심으로 REST API, 인증/인가, 데이터베이스, 캐싱, Next.js, Docker/AWS까지 서비스 전체 흐름을 구현한 Full-Stack Web Application**

기존 웹 서비스 개발 및 유지보수 경험을 바탕으로,
**기획 → DB 설계 → Backend API → Frontend → 인증/인가 → 성능 최적화 → Docker → AWS → CI/CD**까지 하나의 서비스 흐름으로 직접 구현한 개인 프로젝트입니다.

단순한 기능 구현보다 실제 개발 과정에서 발생할 수 있는 **인증 오류, SSR/CSR 환경 차이, 캐시 직렬화 문제, Multipart 처리, Docker 네트워크 문제, 불필요한 API 요청** 등을 직접 분석하고 해결하는 데 집중했습니다.

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

비회원은 Local Storage 기반 장바구니를 사용하고, 로그인 사용자는 서버 기반 장바구니를 사용하도록 분리했습니다.

로그인 이후에는 비회원 장바구니 데이터를 서버 장바구니와 동기화합니다.

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

상품 조회 API의 테스트 환경에서 평균 응답 시간이:

**138ms → 21ms**

로 감소했습니다.

또한 `k6`를 이용하여 다음 조건의 부하 테스트를 구성했습니다.

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

GitHub Actions를 이용하여 `main` 브랜치 Push 이후 Docker Image Build 및 EC2 배포가 수행되도록 구성했습니다.

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

CI 과정에서는 Backend의 Redis 의존성을 검증하기 위해 Redis Service Container를 함께 사용합니다.

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
