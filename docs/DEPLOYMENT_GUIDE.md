# Vercel + Supabase Cloud 배포 가이드

**목표**: 로컬 개발 환경을 클라우드로 이전하여 지속적인 개발 가능

**예상 시간**: 30-40분

---

## 📋 배포 개요

```
Local Development              →              Cloud Production
├── Docker Supabase                          ├── Supabase Cloud (PostgreSQL + Auth)
├── Express Server (3000)                    ├── Vercel Serverless (Backend)
└── Next.js Frontend (3001)                  └── Vercel Edge (Frontend)
```

**장점**:
- ✅ 어디서나 개발 가능 (로컬 Docker 불필요)
- ✅ 자동 배포 (git push → 자동 빌드)
- ✅ 무료 플랜으로 시작 가능
- ✅ HTTPS 자동 제공
- ✅ 프로덕션 환경과 동일한 구조

---

## Phase 1: Supabase Cloud 설정 (10분)

### 1.1 Supabase 프로젝트 생성

```bash
# 1. 브라우저에서 Supabase 접속
https://supabase.com

# 2. Sign up with GitHub (또는 기존 계정 로그인)

# 3. "New Project" 클릭

# 4. 프로젝트 정보 입력:
Organization: [새로 생성 또는 기존 선택]
Name: sso-system-prod
Database Password: [강력한 비밀번호 생성 - 저장 필수!]
Region: Northeast Asia (Seoul) - 또는 가장 가까운 지역
Pricing Plan: Free

# 5. "Create new project" 클릭
# 약 2분 대기 (프로젝트 생성 중...)
```

### 1.2 프로젝트 정보 확인

프로젝트 생성 완료 후 **Settings → API** 페이지에서 다음 정보 복사:

```bash
Project URL: https://[PROJECT_REF].supabase.co
anon public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (Show 클릭)
JWT Secret: [복사]
```

**중요**: 이 정보를 안전한 곳에 저장하세요!

### 1.3 로컬 프로젝트 연동

```bash
# 터미널에서 프로젝트 루트로 이동
cd D:\AI\claude01\sso-system

# Supabase CLI로 프로젝트 링크
npx supabase link --project-ref [YOUR_PROJECT_REF]

# 예시:
# npx supabase link --project-ref abcdefghijklmnop

# 프롬프트에서 Database Password 입력 (1.1에서 설정한 비밀번호)
```

### 1.4 데이터베이스 마이그레이션 푸시

```bash
# 로컬 마이그레이션을 클라우드로 전송
npx supabase db push

# 출력 확인:
# ✅ Apply migration 20240101000000_create_profiles_table.sql
# ✅ Apply migration 20240101000001_create_apps_table.sql
# ✅ Apply migration 20240101000002_create_analytics_table.sql
# ✅ Apply migration 20240101000003_create_rls_policies.sql
```

### 1.5 Admin 계정 생성

```bash
# Supabase Studio에서 SQL 실행
# Settings → Database → SQL Editor 이동

# 다음 SQL 실행:
```

```sql
-- Admin 계정 생성 (Supabase Auth에 직접 삽입)
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@sso.local',
  crypt('Test1234!', gen_salt('bf')),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"role":"admin"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Profile 자동 생성 확인
SELECT id, email, role FROM profiles WHERE email = 'admin@sso.local';
```

**결과 확인**:
```
id                                   | email            | role
-------------------------------------|------------------|------
[UUID]                               | admin@sso.local  | admin
```

---

## Phase 2: Vercel Backend 배포 (10분)

### 2.1 Vercel 계정 생성

```bash
# 1. 브라우저에서 Vercel 접속
https://vercel.com

# 2. Sign up with GitHub

# 3. Authorize Vercel (GitHub 권한 허용)
```

### 2.2 Backend 프로젝트 배포

