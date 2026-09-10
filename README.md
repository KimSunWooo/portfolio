# Full-Stack Portfolio & Commerce Platform

**Next.js + Spring Boot 기반의 풀스택 포트폴리오 & 커머스 플랫폼**

개인 포트폴리오 관리 시스템과 이커머스 기능을 하나의 서비스로 통합한 풀스택 웹 애플리케이션입니다.

Frontend → Backend → Database → Cache → Docker → AWS EC2 → CI/CD까지 전체 서비스 라이프사이클을 직접 설계하고 구현했습니다. 단순한 기능 구현을 넘어 인증·인가, SSR/CSR 환경 차이, 캐싱, 컨테이너 네트워크, 배포 자동화 및 운영 환경에서 발생하는 문제를 직접 분석하고 해결하는 데 집중했습니다.

## 🌐 Project Overview

정적인 포트폴리오 페이지가 아닌, 관리자가 직접 데이터를 관리할 수 있는 동적 웹 서비스를 구축했습니다.

관리자 페이지에서 경력, 교육, 기술 스택, 프로젝트 등의 정보를 관리하고 Spring Boot REST API를 통해 데이터를 저장 및 조회합니다.

또한 동일한 서비스에 상품 조회, 장바구니, 주문/결제 관련 기능을 추가하여 실제 웹 서비스에 가까운 Commerce Platform 구조로 확장했습니다.

테스트 관리자계정
아이디 : test@test.com
비밀번호 : test147@

### 핵심 목표

* **Full-Stack Architecture:** Next.js App Router 기반 SSR / CSR 구조와 Spring Boot REST API 서버 구축
* **Authentication & Authorization:** Spring Security + JWT 기반 Stateless 인증 및 관리자 권한 분리
* **Performance Optimization:** Spring Cache + Redis를 활용한 상품 목록 조회 캐싱
* **Environment-Aware Development:** Browser / Next.js SSR / Docker Container 간 네트워크 및 URL 차이 해결
* **Deployment Automation:** Docker 기반 컨테이너화 및 GitHub Actions를 활용한 AWS EC2 자동 배포
* **End-to-End Troubleshooting:** Frontend → Backend → Infrastructure 전 영역에서 발생한 문제를 요청 Lifecycle 관점에서 분석

## 🏗️ Architecture

```text
                              User
                               │
                               ▼
                    ┌────────────────────┐
                    │      Next.js       │
                    │ React / TypeScript │
                    │    App Router      │
                    │     SSR / CSR      │
                    └─────────┬──────────┘
                              │
                         REST API
                              │
                              ▼
                    ┌────────────────────┐
                    │    Spring Boot     │
                    │ Spring Security    │
                    │ JWT / REST API     │
                    └──────┬───────┬─────┘
                           │       │
                      Cache│       │Persistence
                           ▼       ▼
                    ┌─────────┐ ┌──────────┐
                    │  Redis  │ │  AWS RDS │
                    │  Cache  │ │  MySQL   │
                    └─────────┘ └──────────┘
                           │
                           │
                           ▼
                      AWS S3
                   Image / Media
```

### CI/CD Pipeline

```text
Git Push main
      │
      ▼
GitHub Actions
      │
      ├── Backend Docker Image Build
      ├── Frontend Docker Image Build
      │
      ▼
Docker Hub Push
      │
      ▼
AWS EC2
      │
      ├── Docker Image Pull
      └── Deployment Script 실행
```

## 🛠️ Tech Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* App Router
* Server / Client Components
* SSR / CSR
* Fetch API
* Zustand
* Axios

### Backend

* Java 21
* Spring Boot
* Spring Security
* Spring Data JPA / Hibernate
* MySQL
* REST API
* JWT Authentication / Authorization
* Spring Cache
* Redis

### Infrastructure

* Docker
* Docker Compose
* AWS EC2
* AWS RDS
* AWS S3
* Docker Hub
* GitHub Actions

## ✨ Main Features

### 1. Dynamic Portfolio

Backend API와 Database를 기반으로 동작하는 동적 포트폴리오입니다.

* 경력 / 교육 / 기술 스택 관리
* 프로젝트 정보 관리
* 관리자 페이지를 통한 데이터 수정
* SSR 기반 동적 포트폴리오 렌더링

```text
Admin
  ↓
Spring Boot API
  ↓
AWS RDS / MySQL
  ↓
Next.js SSR
  ↓
Portfolio
```

### 2. E-Commerce

포트폴리오 서비스 내부에 커머스 기능을 구성했습니다.

