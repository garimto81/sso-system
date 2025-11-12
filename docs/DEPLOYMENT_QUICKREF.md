# 배포 빠른 참조 가이드 (Quick Reference)

**목표**: Vercel + Supabase Cloud 배포를 5분 안에 시작하기

---

## 🚀 빠른 시작 (5분)

### Option 1: 자동 스크립트 (추천)

```bash
# Windows
scripts\deploy-to-vercel.bat

# Linux/Mac
bash scripts/deploy-to-vercel.sh
```

### Option 2: 수동 단계별 실행

```bash
# 1. Supabase 프로젝트 링크
npx supabase link --project-ref [YOUR_PROJECT_REF]

# 2. 마이그레이션 푸시
npx supabase db push

# 3. Backend 배포
cd server
vercel --prod

# 4. Frontend 배포
cd ../admin-dashboard
vercel --prod
```

---

## 📋 체크리스트

### 사전 준비 (한 번만)
- [ ] GitHub 계정 (무료)
- [ ] Supabase 계정 생성 (https://supabase.com)
- [ ] Vercel 계정 생성 (https://vercel.com)
- [ ] Vercel CLI 설치: `npm install -g vercel`

### Supabase Cloud 설정
- [ ] New Project 생성 (Region: Northeast Asia)
- [ ] Database Password 저장
- [ ] API Keys 복사 (URL, anon key, service_role key, JWT secret)
- [ ] `npx supabase link` 실행
- [ ] `npx supabase db push` 실행

### Admin 계정 생성
- [ ] Supabase Studio → SQL Editor
- [ ] Admin 계정 SQL 실행 (DEPLOYMENT_GUIDE.md 참조)
- [ ] Profiles 테이블 확인

### Backend 배포
- [ ] `cd server && vercel --prod`
- [ ] 11개 환경 변수 설정
- [ ] Backend URL 저장
- [ ] `/health` 엔드포인트 테스트

### Frontend 배포
- [ ] `cd admin-dashboard && vercel --prod`
- [ ] 4개 환경 변수 설정
- [ ] Frontend URL 저장
- [ ] Backend CORS 업데이트 (ALLOWED_ORIGINS)

### 최종 확인
- [ ] Frontend URL 접속
- [ ] 로그인 페이지 확인
- [ ] Admin 로그인 (admin@sso.local / Test1234!)
- [ ] Dashboard 접근 확인

---

## 🔧 필수 환경 변수

### Backend (11개)

```bash
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
SUPABASE_JWT_SECRET=[from Supabase]
JWT_SECRET=[random 64 chars]
SESSION_SECRET=[random 64 chars]
NODE_ENV=production
PORT=3000
FRONTEND_URL=[Frontend Vercel URL]
ALLOWED_ORIGINS=[Frontend Vercel URL]
LOG_LEVEL=info
```

### Frontend (4개)

```bash
NEXT_PUBLIC_API_URL=[Backend Vercel URL]
JWT_SECRET=[Backend와 동일]
SUPABASE_JWT_SECRET=[Backend와 동일]
NODE_ENV=production
```

---

## 🛠️ 빠른 명령어

### 랜덤 Secret 생성

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Vercel 로그 확인

```bash
vercel logs [deployment-url]
```

### 환경 변수 확인

```bash
vercel env ls
```

### 환경 변수 추가

```bash
vercel env add [NAME]
# 프롬프트에서 값 입력
```

### 재배포

```bash
vercel --prod
```

---

## 🐛 자주 발생하는 문제

### CORS 오류
```bash
# Backend에서 ALLOWED_ORIGINS 업데이트
vercel env rm ALLOWED_ORIGINS
vercel env add ALLOWED_ORIGINS
# 값: https://sso-frontend-xxx.vercel.app,https://sso-frontend-git-*.vercel.app
vercel --prod
```

### JWT 오류 (401 Unauthorized)
```bash
# JWT_SECRET과 SUPABASE_JWT_SECRET이 Backend와 Frontend에서 동일한지 확인
vercel env ls  # 두 프로젝트에서 모두 실행
```

### Database 연결 오류
```bash
# Supabase 프로젝트가 Paused 상태인지 확인
# https://app.supabase.com/project/[PROJECT_REF]
# Paused면 Resume 클릭
```

---

## 📚 추가 리소스

- **상세 가이드**: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Vercel 문서**: https://vercel.com/docs
- **Supabase 문서**: https://supabase.com/docs

---

**예상 시간**: 30-40분 (처음) / 5-10분 (익숙해진 후)
**난이도**: ⭐⭐☆☆☆ (쉬움)

**Last Updated**: 2025-01-12
