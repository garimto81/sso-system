# Scripts 디렉토리

GitHub 네이티브 워크플로우 자동화 스크립트 모음

## 📋 목차

- [github-issue-dev.sh](#github-issue-devsh) - 이슈 기반 개발 시작
- [setup-github-labels.sh](#setup-github-labelssh) - GitHub 라벨 설정
- [사용 예시](#사용-예시)

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
