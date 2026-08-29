FROM node:20-alpine
WORKDIR /app

# 패키지 설치
COPY package.json package-lock.json ./
RUN npm ci

# 소스코드 복사 및 빌드
COPY . .
RUN npm run build

# 포트 개방 및 실행
EXPOSE 3000
CMD ["npm", "start"]