* 상품 목록
* 상품 상세
* 장바구니
* 로그인 사용자 / 비회원 장바구니 분리
* 로그인 이후 장바구니 동기화
* 주문 / 결제 관련 기능

비회원 사용자는 Local Storage 기반 장바구니를 사용하고, 로그인 사용자는 서버 기반 장바구니를 사용하도록 분리했습니다.

로그인 이후에는 비회원 장바구니 데이터를 서버 장바구니와 동기화하도록 구성했습니다.

### 3. Admin Dashboard

관리자 권한을 기반으로 포트폴리오 및 상품 데이터를 관리합니다.

* 관리자 인증
* 포트폴리오 데이터 관리
* 상품 데이터 관리
* 이미지 / 영상 Multipart Upload
* 관리자 전용 API 접근 제어

## 🔐 Authentication & Authorization

Spring Security와 JWT를 이용하여 Stateless 인증 구조를 구성했습니다.

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

Spring Security에서는:

```java
SessionCreationPolicy.STATELESS
```

를 사용하여 세션 기반 인증을 사용하지 않도록 구성했습니다.

관리자 API는:

```java
.hasRole("ADMIN")
```

기반으로 접근을 제한합니다.

JWT 인증 필터에서는 요청에서 Access Token을 추출하고 유효성을 검증한 뒤 `SecurityContext`에 Authentication을 설정합니다.

## ⚡ Redis Cache & Performance Optimization

상품 목록 조회 API에 Spring Cache와 Redis를 적용했습니다.

`ProductService`의 상품 목록 조회 메서드에 `@Cacheable`을 적용하여 동일한 조건의 반복적인 DB 조회를 캐시로 처리합니다.

```java
@Cacheable(
    value = "productList",
    key = "(#category != null ? #category : 'ALL') + '_' + (#search != null ? #search : 'NONE')"
)
public ProductListWrapper getProducts(String category, String search) {
    ...
}
```

### Cache Flow

```text
API Request
     │
     ▼
Redis Cache
     │
 ┌───┴───┐
 │       │
Hit     Miss
 │       │
 ▼       ▼
Response MySQL
         │
         ▼
        Redis
         │
         ▼
      Response
```

Redis Cache 설정에는 다음 정책을 적용했습니다.

* Cache TTL: 10분
* Null Value 캐싱 비활성화
* String 기반 Cache Key
* `GenericJackson2JsonRedisSerializer` 기반 Value Serialization
* Java Time 타입 처리를 위한 `JavaTimeModule`

### 성능 측정

상품 조회 API에 대해 Cache 적용 전후의 응답 성능을 비교했으며, 테스트 환경에서 평균 응답 시간이 **138ms → 21ms**로 감소했습니다.

또한 부하 테스트를 위해 k6 기반 테스트 시나리오를 구성했습니다.

```text
Virtual Users: 50
Duration: 30 seconds
Target: /api/products
```

## 🔥 Troubleshooting

### 1. Redis Cache Serialization / Generic Type 문제

**문제**

Redis Cache 적용 과정에서 `List<DTO>` 형태의 응답 객체를 캐싱하면서 Jackson 역직렬화 과정에서 타입 정보가 기대한 형태로 복원되지 않는 문제가 발생했습니다.

**해결**

상품 목록을 `List` 자체로 반환하지 않고 `ProductListWrapper`로 감싸는 구조로 변경했습니다.

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

### 2. Spring Security `ROLE_ADMIN` 권한 매핑 문제

**문제**

DB와 JWT에서 사용하는 권한 값과 Spring Security의 Role 기반 접근 제어 방식이 일치하지 않아 관리자 API 접근 시 403 오류가 발생했습니다.

**원인**

`hasRole("ADMIN")`은 기본적으로 `ROLE_ADMIN` 형태의 권한을 기준으로 검사합니다.

**해결**

실제 권한 체계를 Role 기반으로 맞추고 관리자 API에:

```java
.hasRole("ADMIN")
```

을 적용하여 일관된 권한 검사를 수행하도록 구성했습니다.

### 3. Docker + Next.js SSR `localhost` 네트워크 문제

**문제**

CSR에서는 API 요청이 정상적으로 동작하지만 SSR 환경에서 `Connection Refused`가 발생했습니다.

**원인**

Browser의 `localhost`와 Docker Container 내부의 `localhost`가 서로 다른 실행 환경을 가리키기 때문입니다.

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

**해결**

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

### 4. SSR Image `ERR_NAME_NOT_RESOLVED`

**문제**

SSR 과정에서 생성된 이미지 URL이 Docker 내부 hostname을 포함한 형태로 브라우저에 전달되어 이미지가 표시되지 않았습니다.