```bash
# Vercel CLI 설치 (전역)
npm install -g vercel

# 로그인
vercel login
# 브라우저에서 인증 완료

# Backend 디렉토리로 이동
cd server

# 배포 (프로덕션)
vercel --prod

# 프롬프트 응답:
# ? Set up and deploy "~/sso-system/server"? [Y/n] y
# ? Which scope? [본인 계정 선택]
# ? Link to existing project? [N] n
# ? What's your project's name? sso-backend
# ? In which directory is your code located? ./
# ? Want to modify these settings? [n] y
#   - Build Command: `npm run build` (있다면, 없으면 비워두기)
#   - Output Directory: (비워두기)
#   - Development Command: npm run dev

# 배포 완료 후 URL 확인:
# ✅ Production: https://sso-backend-[random].vercel.app
```

### 2.3 Backend 환경 변수 설정

```bash
# Vercel 대시보드에서 설정
# https://vercel.com/[your-account]/sso-backend/settings/environment-variables

# 또는 CLI로 설정:
cd server

# Supabase 정보 (Phase 1.2에서 복사한 값)
vercel env add SUPABASE_URL
# 입력: https://[PROJECT_REF].supabase.co

vercel env add SUPABASE_ANON_KEY
# 입력: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

vercel env add SUPABASE_SERVICE_ROLE_KEY
# 입력: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (service_role)

vercel env add SUPABASE_JWT_SECRET
# 입력: [JWT Secret from Supabase]

# JWT Secrets (새로 생성)
vercel env add JWT_SECRET
# 입력: [node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" 실행 결과]

vercel env add SESSION_SECRET
# 입력: [다른 랜덤 값]

# Server 설정
vercel env add NODE_ENV
# 입력: production

vercel env add PORT
# 입력: 3000

# Frontend URL (다음 단계에서 생성될 URL)
vercel env add FRONTEND_URL
# 입력: https://sso-frontend-[random].vercel.app (임시, 나중에 수정)

# CORS
vercel env add ALLOWED_ORIGINS
# 입력: https://sso-frontend-[random].vercel.app

# Logging
vercel env add LOG_LEVEL
# 입력: info

# Rate Limiting (프로덕션용)
vercel env add RATE_LIMIT_AUTH
# 입력: 5

vercel env add RATE_LIMIT_TOKEN
# 입력: 10

vercel env add RATE_LIMIT_API
# 입력: 100

# 환경 변수 설정 후 재배포
vercel --prod
```

### 2.4 Backend API 테스트

```bash
# Health check
curl https://sso-backend-[random].vercel.app/health

# 예상 응답:
# {"status":"ok","timestamp":"2025-01-12T..."}

# Login 테스트
curl -X POST https://sso-backend-[random].vercel.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sso.local","password":"Test1234!"}'

# 예상 응답:
# {"user":{"id":"...","email":"admin@sso.local","role":"admin"},"access_token":"..."}
```

---

## Phase 3: Vercel Frontend 배포 (10분)

### 3.1 Frontend 프로젝트 배포

```bash
# Frontend 디렉토리로 이동
cd ../admin-dashboard

# 배포 (프로덕션)
vercel --prod

# 프롬프트 응답:
# ? Set up and deploy "~/sso-system/admin-dashboard"? [Y/n] y
# ? Which scope? [본인 계정 선택]
# ? Link to existing project? [N] n
# ? What's your project's name? sso-frontend
# ? In which directory is your code located? ./
# ? Want to modify these settings? [n] y
#   - Build Command: `npm run build`
#   - Output Directory: .next
#   - Development Command: npm run dev

# 배포 완료 후 URL 확인:
# ✅ Production: https://sso-frontend-[random].vercel.app
```

### 3.2 Frontend 환경 변수 설정

