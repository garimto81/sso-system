# PRD-0003: SSO Admin Dashboard & Management System

**작성일**: 2025-01-12
**작성자**: System Architect
**상태**: Draft → Review
**우선순위**: High
**예상 기간**: 3-4주
**타겟 버전**: v1.1.0

---

## 📋 Executive Summary

### 문제 정의

현재 SSO System에 새로운 애플리케이션을 등록하려면:
1. 데이터베이스에 직접 SQL 실행
2. API Key/Secret 수동 생성
3. 개발자에게 Credentials 전달
4. 앱 상태 모니터링을 위해 SQL 쿼리 작성

이 프로세스는:
- ❌ 비효율적 (앱 등록에 5-10분 소요)
- ❌ 오류 발생 위험 높음 (수동 입력)
- ❌ 확장성 부족 (앱이 많아질수록 관리 어려움)
- ❌ 가시성 부족 (사용 현황 파악 어려움)

### 솔루션

**SSO Admin Dashboard**: 웹 기반 관리 UI로 No-Code 앱 등록 및 관리

**핵심 가치 제안**:
- ✅ 앱 등록 시간 **5분 → 30초** (90% 단축)
- ✅ API Key 자동 생성 및 안전한 표시
- ✅ 실시간 사용 현황 모니터링
- ✅ Self-service 개발자 포털 (선택적)

### 성공 지표

| 지표 | 현재 | 목표 (3개월) |
|------|------|--------------|
| 앱 등록 시간 | 5분 | 30초 |
| 등록 오류율 | ~10% | <1% |
| 관리자 만족도 | N/A | 4.5/5 |
| 등록된 앱 수 | 1 | 10+ |

---

## 🎯 Goals & Non-Goals

### Goals

1. **관리자 생산성 향상**
   - Web UI로 CRUD 작업 수행
   - API Key/Secret 안전 관리
   - 앱 활성화/비활성화 원클릭

2. **가시성 확보**
   - 앱별 사용 통계 대시보드
   - 로그인 트렌드 차트
   - 에러율 모니터링

3. **보안 강화**
   - API Secret은 생성 시 1회만 표시
   - Role-based Access Control (Admin only)
   - Audit log 기록

4. **개발자 경험 개선**
   - 직관적인 UI/UX
   - Integration code snippet 제공
   - 실시간 검증 (URL 형식 등)

### Non-Goals (v1.1.0 범위 외)

- ❌ Self-service 개발자 포털 (v1.2.0으로 연기)
- ❌ Approval workflow (v1.2.0)
- ❌ Multi-tenancy/Organizations (v2.0.0)
- ❌ Webhook 설정 (v1.3.0)
- ❌ Advanced analytics (ML 기반 이상 탐지 등)

---

## 👥 User Personas

### Persona 1: SSO System Admin (Primary)

**배경**:
- 이름: 김관리 (30대, DevOps Engineer)
- 역할: SSO 시스템 관리 책임자
- 기술 수준: 높음 (SQL, APIs 능숙)

**Pain Points**:
- SQL로 앱 등록하는 것이 번거로움
- Credentials를 안전하게 전달하기 어려움
- 앱 사용 현황을 파악하려면 복잡한 쿼리 필요

**Goals**:
- 빠르고 정확하게 앱 등록
- 앱 상태 실시간 모니터링
- 문제 발생 시 빠른 대응

**User Journey**:
1. 새 앱 등록 요청 받음 (이메일/Slack)
2. Admin Dashboard 로그인
3. "New App" 버튼 클릭
4. 폼 입력 (2분 이내)
5. API Key/Secret 복사하여 개발자에게 전달
6. 대시보드에서 앱 상태 확인

### Persona 2: App Developer (Secondary, v1.1.0 간접 수혜)

**배경**:
- 이름: 박개발 (20대, Full-stack Developer)
- 역할: OJT Platform 개발자
- 기술 수준: 중급

**Pain Points**:
- SSO 연동 설정 복잡함
- API Key 받기까지 시간 소요
- 연동 후 디버깅 어려움

**Goals**:
- 빠르게 SSO SDK 통합
- 명확한 문서와 예제 코드
- 연동 상태 확인 가능

**User Journey** (Admin과 협업):
1. SSO 연동 필요 → 관리자에게 요청
2. 관리자가 앱 등록 (Dashboard)
3. API Key/Secret 수신
4. SDK 설치 및 설정
5. 테스트 로그인 시도
6. (미래) Dashboard에서 내 앱 상태 확인

---

