# E2E 테스트 워크플로우 설계

**목표**: 사용자가 한 번의 명령으로 전체 시스템을 테스트할 수 있도록 자동화

---

## 📋 워크플로우 개요

```
┌────────────────────────────────────────────────────────┐
│ Phase 1: 환경 준비 자동화 (5분)                        │
│ ✅ Supabase 시작                                       │
│ ✅ 백엔드 서버 시작                                    │
│ ✅ Frontend 서버 시작                                  │
│ ✅ Admin 계정 생성                                     │
│ ✅ 테스트 데이터 시딩 (선택)                           │
└────────────────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────┐
│ Phase 2: Playwright E2E 테스트 작성 (3-4시간)          │
│ ✅ 로그인 플로우 테스트                                │
│ ✅ Apps CRUD 테스트                                    │
│ ✅ Show-Once Secret 패턴 검증                          │
│ ✅ 보안 테스트 (httpOnly, localStorage 확인)           │
└────────────────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────┐
│ Phase 3: 통합 실행 스크립트 (1시간)                    │
│ ✅ npm run test:setup - 환경 준비                      │
│ ✅ npm run test:e2e - 테스트 실행                      │
│ ✅ npm run test:all - 전체 자동화                      │
└────────────────────────────────────────────────────────┘
                         ↓
┌────────────────────────────────────────────────────────┐
│ Phase 4: 사용자 테스트 가이드 (30분)                   │
│ ✅ 로컬 실행 방법                                      │
│ ✅ 수동 테스트 시나리오                                │
│ ✅ Playwright UI 모드 사용법                           │
│ ✅ 트러블슈팅 가이드                                   │
└────────────────────────────────────────────────────────┘
```

**총 예상 시간**: 5-6시간

---

## 🎯 최종 사용자 경험

### 자동화된 테스트 실행 (추천)

```bash
# 1. 전체 환경 + 테스트 자동 실행 (한 번에)
npm run test:all

# 결과:
# ✅ Supabase 시작됨
# ✅ 백엔드 서버 시작됨 (localhost:3000)
# ✅ Frontend 서버 시작됨 (localhost:3001)
# ✅ Admin 계정 생성됨
# ✅ Playwright 테스트 실행
# ✅ 17/17 테스트 통과
```

### 수동 테스트 (사용자가 직접 확인)

```bash
# 1. 환경 준비
npm run test:setup

# 2. 개발 서버 시작 (별도 터미널)
cd admin-dashboard && npm run dev

# 3. 브라우저에서 직접 테스트
open http://localhost:3001/login
# Email: admin@test.com
# Password: Test1234!

# 4. Playwright UI 모드로 테스트 확인
npx playwright test --ui

# 5. 특정 테스트만 실행
npx playwright test apps.spec.ts
```

---

## 📁 생성할 파일 구조

```
sso-system/
├── scripts/
│   ├── start-test-env.js          # 전체 환경 시작 (자동화)
│   ├── setup-admin-user.js        # Admin 계정 생성 (이미 있음)
│   ├── seed-test-data.js          # 테스트 데이터 시딩 (이미 있음)
│   ├── check-test-env.js          # 환경 확인 스크립트
│   └── stop-test-env.js           # 환경 종료 스크립트
│
├── admin-dashboard/
│   ├── tests/
│   │   ├── e2e/
│   │   │   ├── login.spec.ts      # 로그인 테스트
│   │   │   ├── apps.spec.ts       # Apps CRUD 테스트
│   │   │   ├── secret.spec.ts     # Show-Once Secret 테스트
│   │   │   └── security.spec.ts   # 보안 테스트
│   │   ├── fixtures/
│   │   │   └── test-data.ts       # 테스트 데이터
│   │   └── helpers/
│   │       └── auth.ts            # 로그인 헬퍼
│   │
│   ├── playwright.config.ts       # Playwright 설정
│   └── package.json               # 테스트 스크립트 추가
│
└── docs/
    ├── E2E_TEST_WORKFLOW.md       # 이 문서
    └── TESTING_GUIDE.md           # 사용자 테스트 가이드
```

---

## 🔧 Phase 1: 환경 준비 자동화

### 1.1. 환경 시작 스크립트 (`scripts/start-test-env.js`)

**기능**:
- Supabase 로컬 DB 확인/시작
- 백엔드 서버 시작 (port 3000)
- Frontend 서버 시작 (port 3001)
- Admin 계정 자동 생성
- 테스트 데이터 시딩 (선택)

**사용법**:
```bash
node scripts/start-test-env.js
# 또는
npm run test:setup
```