```bash
# Backend API URL (Phase 2.2에서 확인한 URL)
vercel env add NEXT_PUBLIC_API_URL
# 입력: https://sso-backend-[random].vercel.app

# JWT Secret (Backend와 동일)
vercel env add JWT_SECRET
# 입력: [Phase 2.3에서 생성한 JWT_SECRET과 동일한 값]

# Supabase JWT Secret (Phase 1.2에서 복사한 값)
vercel env add SUPABASE_JWT_SECRET
# 입력: [JWT Secret from Supabase]

# Node Environment
vercel env add NODE_ENV
# 입력: production

# 환경 변수 설정 후 재배포
vercel --prod
```

### 3.3 Backend CORS 업데이트

```bash
# Backend에서 Frontend URL 업데이트
cd ../server

vercel env rm FRONTEND_URL
vercel env add FRONTEND_URL
# 입력: https://sso-frontend-[random].vercel.app

vercel env rm ALLOWED_ORIGINS
vercel env add ALLOWED_ORIGINS
# 입력: https://sso-frontend-[random].vercel.app

# 재배포
vercel --prod
```

### 3.4 Frontend 테스트

```bash
# 브라우저에서 접속
https://sso-frontend-[random].vercel.app/login

# Admin 계정으로 로그인:
# Email: admin@sso.local
# Password: Test1234!

# ✅ Dashboard로 리다이렉트 확인
# ✅ Apps 페이지 접근 확인
```

---

## Phase 4: 지속적인 개발 워크플로우 (5분)

### 4.1 자동 배포 설정

Vercel은 Git 연동 시 자동 배포됩니다:

```bash
# GitHub에 푸시하면 자동 배포
git add .
git commit -m "feat: Update Apps UI"
git push origin feature/sso-supabase-init

# Vercel이 자동으로:
# 1. 커밋 감지
# 2. 빌드 시작
# 3. 배포 완료
# 4. Slack/Email 알림 (설정 시)

# 배포 상태 확인:
vercel --logs
```

### 4.2 개발 브랜치 미리보기

```bash
# Feature 브랜치 푸시 시 Preview URL 자동 생성
git checkout -b feature/new-feature
git push origin feature/new-feature

# Vercel이 자동으로 Preview 환경 생성:
# ✅ https://sso-frontend-git-feature-new-feature-[account].vercel.app

# 장점:
# - 프로덕션 영향 없이 테스트
# - PR 코멘트에 자동으로 Preview URL 추가
# - 브랜치 삭제 시 Preview 환경도 삭제
```

### 4.3 로컬 개발 시 클라우드 DB 사용

```bash
# .env.local 업데이트 (admin-dashboard/)
NEXT_PUBLIC_API_URL=http://localhost:3000  # 로컬 backend
SUPABASE_JWT_SECRET=[Supabase Cloud JWT Secret]
JWT_SECRET=[동일한 JWT Secret]

# server/.env 업데이트
SUPABASE_URL=https://[PROJECT_REF].supabase.co  # 클라우드 DB
SUPABASE_SERVICE_ROLE_KEY=[service_role key]
SUPABASE_JWT_SECRET=[JWT Secret]

# 로컬 서버 시작
cd server && npm run dev  # localhost:3000
cd admin-dashboard && npm run dev  # localhost:3001

# 이제 로컬에서 개발 → 클라우드 DB 사용!
```

---

## 📋 배포 완료 체크리스트

### Supabase Cloud
- [ ] 프로젝트 생성 완료
- [ ] API 키 복사 및 저장
- [ ] 로컬 프로젝트 링크 (`npx supabase link`)
- [ ] 마이그레이션 푸시 (`npx supabase db push`)
- [ ] Admin 계정 생성 (admin@sso.local)
- [ ] SQL Editor에서 Admin 계정 확인

### Vercel Backend
- [ ] Vercel 계정 생성
- [ ] Backend 프로젝트 배포 (`vercel --prod`)
- [ ] 환경 변수 11개 설정
- [ ] `/health` 엔드포인트 확인
- [ ] `/auth/login` 테스트 성공

