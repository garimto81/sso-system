# Task List: PRD-0001 - SSO 중앙 인증 서버 구축

**PRD**: [0001-prd-supabase-init.md](./prds/0001-prd-supabase-init.md)
**상태**: 🚀 구현 진행 중 (Sub-Tasks 활성화)
**예상 공수**: 2-3일
**시작일**: 2025-01-12

---

## 📋 Parent Tasks (개요)

### Task 0.0: Feature Branch 생성 ✨
- [x] `feature/sso-supabase-init` 브랜치 생성
- [x] 브랜치 전환 확인

**예상 시간**: 5분
**상태**: ✅ 완료

---

### Task 1.0: Supabase 로컬 환경 구축 🚀
- [ ] Docker Desktop 실행 확인
- [ ] `supabase start` 실행
- [ ] 로컬 Supabase 서버 접속 확인 (http://localhost:54323)
- [ ] API URL, Anon Key, Service Role Key 확보
- [ ] `.env` 파일 생성 및 키 입력

**예상 시간**: 30분
**의존성**: 없음

---

### Task 2.0: 데이터베이스 마이그레이션 작성 📊
- [ ] `20250112000001_initial_schema.sql` 작성
  - `profiles` 테이블
  - `apps` 테이블
  - 인덱스 및 제약조건
  - `updated_at` 트리거
- [ ] `20250112000002_auth_codes_table.sql` 작성
  - `auth_codes` 테이블 (Token Exchange용)
  - 만료 인덱스
- [ ] `20250112000003_rls_policies.sql` 작성
  - `profiles` RLS 정책
  - `apps` RLS 정책
  - `auth_codes` RLS 정책

**예상 시간**: 2시간
**의존성**: Task 1.0 완료

---

### Task 3.0: 마이그레이션 실행 및 검증 ✅
- [ ] `supabase db reset` 실행
- [ ] 마이그레이션 자동 적용 확인
- [ ] Supabase Studio에서 테이블 구조 확인
- [ ] RLS 정책 활성화 확인

**예상 시간**: 30분
**의존성**: Task 2.0 완료

---

### Task 4.0: 테스트 데이터 Seed 작성 🌱
- [ ] `supabase/seed.sql` 작성
  - Admin 계정 생성 (admin@sso.local)
  - 테스트 앱 2개 등록
    - VTC_Logger (localhost:3001)
    - contents-factory (localhost:3002)
  - API Key/Secret 생성

**예상 시간**: 1시간
**의존성**: Task 3.0 완료

---

### Task 5.0: config.toml 설정 업데이트 ⚙️
- [ ] JWT 만료 시간 확인 (기본 1시간)
- [ ] 비밀번호 최소 길이 8자로 변경
- [ ] Google OAuth 설정 추가 (Placeholder)
- [ ] CORS 설정 확인

**예상 시간**: 30분
**의존성**: Task 1.0 완료

---

### Task 6.0: SSO API 서버 초기 설정 (Backend) 🔧
- [ ] Node.js/TypeScript 프로젝트 초기화 (`server/` 폴더)
- [ ] 필요 패키지 설치
  - `express`, `@supabase/supabase-js`
  - `dotenv`, `cors`, `crypto`
- [ ] 기본 서버 구조 생성
  - `server/src/index.ts` (Entry point)
  - `server/src/routes/` (API 라우트)
  - `server/src/middleware/` (인증 미들웨어)

**예상 시간**: 1시간
**의존성**: Task 1.0 완료

---

### Task 7.0: Authorization Endpoint 구현 🔐
- [ ] `GET /api/v1/authorize` 라우트 생성
- [ ] Query 파라미터 검증
  - `app_id`, `redirect_uri`, `state`
- [ ] 앱 등록 확인 (DB 조회)
- [ ] 리다이렉트 URL 화이트리스트 검증
- [ ] 로그인 상태 확인
  - 로그인 안됨 → `/login` 리디렉션
  - 로그인됨 → 일회용 코드 생성
- [ ] `auth_codes` 테이블에 코드 저장 (5분 만료)
- [ ] 앱 `redirect_uri`로 리디렉션 (code 전달)

**예상 시간**: 2시간
**의존성**: Task 6.0 완료

---

### Task 8.0: Token Exchange Endpoint 구현 🔄
- [ ] `POST /api/v1/token/exchange` 라우트 생성
- [ ] Request Body 검증
  - `code`, `app_id`, `app_secret`
- [ ] 앱 검증 (API Secret 확인)
- [ ] 코드 검증 및 만료 확인
- [ ] 코드 삭제 (일회용!)
- [ ] JWT 발급 (Supabase Admin API)
- [ ] Response 반환
  - `access_token`, `expires_in`, `user`

**예상 시간**: 2시간
**의존성**: Task 6.0 완료

---

### Task 9.0: 통합 테스트 🧪
- [ ] Email/Password 회원가입 테스트
- [ ] 로그인 후 JWT 발급 확인
- [ ] `profiles` 자동 생성 확인
- [ ] Authorization Flow 테스트
  - `/api/v1/authorize` 호출
  - 코드 발급 확인
- [ ] Token Exchange 테스트
  - `/api/v1/token/exchange` 호출
  - JWT 발급 확인
- [ ] RLS 정책 테스트
  - 본인 프로필 읽기 (성공)
  - 타인 프로필 읽기 (실패)
  - Admin 계정으로 전체 조회 (성공)

**예상 시간**: 2시간
**의존성**: Task 7.0, 8.0 완료

---

### Task 10.0: 문서화 📚
- [ ] 마이그레이션 SQL 주석 작성
- [ ] API Endpoint 문서 작성
  - `docs/api-reference.md`
- [ ] 환경변수 가이드 작성
  - `.env.example` 업데이트
- [ ] README 업데이트
  - 로컬 개발 시작 가이드
  - 테스트 방법

**예상 시간**: 1시간
**의존성**: Task 9.0 완료

---

### Task 11.0: Git Commit & Push 🚀
- [ ] 변경사항 스테이징
- [ ] 커밋 메시지 작성
  - `feat: Add SSO central auth server (v0.1.0) [PRD-0001]`
- [ ] Feature 브랜치 푸시
- [ ] (선택) Pull Request 생성

**예상 시간**: 30분
**의존성**: Task 10.0 완료

---

## 📊 진행 상황

**Total Tasks**: 11개 (Task 0.0 ~ 11.0)
**Completed**: 0개
**In Progress**: 0개
**Pending**: 11개

**진행률**: 0% ░░░░░░░░░░

---

## 🎯 다음 단계

**"Go"** 입력 시:
1. 각 Parent Task를 Sub-Tasks로 상세 분해
2. 체크박스 형식으로 변경 (`[ ]`, `[x]`)
3. 구현 세부사항 추가
4. 즉시 Task 0.0부터 시작

**예시 Sub-Task 형식** (Go 입력 후):
```markdown
### Task 2.0: 데이터베이스 마이그레이션 작성
- [ ] 2.1: `20250112000001_initial_schema.sql` 파일 생성
- [ ] 2.2: `profiles` 테이블 DDL 작성
  - id, email, display_name, avatar_url, role
  - created_at, updated_at
- [ ] 2.3: `apps` 테이블 DDL 작성
  - id, name, api_key, api_secret, redirect_urls
  - auth_method, allowed_origins
...
```

---

**현재 상태**: ⏸️ Parent Tasks 확인 대기 중

승인하시면 상세 Sub-Tasks를 생성하고 즉시 구현을 시작합니다!
