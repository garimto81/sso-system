# 재부팅 후 작업 재개 가이드

**작성일**: 2025-01-12
**상태**: WSL2 설치 중 - 재부팅 대기

---

## 📍 현재 진행 상황

### ✅ 완료된 작업
- [x] v0.1.0 릴리스 (PRD, DB 스키마, 문서)
- [x] GitHub 푸시 완료
- [x] WSL2 설치 가이드 작성 (SETUP_WSL_DOCKER.md)
- [x] WSL 기능 활성화 (`dism.exe /online /enable-feature ...`)
- [x] 가상 머신 플랫폼 활성화

### ⏸️ 재부팅 필요
```powershell
# 이미 실행한 명령어:
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

# → 지금 재부팅!
Restart-Computer
```

### 🔜 재부팅 후 할 일

---

## 🚀 재부팅 후 실행 순서

### Step 1: WSL2 커널 업데이트

**PowerShell (관리자 권한)**:

```powershell
# 1. 작업 디렉토리로 이동
cd d:\AI\claude01\sso-system

# 2. WSL2 커널 다운로드 및 설치
Invoke-WebRequest -Uri https://wslstorestorage.blob.core.windows.net/wslblob/wsl_update_x64.msi -OutFile wsl_update_x64.msi
Start-Process msiexec.exe -Wait -ArgumentList '/I wsl_update_x64.msi /quiet'
Remove-Item wsl_update_x64.msi

# 3. WSL2를 기본 버전으로 설정
wsl --set-default-version 2

# 4. WSL 상태 확인
wsl --status
```

### Step 2: Ubuntu 설치 (선택사항)

```powershell
# Ubuntu 설치
wsl --install -d Ubuntu

# 첫 실행 시:
# - 사용자 이름: dev (또는 원하는 이름)
# - 비밀번호 설정 (sudo 사용 시 필요)
```

### Step 3: Docker Desktop 설정

1. Docker Desktop 실행
2. 설정 (⚙️) → General
   - ✅ "Use the WSL 2 based engine" 체크
3. 설정 → Resources → WSL Integration
   - ✅ "Enable integration with my default WSL distro" 체크
   - ✅ Ubuntu 활성화 (설치한 경우)
4. "Apply & Restart"

### Step 4: Docker 확인

```powershell
# Docker 버전 확인
docker --version

# Docker 실행 확인
docker ps

# Hello World 테스트
docker run hello-world
```

### Step 5: Supabase 로컬 시작

```powershell
# 프로젝트 디렉토리
cd d:\AI\claude01\sso-system

# Supabase 시작
npx supabase start

# 성공 시 출력:
# Started supabase local development setup.
#          API URL: http://localhost:54321
#           DB URL: postgresql://postgres:postgres@localhost:54322/postgres
#       Studio URL: http://localhost:54323
```

### Step 6: .env 파일 생성

출력된 키를 복사하여 `.env` 파일 생성:

```powershell
cp .env.example .env
code .env
```

`.env` 파일 내용 업데이트:
```
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=<출력된 Anon key>
SUPABASE_SERVICE_ROLE_KEY=<출력된 Service Role key>
JWT_SECRET=<출력된 JWT secret>
```

### Step 7: Supabase Studio 접속

브라우저에서:
- http://localhost:54323

확인 사항:
- [ ] 테이블 생성 확인 (profiles, apps, auth_codes)
- [ ] RLS 정책 활성화 확인

---

## 🔧 문제 발생 시

### 문제 1: WSL2 커널 업데이트 실패
```powershell
# 수동 다운로드
# https://aka.ms/wsl2kernel 접속
# 다운로드 후 설치
```

### 문제 2: Docker 여전히 안됨
**옵션 C로 전환**: Supabase Cloud 사용
```powershell
# SETUP_WSL_DOCKER.md의 "옵션 C" 참조
# Supabase Cloud에서 프로젝트 생성
# Docker 설치 불필요
```

### 문제 3: Supabase 시작 에러
```powershell
# Docker 로그 확인
docker logs supabase_db_sso-system

# Supabase 재시작
npx supabase stop
npx supabase start
```

---

## 📋 체크리스트

재부팅 후 순서대로 체크:

- [ ] Step 1: WSL2 커널 업데이트
- [ ] Step 2: Ubuntu 설치 (선택)
- [ ] Step 3: Docker Desktop 설정
- [ ] Step 4: Docker 확인
- [ ] Step 5: Supabase 로컬 시작
- [ ] Step 6: .env 파일 생성
- [ ] Step 7: Supabase Studio 접속

---

## 📚 관련 문서

- [SETUP_WSL_DOCKER.md](./SETUP_WSL_DOCKER.md) - 상세 가이드
- [SETUP.md](./SETUP.md) - 일반 설정 가이드
- [tasks/0001-tasks-supabase-init.md](./tasks/0001-tasks-supabase-init.md) - Task List

---

## 🎯 최종 목표

Task 1.0 완료:
- ✅ Supabase 로컬 환경 구축
- ✅ DB 접속 확인
- ✅ Studio 접속 확인

그 다음:
- Task 3.0: 마이그레이션 실행 (`npx supabase db reset`)
- Task 4.0: Seed 데이터 로드
- Task 6.0: SSO API 서버 개발 시작

---

## 💬 도움 요청

Claude에게 다시 물어보기:
- "재부팅 완료했어, 다음 단계 진행해줘"
- "Step 2에서 에러 발생: [에러 메시지]"
- "옵션 C로 전환하고 싶어" (Supabase Cloud)

---

**Good Luck!** 🚀
재부팅 후 돌아오세요!
