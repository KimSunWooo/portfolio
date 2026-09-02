# ==========================================
# 1단계: 빌드 환경 (Builder Stage)
# ==========================================
FROM node:20-alpine AS builder
WORKDIR /app

# 패키지 설치
COPY package.json package-lock.json ./
RUN npm ci

# 소스코드 복사 및 Next.js 빌드
COPY . .
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build


# ==========================================
# 2단계: 실행 환경 (Runtime Stage)
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /app

# Next.js에게 현재 환경이 프로덕션(운영)임을 명시
ENV NODE_ENV production

# 1단계(builder)에서 완성된 결과물과 실행에 필요한 파일만 가로채서 복사
# (용량을 많이 차지하는 원본 소스 코드는 가져오지 않는다)
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# 포트 개방 및 실행
EXPOSE 3000
CMD ["npm", "start"]