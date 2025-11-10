# Supabase CLI 설치 가이드

## 방법 1: npm 전역 설치 (추천)

### PowerShell에서 실행:

```powershell
# 1. 기존 설치 제거 (있다면)
npm uninstall -g supabase

# 2. 최신 버전 설치
npm install -g supabase

# 3. 설치 확인
supabase --version

# 4. 여전히 안되면 PowerShell 재시작 후
supabase --version
```

---

## 방법 2: Scoop 사용 (Windows 패키지 관리자)

```powershell
# 1. Scoop 설치 (없다면)
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# 2. Supabase CLI 설치
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# 3. 확인
supabase --version
```

---

## 방법 3: 수동 설치

```powershell
# 1. GitHub에서 다운로드
# https://github.com/supabase/cli/releases

# 2. Windows용 바이너리 다운로드
# supabase_windows_amd64.exe

# 3. C:\Program Files\Supabase\ 폴더 생성 후 복사

# 4. 환경변수 PATH 추가
# 제어판 → 시스템 → 고급 시스템 설정 → 환경 변수
# Path에 C:\Program Files\Supabase\ 추가

# 5. PowerShell 재시작 후 확인
supabase --version
```

---

## 방법 4: npx 사용 (설치 없이)

설치가 계속 안되면 `npx`로 임시 사용:

```powershell
# 설치 대신 npx로 직접 실행
npx supabase init
npx supabase start
npx supabase status
```

**단점**: 매번 `npx` 붙여야 함
**장점**: 설치 불필요

---

## 🔍 문제 진단

### 1. npm 전역 경로 확인

```powershell
# npm 전역 경로 확인
npm config get prefix

# 출력 예시: C:\Users\사용자이름\AppData\Roaming\npm

# 이 경로가 PATH에 있는지 확인
$env:Path -split ';' | Select-String "npm"
```

### 2. PATH에 npm 추가 (없다면)

```powershell
# 현재 세션에만 추가 (임시)
$env:Path += ";C:\Users\사용자이름\AppData\Roaming\npm"

# 영구 추가 (관리자 권한 필요)
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\Users\사용자이름\AppData\Roaming\npm", "User")
```

### 3. PowerShell 재시작

중요: 환경변수 변경 후 **PowerShell을 완전히 종료하고 재시작**해야 합니다.

---

## ✅ 설치 성공 확인

```powershell
# 버전 확인
supabase --version

# 출력 예시:
# 1.138.6
```

---

## 🚨 여전히 안되면?

### 옵션 A: npx 사용 (임시 해결)

```powershell
cd d:\AI\claude01\sso-system
npx supabase init
npx supabase start
```

### 옵션 B: Docker로 직접 실행

```powershell
# Supabase Docker 이미지로 직접 실행
docker run --rm -it supabase/postgres

# 하지만 CLI 없이는 관리가 어려움
```

### 옵션 C: 나중에 설정

- 지금은 SSO PRD 작성 먼저
- Supabase 설정은 구현 단계(Phase 1)에서
- 요구사항 정의가 더 중요

---

## 📝 추천 순서

1. **방법 1 시도** (npm install -g supabase)
2. **PowerShell 재시작**
3. **여전히 안되면 방법 4** (npx 사용)
4. **또는 SSO PRD 작성 먼저**

---

**다음**: 설치 후 돌아와서 `supabase init` 실행
