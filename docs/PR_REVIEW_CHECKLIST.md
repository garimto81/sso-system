# PR #13 검토 체크리스트

**PR**: feat: Add Vercel + Supabase Cloud deployment guides (v0.4.0)
**URL**: https://github.com/garimto81/sso-system/pull/13

---

## 📋 검토 포인트

### 1. 문서 검토 (5분)

#### ✅ 배포 가이드
- [ ] `docs/DEPLOYMENT_GUIDE.md` - Phase 1-4 단계가 명확한가?
- [ ] `docs/DEPLOYMENT_QUICKREF.md` - 체크리스트가 완전한가?
- [ ] `docs/DEPLOYMENT_SUMMARY.md` - 비용/시간 정보가 정확한가?

**확인 방법**:
```bash
# Files changed 탭에서 확인
# 또는 로컬에서:
code docs/DEPLOYMENT_GUIDE.md
```

#### ✅ Frontend 설계 문서
- [ ] `docs/design/FRONTEND_ARCHITECTURE.md` - 기술 스택 선정 근거가 타당한가?
- [ ] `docs/design/UI_UX_DESIGN.md` - 8개 화면 wireframe이 명확한가?
- [ ] `docs/design/SECURITY_AUDIT.md` - 보안 이슈 3개가 해결 가능한가?

**주요 보안 이슈**:
1. JWT Storage: localStorage → httpOnly cookies (2시간)
2. CSP Headers: next.config.js 추가 (1시간)
3. Environment Separation: Test/Prod toggle UI (12시간)

---

### 2. 스크립트 검토 (3분)

#### ✅ 자동화 스크립트
- [ ] `scripts/deploy-to-vercel.bat` - Windows 경로가 올바른가?
- [ ] `scripts/deploy-to-vercel.sh` - Linux/Mac 권한 설정이 필요한가?
- [ ] `scripts/create-admin-supabase-cloud.sql` - SQL이 안전한가?

**확인 방법**:
```bash
# 스크립트 구조 확인
cat scripts/deploy-to-vercel.bat | head -50

# SQL 안전성 확인 (bcrypt 사용 여부)
grep "crypt" scripts/create-admin-supabase-cloud.sql
```

**예상 출력**:
```sql
crypt('Test1234!', gen_salt('bf'))  # ✅ bcrypt 사용
```

---

### 3. 설정 파일 검토 (2분)

#### ✅ Vercel 설정
- [ ] `vercel.json` - Backend 설정이 올바른가?
- [ ] `admin-dashboard/vercel.json` - 보안 헤더가 포함되었는가?
- [ ] `.vercelignore` - 민감 파일이 제외되었는가?

**주요 확인 항목**:
```json
// admin-dashboard/vercel.json
{
  "headers": [
    {
      "key": "X-Frame-Options",
      "value": "DENY"  // ✅ Clickjacking 방지
    },
    {
      "key": "Content-Security-Policy",
      "value": "..."  // ⚠️ 확인 필요
    }
  ]
}
```

#### ✅ 환경 변수 템플릿
- [ ] `server/.env.production.example` - 11개 변수가 모두 있는가?
- [ ] `admin-dashboard/.env.production.example` - 4개 변수가 모두 있는가?
- [ ] 민감 정보가 포함되지 않았는가? (실제 키 대신 예시값)

**확인 방법**:
```bash
# 실제 키가 포함되었는지 확인
grep -E "eyJhbGci|sbp_|postgres" server/.env.production.example

# 빈 결과 = ✅ (예시값만 포함)
# 값 존재 = ❌ (실제 키 포함됨 - 수정 필요)
```

---

### 4. 보안 검토 (3분)

#### ✅ .gitignore 업데이트
- [ ] Test 파일 제외: `test-*.json`, `nul`
- [ ] 환경 변수 제외: `.env.production`
- [ ] 임시 파일 제외: `decode-token.js`

**확인 방법**:
```bash
git status --ignored | grep "test-"
# 예상: test-login.json, test-frontend-api.json (ignored)
```

#### ✅ 민감 정보 누락 확인
```bash
# 커밋된 파일에 실제 키가 없는지 확인
git log --patch -1 | grep -E "supabase_service_role_key|jwt_secret"

# 빈 결과 = ✅
# 값 존재 = ❌ (즉시 수정 필요)
```

---

### 5. 코드 품질 (2분)

#### ✅ Claude Commands
- [ ] `.claude/commands/setup-admin.md` - 명령어가 작동하는가?
- [ ] `.claude/commands/check-deploy.md` - 검증 로직이 올바른가?
- [ ] `.claude/commands/test-sso.md` - E2E 테스트 실행 가능한가?

**테스트 방법**:
```bash
# Claude Code에서 슬래시 명령어 테스트
/setup-admin
/check-deploy
```

---

## ✅ 머지 전 최종 확인

### Critical 체크리스트
- [ ] 실제 API 키가 커밋되지 않았는가?
- [ ] .env.production.example이 예시값만 포함하는가?
- [ ] SQL injection 가능성이 없는가?
- [ ] 보안 헤더가 설정되었는가?

### Optional 체크리스트
- [ ] 문서 오타가 없는가?
- [ ] 링크가 올바른가?
- [ ] 코드 예시가 실행 가능한가?

---

## 🚀 머지 후 배포 절차

### Step 1: PR 머지
```bash
# GitHub Web UI에서:
1. "Squash and merge" 선택
2. Commit message 확인
3. "Confirm squash and merge" 클릭

# 또는 CLI:
gh pr merge 13 --squash --delete-branch
```

### Step 2: 로컬 동기화
```bash
git checkout feature/sso-supabase-init
git pull origin feature/sso-supabase-init
```

### Step 3: 배포 시작
```bash
# Windows
scripts\deploy-to-vercel.bat

# Linux/Mac (WSL 가능)
bash scripts/deploy-to-vercel.sh
```

**예상 소요 시간**: 30-40분

---

## 📊 예상 결과

### PR 머지 후
- ✅ 47 files merged
- ✅ +83,996 lines added
- ✅ feature/deployment-v0.4 브랜치 삭제됨
- ✅ feature/sso-supabase-init에 반영됨

### 배포 스크립트 실행 후
```
✅ Supabase Cloud 프로젝트 생성
✅ 마이그레이션 푸시 완료
✅ Backend 배포 완료 (https://sso-backend-xxx.vercel.app)
✅ Frontend 배포 완료 (https://sso-frontend-xxx.vercel.app)
📋 환경 변수 설정 가이드 출력
```

---

## 🐛 문제 발생 시

### PR 머지 실패
```bash
# Conflict가 있는 경우
git checkout feature/deployment-v0.4
git rebase feature/sso-supabase-init
git push --force-with-lease
```

### 민감 정보 커밋됨
```bash
# 즉시 되돌리기
git checkout feature/deployment-v0.4
git reset --hard HEAD~1
git push --force

# .env.production.example에서 실제 값 제거
# 다시 커밋 & PR 업데이트
```

### 배포 스크립트 실패
```bash
# 로그 확인
vercel logs [deployment-url]

# 수동 배포
cd server
vercel --prod

cd ../admin-dashboard
vercel --prod
```

---

**검토 완료 시**: PR 머지 → 배포 시작
**문제 발견 시**: 수정 후 재검토

**Last Updated**: 2025-01-12
