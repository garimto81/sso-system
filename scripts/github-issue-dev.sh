#!/bin/bash
# GitHub Issue 기반 개발 워크플로우 시작 스크립트
# 사용법: ./scripts/github-issue-dev.sh <issue-number>

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 함수: 에러 메시지 출력
error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
    exit 1
}

# 함수: 성공 메시지 출력
success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# 함수: 정보 메시지 출력
info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# 함수: 경고 메시지 출력
warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# GitHub CLI 확인
if ! command -v gh &> /dev/null; then
    error "GitHub CLI (gh)가 설치되지 않았습니다. https://cli.github.com/ 에서 설치하세요."
fi

# 인자 확인
if [ -z "$1" ]; then
    error "사용법: $0 <issue-number>"
fi

ISSUE_NUMBER=$1

# Git 저장소 확인
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    error "Git 저장소가 아닙니다."
fi

info "이슈 #${ISSUE_NUMBER} 정보를 가져오는 중..."

# 이슈 정보 가져오기
ISSUE_TITLE=$(gh issue view "$ISSUE_NUMBER" --json title -q .title 2>/dev/null) || error "이슈 #${ISSUE_NUMBER}를 찾을 수 없습니다."
ISSUE_LABELS=$(gh issue view "$ISSUE_NUMBER" --json labels -q '.labels[].name' 2>/dev/null | tr '\n' ',' | sed 's/,$//')
ISSUE_STATE=$(gh issue view "$ISSUE_NUMBER" --json state -q .state)

if [ "$ISSUE_STATE" = "CLOSED" ]; then
    warn "이슈 #${ISSUE_NUMBER}는 이미 닫혀 있습니다."
    read -p "계속하시겠습니까? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 0
    fi
fi

info "이슈: $ISSUE_TITLE"
info "라벨: $ISSUE_LABELS"

# 브랜치 이름 생성 (feature/issue-123-title-slug)
# 제목을 소문자로 변환하고 공백을 하이픈으로, 특수문자 제거
BRANCH_SLUG=$(echo "$ISSUE_TITLE" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9가-힣]/-/g' | sed 's/--*/-/g' | sed 's/^-//' | sed 's/-$//' | cut -c1-50)

# 라벨에 따라 브랜치 접두사 결정
if [[ "$ISSUE_LABELS" == *"feature"* ]] || [[ "$ISSUE_LABELS" == *"prd"* ]]; then
    BRANCH_PREFIX="feature"
elif [[ "$ISSUE_LABELS" == *"bug"* ]]; then
    BRANCH_PREFIX="bugfix"
elif [[ "$ISSUE_LABELS" == *"hotfix"* ]]; then
    BRANCH_PREFIX="hotfix"
else
    BRANCH_PREFIX="task"
fi

BRANCH_NAME="${BRANCH_PREFIX}/issue-${ISSUE_NUMBER}-${BRANCH_SLUG}"

info "브랜치 이름: $BRANCH_NAME"

# 현재 브랜치 확인
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" = "$BRANCH_NAME" ]; then
    warn "이미 브랜치 $BRANCH_NAME에 있습니다."
else
    # 브랜치 존재 확인
    if git show-ref --verify --quiet "refs/heads/$BRANCH_NAME"; then
        warn "브랜치 $BRANCH_NAME가 이미 존재합니다."
        read -p "체크아웃하시겠습니까? (Y/n): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Nn]$ ]]; then
            git checkout "$BRANCH_NAME"
            success "브랜치 $BRANCH_NAME로 체크아웃했습니다."
        fi
    else
        # 새 브랜치 생성
        info "새 브랜치 생성 중..."
        git checkout -b "$BRANCH_NAME"
        success "브랜치 $BRANCH_NAME를 생성하고 체크아웃했습니다."
    fi
fi

# 이슈를 "In Progress"로 표시 (선택적)
read -p "이슈 상태를 업데이트하시겠습니까? (Y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    # 이슈에 코멘트 추가
    gh issue comment "$ISSUE_NUMBER" --body "🚀 작업 시작: \`$BRANCH_NAME\` 브랜치에서 개발 중" 2>/dev/null && success "이슈에 코멘트를 추가했습니다."

    # "in-progress" 라벨 추가 (존재하는 경우)
    gh issue edit "$ISSUE_NUMBER" --add-label "in-progress" 2>/dev/null && success "라벨 'in-progress'를 추가했습니다." || warn "라벨 'in-progress'를 추가하지 못했습니다."
fi

# PRD가 있는 경우 로컬에 저장 (feature 타입인 경우)
if [[ "$ISSUE_LABELS" == *"prd"* ]]; then
    info "PRD를 로컬에 저장합니다..."

    # PRD 디렉토리 생성
    mkdir -p tasks/prds

    # 이슈 번호를 4자리로 포맷 (0001, 0002, ...)
    PRD_NUMBER=$(printf "%04d" "$ISSUE_NUMBER")
    PRD_FILE="tasks/prds/${PRD_NUMBER}-prd-${BRANCH_SLUG}.md"

    # 이슈 내용 가져오기
    gh issue view "$ISSUE_NUMBER" --json body -q .body > "$PRD_FILE"

    success "PRD를 $PRD_FILE에 저장했습니다."

    # Task list 생성 여부 확인
    read -p "Task list를 생성하시겠습니까? (Y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Nn]$ ]]; then
        info "Task list 생성은 Claude Code에서 수동으로 진행해주세요:"
        echo "  python scripts/generate_tasks.py $PRD_FILE"
    fi
fi

# 요약 정보 출력
echo ""
echo "=========================================="
success "개발 환경 준비 완료!"
echo "=========================================="
echo ""
info "이슈 번호: #${ISSUE_NUMBER}"
info "브랜치: ${BRANCH_NAME}"
info "다음 단계:"
echo "  1. 코드 작성 및 커밋"
echo "  2. git push -u origin ${BRANCH_NAME}"
echo "  3. gh pr create --fill (PR 생성)"
echo "  4. PR에 'Closes #${ISSUE_NUMBER}' 포함"
echo ""
info "커밋 메시지 형식:"
echo "  type: 설명 [#${ISSUE_NUMBER}]"
echo "  예: feat: Add user authentication [#${ISSUE_NUMBER}]"
echo ""
