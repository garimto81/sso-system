# PRD-0001: SSO 중앙 인증 서버 - Supabase 기반 설계

**작성일**: 2025-01-12
**최종 수정**: 2025-01-12
**상태**: Draft v2.0
**작성자**: Development Team
**우선순위**: P0 (Critical)
**예상 공수**: 2-3일

---

## 📌 요약 (Executive Summary)

**진짜 SSO(Single Sign-On) 시스템**을 구축합니다. 하나의 중앙 인증 서버에서 로그인하면, 모든 연동 앱(VTC_Logger, contents-factory 등)에서 **자동으로 로그인 상태**가 됩니다.

### 핵심 차별점
- ✅ **Google OAuth 설정은 SSO 서버 하나만** (앱마다 설정 불필요)
- ✅ **리디렉션 URL 추가 작업 없음** (앱 등록만 DB에 추가)
- ✅ **3가지 사용자 경험 모두 지원** (투명한 인증 / 자동 로그인 / 명시적 SSO)
- ✅ **도메인 제약 없음** (같은 도메인, 다른 도메인 모두 지원)

---

## 🎯 목표 (Objectives)

### 주요 목표
1. ✅ **SSO 중앙 인증 서버 구축** (Supabase 기반)
2. ✅ **Token Exchange 메커니즘 구현** (도메인 제약 없이 JWT 공유)
3. ✅ **3가지 사용자 경험(UX) 지원**
   - Experience A: 투명한 인증 (Shared Cookie)
   - Experience B: 자동 로그인 (Token Exchange)
   - Experience C: SSO 게이트웨이 (명시적 인증)
4. ✅ **하이브리드 도메인 전략** (로컬/프로덕션 자동 전환)
5. ✅ **OAuth는 SSO 서버에만 설정** (앱 추가 시 Google Console 불필요)

### 비즈니스 가치
- **개발자 경험 개선**: 앱 추가 시 OAuth 재설정 불필요 (DB 등록만)
- **사용자 경험 개선**: 한 번 로그인 → 모든 앱 자동 접근
- **보안 강화**: 중앙화된 인증 + Supabase RLS
- **확장성**: 무제한 앱 추가 (도메인 제약 없음)

---

## 📊 범위 (Scope)

### ✅ In Scope (이번 PRD에 포함)

#### 1. Supabase 환경 설정
- 로컬 Supabase 서버 시작 (`supabase start`)
- `config.toml` 설정 검토 및 필요 시 수정
- 환경변수 `.env` 파일 생성

#### 2. 데이터베이스 스키마
**테이블 설계**:

##### 2.1 `profiles` 테이블
```sql
-- Supabase Auth의 users를 확장하는 프로필 정보
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'app_owner', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**용도**:
- 사용자의 추가 정보 저장 (이름, 아바타, 역할)
- `auth.users`와 1:1 관계

##### 2.2 `apps` 테이블 (SSO 핵심!)
```sql
-- SSO에 등록된 앱 목록
CREATE TABLE apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  redirect_urls TEXT[] NOT NULL, -- 허용된 리다이렉트 URL 목록
  api_key TEXT NOT NULL UNIQUE, -- SDK에서 사용할 API 키
  api_secret TEXT NOT NULL,     -- Token exchange용 secret (해시 저장)
  owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  auth_method TEXT NOT NULL DEFAULT 'token_exchange'
    CHECK (auth_method IN ('shared_cookie', 'token_exchange', 'hybrid')),
  allowed_origins TEXT[], -- CORS 허용 도메인
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**용도** (SSO 핵심 기능):
- VTC_Logger, contents-factory 등 등록
- **`api_key` + `api_secret`**: Token exchange 시 앱 검증
- **`redirect_urls`**: 콜백 URL 화이트리스트 (보안)
- **`auth_method`**: 앱별 인증 방식 (shared_cookie/token_exchange/hybrid)
- **`allowed_origins`**: CORS 정책

##### 2.3 `auth_codes` 테이블 (Token Exchange용)
```sql
-- 일회용 인증 코드 (Token Exchange에서 사용)
CREATE TABLE auth_codes (
  code TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id UUID NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 만료된 코드 자동 삭제 인덱스
CREATE INDEX idx_auth_codes_expires ON auth_codes(expires_at);
```

**용도**:
- OAuth 2.0 Authorization Code Flow 구현
- 앱이 코드 → JWT 교환 시 사용
- 5분 후 자동 만료 (보안)

#### 3. RLS (Row Level Security) 정책

##### 3.1 `profiles` 테이블
```sql
-- 본인 프로필은 읽기 가능
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- 본인 프로필은 수정 가능
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admin은 모든 프로필 읽기 가능
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

##### 3.2 `apps` 테이블
```sql
-- 모든 사용자는 활성화된 앱 목록 조회 가능
CREATE POLICY "Anyone can view active apps" ON apps
  FOR SELECT USING (is_active = true);

