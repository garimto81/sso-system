# WSL2 + Docker Desktop 설치 가이드

**목적**: Windows에서 Supabase 로컬 개발 환경 구축
**소요 시간**: 30-60분
**난이도**: 중급

---

## 🎯 문제 상황

```
npx supabase start 실행 시:
❌ failed to inspect container health: request returned 500 Internal Server Error
```

**원인**: Docker Desktop이 WSL2 기반으로 동작하는데, WSL2가 제대로 설정되지 않음

---

## 📋 사전 확인

### 1. Windows 버전 확인

```powershell
# PowerShell (관리자 권한)
winver
```

**필요 버전**:
- Windows 10 버전 2004 이상 (빌드 19041 이상)
- 또는 Windows 11

---

## 🔧 해결 방법 (3가지 옵션)

### 옵션 A: WSL2 설치 (권장, 완전한 해결책)
### 옵션 B: Docker Desktop 재설치 (빠른 해결)
### 옵션 C: Supabase Cloud 사용 (로컬 Docker 불필요)

---

## ✅ 옵션 A: WSL2 설치 및 설정

### Step 1: WSL2 활성화

**PowerShell (관리자 권한으로 실행)**:

```powershell
# 1. WSL 기능 활성화
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart

# 2. 가상 머신 플랫폼 활성화
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

# 3. 재부팅 (필수!)
Restart-Computer
```

### Step 2: WSL2 Linux 커널 업데이트

**재부팅 후 PowerShell (관리자 권한)**:

```powershell
# WSL2 커널 업데이트 다운로드 및 설치
# 자동 다운로드
Invoke-WebRequest -Uri https://wslstorestorage.blob.core.windows.net/wslblob/wsl_update_x64.msi -OutFile wsl_update_x64.msi

# 설치
Start-Process msiexec.exe -Wait -ArgumentList '/I wsl_update_x64.msi /quiet'

# 삭제
Remove-Item wsl_update_x64.msi
```

또는 **수동 다운로드**:
https://aka.ms/wsl2kernel

### Step 3: WSL2를 기본 버전으로 설정

```powershell
wsl --set-default-version 2
```

### Step 4: Ubuntu 설치 (선택사항, 권장)

```powershell
# Microsoft Store에서 Ubuntu 설치
# 또는 명령어로:
wsl --install -d Ubuntu
```

**처음 실행 시**:
- 사용자 이름 입력 (예: dev)
- 비밀번호 입력 (나중에 sudo에 사용)

### Step 5: Docker Desktop 재시작

1. Docker Desktop 종료
2. 설정 → General → "Use the WSL 2 based engine" 체크
3. 설정 → Resources → WSL Integration → Ubuntu 활성화
4. Docker Desktop 재시작

### Step 6: 확인

```powershell
# WSL 버전 확인
wsl --list --verbose

# 출력 예시:
#   NAME      STATE           VERSION
# * Ubuntu    Running         2
```

```powershell
# Docker 확인
docker --version
docker ps
```

```powershell
# Supabase 시작
cd d:\AI\claude01\sso-system
npx supabase start
```

---

## ✅ 옵션 B: Docker Desktop 재설치 (빠른 해결)

### Step 1: 기존 Docker 완전 제거

1. **제어판** → **프로그램 제거** → **Docker Desktop** 제거
2. 재부팅

### Step 2: WSL2 확인

```powershell
# PowerShell
wsl --status

# WSL이 설치되지 않았다면:
wsl --install
```

### Step 3: Docker Desktop 재설치

1. https://www.docker.com/products/docker-desktop 접속
2. Windows용 다운로드
3. 설치 시 **"Use WSL 2 instead of Hyper-V"** 체크
4. 설치 완료 후 재부팅

### Step 4: 확인

```powershell
docker --version
docker run hello-world
```

---

## ✅ 옵션 C: Supabase Cloud 사용 (Docker 불필요)

Docker 설치 없이 Supabase Cloud에서 직접 개발 가능

### Step 1: Supabase 프로젝트 생성

1. https://supabase.com 접속
2. "Start your project" 클릭
3. 무료 플랜 선택 (Free Tier)
4. 프로젝트 이름: `sso-system-dev`
5. Database 비밀번호 설정
6. 지역 선택: `Northeast Asia (Seoul)`

