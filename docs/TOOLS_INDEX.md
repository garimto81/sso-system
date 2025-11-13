# SSO System - 개발 도구 카탈로그

**버전**: 1.0.0
**업데이트**: 2025-01-12

---

## 🎯 Quick Start

```bash
# 1. Admin 계정 생성
/setup-admin

# 2. 테스트 데이터 생성
/seed-apps

# 3. SSO 플로우 테스트
/test-sso

# 4. 배포 전 체크
/check-deploy
```

---

## 📋 목차

1. [Slash Commands](#slash-commands)
2. [Helper Scripts](#helper-scripts)
3. [개발 가이드](#개발-가이드)
4. [빠른 참조](#빠른-참조)

---

## Slash Commands

### /setup-admin
**용도**: Admin 계정 빠르게 생성

**사용법**:
```bash
# Claude Code에서
/setup-admin

# 이메일과 비밀번호 입력 프롬프트 표시
```

**출력**:
- Admin 계정 생성 확인
- 로그인 테스트 curl 명령

**시나리오**:
- 로컬 개발 환경 초기 설정
- 새로운 관리자 계정 추가
- 테스트 환경 구성

**파일**: `.claude/commands/setup-admin.md`

---

### /test-sso
**용도**: SSO OAuth 2.0 플로우 전체 자동 테스트

**사용법**:
```bash
/test-sso
```

**테스트 시나리오**:
1. Health Check
2. Admin 로그인
3. 앱 생성
4. Authorization URL 생성
5. Auth Code 발급
6. Token Exchange
7. JWT 검증
8. Analytics 기록 확인

**출력**:
```
✅ SSO Flow Test Results
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Health Check:        PASS (120ms)
Admin Login:         PASS (245ms)
...
Status: ALL TESTS PASSED ✅
```

**파일**: `.claude/commands/test-sso.md`

---

### /seed-apps
**용도**: 테스트용 앱과 Analytics 데이터 생성

**사용법**:
```bash
/seed-apps

# 옵션
/seed-apps --count=10 --events=500
/seed-apps --clean  # 기존 데이터 삭제 후 생성
```

**생성 데이터**:
- 5개 테스트 앱 (기본값)
- 앱별 Analytics 이벤트 (100-500개)
- 최근 30일 분포

**출력**:
- 앱 목록 테이블
- Credentials 파일 생성 (seed-data-credentials.txt)

**시나리오**:
- Admin Dashboard UI 개발
- Analytics 차트 테스트
- 검색/필터링 기능 테스트

**파일**: `.claude/commands/seed-apps.md`

---

### /check-deploy
**용도**: 프로덕션 배포 전 20개 항목 자동 체크

**사용법**:
```bash
/check-deploy
```

**체크 항목** (20개):
- 환경 설정 (5개)
- 보안 (5개)
- 데이터베이스 (4개)
- 테스트 (3개)
- 성능 (3개)

**출력**:
```
✅ Deployment Readiness Check
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Overall: 19/20 passed (95%)

⚠️  Issues Found:
1. Bundle size: 523KB (target: 500KB)

✅ READY FOR DEPLOYMENT
```

**파일**: `.claude/commands/check-deploy.md`

---

### /db-status
**용도**: Supabase 데이터베이스 상태 실시간 확인

**사용법**:
```bash
/db-status

# 옵션
/db-status --table=apps       # 특정 테이블만
/db-status --detailed         # 상세 통계
/db-status --export=json      # JSON 파일로 저장
```

**확인 항목**:
- 연결 상태 & Latency
- 테이블별 Row 수
- RLS 정책 상태
- 인덱스 사용률
- 최근 마이그레이션

**출력**:
```
✅ Supabase Database Status
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Status:     ✅ Connected
Latency:    45ms

Tables:
├─ apps:            12 rows
├─ profiles:        45 rows
└─ app_analytics:   8,234 rows
```

**파일**: `.claude/commands/db-status.md`

---

## Helper Scripts

### setup-admin-user.js
**용도**: Admin 계정 자동 생성

**사용법**:
```bash
node scripts/setup-admin-user.js

# 또는 CLI 인자로
node scripts/setup-admin-user.js \
  --email=admin@example.com \
  --password=secure123
```

**기능**:
- Supabase Auth에 사용자 생성
- profiles 테이블에 role='admin' 설정
- 중복 이메일 처리 (role 업데이트)

**파일**: `scripts/setup-admin-user.js`

---

### seed-test-data.js
**용도**: 테스트 앱 및 Analytics 데이터 생성

**사용법**:
```bash
node scripts/seed-test-data.js

# 옵션
node scripts/seed-test-data.js --count=10 --events=500
node scripts/seed-test-data.js --clean
```

**생성 데이터**:
- 앱 데이터 (API Key/Secret 포함)
- Analytics 이벤트 (랜덤 타임스탬프)
- Credentials 파일 (seed-data-credentials.txt)

**파일**: `scripts/seed-test-data.js`

---

### validate-environment.js
**용도**: .env 파일 및 환경변수 검증

**사용법**:
```bash
node scripts/validate-environment.js

# 프로덕션 검증
node scripts/validate-environment.js --env=production

# 자동 수정
node scripts/validate-environment.js --fix
```

**검증 항목**:
- 필수 환경변수 존재 여부
- 환경변수 형식 (URL, 비밀번호 길이 등)
- .gitignore에 .env 포함 여부
- 프로덕션 특화 검증 (HTTPS 등)

**출력**:
```
✅ All checks passed!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
.env file:           ✅ Found
.gitignore (.env):   ✅ Protected
JWT_SECRET:          ✅ Valid (64 chars)
```

**파일**: `scripts/validate-environment.js`

---

### test-api-endpoints.js
**용도**: SSO Server 엔드포인트 헬스 체크

**사용법**:
```bash
node scripts/test-api-endpoints.js

# 프로덕션 테스트
node scripts/test-api-endpoints.js --url=https://your-app.vercel.app

# 상세 로그
node scripts/test-api-endpoints.js --verbose
```

**테스트 엔드포인트**:
- Public: /health, /auth/login, /api/v1/authorize
- Admin: /api/v1/admin/apps, /api/v1/admin/dashboard
- Performance: 10개 동시 요청

**출력**:
```
✅ SSO API Endpoint Tests
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Tests:     18
Passed:          18 ✅
Avg Response:    89ms
```

**파일**: `scripts/test-api-endpoints.js`

---

### generate-migration.js
**용도**: Supabase 마이그레이션 SQL 자동 생성

**사용법**:
```bash
# 컬럼 추가
node scripts/generate-migration.js add-column apps logo_url

# 테이블 생성
node scripts/generate-migration.js create-table sessions

# 인덱스 추가
node scripts/generate-migration.js add-index apps email

# RLS 정책 추가
node scripts/generate-migration.js add-rls sessions
```

**생성 파일**:
- `supabase/migrations/YYYYMMDDHHMMSS_<command>_<table>_<column>.sql`
- 템플릿 기반 SQL 생성
- 주석 포함 (목적, Rollback 방법)

**파일**: `scripts/generate-migration.js`

---

## 개발 가이드

### SSO_DEVELOPMENT_GUIDE.md
**내용**:
- 개발 환경 설정 (5분)
- OAuth 2.0 Flow 구현 (단계별)
- Admin API 개발 패턴
- 테스트 전략 (Unit, Integration, E2E)
- 디버깅 팁 (Supabase, JWT, OAuth)
- 배포 (Vercel + Supabase)

**파일**: `docs/SSO_DEVELOPMENT_GUIDE.md`

---

### SUPABASE_COOKBOOK.md
**내용**:
- RLS Policies (4가지 패턴)
- Triggers & Functions (4가지 패턴)
- Indexes & Performance (Essential, Composite, Partial, JSONB)
- Migrations (워크플로우, 템플릿, 안전한 패턴)
- Best Practices (클라이언트 설정, 쿼리 최적화, 에러 처리)

**파일**: `docs/SUPABASE_COOKBOOK.md`

---

### ADMIN_UI_PATTERNS.md
**내용**:
- Next.js 14 App Router 구조
- shadcn/ui 설정 및 커스터마이징
- 공통 패턴 (Layout, React Query, API Client)
- CRUD 화면 레시피 (List, Table, Form)
- Analytics Dashboard (Charts, Stats Cards)
- Form 처리 (Show-Once API Secret Modal)

**파일**: `docs/ADMIN_UI_PATTERNS.md`

---

## 빠른 참조

### 개발 환경 초기 설정

```bash
# 1. 저장소 클론 및 의존성 설치
git clone https://github.com/garimto81/sso-system.git
cd sso-system/server
npm install

# 2. Supabase 로컬 실행
npx supabase start

# 3. 환경변수 설정 및 검증
cp .env.example .env
node scripts/validate-environment.js

# 4. Admin 계정 및 테스트 데이터 생성
/setup-admin
/seed-apps

# 5. 서버 시작 및 테스트
npm run dev
/test-sso
```

### 일상 개발 워크플로우

```bash
# 아침: 개발 환경 시작
npx supabase start
npm run dev

# 개발 중: DB 상태 확인
/db-status

# 새 기능 개발 후: 테스트
npm test
/test-sso

# 배포 전: 최종 체크
/check-deploy
```

### 트러블슈팅

**서버 연결 실패**:
```bash
/db-status  # DB 상태 확인
node scripts/validate-environment.js  # 환경변수 검증
```

**테스트 실패**:
```bash
npx supabase db reset  # DB 리셋
/seed-apps --clean  # 테스트 데이터 재생성
npm test -- --clearCache  # Jest 캐시 삭제
```

**배포 이슈**:
```bash
/check-deploy  # 배포 체크리스트
node scripts/test-api-endpoints.js --url=https://your-app.vercel.app
```

---

## 도구 매트릭스

| 작업 | Slash Command | Script | 가이드 |
|------|--------------|--------|--------|
| Admin 계정 생성 | `/setup-admin` | `setup-admin-user.js` | SSO_DEVELOPMENT_GUIDE |
| 테스트 데이터 | `/seed-apps` | `seed-test-data.js` | - |
| SSO 테스트 | `/test-sso` | `test-api-endpoints.js` | SSO_DEVELOPMENT_GUIDE |
| 배포 체크 | `/check-deploy` | - | SSO_DEVELOPMENT_GUIDE |
| DB 상태 | `/db-status` | - | SUPABASE_COOKBOOK |
| 환경변수 검증 | - | `validate-environment.js` | - |
| 마이그레이션 | - | `generate-migration.js` | SUPABASE_COOKBOOK |
| Admin UI 개발 | - | - | ADMIN_UI_PATTERNS |

---

## 기여하기

### 새 Slash Command 추가

1. `.claude/commands/` 폴더에 `<name>.md` 파일 생성
2. 명령 설명 및 사용법 작성
3. 이 문서 업데이트

### 새 Helper Script 추가

1. `scripts/` 폴더에 `<name>.js` 파일 생성
2. Shebang (`#!/usr/bin/env node`) 추가
3. CLI 인자 파싱 (`process.argv`)
4. 이 문서 업데이트

---

## 참조

- [Claude Code 공식 문서](https://docs.anthropic.com/en/docs/claude-code)
- [Slash Commands 가이드](https://docs.anthropic.com/en/docs/claude-code/slash-commands)
- [Supabase 문서](https://supabase.com/docs)

---

**Last Updated**: 2025-01-12
**Next Review**: After adding new tools