-- App owner는 자신의 앱 수정 가능
CREATE POLICY "Owners can update own apps" ON apps
  FOR UPDATE USING (auth.uid() = owner_id);

-- Admin은 모든 앱 관리 가능
CREATE POLICY "Admins can manage all apps" ON apps
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

##### 3.3 `auth_codes` 테이블
```sql
-- auth_codes는 Service Role에서만 접근 (앱이 아닌 SSO 서버만)
-- RLS 비활성화 (API에서 직접 제어)
ALTER TABLE auth_codes ENABLE ROW LEVEL SECURITY;

-- 정책 없음 → Service Role만 접근 가능
```

#### 4. 인증 방식

##### 4.1 Email/Password (기본)
- Supabase Auth 기본 제공
- `config.toml`에서 이미 활성화됨:
  ```toml
  [auth.email]
  enable_signup = true
  enable_confirmations = false  # 로컬 개발용
  ```

##### 4.2 Google OAuth (SSO 서버에만 설정!)
**핵심**: Google Console에서 리디렉션 URL은 **SSO 서버 하나만** 등록!

`config.toml` 설정:
```toml
[auth]
site_url = "http://127.0.0.1:3000"  # 로컬: SSO 서버
# 프로덕션: https://sso.yourdomain.com

[auth.external.google]
enabled = true
client_id = "env(GOOGLE_OAUTH_CLIENT_ID)"
secret = "env(GOOGLE_OAUTH_SECRET)"
redirect_uri = "http://127.0.0.1:3000/auth/callback"
# 프로덕션: https://sso.yourdomain.com/auth/callback
```

**Google Console 설정** (한 번만!):
```
Authorized redirect URIs:
- http://localhost:3000/auth/callback (개발)
- https://sso.yourdomain.com/auth/callback (프로덕션)

❌ VTC_Logger, contents-factory URL은 추가 안 함!
```

#### 5. SSO API Endpoints

##### 5.1 Authorization Endpoint
```
GET /api/v1/authorize
Query Parameters:
  - app_id: string (필수)
  - redirect_uri: string (필수)
  - state: string (CSRF 방지)

Flow:
1. 앱 → SSO 서버 (/api/v1/authorize)
2. 로그인 안됨 → /login 페이지
3. 로그인 후 → 일회용 코드 발급
4. 앱 redirect_uri로 리디렉션 (code 전달)
```

##### 5.2 Token Exchange Endpoint
```
POST /api/v1/token/exchange
Body:
  - code: string (일회용 코드)
  - app_id: string
  - app_secret: string

Response:
  - access_token: JWT
  - expires_in: 3600
  - user: { id, email, ... }
```

#### 6. 마이그레이션 파일 생성
- `supabase/migrations/20250112000001_initial_schema.sql`
- `supabase/migrations/20250112000002_add_rls_policies.sql`
- `supabase/migrations/20250112000003_add_auth_codes_table.sql`

### ❌ Out of Scope (이번 PRD에 포함 안함)

- ❌ 복잡한 권한 시스템 (RBAC, permissions 테이블 등)
- ❌ 감사 로그(audit logs) 테이블
- ❌ GitHub, Facebook OAuth (필요 시 나중에 추가)
- ❌ Multi-Factor Authentication (MFA)
- ❌ **SDK 개발 (별도 PRD-0002)**
- ❌ **로그인 UI 개발 (별도 PRD-0003)**
- ❌ 프로덕션 Supabase 프로젝트 생성 (로컬만)

---

## 🏗️ 아키텍처

### 전체 시스템 아키텍처
```
┌──────────────────────────────────────────────────────┐
│          SSO Central Server                          │
│          (sso.yourdomain.com 또는 localhost:3000)     │
│                                                       │
│  ┌─────────────────┐     ┌──────────────────────┐  │
│  │  Login UI       │     │  SSO API             │  │
│  │  /login         │     │  /api/v1/authorize   │  │
│  │  /auth/callback │     │  /api/v1/token/ex... │  │
│  └─────────────────┘     └──────────────────────┘  │
│            ↓                       ↓                 │
│  ┌──────────────────────────────────────────────┐  │
│  │        Supabase (Auth + DB)                  │  │
│  │  - auth.users (사용자)                        │  │
│  │  - profiles (역할, 프로필)                    │  │
│  │  - apps (등록 앱)                             │  │
│  │  - auth_codes (일회용 코드)                   │  │
│  └──────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
                    ↓ JWT / Cookie
       ┌────────────┼────────────┐
       ↓            ↓            ↓
┌─────────────┐ ┌──────────┐ ┌───────────┐
│ VTC_Logger  │ │ contents │ │   AppN    │
│ (SDK 통합)  │ │ -factory │ │ (SDK 통합)│
│localhost:   │ │localhost:│ │ ...       │
│3001         │ │3002      │ │           │
└─────────────┘ └──────────┘ └───────────┘
```