**원인**

`backend-api`와 같은 Docker 내부 hostname은 Browser에서 해석할 수 없습니다.

**해결**

Asset URL을 서버와 브라우저 환경에 맞게 분리했습니다.

```text
Server
  ↓
Internal API URL

Browser
  ↓
Public API URL
```

Frontend의 `resolveAssetUrl()`을 통해 외부에 전달되는 Asset URL을 Public URL 기준으로 처리하도록 구성했습니다.

### 5. Multipart Upload - HTTP 415 / 403

**문제**

관리자 페이지에서 이미지 / 영상 업로드 과정에서 `415 Unsupported Media Type`, `403 Forbidden` 오류가 발생했습니다.

**원인**

Frontend에서 FormData 요청의 `Content-Type`을 직접 지정하여 Multipart Boundary 처리에 문제가 발생했습니다.

또한 Backend에서 Multipart 데이터를 JSON 요청처럼 처리하는 문제가 있었습니다.

**해결**

Frontend에서는 FormData 전송 시 `Content-Type`을 직접 지정하지 않도록 수정했습니다.

Backend에서는 Multipart 데이터를 `MultipartFile` 기반으로 처리하도록 변경했습니다.

### 6. JWT Token Source 불일치

**문제**

일반 API는 정상적으로 인증되지만 특정 파일 업로드 API에서만 403 오류가 발생했습니다.

**원인**

일부 API는 메모리의 Access Token을 사용하고, 일부 로직은 Cookie를 기준으로 Token을 조회하는 등 인증 Token Source가 일관되지 않았습니다.

**해결**

공통 인증 함수인:

```typescript
getAccessToken()
```

을 사용하도록 인증 로직을 통일했습니다.

### 7. Spring Security CSRF / REST API

**문제**

JWT를 포함한 POST / PUT / DELETE 요청이 차단되는 문제가 발생했습니다.

**해결**

JWT 기반 Stateless REST API 구조에 맞게 CSRF 정책을 조정하고 CORS 설정을 구성했습니다.

```java
.csrf(csrf -> csrf.disable())
.sessionManagement(
    session -> session.sessionCreationPolicy(
        SessionCreationPolicy.STATELESS
    )
)
```

### 8. Next.js App Router Cache

**문제**

관리자 페이지에서 데이터를 수정했지만 메인 페이지에 변경 사항이 즉시 반영되지 않는 문제가 발생했습니다.

**해결**

동적 데이터가 필요한 API 요청에는:

```typescript
cache: "no-store"
```

를 적용하고 필요한 페이지에서는:

```typescript
dynamic = "force-dynamic"
```

을 사용하여 최신 데이터를 조회하도록 구성했습니다.

### 9. 불필요한 API Request 제거

**문제**

Portfolio 페이지에서도 Shopping Cart API가 호출되는 문제가 발생했습니다.

**원인**

Global Header가 모든 페이지에서 Mount되고 내부 `useEffect`가 페이지 종류와 관계없이 실행되었습니다.

**해결**

`usePathname()`을 사용하여 현재 경로를 확인하고 필요한 페이지에서만 Cart API를 호출하도록 분리했습니다.

```text
Portfolio
 └── Cart API 호출 X

Shop
 └── Cart API 호출 O
```

이를 통해 불필요한 API 요청을 제거하고 페이지별 데이터 Lifecycle을 분리했습니다.

## ☁️ AWS Integration

### AWS RDS

Production 환경에서는 AWS RDS의 MySQL 데이터베이스를 사용합니다.

Production 설정에서는:

```properties
spring.jpa.hibernate.ddl-auto=validate
```

를 적용하여 애플리케이션 실행 과정에서 DB 스키마를 임의로 변경하지 않도록 구성했습니다.

### AWS S3

상품 이미지 및 프로필 이미지 등의 파일은 AWS S3에 저장합니다.

파일 업로드 시 UUID 기반 파일명을 생성하여 저장하고, DB에는 해당 Asset URL을 저장합니다.

## 🚀 CI/CD

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
Docker Image Pull / Container Deployment
```

GitHub Actions에서는 Docker Hub 인증 정보와 AWS/EC2 관련 민감 정보를 Secrets로 관리합니다.

CI 과정에서는 Backend의 Redis 의존성을 검증하기 위해 Redis Service Container도 함께 실행합니다.

## 🐳 Docker

현재 Repository에서는 Frontend와 Backend를 각각 Docker Image로 구성하고 Docker Compose를 통해 함께 실행할 수 있도록 구성했습니다.

```text
Docker Compose
├── Frontend
│   └── Next.js
│
└── Backend
    └── Spring Boot