**출력 예시**:
```
✅ Checking Supabase...
✅ Supabase is running (http://localhost:54321)

✅ Starting Backend Server...
✅ Backend started at http://localhost:3000

✅ Starting Frontend Server...
✅ Frontend started at http://localhost:3001

✅ Creating Admin Account...
✅ Admin created: admin@test.com / Test1234!

✅ Seeding Test Data...
✅ Created 5 sample apps

🎉 Test environment ready!
   Backend:  http://localhost:3000
   Frontend: http://localhost:3001
   Admin:    admin@test.com / Test1234!
```

---

### 1.2. 환경 확인 스크립트 (`scripts/check-test-env.js`)

**기능**:
- Docker 실행 확인
- Supabase 상태 확인
- 포트 사용 확인 (3000, 3001)
- 환경 변수 확인

**사용법**:
```bash
node scripts/check-test-env.js
```

---

### 1.3. 환경 종료 스크립트 (`scripts/stop-test-env.js`)

**기능**:
- 백엔드 서버 종료
- Frontend 서버 종료
- Supabase 종료 (선택)

**사용법**:
```bash
node scripts/stop-test-env.js
# 또는
npm run test:cleanup
```

---

## 🎭 Phase 2: Playwright E2E 테스트 작성

### 2.1. 로그인 테스트 (`tests/e2e/login.spec.ts`)

```typescript
import { test, expect } from '@playwright/test'

test.describe('Login Flow', () => {
  test('should login with valid admin credentials', async ({ page }) => {
    await page.goto('http://localhost:3001/login')

    await page.fill('input[name="email"]', 'admin@test.com')
    await page.fill('input[name="password"]', 'Test1234!')
    await page.click('button[type="submit"]')

    // Should redirect to dashboard
    await expect(page).toHaveURL('http://localhost:3001/admin')
    await expect(page.locator('h1')).toContainText('Dashboard')
  })

  test('should reject non-admin users', async ({ page }) => {
    // Test non-admin rejection
  })

  test('should show error for invalid credentials', async ({ page }) => {
    // Test invalid login
  })

  test('should persist session with httpOnly cookie', async ({ page, context }) => {
    // Test cookie persistence
    await page.goto('http://localhost:3001/login')
    await page.fill('input[name="email"]', 'admin@test.com')
    await page.fill('input[name="password"]', 'Test1234!')
    await page.click('button[type="submit"]')

    // Check httpOnly cookie exists
    const cookies = await context.cookies()
    const authCookie = cookies.find(c => c.name === 'sso_admin_token')

    expect(authCookie).toBeDefined()
    expect(authCookie?.httpOnly).toBe(true)
    expect(authCookie?.sameSite).toBe('Lax')
  })
})
```

---

### 2.2. Apps CRUD 테스트 (`tests/e2e/apps.spec.ts`)

```typescript
import { test, expect } from '@playwright/test'
import { loginAsAdmin } from '../helpers/auth'

test.describe('Apps Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('should display apps list', async ({ page }) => {
    await page.goto('http://localhost:3001/admin/apps')

    await expect(page.locator('h1')).toContainText('Applications')
    await expect(page.locator('table')).toBeVisible()
  })

  test('should search apps by name', async ({ page }) => {
    await page.goto('http://localhost:3001/admin/apps')

    await page.fill('input[placeholder*="Search"]', 'Test App')
    await page.waitForTimeout(500) // Debounce

    // Should filter results
    const rows = page.locator('tbody tr')
    await expect(rows).toHaveCount(1)
  })

  test('should navigate to app details', async ({ page }) => {
    await page.goto('http://localhost:3001/admin/apps')

    await page.click('tbody tr:first-child')

    // Should show app details
    await expect(page).toHaveURL(/\/admin\/apps\/[a-z0-9-]+/)
    await expect(page.locator('h1')).toBeVisible()
  })
})
```

---

### 2.3. Show-Once Secret 테스트 (`tests/e2e/secret.spec.ts`)