## 🏗️ Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────┐
│                 Browser (Admin User)                │
└───────────────────────┬─────────────────────────────┘
                        │ HTTPS
                        ▼
┌─────────────────────────────────────────────────────┐
│         Admin Dashboard (Next.js 14 Frontend)       │
│  ┌──────────────┬──────────────┬─────────────────┐  │
│  │ Apps List    │ App Detail   │ Analytics       │  │
│  │ Page         │ Page         │ Dashboard       │  │
│  └──────────────┴──────────────┴─────────────────┘  │
└───────────────────────┬─────────────────────────────┘
                        │ REST API (JWT Auth)
                        ▼
┌─────────────────────────────────────────────────────┐
│      SSO Auth Server (Express.js Backend)           │
│  ┌─────────────────────────────────────────────┐    │
│  │  /api/v1/admin/apps                         │    │
│  │    - GET    /          (List apps)          │    │
│  │    - POST   /          (Create app)         │    │
│  │    - GET    /:id       (Get details)        │    │
│  │    - PUT    /:id       (Update)             │    │
│  │    - DELETE /:id       (Deactivate)         │    │
│  │    - POST   /:id/regenerate-secret          │    │
│  │    - GET    /:id/analytics                  │    │
│  └─────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────┐    │
│  │  Middleware: authenticateAdmin()            │    │
│  │  - JWT validation                           │    │
│  │  - Role check (admin only)                  │    │
│  └─────────────────────────────────────────────┘    │
└───────────────────────┬─────────────────────────────┘
                        │ Supabase Client
                        ▼
┌─────────────────────────────────────────────────────┐
│           Supabase (PostgreSQL + Auth)              │
│  ┌──────────────┬──────────────┬─────────────────┐  │
│  │ apps         │ profiles     │ app_analytics   │  │
│  │ auth_codes   │ auth.users   │ (views)         │  │
│  └──────────────┴──────────────┴─────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Tech Stack

**Frontend** (Admin Dashboard):
- Framework: Next.js 14 (App Router)
- Language: TypeScript 5.x
- UI Components: Shadcn UI (Radix + Tailwind)
- Forms: React Hook Form + Zod validation
- Tables: Tanstack Table v8
- Charts: Recharts
- State: Tanstack Query (React Query)
- Auth: Supabase Auth (JWT)

**Backend** (Existing SSO Server):
- Runtime: Node.js 18+
- Framework: Express.js 4.x
- Database: Supabase (PostgreSQL)
- Auth: JWT validation middleware

**Deployment**:
- Frontend: Vercel (same domain as main SSO server)
- Backend: Already deployed at https://sso-system-ruby.vercel.app

---

## ⚡ Agent Execution Strategy

### Phase별 최대 병렬 실행 계획

#### Phase 0: 기술 검증 (2개 병렬)
```bash
# 동시 실행
context7-engineer + ui-ux-designer

# context7-engineer: Next.js 14, shadcn/ui, React Query v5 최신 문서 검증
# ui-ux-designer: 디자인 시스템 검증, Tailwind v4 접근성 가이드
```

**소요 시간**: ~15분 (순차 대비 50% 단축)

---

#### Phase 1: 구현 (6개 병렬!) ⚡

**1단계: 프로젝트 초기화** (순차 필수)
```bash
frontend-developer
# Next.js 14 프로젝트 생성, shadcn/ui 설치, 폴더 구조 생성
```

**2단계: 병렬 개발** (최대 6개 동시)
```bash
# 🔥 최대 병렬 실행
frontend-developer       # 화면 컴포넌트 개발
+ typescript-expert      # API 타입 정의, Form 스키마
+ ui-ux-designer         # 디자인 토큰, 반응형 레이아웃
+ backend-architect      # React Query 설정, API 클라이언트
+ performance-engineer   # next.config.js 최적화, 번들 분석
+ database-architect     # 클라이언트 사이드 캐싱 전략
```

**파일 분리 (충돌 방지)**:
| Agent | 작업 파일 |
|-------|----------|
| frontend-developer | `app/**/*.tsx` (UI 컴포넌트) |
| typescript-expert | `types/**/*.ts`, `schemas/**/*.ts` |
| ui-ux-designer | `tailwind.config.ts`, `app/globals.css` |
| backend-architect | `lib/api/**/*.ts`, `hooks/**/*.ts` |
| performance-engineer | `next.config.js`, `public/` 최적화 |
| database-architect | `lib/cache/**/*.ts` |

**소요 시간**: ~30분 (순차 180분 → 83% 단축)

---

#### Phase 2: 테스트 (5개 병렬!) ⚡

