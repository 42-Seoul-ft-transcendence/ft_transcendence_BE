# 1) Build Stage: TS → JS 컴파일
FROM node:20-alpine AS builder
WORKDIR /app

# 패키지 매니페스트만 복사해 설치
COPY package*.json ./
# devDependencies 포함 설치
RUN npm ci

# 소스 복사 & Prisma client 생성
COPY prisma ./prisma
COPY tsconfig.json ./
COPY src ./src
RUN npx prisma generate

# TS 컴파일 (dist 폴더 생성)
RUN npm run build          # package.json에 "build": "tsc" 필요

# 2) Production Stage: JS만 실행
FROM node:20-alpine
WORKDIR /app

# prod 의존성만 설치 (devDependencies 제거)
COPY package*.json ./
RUN npm ci --omit=dev

# 빌드 결과물과 Prisma client 복사
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 8083
ENV NODE_ENV=production

# 컴파일된 JS 진입점 실행
CMD ["node", "dist/main.js"]