### Vercel Frontend
- [ ] Frontend 프로젝트 배포 (`vercel --prod`)
- [ ] 환경 변수 4개 설정
- [ ] Backend CORS 업데이트
- [ ] 로그인 페이지 접근 확인
- [ ] Admin 로그인 성공
- [ ] Dashboard 접근 확인

### 지속적 개발
- [ ] Git 자동 배포 확인
- [ ] Preview 환경 테스트
- [ ] 로컬 개발 → 클라우드 DB 연동

---

## 🔧 트러블슈팅

### 문제 1: Supabase 마이그레이션 실패

**증상**: `Error: Could not apply migration`

**해결**:
```bash
# 마이그레이션 상태 확인
npx supabase migration list

# 특정 마이그레이션만 적용
npx supabase db push --include-all

# 또는 Supabase Studio SQL Editor에서 수동 실행
```

### 문제 2: Vercel 배포 빌드 실패

**증상**: `Build failed with error code 1`

**해결**:
```bash
# 로컬에서 빌드 테스트
cd server
npm run build  # (있다면)

cd ../admin-dashboard
npm run build

# 빌드 로그 확인
vercel --logs
```

### 문제 3: CORS 오류

**증상**: `Access-Control-Allow-Origin` 오류

**해결**:
```bash
# Backend 환경 변수 확인
vercel env ls

# ALLOWED_ORIGINS 업데이트
vercel env rm ALLOWED_ORIGINS
vercel env add ALLOWED_ORIGINS
# 입력: https://sso-frontend-[random].vercel.app,https://sso-frontend-git-*.vercel.app

# 재배포
vercel --prod
```

### 문제 4: 로그인 후 401 오류

**증상**: Dashboard 접근 시 401 Unauthorized

**해결**:
```bash
# JWT Secret이 일치하는지 확인
# Backend와 Frontend의 JWT_SECRET, SUPABASE_JWT_SECRET이 동일해야 함

# Backend 확인
vercel env pull .env.production
cat .env.production | grep JWT_SECRET

# Frontend 확인
cd ../admin-dashboard
vercel env pull .env.production
cat .env.production | grep JWT_SECRET

# 불일치 시 동일하게 수정
```

### 문제 5: Database connection 오류

**증상**: `connection to server at "..." failed`

**해결**:
```bash
# Supabase 프로젝트 활성 상태 확인
# https://app.supabase.com/project/[PROJECT_REF]

# Paused 상태면 Resume 클릭

# Connection pooling 확인
# Settings → Database → Connection pooling: Enabled
```

---

## 📊 비용 안내

### Supabase Free Plan
- ✅ 500MB Database
- ✅ 5GB Bandwidth
- ✅ 50,000 Monthly Active Users
- ✅ 무제한 API 요청
- **충분함**: SSO 서버 + 소규모 앱 (~10개)

### Vercel Hobby Plan (Free)
- ✅ 100GB Bandwidth
- ✅ 100 Serverless Functions
- ✅ 무제한 배포
- ✅ 자동 SSL
- **충분함**: 개발 + 소규모 프로덕션

**총 비용**: $0/월 (Free Plan으로 시작 가능!)

---

## 🚀 다음 단계

배포 완료 후:

1. **Apps CRUD 완성** (2-3시간)
   - Edit App Modal 구현
   - Delete Confirmation 구현
   - Regenerate Secret Modal 구현

2. **CI/CD 파이프라인** (1-2시간)
   - GitHub Actions 추가
   - 자동 테스트 실행
   - E2E 테스트 on Vercel Preview

3. **모니터링 설정** (1시간)
   - Vercel Analytics 활성화
   - Supabase Logs 활용
   - Error tracking (Sentry 등)

---

**배포 완료 시간**: 30-40분
**난이도**: ⭐⭐☆☆☆ (쉬움)
**준비물**: GitHub 계정, 신용카드 불필요

**Last Updated**: 2025-01-12