### Step 2: 프로젝트 설정 복사

프로젝트 대시보드 → Settings → API:
- **Project URL**: `https://xxxxx.supabase.co`
- **Anon public key**: `eyJhbGc...`
- **Service role secret**: `eyJhbGc...`

### Step 3: .env 파일 수정

```bash
# .env
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

### Step 4: 마이그레이션 실행

```powershell
cd d:\AI\claude01\sso-system

# Supabase 프로젝트 링크
npx supabase link --project-ref xxxxx

# 마이그레이션 푸시
npx supabase db push
```

### 장단점

**장점**:
- ✅ Docker 설치 불필요
- ✅ 설정 간편
- ✅ 외부에서 접근 가능 (앱 테스트 쉬움)

**단점**:
- ⚠️ 무료 플랜 제한 (500MB DB, 5GB 트래픽)
- ⚠️ 인터넷 연결 필요

---

## 🔍 문제 진단

### 현재 Docker 상태 확인

```powershell
# Docker Desktop 실행 중인지 확인
Get-Process "Docker Desktop" -ErrorAction SilentlyContinue

# Docker 버전
docker --version

# Docker 엔진 상태
docker info
```

### WSL 상태 확인

```powershell
# WSL 설치 여부
wsl --status

# WSL 버전 확인
wsl --list --verbose
```

### 에러 메시지별 해결

#### 에러 1: "request returned 500 Internal Server Error"
**원인**: Docker 엔진이 WSL2에 접근 못함
**해결**: 옵션 A (WSL2 설치)

#### 에러 2: "docker: command not found"
**원인**: Docker Desktop 미설치 또는 PATH 문제
**해결**: Docker Desktop 재설치

#### 에러 3: "Cannot connect to the Docker daemon"
**원인**: Docker Desktop 실행 안됨
**해결**:
```powershell
# Docker Desktop 재시작
Stop-Process -Name "Docker Desktop" -Force
Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
```

---

## 📊 권장 옵션 선택 가이드

### 옵션 A (WSL2) 선택 조건:
- ✅ 장기적으로 로컬 개발 계획
- ✅ 오프라인 개발 필요
- ✅ 다른 Docker 컨테이너도 사용 예정

### 옵션 B (Docker 재설치) 선택 조건:
- ✅ 이미 WSL2 설치됨
- ✅ Docker만 문제

### 옵션 C (Supabase Cloud) 선택 조건:
- ✅ 빠르게 시작하고 싶음
- ✅ Docker 설치 시간 없음
- ✅ 무료 플랜으로 충분

---

## ⚡ 빠른 시작 (추천 순서)

### 1단계: WSL2 확인
```powershell
wsl --status
```

- **설치됨** → 옵션 B (Docker 재설치)
- **미설치** → 옵션 A (WSL2 설치) 또는 옵션 C (Supabase Cloud)

### 2단계: 선택한 옵션 실행

### 3단계: 확인
```powershell
npx supabase start
```

---

## 🆘 추가 도움

### 공식 문서
- [Docker Desktop WSL2 설정](https://docs.docker.com/desktop/wsl/)
- [WSL2 설치 가이드](https://docs.microsoft.com/ko-kr/windows/wsl/install)
- [Supabase 로컬 개발](https://supabase.com/docs/guides/cli/local-development)

### 문제 지속 시
1. Docker Desktop → Troubleshoot → Reset to factory defaults
2. Windows 업데이트 확인
3. BIOS에서 가상화 활성화 (VT-x/AMD-V)

---

## ✅ 성공 확인

다음 명령어가 모두 작동하면 성공:

```powershell
# 1. WSL 작동
wsl --list --verbose

# 2. Docker 작동
docker ps

# 3. Supabase 작동
npx supabase start

# 출력:
# Started supabase local development setup.
#          API URL: http://localhost:54321
#           DB URL: postgresql://postgres:postgres@localhost:54322/postgres
#       Studio URL: http://localhost:54323
```

---

**다음 단계**: 성공 후 [SETUP.md](./SETUP.md)로 돌아가서 Task 1.0 계속 진행

**예상 시간**:
- 옵션 A: 60분 (재부팅 포함)
- 옵션 B: 30분
- 옵션 C: 10분