```bash
# 독립적 테스트 작성
playwright-engineer      # E2E 테스트 (tests/e2e/)
+ test-automator         # 단위 테스트 (components/**/__tests__/)
+ security-auditor       # 보안 테스트 (XSS, CSRF 체크)
+ typescript-expert      # 타입 테스트 (타입 안전성 검증)
+ performance-engineer   # 성능 테스트 (Lighthouse CI)
```

**테스트 범위**:
- `playwright-engineer`: Login → Create App → Edit → Delete 플로우
- `test-automator`: 모든 컴포넌트 + hooks 단위 테스트
- `security-auditor`: JWT 저장소, CSP 헤더, Input sanitization
- `typescript-expert`: 타입 커버리지 >90%, strict mode
- `performance-engineer`: Core Web Vitals, 번들 사이즈 분석

**소요 시간**: ~30분 (순차 150분 → 80% 단축)

---

#### Phase 5: 최종 검증 (4개 병렬)

```bash
# 동시 검증
playwright-engineer      # 전체 E2E 플로우 실행 (필수!)
+ security-auditor       # 프로덕션 보안 스캔 (OWASP Top 10)
+ performance-engineer   # Core Web Vitals 측정 (>90점)
+ code-reviewer          # 코드 품질 리뷰 (아키텍처 일관성)
```

**검증 기준**:
- Playwright: 모든 E2E 테스트 통과 (0 failures)
- Security: 치명적 취약점 0개, CSP 헤더 설정 확인
- Performance: Lighthouse 점수 >90 (Desktop), >85 (Mobile)
- Code Review: SOLID 원칙 준수, 중복 코드 <5%

**소요 시간**: ~30분 (순차 120분 → 75% 단축)

---

### 총 개발 시간 예측

| 구분 | 순차 실행 | 병렬 실행 | 단축율 |
|------|----------|----------|--------|
| Phase 0 | 30분 | 15분 | 50% |
| Phase 1 | 180분 | 30분 | 83% |
| Phase 2 | 150분 | 30분 | 80% |
| Phase 5 | 120분 | 30분 | 75% |
| **합계** | **480분 (8h)** | **105분 (1.75h)** | **78%** |

**결론**: 병렬 실행으로 **1일 작업 → 2시간**으로 단축 가능!

---

### 병렬 실행 예시 (Phase 1)

**명령**:
```
"다음 에이전트들을 병렬로 실행:

1. frontend-developer
   - Dashboard 페이지 구현 (app/admin/page.tsx)
   - Apps List 페이지 (app/admin/apps/page.tsx)
   - Create App 폼 (app/admin/apps/new/page.tsx)

2. typescript-expert
   - API 응답 타입 정의 (types/api.ts)
   - Form 스키마 (schemas/appForm.ts)
   - 공통 인터페이스 (types/common.ts)

3. ui-ux-designer
   - Tailwind 디자인 토큰 설정 (tailwind.config.ts)
   - 공통 CSS 변수 (app/globals.css)
   - 반응형 레이아웃 유틸리티 (lib/styles/)

4. backend-architect
   - React Query 설정 (lib/query-client.ts)
   - API 클라이언트 (lib/api/admin.ts)
   - Custom hooks (hooks/useApps.ts, hooks/useAnalytics.ts)

5. performance-engineer
   - Next.js 설정 최적화 (next.config.js)
   - 이미지 최적화 설정
   - 번들 분석 스크립트

6. database-architect
   - React Query 캐싱 전략 (lib/cache/strategies.ts)
   - Optimistic updates 로직
   - Stale-while-revalidate 설정"
```

**결과**: 6개 에이전트가 동시 작업 → 30분 내 완료

---

## 📐 Functional Requirements

### FR-1: App Management (CRUD)

#### FR-1.1: List Apps
**Actor**: Admin
**Precondition**: User logged in with admin role

**Flow**:
1. Navigate to `/admin/apps`
2. System displays table with columns:
   - App Name
   - Owner (email)
   - Status (Active/Inactive)
   - Created Date
   - Actions (Edit, View Analytics, Delete)
3. User can:
   - Search by name
   - Filter by status (All/Active/Inactive)
   - Sort by any column
   - Paginate (20 items/page default)

**Success Criteria**:
- ✅ Table loads within 2 seconds
- ✅ Search updates results in <500ms
- ✅ Pagination works correctly

