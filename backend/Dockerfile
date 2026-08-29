# 1. 빌드 환경 (Amazon Corretto 17 기준 - 버전에 맞게 수정 가능)
FROM amazoncorretto:21-alpine-jdk

# 2. 작업 디렉토리 설정
WORKDIR /app

# 3. 빌드된 jar 파일을 컨테이너 내부로 복사
# Gradle을 쓰신다면 build/libs/*.jar, Maven이라면 target/*.jar
ARG JAR_FILE=build/libs/*SNAPSHOT.jar
COPY ${JAR_FILE} app.jar

# 4. 컨테이너 시간대를 한국 시간(KST)으로 설정
ENV TZ=Asia/Seoul
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# 5. 애플리케이션 실행
ENTRYPOINT ["java", "-jar", "/app/app.jar"]