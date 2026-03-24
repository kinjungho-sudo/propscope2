.PHONY: dev prod build stop clean logs migrate seed

# 개발 환경 (DB + Redis만 Docker, 앱은 로컬)
dev-infra:
	docker-compose -f docker-compose.dev.yml up -d
	@echo "PostgreSQL: localhost:5432"
	@echo "Redis: localhost:6379"

dev-infra-down:
	docker-compose -f docker-compose.dev.yml down

# 마이그레이션
migrate:
	cd backend && npx prisma migrate dev

migrate-prod:
	cd backend && npx prisma migrate deploy

# DB 시드 데이터 (행정구역 코드 등)
seed:
	cd backend && npx prisma db seed

# 개발 서버 실행 (별도 터미널에서)
run-backend:
	cd backend && npm run start:dev

run-frontend:
	cd frontend && npm run dev

# 전체 프로덕션 빌드 & 실행
prod:
	docker-compose up -d --build

prod-down:
	docker-compose down

# 로그 확인
logs-backend:
	docker-compose logs -f backend

logs-frontend:
	docker-compose logs -f frontend

logs-db:
	docker-compose logs -f postgres

# 클린업
clean:
	docker-compose down -v
	docker system prune -f

# Prisma Studio (DB GUI)
studio:
	cd backend && npx prisma studio

# 타입 체크
typecheck:
	cd frontend && npx tsc --noEmit
	cd backend && npx tsc --noEmit