**Mockup**:
```
┌────────────────────────────────────────────────────────┐
│  SSO Admin Dashboard            [Search...] [Filter▼]  │
├────┬───────────────┬───────────┬──────────┬────────────┤
│ ID │ Name          │ Owner     │ Status   │ Actions    │
├────┼───────────────┼───────────┼──────────┼────────────┤
│ 1  │ OJT Platform  │ admin@... │ ✅ Active│ [Edit][📊]│
│ 2  │ HR System     │ hr@...    │ 🔴 Inactive│ [Edit]  │
└────┴───────────────┴───────────┴──────────┴────────────┘
```

---

#### FR-1.2: Create New App
**Actor**: Admin
**Precondition**: User logged in with admin role

**Flow**:
1. Click "New App" button
2. Fill registration form:
   - **App Name*** (text, required, unique)
   - **Description** (textarea, optional, max 500 chars)
   - **Redirect URLs*** (textarea, one URL per line, required)
   - **Allowed Origins** (textarea, one URL per line, optional)
   - **Auth Method*** (radio: token_exchange/shared_cookie/hybrid)
   - **Owner Email*** (text, required, must exist in profiles)
3. Click "Create App"
4. System validates:
   - All required fields filled
   - URLs are valid format (http/https)
   - Owner exists
   - Name is unique
5. System generates:
   - UUID as `api_key`
   - 64-char hex as `api_secret`
6. System displays success modal with:
   - ✅ "App created successfully"
   - API Key (copyable)
   - API Secret (copyable, shown once)
   - Warning: "Save API Secret now - it won't be shown again"
7. User copies credentials
8. Redirects to app detail page

**Validation Rules**:
| Field | Rule |
|-------|------|
| App Name | 3-100 chars, alphanumeric + spaces/hyphens |
| Redirect URLs | Valid HTTP(S) URL, max 10 URLs |
| Owner Email | Valid email format, exists in DB |

**Error Handling**:
- Duplicate name → "App name already exists"
- Invalid URL → "Invalid URL format: {url}"
- Owner not found → "Owner email not found"

**Success Criteria**:
- ✅ Form validation works client-side (instant feedback)
- ✅ Server-side validation prevents invalid data
- ✅ API Secret shown exactly once
- ✅ Copy buttons work (clipboard API)

**Mockup**:
```
┌──────────────────────────────────────────┐
│  Create New Application                  │
├──────────────────────────────────────────┤
│  App Name *                              │
│  ┌────────────────────────────────────┐  │
│  │ OJT Platform                       │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Description                             │
│  ┌────────────────────────────────────┐  │
│  │ Employee training system           │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Redirect URLs * (one per line)          │
│  ┌────────────────────────────────────┐  │
│  │ http://localhost:3000/callback     │  │
│  │ https://ojt.example.com/callback   │  │
│  └────────────────────────────────────┘  │
│                                          │
│  Auth Method *                           │
│  ⦿ Token Exchange  ○ Shared Cookie      │
│                                          │
│  Owner Email *                           │
│  ┌────────────────────────────────────┐  │
│  │ admin@example.com                  │  │
│  └────────────────────────────────────┘  │
│                                          │
│         [Cancel]    [Create App]         │
└──────────────────────────────────────────┘

Success Modal:
┌──────────────────────────────────────────┐
│  ✅ App Created Successfully             │
├──────────────────────────────────────────┤
│  API Key:                                │
│  a3f2b8c1-1234-5678-90ab-cdef12345678    │
│  [📋 Copy]                               │
│                                          │
│  API Secret:                             │
│  a1b2c3d4e5f6...                         │
│  [📋 Copy]                               │
│                                          │
│  ⚠️ Save these credentials now!          │
│  API Secret won't be shown again.        │
│                                          │
│               [Got it]                   │
└──────────────────────────────────────────┘
```

---

#### FR-1.3: View/Edit App Details
**Actor**: Admin
**Precondition**: App exists

**Flow**:
1. Click app name or "Edit" button from list
2. System displays app detail page with sections:

   **Basic Info**:
   - App ID (read-only, copyable)
   - App Name (editable)
   - Description (editable)
   - Status toggle (Active/Inactive)
   - Created/Updated dates

   **Credentials**:
   - API Key (read-only, copyable)
   - API Secret (masked, "Show" button, copyable)
   - "Regenerate Secret" button (with confirmation)

   **URLs**:
   - Redirect URLs (editable textarea)
   - Allowed Origins (editable textarea)

   **Configuration**:
   - Auth Method (editable radio)

   **Usage Stats** (read-only):
   - Total logins (30 days)
   - Active users (30 days)
   - Token requests (30 days)
   - Error rate

3. User edits fields
4. Click "Save Changes"
5. System validates and updates
6. Show success toast

