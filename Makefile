.PHONY: all install build prisma db server clean

all: server

install:
	@echo "==> npm 패키지 설치 중..."
	npm ci

prisma:
	@echo "==> Prisma Client 생성 중..."
	npx prisma generate

build:
	@echo "==> TypeScript 빌드 중..."
	npm run build

db:
	@echo "==> DB 마이그레이션 적용 중..."
	npx prisma migrate deploy || npx prisma migrate dev

server: install prisma build
	@echo "==> 서버 실행 중..."
	npm start

clean:
	@echo "==> 빌드/의존성 파일 삭제 중..."
	rm -rf node_modules dist