```typescript
import { test, expect } from '@playwright/test'
import { loginAsAdmin } from '../helpers/auth'

test.describe('Show-Once Secret Pattern', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('should show API secret only once when creating app', async ({ page }) => {
    await page.goto('http://localhost:3001/admin/apps')

    // Open create modal
    await page.click('button:has-text("New App")')

    // Fill form
    await page.fill('input[name="name"]', 'Test App E2E')
    await page.fill('textarea[name="description"]', 'E2E Test App')
    await page.fill('input[placeholder*="redirect"]', 'http://localhost:3002/callback')
    await page.fill('input[placeholder*="example.com"]', 'http://localhost:3002')

    // Submit
    await page.click('button:has-text("Create Application")')

    // Wait for success screen
    await expect(page.locator('text=Application Created Successfully')).toBeVisible()

    // Secret should be visible
    const secretInput = page.locator('input[value*=""][class*="bg-red"]')
    await expect(secretInput).toBeVisible()

    const secretValue = await secretInput.inputValue()
    expect(secretValue.length).toBe(64) // 64-char hex

    // Copy secret
    await page.click('button:has(svg):near(:text("API Secret"))')

    // Close modal
    await page.click('button:has-text("I\'ve Saved My Credentials")')

    // ✅ CRITICAL: Secret should NOT be in localStorage
    const localStorage = await page.evaluate(() => JSON.stringify(window.localStorage))
    expect(localStorage).not.toContain(secretValue)

    // Navigate to app details
    await page.click(`text=${await page.locator('tbody tr:first-child td:first-child').textContent()}`)

    // ✅ CRITICAL: Secret should NOT be displayed
    await expect(page.locator(`text=${secretValue}`)).not.toBeVisible()
    await expect(page.locator('text=API Secret: (hidden)')).toBeVisible()
  })

  test('should not cache API secret in React Query', async ({ page }) => {
    // Create app and check devtools
    await page.goto('http://localhost:3001/admin/apps')
    await page.click('button:has-text("New App")')

    // Fill and submit (same as above)
    // ...

    // Check React Query cache via devtools
    const queryCache = await page.evaluate(() => {
      // @ts-ignore
      return window.__REACT_QUERY_DEVTOOLS_CACHE__
    })

    // Secret should not be in cache
    const cacheStr = JSON.stringify(queryCache)
    expect(cacheStr).not.toMatch(/api_secret/)
  })
})
```

---

### 2.4. 보안 테스트 (`tests/e2e/security.spec.ts`)

```typescript
import { test, expect } from '@playwright/test'

test.describe('Security Tests', () => {
  test('should use httpOnly cookies (not localStorage)', async ({ page, context }) => {
    await page.goto('http://localhost:3001/login')
    await page.fill('input[name="email"]', 'admin@test.com')
    await page.fill('input[name="password"]', 'Test1234!')
    await page.click('button[type="submit"]')

    await page.waitForURL('**/admin')

    // Check httpOnly cookie
    const cookies = await context.cookies()
    const authCookie = cookies.find(c => c.name === 'sso_admin_token')

    expect(authCookie).toBeDefined()
    expect(authCookie?.httpOnly).toBe(true)

    // Check localStorage is empty
    const localStorage = await page.evaluate(() => window.localStorage.length)
    expect(localStorage).toBe(0)
  })

  test('should have CSP headers', async ({ page }) => {
    const response = await page.goto('http://localhost:3001/admin')
    const headers = response?.headers()

    expect(headers?.['content-security-policy']).toBeDefined()
    expect(headers?.['x-frame-options']).toBe('DENY')
    expect(headers?.['x-content-type-options']).toBe('nosniff')
  })

  test('should clear auth on logout', async ({ page, context }) => {
    // Login
    await page.goto('http://localhost:3001/login')
    await page.fill('input[name="email"]', 'admin@test.com')
    await page.fill('input[name="password"]', 'Test1234!')
    await page.click('button[type="submit"]')

    await page.waitForURL('**/admin')

    // Logout
    await page.click('button:has-text("Logout")')

    // Should redirect to login
    await expect(page).toHaveURL('**/login')

    // Cookie should be deleted
    const cookies = await context.cookies()
    const authCookie = cookies.find(c => c.name === 'sso_admin_token')
    expect(authCookie).toBeUndefined()
  })
})
```

---

## 🚀 Phase 3: 통합 실행 스크립트

### 3.1. package.json 스크립트 추가

**Root `package.json`**:
```json
{
  "scripts": {
    "test:setup": "node scripts/start-test-env.js",
    "test:cleanup": "node scripts/stop-test-env.js",
    "test:check": "node scripts/check-test-env.js",
    "test:e2e": "cd admin-dashboard && npm run test:e2e",
    "test:all": "npm run test:setup && npm run test:e2e"
  }
}
```

**admin-dashboard/package.json**:
```json
{
  "scripts": {
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug"
  }
}
```

---

### 3.2. Playwright 설정 (`admin-dashboard/playwright.config.ts`)

```typescript
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
  },
})
```

---

## 📖 Phase 4: 사용자 테스트 가이드

### 4.1. 빠른 시작 (`docs/TESTING_GUIDE.md`)

