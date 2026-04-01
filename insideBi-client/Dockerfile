# Node 22 사용 (Vite 8 requires Node 20.19+ or 22.12+)
FROM node:22-alpine AS builder

WORKDIR /app

# 의존성 설치
COPY package.json package-lock.json ./
RUN npm ci --omit=dev=false

# 소스 복사 및 빌드
COPY . .
RUN npm run build

# 프로덕션 서브 - serve로 정적 파일 제공
FROM node:22-alpine

WORKDIR /app

RUN npm install -g serve

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD serve dist -s -l ${PORT:-3000}
