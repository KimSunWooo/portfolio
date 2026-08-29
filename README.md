🚀 Full-Stack Portfolio & Commerce Platform
개인 포트폴리오(이력/프로젝트)와 이커머스(쇼핑몰) 기능을 결합한 풀스택 웹 애플리케이션입니다.
백엔드 아키텍처부터 프론트엔드 UI/UX, 그리고 Docker 기반의 인프라 구축까지 서비스의 전체 라이프사이클을 직접 설계하고 구현했습니다.

🛠 Tech Stack
Frontend: React, Next.js (App Router), TypeScript, Tailwind CSS

Backend: Java, Spring Boot, Spring Security, JPA (Hibernate), MySQL

Infrastructure: Docker, Docker Compose

Auth: JWT (JSON Web Token), OAuth

📌 Key Features
Portfolio & Resume (/)

서버 사이드 렌더링(SSR)을 활용한 동적 포트폴리오 노출 (force-dynamic).

관리자 페이지를 통한 이력(기술 스택, 경력, 교육) 및 프로젝트 실시간 업데이트 기능.

E-Commerce (/shop)

상품 목록 및 상세 조회, 장바구니, 결제 확인 등 실제 커머스 플로우 구현.

비회원(Local Storage)과 회원(DB)의 장바구니 데이터 분리 및 동기화 처리.

Admin Dashboard (/admin)

hasAuthority("ADMIN") 권한 기반의 관리자 전용 라우팅.

다중 미디어(이미지/영상) 업로드 및 에셋 관리.

📍 Phase 1. 데이터 통신 및 포맷 트러블슈팅 (HTTP & API 연동)
1. 다중 미디어 파일 업로드 실패 (HTTP 415 Unsupported Media Type)

문제 현상: 프론트엔드에서 프로젝트 이미지 업로드 API 호출 시, 백엔드에서 415 에러를 반환하며 요청을 거부함.

원인 분석:

프론트엔드(fetch API)에서 파일을 FormData에 담았으나, 헤더에 "Content-Type": "multipart/form-data"를 수동으로 강제 지정하여 브라우저가 자동 생성해야 할 boundary 값이 누락됨.

백엔드 컨트롤러에서는 텍스트와 파일을 동시에 받기 위해 설정했으나, @RequestBody 어노테이션이 남아 있어 들어오는 데이터를 무조건 JSON으로 파싱하려 시도함.

해결 과정:

Frontend: fetch 호출 시 headers 객체에서 Content-Type 속성을 완전히 제거하여 브라우저가 규격에 맞게 자동 세팅하도록 수정.

Backend: @RequestBody를 제거하고 @ModelAttribute (또는 @RequestParam)를 사용하여 MultipartFile과 텍스트 필드를 정상적으로 바인딩하도록 수정.

2. 인증 토큰 참조 위치 불일치로 인한 권한 에러 (HTTP 403 Forbidden)

문제 현상: 일반 기능은 정상 작동하나, 미디어 업로드 시에만 인증 실패(403) 발생.

원인 분석: 앱 전반의 API는 로그인 시 메모리(변수)에 저장된 inMemoryAccessToken을 읽어 헤더에 주입하고 있었으나, 미디어 업로드 로직만 document.cookie에서 토큰을 찾도록 파편화되어 있어 백엔드로 토큰이 전달되지 않음.

해결 과정: 파일 전송 로직도 공통 함수인 getAccessToken()을 사용하도록 변경하여 인증 로직을 일원화하고 토큰 누락 문제를 해결.

📍 Phase 2. 백엔드 보안 및 권한 설정 (Spring Security)
1. POST 요청 시 보안 필터 차단 (403 Forbidden)

문제 현상: 올바른 토큰을 전송하고 데이터 포맷을 맞추었음에도 API(POST, PUT, DELETE) 접근이 차단됨.

원인 분석:

Spring Security의 기본 CSRF 방어 기능이 활성화되어 있어 상태를 저장하지 않는(Stateless) REST API의 POST 요청을 악의적 공격으로 간주함.