```markdown
# 테스트 가이드

## 🚀 자동 테스트 (추천)

### 한 번에 실행
```bash
npm run test:all
```

### 단계별 실행
```bash
# 1. 환경 준비
npm run test:setup

# 2. E2E 테스트 실행
npm run test:e2e
```

## 🖐️ 수동 테스트

### 1. 환경 시작
```bash
npm run test:setup
```

### 2. 브라우저에서 테스트
```
URL: http://localhost:3001/login
Email: admin@test.com
Password: Test1234!
```

### 3. 테스트 시나리오
1. **로그인**
   - 관리자 계정으로 로그인
   - Dashboard 확인

2. **앱 생성**
   - "New App" 클릭
   - 폼 작성 (이름, 설명, URLs)
   - Submit → API Secret 복사
   - "I've Saved My Credentials" 클릭

3. **앱 목록**
   - Apps 페이지에서 생성된 앱 확인
   - 검색 기능 테스트
   - 앱 클릭 → 상세 페이지

4. **앱 상세**
   - 통계 확인
   - API Key 복사
   - Secret은 숨겨진 상태 확인

## 🎭 Playwright UI 모드

```bash
cd admin-dashboard
npx playwright test --ui
```

## 🐛 디버깅

```bash
# 특정 테스트만 실행
npx playwright test apps.spec.ts

# 브라우저 보면서 실행
npx playwright test --headed

# 디버그 모드
npx playwright test --debug
```

## ❌ 트러블슈팅

### Supabase 시작 안됨
```bash
# Docker Desktop 확인
docker ps

# Supabase 재시작
npx supabase stop
npx supabase start
```

### 포트 이미 사용 중
```bash
# 3000, 3001 포트 종료
npx kill-port 3000 3001
```

### Admin 계정 없음
```bash
node scripts/setup-admin-user.js
```
```

---

## ⏱️ 예상 작업 시간

| Phase | 작업 | 시간 |
|-------|------|------|
| 1 | 환경 시작 스크립트 | 1시간 |
| 1 | 환경 확인/종료 스크립트 | 30분 |
| 2 | 로그인 테스트 | 1시간 |
| 2 | Apps CRUD 테스트 | 1.5시간 |
| 2 | Show-Once Secret 테스트 | 1시간 |
| 2 | 보안 테스트 | 1시간 |
| 3 | Playwright 설정 | 30분 |
| 3 | package.json 스크립트 | 15분 |
| 4 | 테스트 가이드 문서 | 30분 |

**총 예상 시간**: 6-7시간

---

## 🎯 병렬 Agent 실행 전략

Phase 2-3을 병렬로 실행하면 **2-3시간으로 단축** 가능:

```
┌─────────────────────────────────────────┐
│ Phase 1: 환경 스크립트 (순차)           │
│ - fullstack-developer                   │
│ - 1.5시간                               │
└─────────────────────────────────────────┘
                 ↓
┌──────────────────┬──────────────────────┐
│ Phase 2a:        │ Phase 2b:            │
│ playwright-      │ test-automator +     │
│ engineer         │ security-auditor     │
│                  │                      │
│ - login.spec     │ - apps.spec          │
│ - secret.spec    │ - security.spec      │
│                  │                      │
│ 2시간            │ 2시간                │
└──────────────────┴──────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│ Phase 3-4: 통합 & 문서 (순차)           │
│ - fullstack-developer                   │
│ - 1시간                                 │
└─────────────────────────────────────────┘
```

**병렬 실행 시간**: 1.5h + 2h + 1h = **4.5시간**

---

## ✅ 최종 체크리스트

### 사용자가 실행 가능한 명령어

```bash
# ✅ 전체 자동화
npm run test:all

# ✅ 환경만 시작
npm run test:setup

# ✅ 테스트만 실행
npm run test:e2e

# ✅ Playwright UI 모드
cd admin-dashboard && npx playwright test --ui

# ✅ 수동 테스트
npm run test:setup
open http://localhost:3001/login
```

### 테스트 커버리지

- ✅ 로그인 플로우 (4개 테스트)
- ✅ Apps CRUD (5개 테스트)
- ✅ Show-Once Secret (2개 테스트)
- ✅ 보안 검증 (3개 테스트)
- ✅ httpOnly 쿠키 (2개 테스트)

**총 테스트**: 16-20개

---

**다음 단계**: 이 워크플로우대로 진행하시겠습니까?
1. ✅ 승인 → 자동화 스크립트부터 시작
2. ⚙️ 수정 요청 → 워크플로우 조정
