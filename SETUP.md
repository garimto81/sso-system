# SSO System 설정 가이드

## ⚠️ 다음 명령어를 PowerShell에서 실행하세요

### 1단계: Supabase 초기화

```powershell
# sso-system 폴더로 이동
cd d:\AI\claude01\sso-system

# Supabase 초기화
supabase init

# 실행 결과:
# ✓ supabase/ 폴더 생성
# ✓ config.toml 생성
# ✓ migrations/ 폴더 생성
```

### 2단계: 로컬 Supabase 시작

```powershell
# Docker Desktop이 실행 중인지 확인
docker ps

# Supabase 로컬 서버 시작
supabase start

# 5-10분 소요 (첫 실행 시)
# 완료 후 출력되는 정보를 .env 파일에 저장
```

**출력 예시**:
```
API URL: http://localhost:54321
DB URL: postgresql://postgres:postgres@localhost:54322/postgres
Anon key: eyJhbG...
Service Role key: eyJhbG...
```

### 3단계: 환경변수 설정

```powershell
# .env 파일 생성
copy .env.example .env

# .env 파일 편집 (VS Code)
code .env

# 위 출력값을 .env에 입력:
# SUPABASE_URL=http://localhost:54321
# SUPABASE_ANON_KEY=eyJhbG...
# SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
```

### 4단계: 확인

```powershell
# Supabase 상태 확인
supabase status

# 브라우저에서 확인
# http://localhost:54323 (Supabase Studio)
```

---

## 🎯 완료 후 폴더 구조

```
sso-system/
├── .git/
├── .gitignore
├── .env
├── .env.example
├── README.md
├── SETUP.md (이 파일)
└── supabase/
    ├── config.toml
    ├── migrations/
    ├── seed.sql
    └── .temp/
```

---

## 🚨 문제 해결

### Docker Desktop이 실행 안됨
```powershell
# Docker Desktop 시작
start docker-desktop

# 1-2분 대기 후
docker ps
```

### supabase 명령어 안됨
```powershell
# 재설치
npm uninstall -g supabase
npm install -g supabase

# 또는
npm install -g supabase@latest
```

### 포트 충돌
```powershell
# 사용 중인 포트 확인
netstat -ano | findstr ":54321"
netstat -ano | findstr ":54322"

# Supabase 중지 후 재시작
supabase stop
supabase start
```

---

## ✅ 완료 체크리스트

- [ ] `supabase init` 실행 완료
- [ ] `supabase start` 실행 완료
- [ ] `.env` 파일 생성 및 설정
- [ ] http://localhost:54323 접속 확인
- [ ] Supabase Studio에서 DB 확인

---

**다음 단계**: Phase 0 PRD 작성
