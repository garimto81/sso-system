#!/bin/bash
# GitHub Labels 자동 설정 스크립트
# 프로젝트에 필요한 표준 라벨을 생성/업데이트합니다.

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

# Git 저장소 확인
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    error "Git 저장소가 아닙니다."
fi

# GitHub 저장소 확인
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner 2>/dev/null) || error "GitHub 저장소를 찾을 수 없습니다. 'gh auth login' 또는 원격 저장소를 설정하세요."

info "저장소: $REPO"
info "라벨 설정을 시작합니다..."

# 라벨 생성/업데이트 함수
# 사용법: create_or_update_label "name" "color" "description"
create_or_update_label() {
    local name=$1
    local color=$2
    local description=$3

    # 라벨 존재 확인
    if gh label list --json name -q ".[] | select(.name==\"$name\") | .name" 2>/dev/null | grep -q "^$name$"; then
        # 라벨 업데이트
        gh label edit "$name" --color "$color" --description "$description" 2>/dev/null && \
            info "✓ 업데이트: $name" || \
            warn "✗ 업데이트 실패: $name"
    else
        # 라벨 생성
        gh label create "$name" --color "$color" --description "$description" 2>/dev/null && \
            success "✓ 생성: $name" || \
            warn "✗ 생성 실패: $name"
    fi
}

echo ""
info "=== 타입 라벨 ==="

# 타입 라벨
create_or_update_label "feature" "0e8a16" "새로운 기능 추가"
create_or_update_label "bug" "d73a4a" "버그 수정"
create_or_update_label "hotfix" "b60205" "긴급 수정"
create_or_update_label "task" "1d76db" "일반 작업"
create_or_update_label "refactor" "fbca04" "코드 리팩토링"
create_or_update_label "docs" "0075ca" "문서 작업"
create_or_update_label "test" "d4c5f9" "테스트 추가/수정"
create_or_update_label "perf" "f9d0c4" "성능 개선"
create_or_update_label "style" "fef2c0" "코드 스타일 (포맷팅)"
create_or_update_label "chore" "fef2c0" "빌드/도구 설정"

echo ""
info "=== 우선순위 라벨 ==="

# 우선순위 라벨
create_or_update_label "priority: critical" "b60205" "🔴 Critical - 즉시 처리 필요"
create_or_update_label "priority: high" "d93f0b" "🟠 High - 이번 스프린트"
create_or_update_label "priority: medium" "fbca04" "🟡 Medium - 다음 스프린트"
create_or_update_label "priority: low" "0e8a16" "🟢 Low - 백로그"

echo ""
info "=== 상태 라벨 ==="

# 상태 라벨
create_or_update_label "status: backlog" "ededed" "백로그 - 계획 중"
create_or_update_label "status: ready" "c2e0c6" "준비 완료 - 작업 가능"
create_or_update_label "status: in-progress" "0052cc" "작업 중"
create_or_update_label "status: review" "5319e7" "리뷰 대기"
create_or_update_label "status: blocked" "d93f0b" "블락됨 - 진행 불가"
create_or_update_label "status: done" "0e8a16" "완료"

echo ""
info "=== PRD/스펙 라벨 ==="

# PRD/스펙 라벨
create_or_update_label "prd" "1d76db" "PRD (Product Requirements Document)"
create_or_update_label "spec" "0075ca" "기술 스펙 문서"
create_or_update_label "design" "f9d0c4" "디자인 관련"

echo ""
info "=== 크기 라벨 ==="

# 크기 라벨 (Story Points)
create_or_update_label "size: XS" "c2e0c6" "1-2시간"
create_or_update_label "size: S" "bfe5bf" "반나절"
create_or_update_label "size: M" "fbca04" "1일"
create_or_update_label "size: L" "f9d0c4" "2-3일"
create_or_update_label "size: XL" "d93f0b" "1주 이상"

echo ""
info "=== 카테고리 라벨 ==="

# 카테고리 라벨
create_or_update_label "frontend" "e99695" "프론트엔드 관련"
create_or_update_label "backend" "5319e7" "백엔드 관련"
create_or_update_label "database" "006b75" "데이터베이스 관련"
create_or_update_label "devops" "0e8a16" "DevOps/인프라"
create_or_update_label "security" "b60205" "보안 관련"
create_or_update_label "ux" "d876e3" "UX/UI 관련"

echo ""
info "=== 기타 라벨 ==="

# 기타 라벨
create_or_update_label "good first issue" "7057ff" "초보자에게 좋은 이슈"
create_or_update_label "help wanted" "008672" "도움 필요"
create_or_update_label "question" "d876e3" "질문"
create_or_update_label "duplicate" "cfd3d7" "중복된 이슈"
create_or_update_label "invalid" "e4e669" "유효하지 않음"
create_or_update_label "wontfix" "ffffff" "수정하지 않음"
create_or_update_label "dependencies" "0366d6" "의존성 업데이트"
create_or_update_label "breaking change" "d73a4a" "Breaking Change"

echo ""
echo "=========================================="
success "라벨 설정 완료!"
echo "=========================================="
echo ""
info "생성된 라벨 확인:"
echo "  gh label list"
echo ""
info "라벨 사용 예시:"
echo "  gh issue create --label \"feature,priority: high,status: in-progress\""
echo "  gh issue edit 123 --add-label \"status: review\""
echo ""
