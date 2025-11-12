# SSO System - 개발자 도구

SSO System 프로젝트에 최적화된 개발 도구 모음입니다.

---

## 🚀 Quick Start

```bash
# 1. Admin 계정 생성
/setup-admin

# 2. 테스트 데이터 생성
/seed-apps

# 3. SSO 플로우 테스트
/test-sso
```

---

## 📦 도구 카탈로그

### Slash Commands (Claude Code에서 즉시 실행)

| 명령 | 용도 | 소요 시간 |
|------|------|----------|
| `/setup-admin` | Admin 계정 생성 | ~10초 |
| `/test-sso` | SSO 플로우 전체 테스트 | ~2분 |
| `/seed-apps` | 테스트 앱/데이터 생성 | ~30초 |
| `/check-deploy` | 배포 전 체크리스트 (20항목) | ~1분 |
| `/db-status` | Supabase DB 상태 확인 | ~5초 |

### Helper Scripts (Node.js 스크립트)

| 스크립트 | 용도 | 사용법 |
|---------|------|--------|
| `setup-admin-user.js` | Admin 계정 자동 생성 | `node scripts/setup-admin-user.js` |
| `seed-test-data.js` | 테스트 데이터 생성 | `node scripts/seed-test-data.js --count=10` |
| `validate-environment.js` | .env 파일 검증 | `node scripts/validate-environment.js --fix` |
| `test-api-endpoints.js` | API 헬스 체크 | `node scripts/test-api-endpoints.js --verbose` |
| `generate-migration.js` | Supabase 마이그레이션 생성 | `node scripts/generate-migration.js add-column apps logo_url` |

### 개발 가이드 (상세 문서)

| 가이드 | 내용 | 파일 |
|--------|------|------|
| **SSO Development** | OAuth 2.0 Flow 구현, Admin API 패턴 | [SSO_DEVELOPMENT_GUIDE.md](docs/SSO_DEVELOPMENT_GUIDE.md) |
| **Supabase Cookbook** | RLS, Triggers, Indexes, Migrations | [SUPABASE_COOKBOOK.md](docs/SUPABASE_COOKBOOK.md) |
| **Admin UI Patterns** | Next.js 14, shadcn/ui, React Query | [ADMIN_UI_PATTERNS.md](docs/ADMIN_UI_PATTERNS.md) |

---

## 📖 사용 예시

### 시나리오 1: 로컬 개발 환경 설정 (5분)

```bash
# 1. Supabase 로컬 실행
npx supabase start

# 2. 환경변수 검증
node scripts/validate-environment.js

# 3. Admin 계정 생성
/setup-admin
# Email: admin@example.com
# Password: secure123

# 4. 테스트 데이터 생성
/seed-apps

# 5. 서버 시작 및 테스트
npm run dev
/test-sso
```

### 시나리오 2: 배포 전 체크 (2분)

```bash
# 1. 배포 체크리스트 실행
/check-deploy

# 2. 환경변수 프로덕션 검증
node scripts/validate-environment.js --env=production

# 3. API 엔드포인트 테스트
node scripts/test-api-endpoints.js --url=https://your-app.vercel.app

# 4. DB 마이그레이션 확인
npx supabase db diff --use-remote
```

### 시나리오 3: 새 기능 개발 (OAuth 플로우 수정)

```bash
# 1. 현재 플로우 테스트 (베이스라인)
/test-sso

# 2. 코드 수정
# ... 개발 작업 ...

# 3. 다시 테스트
/test-sso

# 4. DB 마이그레이션 필요 시
node scripts/generate-migration.js add-column apps new_field
npx supabase db reset

# 5. 최종 검증
npm test
/test-sso
```

---

## 🔧 도구 설치 및 설정

### 사전 요구사항

- Node.js 22+
- Docker Desktop (Supabase 로컬 실행용)
- Claude Code CLI

### Slash Commands 설정

Slash Commands는 `.claude/commands/` 폴더에 자동으로 인식됩니다.

```bash
# 확인
ls .claude/commands/
# setup-admin.md
# test-sso.md
# seed-apps.md
# check-deploy.md
# db-status.md
```

### Helper Scripts 권한 설정 (Unix 계열)

```bash
chmod +x scripts/*.js
```

---

## 📊 도구별 상세 정보

### 완전한 카탈로그

모든 도구의 상세 사용법 및 옵션은 다음 문서를 참조하세요:

📚 **[TOOLS_INDEX.md](docs/TOOLS_INDEX.md)** - 전체 도구 카탈로그

---

## 🎯 핵심 원칙

1. **자동화 우선**: 반복 작업은 도구로 자동화
2. **로컬 우선 테스트**: 프로덕션 배포 전 로컬 검증
3. **문서와 도구 연계**: 가이드 문서 + 실행 도구 세트

---

## 🤝 기여하기

### 새 도구 추가

1. **Slash Command 추가**:
   ```bash
   # .claude/commands/<name>.md 생성
   # 명령 설명, 사용법, 출력 예시 작성
   # TOOLS_INDEX.md 업데이트
   ```

2. **Helper Script 추가**:
   ```bash
   # scripts/<name>.js 생성
   # CLI 인자 파싱, 에러 처리, 로깅 추가
   # TOOLS_INDEX.md 업데이트
   ```

3. **가이드 문서 추가**:
   ```bash
   # docs/<topic>.md 생성
   # 패턴, 예제, Best Practices 작성
   # TOOLS_INDEX.md 업데이트
   ```

---

## 📚 참조

- [TOOLS_INDEX.md](docs/TOOLS_INDEX.md) - 전체 도구 카탈로그
- [SSO_DEVELOPMENT_GUIDE.md](docs/SSO_DEVELOPMENT_GUIDE.md) - SSO 개발 가이드
- [SUPABASE_COOKBOOK.md](docs/SUPABASE_COOKBOOK.md) - Supabase 사용 패턴
- [ADMIN_UI_PATTERNS.md](docs/ADMIN_UI_PATTERNS.md) - Admin Dashboard UI 레시피

---

**Last Updated**: 2025-01-12