### 데이터베이스 ERD
```
┌─────────────────┐
│  auth.users     │  (Supabase 자동 생성)
│  - id (PK)      │
│  - email        │
│  - encrypted_pw │
└────────┬────────┘
         │ 1:1
         ▼
┌─────────────────┐         ┌─────────────────────┐
│  profiles       │         │    apps             │
│  - id (FK)      │◄────────┤  - id (PK)          │
│  - display_name │  owner  │  - name             │
│  - role         │         │  - api_key          │
│  - avatar_url   │         │  - api_secret       │
└─────────────────┘         │  - redirect_urls[]  │
                            │  - auth_method      │
                            └──────┬──────────────┘
                                   │ 1:N
                                   ▼
                            ┌─────────────────────┐
                            │  auth_codes         │
                            │  - code (PK)        │
                            │  - user_id (FK)     │
                            │  - app_id (FK)      │
                            │  - expires_at       │
                            └─────────────────────┘
```

### SSO 인증 플로우 (Token Exchange)

#### 시나리오: VTC_Logger에 로그인
```
1. 사용자 → http://localhost:3001 (VTC_Logger)
2. 로그인 필요 감지 (SDK)
3. 리디렉션 → http://localhost:3000/api/v1/authorize?
                app_id=vtc-logger&
                redirect_uri=http://localhost:3001/auth/callback&
                state=csrf-token

4. SSO 서버: 로그인 상태 확인
   - 로그인 안됨 → /login 페이지 표시
   - 로그인됨 → 스킵 (자동)

5. 로그인 후:
   - 일회용 코드 생성 (예: abc123)
   - auth_codes 테이블에 저장 (5분 만료)
   - 리디렉션 → http://localhost:3001/auth/callback?code=abc123&state=csrf-token

6. VTC_Logger 백엔드 (/auth/callback):
   POST http://localhost:3000/api/v1/token/exchange
   Body: { code: "abc123", app_id: "vtc-logger", app_secret: "xxx" }

7. SSO 서버:
   - 코드 검증 (auth_codes 테이블)
   - 코드 삭제 (일회용!)
   - JWT 발급
   Response: { access_token: "eyJ...", expires_in: 3600 }

8. VTC_Logger:
   - JWT 검증
   - 자체 세션 생성
   - /dashboard로 리디렉션

✅ 사용자 로그인 완료!
```

#### 두 번째 앱 접속 (contents-factory)
```
1. 사용자 → http://localhost:3002 (contents-factory)
2. SDK가 SSO로 리디렉션
3. SSO: 이미 로그인 상태 → 즉시 코드 발급 (1초 이내!)
4. contents-factory로 복귀 → 자동 로그인

✅ SSO 덕분에 재로그인 불필요!
```

---

## 🔧 기술 스택

| 항목 | 기술 | 버전/설정 |
|------|------|----------|
| **인증** | Supabase Auth | 로컬 개발 |
| **데이터베이스** | PostgreSQL | 17 |
| **개발 환경** | Docker Desktop | 최신 |
| **CLI** | Supabase CLI | npm install -g |
| **언어** | SQL | - |
| **보안** | RLS | 필수 적용 |

---

## 🔐 보안 요구사항

### 필수 보안 정책
1. ✅ **RLS 활성화**: 모든 테이블에 RLS 정책 적용
2. ✅ **환경변수 관리**: `.env` 파일로 키 관리, `.gitignore`에 추가
3. ✅ **JWT 만료**: 1시간 (기본값, `config.toml`에서 설정됨)
4. ✅ **비밀번호 정책**: 최소 6자 → 8자로 변경 권장
5. ✅ **HTTPS**: 프로덕션에서는 필수 (로컬은 HTTP 허용)

### 변경할 보안 설정
```toml
# config.toml
[auth]
minimum_password_length = 8  # 6 → 8로 변경
```

---

## 📋 상세 작업 목록 (Tasks)

### Task 1: Supabase 로컬 환경 시작
- [ ] Docker Desktop 실행 확인
- [ ] `supabase start` 실행
- [ ] 출력된 API URL, Anon Key, Service Role Key 저장

### Task 2: 환경변수 설정
- [ ] `.env` 파일 생성 (`cp .env.example .env`)
- [ ] Supabase 로컬 키 입력
- [ ] Google OAuth 키 placeholder 추가 (실제 키는 나중)