**Special Actions**:
- **Toggle Status**: Instant update, no confirmation
- **Regenerate Secret**:
  - Shows warning modal: "This will invalidate the current secret. Continue?"
  - Requires typing app name to confirm
  - Generates new secret and displays once
  - (Optional) Sends email to app owner

**Success Criteria**:
- ✅ Changes saved within 1 second
- ✅ API Secret regeneration requires confirmation
- ✅ Real-time stats refresh every 30 seconds

---

#### FR-1.4: Delete/Deactivate App
**Actor**: Admin
**Precondition**: App exists

**Flow**:
1. Click "Delete" button
2. System shows confirmation modal:
   - "Are you sure you want to deactivate {app_name}?"
   - "Users will no longer be able to authenticate"
   - Options: "Deactivate" or "Permanently Delete"
3. **Deactivate** (default):
   - Sets `is_active = false`
   - App still in DB, can be reactivated
4. **Permanently Delete**:
   - Requires typing app name
   - Deletes from DB (CASCADE deletes auth_codes)
   - Cannot be undone

**Success Criteria**:
- ✅ Deactivation is instant
- ✅ Permanent deletion requires strong confirmation
- ✅ Deleted apps disappear from list

---

### FR-2: Analytics Dashboard

#### FR-2.1: App-Level Analytics
**Actor**: Admin
**Precondition**: App exists

**Flow**:
1. Click "Analytics" icon from app list OR "View Analytics" from detail page
2. Navigate to `/admin/apps/:id/analytics`
3. System displays:

   **Time Range Selector**:
   - 7 days / 30 days / 90 days (tabs)

   **Key Metrics (Cards)**:
   ```
   ┌─────────────┬─────────────┬─────────────┬─────────────┐
   │ Total       │ Active      │ Token       │ Error       │
   │ Logins      │ Users       │ Requests    │ Rate        │
   │ 1,234       │ 456         │ 2,345       │ 0.2%        │
   │ +12% ↑     │ +5% ↑      │ +8% ↑      │ -0.1% ↓    │
   └─────────────┴─────────────┴─────────────┴─────────────┘
   ```

   **Login Trend Chart** (Line chart):
   - X-axis: Date
   - Y-axis: Number of logins
   - Hover tooltip: Date, count

   **Top Users Table**:
   | User | Email | Logins | Last Login |
   |------|-------|--------|------------|
   | User 1 | user1@... | 45 | 2h ago |

   **Error Log** (Last 50):
   | Time | Error Type | User | Details |
   |------|------------|------|---------|

**Success Criteria**:
- ✅ Charts load within 3 seconds
- ✅ Data updates when changing time range
- ✅ Charts are responsive (mobile-friendly)

---

#### FR-2.2: Global Dashboard
**Actor**: Admin
**Precondition**: N/A

**Flow**:
1. Navigate to `/admin` (dashboard home)
2. System displays overview:

   **Summary Cards**:
   - Total Apps
   - Total Users
   - Logins Today
   - Active Apps

   **Recent Activity Feed**:
   - New app registrations
   - Recent logins
   - Errors

   **Top Apps by Usage** (Bar chart):
   - X-axis: App name
   - Y-axis: Login count

**Success Criteria**:
- ✅ Dashboard loads within 2 seconds
- ✅ Auto-refreshes every 60 seconds

---

### FR-3: Authentication & Authorization

#### FR-3.1: Admin Login
**Actor**: Admin
**Precondition**: User has admin role in profiles table

**Flow**:
1. Navigate to `/admin/login`
2. Enter email/password (Supabase Auth)
3. System validates:
   - Credentials correct
   - User role is 'admin'
4. If valid:
   - Generate JWT session
   - Redirect to `/admin/apps`
5. If invalid role:
   - Show error: "Admin access required"
   - Log attempt (security audit)

**Session Management**:
- JWT expires after 24 hours
- Auto-refresh before expiration
- Logout clears session

**Success Criteria**:
- ✅ Non-admin users cannot access admin routes
- ✅ Session persists across page refreshes
- ✅ Failed admin access attempts are logged

---

#### FR-3.2: API Authentication
**Actor**: Admin Dashboard Frontend
**Precondition**: User logged in

**Flow**:
1. Frontend includes JWT in Authorization header:
   ```
   Authorization: Bearer {jwt_token}
   ```
2. Backend middleware validates:
   - Token format valid
   - Token not expired
   - User exists
   - User role is 'admin'
3. If valid: proceed to route handler
4. If invalid: return 401/403 error

