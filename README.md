# PropScope — 부동산 실거래가 시세 검색 웹앱

은행 여신관리 부서를 위한 빌라(다세대)·주거용 오피스텔 실거래가 확인 및 평당 가격·시세 분석 서비스

## 기술 스택

| 계층 | 기술 |
|------|------|
| 프론트엔드 | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Recharts |
| 백엔드 | NestJS, TypeScript, Prisma |
| 데이터베이스 | PostgreSQL 15 |
| 캐시 | Redis 7 |
| 지도 | Kakao Maps JavaScript API v3 |
| 인프라 | Docker, Docker Compose, Nginx |

## 빠른 시작

### 1. 환경 변수 설정

```bash
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
# .env 파일에 API 키 입력
```

### 2. 개발 환경 (인프라만 Docker)

```bash
make dev-infra          # PostgreSQL, Redis 시작
make migrate            # DB 마이그레이션
make seed               # 행정구역 기초 데이터 입력

# 별도 터미널에서:
make run-backend        # NestJS 개발 서버 (포트 3001)
make run-frontend       # Next.js 개발 서버 (포트 3000)
```

### 3. 프로덕션 전체 Docker 실행

```bash
make prod               # 전체 빌드 & 실행
```

## API 문서

- Swagger UI: http://localhost:3001/api/docs

## 데이터 소스

- 국토교통부 실거래가 Open API (data.go.kr)
- 카카오맵 JavaScript API v3
- 행정안전부 법정동 코드 (code.go.kr)

## 프로젝트 구조

```
propscope/
├── frontend/           # Next.js 14 프론트엔드
│   ├── src/
│   │   ├── app/        # App Router 페이지
│   │   ├── components/ # UI 컴포넌트
│   │   ├── lib/        # API 클라이언트, 유틸리티
│   │   ├── store/      # Zustand 상태 관리
│   │   └── types/      # TypeScript 타입 정의
│   └── Dockerfile
├── backend/            # NestJS 백엔드
│   ├── src/
│   │   ├── regions/    # 지역 검색 모듈
│   │   ├── transactions/ # 실거래가 모듈
│   │   ├── listings/   # 매물 모듈
│   │   ├── reports/    # 감정 리포트 모듈
│   │   ├── constructions/ # 신축 분양률 모듈
│   │   ├── molit/      # 국토부 API 연동
│   │   └── prisma/     # Prisma 서비스
│   ├── prisma/
│   │   └── schema.prisma
│   └── Dockerfile
├── nginx/
│   └── nginx.conf
├── scripts/
│   └── init.sql
├── docker-compose.yml      # 프로덕션
├── docker-compose.dev.yml  # 개발 (DB만)
└── Makefile
```

## 주요 기능 (Phase 1 MVP)

- [x] 동 단위 지역 검색 (자동완성)
- [x] 빌라(다세대) / 주거용 오피스텔 실거래가 조회
- [x] 평당 가격 자동 계산
- [x] 동네 평균 시세 통계
- [x] 주거 형태 필터
- [x] 상세 필터링
- [ ] 카카오맵 연동 (API 키 필요)
- [ ] 5년치 시세 추이 차트
- [ ] 감정 리포트 PDF 생성

## API 키 발급 안내

1. **국토부 실거래가 API**: https://www.data.go.kr → "연립다세대 매매 실거래가" 검색 후 활용 신청
2. **카카오맵 API**: https://developers.kakao.com → 내 애플리케이션 → 앱 키 발급
