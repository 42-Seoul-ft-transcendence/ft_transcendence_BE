.PHONY: all install build prisma db server clean docker-build docker-run docker-stop docker-clean

# 변수 정의
IMAGE_NAME ?= ft_transcendence_be
CONTAINER_NAME ?= ft_transcendence
PORT ?= 8083

all: docker-clean docker-build docker-run

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

# Docker 관련 타겟
docker-build:
	@echo "==> Docker 이미지 빌드 중..."
	docker build -t $(IMAGE_NAME) .

docker-run:
	@echo "==> Docker 컨테이너 실행 중..."
	docker run --name $(CONTAINER_NAME) -d -p $(PORT):8083 --env-file .env $(IMAGE_NAME)

docker-stop:
	@echo "==> Docker 컨테이너 중지 중..."
	-docker stop $(CONTAINER_NAME)
	-docker rm $(CONTAINER_NAME)

docker-clean:
	@echo "==> Docker 이미지/컨테이너 정리 중..."
	-docker stop $(CONTAINER_NAME)
	-docker rm $(CONTAINER_NAME)
	-docker rmi $(IMAGE_NAME)