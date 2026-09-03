# ==========================================
# 1단계: 빌드 환경 (Builder Stage)
# ==========================================
FROM amazoncorretto:21-alpine-jdk AS builder
WORKDIR /app

# 1. 빌드 도구(Gradle Wrapper)와 설정 파일 복사
COPY gradlew .
COPY gradle gradle
COPY build.gradle settings.gradle ./

# 2. 윈도우/맥 환경 차이로 인한 실행 권한 문제 방지
RUN chmod +x ./gradlew

# 3. 실제 소스 코드 복사
COPY src src

# 4. 도커 내부에서 소스 코드를 빌드하여 .jar 파일 생성 (테스트 생략)
RUN ./gradlew clean build -x test


# ==========================================
# 2단계: 실행 환경 (Runtime Stage)
# ==========================================
FROM amazoncorretto:21-alpine-jdk
WORKDIR /app

# 1. 컨테이너 시간대를 한국 시간(KST)으로 설정 
# Alpine 리눅스는 tzdata 패키지가 기본적으로 없어서 설치 명령어가 추가되어야 함.
ENV TZ=Asia/Seoul
RUN apk add --no-cache tzdata && \
    cp /usr/share/zoneinfo/$TZ /etc/localtime && \
    echo $TZ > /etc/timezone

# 2. 1단계(builder)에서 완성된 .jar 파일만 복사
COPY --from=builder /app/build/libs/*SNAPSHOT.jar app.jar

# 3. 애플리케이션 실행
ENTRYPOINT ["java", "-Dspring.profiles.active=prod", "-jar", "app.jar"]