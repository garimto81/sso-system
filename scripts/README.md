# Scripts 디렉토리

GitHub 네이티브 워크플로우 자동화 스크립트 모음

## 📋 목차

- [Admin User Setup](#-admin-user-setup) - Admin 계정 생성
  - [setup-admin-user.js](#setup-admin-userjs) - Node.js 스크립트
  - [setup-admin-user.sql](#setup-admin-usersql) - SQL 대안
  - [setup-admin-user.sh/bat](#setup-admin-usershbat) - 래퍼 스크립트
- [github-issue-dev.sh](#github-issue-devsh) - 이슈 기반 개발 시작
- [setup-github-labels.sh](#setup-github-labelssh) - GitHub 라벨 설정
- [사용 예시](#사용-예시)

---

## 🔐 Admin User Setup

### 빠른 시작 (권장)

**Windows:**
```bash
# 방법 1: 배치 래퍼 사용 (의존성 자동 처리)
scripts\setup-admin-user.bat

# 방법 2: npm 스크립트 사용
npm run admin:setup

# 방법 3: 커스텀 계정 정보
scripts\setup-admin-user.bat --email=admin@example.com --password=MySecret123!
```

**Linux/macOS:**
```bash
# 방법 1: bash 래퍼 사용 (의존성 자동 처리)
bash scripts/setup-admin-user.sh

# 방법 2: npm 스크립트 사용
npm run admin:setup

# 방법 3: 커스텀 계정 정보
bash scripts/setup-admin-user.sh --email=admin@example.com --password=MySecret123!
```

### 대안 방법

**SQL 스크립트 (Node.js 의존성 불필요):**
```bash
# 사전요구: PostgreSQL client (psql) + Supabase 실행 중
npm run admin:setup:sql

# 또는 psql 직접 실행
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f scripts/setup-admin-user.sql
```

**수동 Node.js (고급):**
```bash
# NODE_PATH 설정으로 @supabase/supabase-js 찾기
export NODE_PATH=./server/node_modules  # Linux/macOS
set NODE_PATH=.\server\node_modules     # Windows CMD
$env:NODE_PATH=".\server\node_modules"  # Windows PowerShell

node scripts/setup-admin-user.js --email=admin@test.com --password=Test1234!
```

### 기본 계정 정보

- **Email:** admin@test.com
- **Password:** Test1234!
- **Role:** admin

### 문제 해결

**에러: "Cannot find package '@supabase/supabase-js'"**
```bash
# 해결 1: 서버 의존성 설치
cd server
npm install
cd ..

# 해결 2: SQL 대안 사용
npm run admin:setup:sql
```

**에러: "SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found"**
```bash
# .env 파일 존재 확인
ls server/.env

# 없으면 예제에서 복사
cd server
cp .env.example .env

# Supabase 시작으로 키 얻기
npx supabase start
```

**에러: "psql: command not found" (SQL 방법)**
```bash
# PostgreSQL client 도구 설치
# Ubuntu/Debian
sudo apt-get install postgresql-client

# macOS
brew install postgresql

# Windows: https://www.postgresql.org/download/windows/
# 또는 Node.js 방법 사용
```

### setup-admin-user.js

Supabase Auth + profiles 테이블에 admin 사용자를 생성합니다.

**기능:**
- 이메일/비밀번호 대화형 입력 (CLI 인자 미제공 시)
- 이메일 형식 및 비밀번호 길이 검증 (최소 8자)
- 기존 사용자 처리 (role을 admin으로 업데이트)
- 이메일 자동 확인 (검증 불필요)
- 생성 후 테스트 curl 명령 표시

**사용법:**
```bash
# 대화형 모드
node scripts/setup-admin-user.js

# CLI 인자 사용
node scripts/setup-admin-user.js --email=admin@example.com --password=secret123
```

**요구사항:**
- `@supabase/supabase-js` (server/node_modules에 설치됨)
- `dotenv` (Node.js 내장)
- 유효한 `server/.env` (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 포함)

### setup-admin-user.sql

PostgreSQL을 통해 admin을 직접 생성하는 SQL 기반 대안입니다.

**기능:**
- Node.js 의존성 불필요
- 비밀번호 해싱에 bcrypt 사용 (10 rounds)
- 트랜잭션 안전 (BEGIN/COMMIT)
- 기존 사용자 확인
- 마지막에 검증 쿼리 실행

**사용법:**
```bash
# npm 스크립트 사용
npm run admin:setup:sql

# psql 직접 사용
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f scripts/setup-admin-user.sql

# Windows
set PGPASSWORD=postgres
psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f scripts\setup-admin-user.sql
```

**요구사항:**
- PostgreSQL client (`psql`) 설치됨
- Supabase 실행 중 (`npx supabase start`)

### setup-admin-user.sh/bat

의존성 해결을 자동으로 처리하는 래퍼 스크립트입니다.

**기능:**
- server/node_modules 확인 및 필요 시 `npm install` 실행
- NODE_PATH 환경 변수 설정
- Node.js 방법 실패 시 SQL 방법으로 폴백
- 색상 코드 출력

**사용법:**
```bash
# Bash (Linux/macOS)
bash scripts/setup-admin-user.sh
bash scripts/setup-admin-user.sh --email=admin@example.com --password=secret123

# Batch (Windows)
scripts\setup-admin-user.bat
scripts\setup-admin-user.bat --email=admin@example.com --password=secret123
```

---

## 🚀 github-issue-dev.sh

GitHub Issue를 기반으로 개발 환경을 자동으로 설정합니다.

### 기능

- ✅ 이슈 정보 자동 조회 (제목, 라벨, 상태)
- ✅ 라벨에 따른 브랜치 자동 생성
  - `feature/` - feature/prd 라벨
  - `bugfix/` - bug 라벨
  - `hotfix/` - hotfix 라벨
  - `task/` - 기타
- ✅ PRD 자동 저장 (`tasks/prds/`)
- ✅ 이슈 상태 자동 업데이트 (in-progress 라벨 + 코멘트)

### 사용법

```bash
# 기본 사용
./scripts/github-issue-dev.sh <issue-number>

# 예시
./scripts/github-issue-dev.sh 42
```

### 워크플로우 예시

```bash
# 1. GitHub에서 Feature 이슈 생성
gh issue create --template 01-feature-prd.yml

# 출력: Created issue #42

# 2. 개발 환경 자동 설정
./scripts/github-issue-dev.sh 42

# 자동 수행 작업:
# - feature/issue-42-user-authentication 브랜치 생성
# - tasks/prds/0042-prd-user-authentication.md 저장
# - 이슈에 "in-progress" 라벨 추가
# - 이슈에 "🚀 작업 시작" 코멘트 추가

# 3. 개발 진행
# ... 코드 작성 ...
git add .
git commit -m "feat: Add user authentication [#42]"

# 4. PR 생성
git push -u origin feature/issue-42-user-authentication
gh pr create --fill

# PR 본문에 자동으로 추가:
# Closes #42
```

### 브랜치 명명 규칙

```
{prefix}/issue-{number}-{title-slug}

예시:
feature/issue-42-user-authentication
bugfix/issue-123-login-session-bug
hotfix/issue-456-security-patch
task/issue-789-docker-setup
```

### 출력 예시

```
[INFO] 이슈 #42 정보를 가져오는 중...
[INFO] 이슈: Add user authentication system
[INFO] 라벨: feature,prd,priority: high
[INFO] 브랜치 이름: feature/issue-42-user-authentication
[INFO] 새 브랜치 생성 중...
[SUCCESS] 브랜치 feature/issue-42-user-authentication를 생성하고 체크아웃했습니다.
[SUCCESS] 이슈에 코멘트를 추가했습니다.
[SUCCESS] 라벨 'in-progress'를 추가했습니다.
[INFO] PRD를 로컬에 저장합니다...
[SUCCESS] PRD를 tasks/prds/0042-prd-user-authentication.md에 저장했습니다.

==========================================
[SUCCESS] 개발 환경 준비 완료!
==========================================

[INFO] 이슈 번호: #42
[INFO] 브랜치: feature/issue-42-user-authentication
[INFO] 다음 단계:
  1. 코드 작성 및 커밋
  2. git push -u origin feature/issue-42-user-authentication
  3. gh pr create --fill (PR 생성)
  4. PR에 'Closes #42' 포함

[INFO] 커밋 메시지 형식:
  type: 설명 [#42]
  예: feat: Add user authentication [#42]
```

---

## 🏷️ setup-github-labels.sh

프로젝트에 필요한 표준 GitHub 라벨을 자동으로 생성/업데이트합니다.

### 기능

- ✅ 50+ 표준 라벨 자동 생성
- ✅ 기존 라벨 자동 업데이트 (색상, 설명)
- ✅ 카테고리별 체계적 분류

### 사용법

```bash
# 라벨 설정 (최초 1회 실행)
./scripts/setup-github-labels.sh

# 라벨 확인
gh label list
```

### 생성되는 라벨 카테고리

#### 1️⃣ 타입 라벨
| 라벨 | 색상 | 설명 |
|------|------|------|
| feature | 🟢 0e8a16 | 새로운 기능 추가 |
| bug | 🔴 d73a4a | 버그 수정 |
| hotfix | 🔥 b60205 | 긴급 수정 |
| task | 🔵 1d76db | 일반 작업 |
| refactor | 🟡 fbca04 | 코드 리팩토링 |
| docs | 📘 0075ca | 문서 작업 |
| test | 🧪 d4c5f9 | 테스트 추가/수정 |
| perf | ⚡ f9d0c4 | 성능 개선 |
| style | 🎨 fef2c0 | 코드 스타일 |
| chore | 🔧 fef2c0 | 빌드/도구 설정 |

#### 2️⃣ 우선순위 라벨
| 라벨 | 설명 |
|------|------|
| priority: critical | 🔴 즉시 처리 필요 |
| priority: high | 🟠 이번 스프린트 |
| priority: medium | 🟡 다음 스프린트 |
| priority: low | 🟢 백로그 |

#### 3️⃣ 상태 라벨
| 라벨 | 설명 |
|------|------|
| status: backlog | 백로그 - 계획 중 |
| status: ready | 준비 완료 - 작업 가능 |
| status: in-progress | 작업 중 |
| status: review | 리뷰 대기 |
| status: blocked | 블락됨 - 진행 불가 |
| status: done | 완료 |

#### 4️⃣ PRD/스펙 라벨
| 라벨 | 설명 |
|------|------|
| prd | PRD 문서 |
| spec | 기술 스펙 문서 |
| design | 디자인 관련 |

#### 5️⃣ 크기 라벨
| 라벨 | 예상 시간 |
|------|----------|
| size: XS | 1-2시간 |
| size: S | 반나절 |
| size: M | 1일 |
| size: L | 2-3일 |
| size: XL | 1주 이상 |

#### 6️⃣ 카테고리 라벨
- `frontend`, `backend`, `database`, `devops`, `security`, `ux`

#### 7️⃣ 기타 라벨
- `good first issue`, `help wanted`, `question`, `duplicate`, `invalid`, `wontfix`, `dependencies`, `breaking change`

### 라벨 사용 예시

```bash
# 이슈 생성 시 라벨 지정
gh issue create \
  --title "Add user authentication" \
  --body "..." \
  --label "feature,prd,priority: high,size: L,backend"

# 기존 이슈에 라벨 추가
gh issue edit 42 --add-label "status: in-progress"

# 여러 라벨 동시 추가
gh issue edit 42 --add-label "status: review,priority: high"

# 라벨 제거
gh issue edit 42 --remove-label "status: in-progress"
```

---

## 📖 사용 예시

### 시나리오 1: 새 기능 개발

```bash
# Step 1: 최초 설정 (프로젝트당 1회)
./scripts/setup-github-labels.sh

# Step 2: Feature 이슈 생성
gh issue create --template 01-feature-prd.yml

# 웹 UI에서 폼 작성:
# - 기능 이름: 사용자 인증 시스템
# - PRD 레벨: STANDARD
# - 우선순위: High
# ...

# 출력: Created issue #42

# Step 3: 개발 환경 설정
./scripts/github-issue-dev.sh 42

# Step 4: 개발 진행
# ... 코드 작성 ...
git add .
git commit -m "feat: Add user authentication [#42]"

# Step 5: 테스트
npm test

# Step 6: PR 생성
git push -u origin feature/issue-42-user-authentication
gh pr create --title "Add user authentication" \
  --body "Closes #42

## Summary
- 사용자 인증 시스템 구현
- JWT 토큰 기반
- Supabase Auth 연동

## Test Plan
- [x] 단위 테스트 통과
- [x] 통합 테스트 통과
- [ ] QA 테스트 대기"
```

### 시나리오 2: 버그 수정

```bash
# Step 1: 버그 리포트 이슈 생성
gh issue create --template 02-bug-report.yml

# Step 2: 개발 환경 설정
./scripts/github-issue-dev.sh 123

# 자동 생성: bugfix/issue-123-login-session-bug

# Step 3: 버그 수정
git add .
git commit -m "fix: Resolve login session persistence issue [#123]"

# Step 4: PR 생성
git push -u origin bugfix/issue-123-login-session-bug
gh pr create --fill
```

### 시나리오 3: Task 작업

```bash
# Step 1: Task 이슈 생성
gh issue create --template 03-task.yml

# Step 2: 개발 환경 설정
./scripts/github-issue-dev.sh 789

# 자동 생성: task/issue-789-docker-setup

# Step 3: 작업 수행
git add .
git commit -m "chore: Setup Docker development environment [#789]"

# Step 4: PR 생성
git push -u origin task/issue-789-docker-setup
gh pr create --fill
```

---

## 🛠️ 요구사항

### 필수
- [GitHub CLI (gh)](https://cli.github.com/)
- Git
- Bash (Windows: Git Bash 또는 WSL)

### 설치

```bash
# GitHub CLI 설치 (Windows)
winget install GitHub.cli

# GitHub CLI 설치 (macOS)
brew install gh

# GitHub CLI 설치 (Linux)
sudo apt install gh

# 인증
gh auth login
```

---

## 🔧 트러블슈팅

### gh: command not found
```bash
# GitHub CLI 설치 확인
which gh

# 없으면 설치
winget install GitHub.cli  # Windows
brew install gh            # macOS
```

### 권한 오류 (Permission denied)
```bash
# 스크립트 실행 권한 부여
chmod +x scripts/*.sh
```

### GitHub 인증 오류
```bash
# GitHub 로그인 상태 확인
gh auth status

# 재인증
gh auth login
```

### 브랜치 이름 길이 초과
스크립트는 자동으로 50자로 제한합니다. 수동 조정이 필요한 경우:
```bash
# 브랜치 이름 변경
git branch -m old-branch-name new-branch-name
```

---

## 📚 참고 자료

- [CLAUDE.md](../CLAUDE.md) - 전체 개발 워크플로우
- [깃허브_워크플로우_개요.md](../깃허브_워크플로우_개요.md) - GitHub 워크플로우 5분 개요
- [깃허브_빠른시작.md](../깃허브_빠른시작.md) - 30분 설정 가이드
- [GitHub CLI Manual](https://cli.github.com/manual/)

---

## 📝 추가 스크립트 (향후 추가 예정)

- `generate_tasks.py` - PRD에서 Task List 자동 생성
- `context_manager.py` - 스마트 컨텍스트 관리
- `diff_manager.py` - Diff 기반 업데이트
- `create_prd.py` - PRD 템플릿 생성

---

**버전**: 1.0.0
**업데이트**: 2025-01-11