**API Error Responses**:
```json
// 401 Unauthorized
{
  "error": "Invalid or expired token"
}

// 403 Forbidden
{
  "error": "Admin access required"
}
```

---

### FR-4: Integration Code Snippets

#### FR-4.1: Display Integration Code
**Actor**: Admin
**Precondition**: Viewing app detail page

**Flow**:
1. App detail page includes "Integration Guide" section
2. System displays code snippets for:

   **JavaScript/TypeScript**:
   ```typescript
   import { SSOClient } from '@garimto81/sso-sdk';

   const ssoClient = new SSOClient({
     ssoUrl: 'https://sso-system-ruby.vercel.app',
     appId: '{api_key}',
     redirectUri: '{first_redirect_url}',
     tokenExchangeUrl: '/api/auth/sso/token', // Backend proxy
   });

   // Login
   const authUrl = ssoClient.getAuthUrl();
   window.location.href = authUrl;
   ```

   **Environment Variables**:
   ```bash
   NEXT_PUBLIC_SSO_URL=https://sso-system-ruby.vercel.app
   NEXT_PUBLIC_SSO_APP_ID={api_key}
   SSO_APP_SECRET={masked_secret}
   ```

3. Code snippets are:
   - Syntax highlighted
   - Copyable (one-click)
   - Auto-filled with app's actual values

**Success Criteria**:
- ✅ Code snippets are accurate
- ✅ Copy button works
- ✅ Snippets update when app config changes

---

## 🎨 UI/UX Requirements

### UX-1: Design System