### Task 3: 마이그레이션 파일 작성
- [ ] `20250112000001_initial_schema.sql` 생성
  - `profiles` 테이블
  - `apps` 테이블
  - 인덱스 (email, api_key)
  - 트리거 (updated_at 자동 업데이트)
- [ ] `20250112000002_add_rls_policies.sql` 생성
  - RLS 활성화
  - 모든 정책 추가

### Task 4: 마이그레이션 실행
- [ ] `supabase db reset` (초기화)
- [ ] 마이그레이션 자동 실행 확인
- [ ] Supabase Studio에서 테이블 확인 (http://localhost:54323)

### Task 5: 테스트 데이터 생성
- [ ] `supabase/seed.sql` 작성
  - 관리자 계정 (admin@sso.local)
  - 테스트 앱 2개 (VTC_Logger, contents-factory)

### Task 6: 기능 테스트
- [ ] Email/Password 회원가입 테스트
- [ ] 로그인 후 JWT 발급 확인
- [ ] `profiles` 자동 생성 확인
- [ ] RLS 정책 동작 테스트 (다른 사용자 프로필 접근 차단)

### Task 7: 문서화
- [ ] 마이그레이션 설명 주석 추가
- [ ] RLS 정책 설명 추가
- [ ] `docs/database-schema.md` 작성

---

## ✅ 성공 기준 (Definition of Done)

### 기능적 성공 기준
1. ✅ `supabase start` 명령어 실행 성공
2. ✅ Supabase Studio 접속 가능 (http://localhost:54323)
3. ✅ `profiles`, `apps` 테이블 생성 확인
4. ✅ RLS 정책 활성화 확인
5. ✅ Email 회원가입/로그인 성공
6. ✅ 본인 프로필 읽기/수정 가능
7. ✅ 다른 사용자 프로필 접근 차단 (403 Forbidden)
8. ✅ Admin 계정으로 모든 프로필 조회 가능

### 기술적 성공 기준
1. ✅ 모든 마이그레이션 파일 Git 커밋
2. ✅ `.env` 파일 `.gitignore`에 포함
3. ✅ `seed.sql`에 테스트 데이터 포함
4. ✅ 스키마 문서화 완료

---

## 🚨 리스크 및 완화 전략

### 리스크 1: Supabase CLI 설치 실패
**완화**:
- npm 전역 설치 시도
- 실패 시 `npx supabase` 사용
- Scoop 패키지 매니저 사용 (Windows)

### 리스크 2: Docker Desktop 포트 충돌
**완화**:
- 기본 포트(54321-54327) 사용 중인지 확인
- `config.toml`에서 포트 변경 가능
- `supabase stop` 후 재시작

### 리스크 3: RLS 정책 잘못 설정 시 접근 불가
**완화**:
- Service Role Key로는 RLS 우회 가능 (관리 목적)
- 로컬 환경이므로 언제든 `db reset` 가능
- 정책 테스트 코드 작성

### 리스크 4: Google OAuth 키 발급 지연
**완화**:
- Email/Password 먼저 완성
- OAuth는 선택적 기능으로 나중 추가 가능

---

## 📚 참고 자료

### 공식 문서
- [Supabase Local Development](https://supabase.com/docs/guides/local-development)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Database Migrations](https://supabase.com/docs/guides/cli/local-development#database-migrations)

### 내부 문서
- [SETUP.md](../../SETUP.md) - 초기 설정 가이드
- [INSTALL_SUPABASE.md](../../INSTALL_SUPABASE.md) - Supabase CLI 설치

---

## 📊 예상 일정

| Phase | 작업 | 예상 시간 |
|-------|------|----------|
| **Setup** | Supabase 로컬 시작 | 30분 |
| **Schema** | 마이그레이션 작성 | 2시간 |
| **RLS** | 정책 작성 및 테스트 | 2시간 |
| **Testing** | 통합 테스트 | 1시간 |
| **Docs** | 문서화 | 1시간 |
| **Total** | | **6.5시간 (약 1일)** |

---

## 🔄 다음 단계 (Next Steps)

이 PRD 완료 후:
1. **PRD-0002**: SDK 개발 (다른 앱에서 SSO 통합)
2. **PRD-0003**: Admin Dashboard (앱 등록 UI)
3. **PRD-0004**: VTC_Logger 통합 (첫 번째 클라이언트 앱)

---

## 📝 변경 이력

| 날짜 | 변경 내용 | 작성자 |
|------|----------|--------|
| 2025-01-12 | 초안 작성 | Development Team |

---

## ✍️ 승인

- [ ] Product Owner: _________________
- [ ] Tech Lead: _________________
- [ ] Security Review: _________________

---

**상태**: ⏳ 승인 대기 중

> 이 PRD는 STANDARD 가이드를 따라 작성되었습니다.
> 질문이나 피드백은 이슈 트래커에 등록해주세요.