```

Production 데이터베이스는 AWS RDS를 사용하며, Redis는 환경변수 기반으로 외부 Redis Endpoint를 주입할 수 있도록 구성했습니다.

```properties
spring.data.redis.host=${REDIS_HOST:localhost}
spring.data.redis.port=${REDIS_PORT:6379}
```

## 📈 Performance Test

프로젝트에는 k6 기반 부하 테스트 스크립트를 포함했습니다.

```javascript
export const options = {
    vus: 50,
    duration: '30s',
};
```

상품 목록 API를 대상으로 반복 요청을 발생시켜 Cache 적용 전후의 성능을 비교할 수 있도록 구성했습니다.

## 📁 Repository Structure

```text
portfolio/
├── .github/
│   └── workflows/
│       └── deploy.yml
│
├── frontend/
│   ├── public/
│   ├── src/
│   ├── Dockerfile
│   ├── next.config.ts
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── main/
│   │   │   └── java/
│   │   │       └── com/project/backend_api/
│   │   │           ├── config/
│   │   │           ├── controller/
│   │   │           ├── domain/
│   │   │           ├── dto/
│   │   │           ├── repository/
│   │   │           ├── security/
│   │   │           └── service/
│   │   └── test/
│   ├── Dockerfile
│   ├── build.gradle
│   └── README_API.md
│
├── docker-compose.yml
├── crawl_hince_images.py
├── dummy_products_hince.sql
├── load-test.js
└── README.md
```

## 📌 Project Status

| Feature                 | Status      |
| ----------------------- | ----------- |
| Next.js App Router      | ✅           |
| React / TypeScript      | ✅           |
| SSR / CSR               | ✅           |
| Spring Boot REST API    | ✅           |
| Spring Security         | ✅           |
| JWT Authentication      | ✅           |
| JPA / MySQL             | ✅           |
| AWS RDS                 | ✅           |
| AWS S3                  | ✅           |
| Admin Dashboard         | ✅           |
| Multipart Upload        | ✅           |
| E-Commerce              | ✅           |
| Docker                  | ✅           |
| Docker Compose          | ✅           |
| AWS EC2 Deployment      | ✅           |
| GitHub Actions CI/CD    | ✅           |
| Docker Image Deployment | ✅           |
| Redis Cache             | ✅           |
| Product List Cache      | ✅           |
| k6 Load Test            | ✅           |
| Kafka                   | Planned     |
| Advanced Monitoring     | Planned     |
| PG Payment Integration  | In Progress |
| Cache 적용 범위 확대          | Planned     |
| 테스트 코드 확대               | Planned     |

## 🎯 What I Focused On

### 1. Full-Stack Architecture

Frontend와 Backend를 분리하고 REST API를 기반으로 전체 데이터 흐름을 설계했습니다.

### 2. Authentication & Authorization

Spring Security와 JWT를 이용해 Stateless 인증 구조를 구현하고 사용자와 관리자 권한을 분리했습니다.

### 3. Performance Optimization

상품 목록 조회 API에 Redis Cache를 적용하여 반복적인 DB 조회를 줄이고 Cache 적용 전후의 응답 성능을 비교했습니다.

### 4. Environment-Aware Development

Local / Browser / Docker / Next.js SSR / Production 환경에서 발생하는 네트워크 및 URL 차이를 직접 분석하고 해결했습니다.

### 5. End-to-End Troubleshooting

단순히 에러 메시지를 해결하는 것이 아니라 요청 Lifecycle과 실행 환경을 추적하여 Frontend → Backend → Infrastructure 전반의 문제를 해결하는 데 집중했습니다.

## 📈 Future Improvements

현재 구현된 기능을 기반으로 다음 영역을 고도화할 계획입니다.

* Redis Cache 적용 범위 확대 및 Cache Invalidation 전략 고도화
* Kafka 기반 비동기 이벤트 처리
* 테스트 코드 확대
* Application Monitoring / Logging
* CI/CD Pipeline 고도화
* Docker Image Versioning
* Rollback 전략 구축
* 결제 / 주문 시스템 고도화
* 서비스 규모 증가에 따른 성능 최적화

## 👨‍💻 Developer

김선우

**Full-Stack / Backend / Frontend**

주요 관심 분야:

* Web Application
* Full-Stack Development
* Backend Architecture
* Cloud / DevOps
* AI / Robotics

## 🔗 Links

* GitHub: https://github.com/KimSunWooo/portfolio