**Colors**:
- Primary: Blue (#3B82F6)
- Success: Green (#10B981)
- Warning: Yellow (#F59E0B)
- Danger: Red (#EF4444)
- Neutral: Gray scale

**Typography**:
- Font: Inter (Google Fonts)
- Headings: Bold, 24-32px
- Body: Regular, 14-16px
- Code: Fira Code (monospace)

**Components** (Shadcn UI):
- Button
- Input / Textarea
- Select / Radio Group
- Table / DataTable
- Dialog / AlertDialog
- Toast (notifications)
- Card
- Tabs
- Badge

**Layout**:
- Sidebar navigation (fixed left)
- Main content area (scrollable)
- Responsive: Mobile (1 column), Tablet (adaptive), Desktop (full)

---

### UX-2: Navigation Structure

```
/admin
├── /login                    # Admin login page
├── /                         # Dashboard home (overview)
├── /apps                     # Apps list
│   ├── /new                  # Create app form
│   └── /:id                  # App detail/edit
│       └── /analytics        # App analytics
├── /users (Future v1.2)      # User management
└── /settings (Future v1.2)   # Admin settings
```

**Sidebar Menu**:
```
┌──────────────────┐
│ SSO Admin        │
├──────────────────┤
│ 📊 Dashboard     │
│ 📱 Apps          │ ← Active
│ 👥 Users         │ (v1.2)
│ ⚙️ Settings      │ (v1.2)
├──────────────────┤
│ 🚪 Logout        │
└──────────────────┘
```

---

### UX-3: Loading & Error States

**Loading**:
- Skeleton loaders for tables/cards
- Spinner for buttons during submit
- Progress bar for long operations

**Empty States**:
```
┌──────────────────────────────┐
│                              │
│      📱                      │
│   No apps yet                │
│                              │
│   [Create Your First App]    │
│                              │
└──────────────────────────────┘
```

**Error States**:
- Inline validation errors (red text under inputs)
- Toast notifications for API errors
- Error boundaries for crash recovery

---

## 🔒 Non-Functional Requirements

### NFR-1: Performance

| Metric | Target | Critical |
|--------|--------|----------|
| Page Load Time | <2s | <5s |
| API Response Time | <500ms | <2s |
| Time to Interactive | <3s | <6s |
| Table Rendering (1000 rows) | <1s | <3s |

**Optimization Strategies**:
- Server-side pagination (20 items/page)
- Debounced search (300ms delay)
- React Query caching (5min stale time)
- Code splitting (lazy load pages)

---

### NFR-2: Security

**Authentication**:
- ✅ JWT-based session (Supabase Auth)
- ✅ Token expiration: 24 hours
- ✅ Auto-refresh before expiration
- ✅ HTTPS only (production)

**Authorization**:
- ✅ Role-based: Only 'admin' role can access
- ✅ Middleware validation on every request
- ✅ Frontend route guards (Next.js middleware)

**Data Protection**:
- ✅ API Secret shown only once at creation
- ✅ API Secret masked in UI (show on click)
- ✅ Regenerate Secret requires confirmation
- ✅ Audit log for sensitive operations

**Input Validation**:
- ✅ Client-side: Zod schema validation
- ✅ Server-side: Express validator
- ✅ SQL injection prevention (Supabase client handles)
- ✅ XSS prevention (React escapes by default)

**Rate Limiting**:
- Admin API: 100 requests/min per user
- Login endpoint: 5 attempts/15min

---

### NFR-3: Scalability

**Current Scale** (v1.1.0):
- Apps: 1-100
- Admins: 1-5
- API requests: ~1,000/day

**Target Scale** (Year 1):
- Apps: 100-1,000
- Admins: 5-20
- API requests: ~100,000/day

**Database Indexes** (Already in place):
```sql
CREATE INDEX idx_apps_owner ON apps(owner_id);
CREATE INDEX idx_apps_active ON apps(is_active);
CREATE INDEX idx_app_analytics_app_time ON app_analytics(app_id, created_at);
```

**Caching Strategy** (Future):
- Redis for app list (TTL: 5 min)
- Supabase built-in connection pooling

---

### NFR-4: Accessibility

**WCAG 2.1 Level AA Compliance**:
- ✅ Keyboard navigation (Tab order, Focus indicators)
- ✅ Screen reader support (ARIA labels)
- ✅ Color contrast ratio >4.5:1
- ✅ Form labels and error messages
- ✅ Alt text for icons

**Testing**:
- Lighthouse accessibility audit >90
- Keyboard-only navigation test
- Screen reader test (NVDA/VoiceOver)

---

### NFR-5: Browser Support

| Browser | Minimum Version |
|---------|-----------------|
| Chrome | 100+ |
| Firefox | 100+ |
| Safari | 15+ |
| Edge | 100+ |

**Mobile**:
- iOS Safari 15+
- Chrome Mobile 100+

---

## 🧪 Testing Requirements

### Test Coverage Goals

| Type | Target |
|------|--------|
| Unit Tests | >80% |
| Integration Tests | Critical paths |
| E2E Tests | Happy paths |

### Test Cases (Priority)

#### High Priority

**TC-1: Create App Happy Path**
1. Login as admin
2. Navigate to /admin/apps/new
3. Fill all required fields with valid data
4. Submit form
5. Assert: Success modal appears
6. Assert: API Key and Secret displayed
7. Copy credentials
8. Assert: Redirected to app detail page
9. Assert: New app appears in list

**TC-2: Create App - Validation Errors**
1. Submit form with empty name → Assert error message
2. Submit with invalid URL → Assert error message
3. Submit with non-existent owner → Assert error message
4. Submit with duplicate name → Assert error message

**TC-3: Edit App**
1. Open existing app
2. Change name and description
3. Save changes
4. Assert: Success toast
5. Refresh page
6. Assert: Changes persisted

**TC-4: Regenerate Secret**
1. Open app detail
2. Click "Regenerate Secret"
3. Assert: Confirmation modal
4. Confirm action
5. Assert: New secret displayed once
6. Assert: Old secret no longer valid (API test)

**TC-5: Deactivate App**
1. Toggle status to Inactive
2. Assert: Status updated instantly
3. Try to authenticate with this app (API test)
4. Assert: Authentication fails

**TC-6: Non-Admin Access Denied**
1. Login as non-admin user
2. Navigate to /admin/apps
3. Assert: 403 Forbidden or redirect to login
4. Try API request with non-admin token
5. Assert: 403 response

#### Medium Priority

**TC-7: Search and Filter**
1. Create 10 apps
2. Search by name → Assert correct results
3. Filter by Active → Assert only active apps
4. Combine search + filter → Assert correct intersection

**TC-8: Analytics Display**
1. Create app with test data (seed)
2. Navigate to analytics page
3. Assert: Charts render
4. Assert: Metrics display correct numbers
5. Change time range → Assert data updates

**TC-9: Copy to Clipboard**
1. Click copy button for API Key
2. Assert: Clipboard contains correct value
3. Assert: Toast shows "Copied!"

#### Low Priority

**TC-10: Pagination**
1. Create 50 apps
2. Navigate through pages
3. Assert: 20 items per page
4. Assert: Page numbers correct

---

### Manual Testing Checklist

- [ ] UI matches designs
- [ ] All buttons clickable and functional
- [ ] Forms validate correctly
- [ ] Toasts appear and dismiss
- [ ] Mobile responsive layout works
- [ ] Dark mode (if implemented)
- [ ] Print layout (if needed)

---

## 📦 Deliverables

### Phase 1: Backend API (Week 1)
- [ ] `/api/v1/admin/apps` CRUD endpoints
- [ ] `authenticateAdmin` middleware
- [ ] API Key/Secret generation logic
- [ ] Unit tests (>80% coverage)
- [ ] Postman collection for testing

### Phase 2: Frontend Core (Week 2)
- [ ] Next.js admin app setup
- [ ] Authentication flow (login)
- [ ] Apps list page with search/filter
- [ ] Create app form with validation
- [ ] App detail/edit page
- [ ] Integration with backend API

### Phase 3: Analytics (Week 3)
- [ ] `app_analytics` table and triggers
- [ ] Analytics API endpoints
- [ ] Dashboard overview page
- [ ] App analytics page with charts
- [ ] Real-time data refresh

### Phase 4: Polish (Week 4)
- [ ] UI/UX refinements
- [ ] Error handling improvements
- [ ] Loading states and skeletons
- [ ] E2E tests
- [ ] Documentation (Admin Guide)
- [ ] Deployment to production

---

## 🚀 Launch Plan

### Pre-Launch Checklist

**Technical**:
- [ ] All tests passing
- [ ] Code review completed
- [ ] Security audit (OWASP Top 10)
- [ ] Performance testing (Lighthouse >90)
- [ ] Browser compatibility tested
- [ ] Database migrations applied

**Documentation**:
- [ ] Admin user guide
- [ ] API documentation
- [ ] Changelog updated
- [ ] README updated

**Deployment**:
- [ ] Staging environment tested
- [ ] Rollback plan documented
- [ ] Monitoring/alerts configured
- [ ] Backup strategy verified

### Launch Strategy

**Phase 1: Soft Launch (Week 4)**
- Deploy to production
- Invite 1-2 internal admins
- Gather feedback
- Fix critical bugs

**Phase 2: Full Rollout (Week 5)**
- Announce to all admins
- Provide training session (1 hour)
- Monitor usage and errors
- Iterate based on feedback

**Success Criteria**:
- Zero critical bugs in first week
- Admin satisfaction >4/5
- >50% of admins use dashboard (vs. SQL)

---

## 📊 Success Metrics (3 Months)

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| App registration time | 5 min | 30 sec | Admin survey |
| Registration error rate | 10% | <1% | Error logs |
| Admin satisfaction | N/A | 4.5/5 | Survey |
| Dashboard usage | 0% | 80% | Analytics |
| Time to troubleshoot | 15 min | 2 min | Admin survey |

---

## 🔮 Future Roadmap

### v1.2.0 (Q2 2025)
- Self-service developer portal
- Approval workflow (Pending → Approved)
- User management UI
- Email notifications

### v1.3.0 (Q3 2025)
- Webhook configuration
- API versioning support
- Advanced rate limiting (per app)
- IP whitelisting

### v2.0.0 (Q4 2025)
- Multi-tenancy (Organizations)
- Custom domains per app
- SSO for SSO (Meta!)
- Marketplace (public app directory)

---

## ❓ Open Questions

1. **Should API Secret be stored encrypted in DB?**
   - Current: Plain text
   - Proposal: Hash (like passwords) or encrypt with KMS
   - Decision: v1.1 keeps plain text, encrypt in v1.2

2. **Should we support app logo upload?**
   - Would improve branding in consent screen
   - Requires file storage (Supabase Storage)
   - Decision: v1.2

3. **Should admins see all apps or only their owned apps?**
   - Current design: Admins see all
   - Alternative: Owner-only view
   - Decision: Admins see all (global role)

4. **Rate limiting per app or per user?**
   - Current: Global rate limits
   - Proposal: Each app can set custom limits
   - Decision: v1.3

---

## 📝 Approval

**Stakeholders**:
- [x] System Architect: Approved
- [ ] Product Owner: Pending
- [ ] Lead Developer: Pending
- [ ] Security Team: Pending

**Sign-off**: Pending review

---

## 📚 References

- [Supabase Auth Admin API](https://supabase.com/docs/reference/javascript/auth-admin-api)
- [Shadcn UI Components](https://ui.shadcn.com/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Tanstack Table](https://tanstack.com/table/latest)
- [OWASP Admin Interface Security](https://owasp.org/)

---

**Document Version**: 1.1
**Last Updated**: 2025-01-12
**Next Review**: 2025-01-19 (after stakeholder feedback)

**Changelog**:
- v1.1 (2025-01-12): Agent Execution Strategy 섹션 추가 (병렬 실행 계획)
- v1.0 (2025-01-12): 초안 작성