프로젝트 업로드 API(POST /api/projects/**)에 대한 Endpoint 접근 권한 설정이 누락되어 anyRequest().authenticated()에 걸림.

해결 과정: SecurityConfig에서 csrf().disable()을 명시하고, 프로젝트 업로드 API에 hasAuthority("ADMIN") 권한을 부여하여 라우팅 보호. (추가적으로 allowCredentials(true)를 포함한 CORS 정책을 명시하여 브라우저의 Preflight(OPTIONS) 통과)

2. 권한 검증 시 접두사 매칭 에러 (Role vs Authority)

문제 현상: 관리자 계정으로 로그인 후 DB의 role 값이 ADMIN임에도 접근이 차단됨.

원인 분석: Security 설정에서 .hasRole("ADMIN") 메서드를 사용했으나, 이는 내부적으로 ROLE_ADMIN이라는 텍스트를 기대함. DB 및 토큰에는 접두사가 없는 ADMIN으로 저장되어 매칭이 실패함.

해결 과정: 데이터베이스 권한 체계와 일치하도록 검증 메서드를 .hasAuthority("ADMIN")으로 변경하여 해결.

📍 Phase 3. 인프라 및 Next.js SSR 통신 (Docker Network)
1. SSR 렌더링 시 API Connection Refused 에러

문제 현상: 프로젝트 등록 후 관리자 페이지(CSR)에서는 보이나, 메인 페이지(SSR)에서는 프로젝트가 노출되지 않음. (Try-Catch로 인해 화면은 정상적으로 뜨나 데이터가 비어있음)

원인 분석: 메인 페이지(page.tsx)는 Next.js(프론트엔드 도커 컨테이너) 서버 사이드에서 실행됨. SSR 환경에서 API 호출 주소를 localhost:8080으로 찌르면, 사용자 컴퓨터가 아닌 도커 컨테이너 자기 자신을 가리키게 되어 연결이 거부됨.

해결 과정: api.ts 내부의 API_BASE_URL을 동적으로 분기.

TypeScript
const IS_SERVER = typeof window === "undefined";
const API_BASE_URL = IS_SERVER ? "http://backend-api:8080" : "http://localhost:8080";
서버 환경에서는 도커 내부망 호스트네임(backend-api)을 참조하고, 클라이언트(브라우저) 환경에서는 외부 공개 주소(localhost)를 참조하도록 이원화.

2. 이미지 리소스 ERR_NAME_NOT_RESOLVED 에러

문제 현상: SSR 통신 해결 후 데이터는 잘 넘어오나, 이미지가 엑스박스로 깨짐.

원인 분석: SSR 렌더링 과정에서 이미지 태그의 src가 <img src="http://backend-api:8080/..."/> 형태로 완성되어 브라우저로 전달됨. 브라우저는 인터넷 상에서 backend-api라는 도메인을 찾을 수 없음.

해결 과정: 에셋 경로를 변환하는 resolveAssetUrl 헬퍼 함수를 구현하여, 파일 리소스 경로만큼은 무조건 퍼블릭 주소(localhost:8080)가 매핑되도록 강제 고정하여 해결.

📍 Phase 4. 프론트엔드 최적화 및 렌더링 제어 (React & Next.js)
1. 클라이언트 컴포넌트 비동기(Async) 렌더링 에러 (React #482)

문제 현상: 브라우저 접근 시 Objects are not valid as a React child... 혹은 화면이 하얗게 변하는 현상 발생.

원인 분석: Next.js App Router 환경에서 "use client" 지시어가 붙은 클라이언트 컴포넌트에 async 키워드를 직접 사용함. (React 클라이언트 컴포넌트는 Promise 자체를 렌더링할 수 없음)

해결 과정: 컴포넌트의 async를 제거하고, 데이터 패칭 로직은 useEffect 안에서 익명 비동기 함수를 호출하거나 상태(State)로 관리하도록 리팩토링.

2. Next.js App Router 강력한 정적 캐싱 무효화

문제 현상: 새 데이터를 DB에 추가해도 메인 페이지에 반영되지 않고 과거 데이터만 지속적으로 노출됨.

해결 과정: fetch 옵션에 { cache: "no-store" }를 부여하고, 메인 페이지 최상단에 export const dynamic = "force-dynamic"을 선언하여 정적 렌더링(SSG) 대신 동적 렌더링(SSR)을 수행하도록 강제함.

3. 도메인(포트폴리오 vs 쇼핑몰) 별 UI 및 API 통신 분리 최적화

문제 현상: 메인 페이지(포트폴리오) 접속 시에도 백그라운드에서 장바구니 데이터를 불러오는 불필요한 네트워크 트래픽 발생.

해결 과정: Header.tsx에서 Next.js의 usePathname()을 활용해 도메인을 논리적으로 분리.

UI 제어: 현재 주소가 /shop, /cart, /mypage 등에 속할 때만 쇼핑몰 전용 네비게이션을 렌더링.

로직 제어: 권한 체크(restoreAuth)는 어드민 관리 편의성을 위해 글로벌하게 유지하되, 장바구니 갱신(fetchCartItems)은 !isShopArea 방어막을 쳐 호출을 원천 차단함.

Edge Case 해결: 포트폴리오에서 숍 탭으로 진입하는 순간(isShopArea 변동 시)을 감지하는 별도의 useEffect를 추가하여, 빈틈없이 장바구니 뱃지가 업데이트 되도록 생명주기(Lifecycle) 완벽 제어.

4. 404 라우팅 누락 및 오타 디버깅

문제 현상: 특정 메뉴나 버튼 클릭 시 404 Not Found 발생 (/project, /admin, /shop/18).

해결 과정:

폴더명과 Link href의 복수형/단수형(projects vs project) 철자 불일치 동기화.

미구현된 관리자 페이지 참조 경로 주석 처리.

쇼핑몰 상세 페이지를 위한 동적 라우팅 폴더([id]) 구축 준비 및 예외 처리 완료.