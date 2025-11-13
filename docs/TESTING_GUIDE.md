# 테스트 가이드

**SSO Admin Dashboard E2E Testing**

---

## 🚀 빠른 시작 (자동 테스트)

### 한 번에 모든 것 실행

```bash
# 환경 시작 + 테스트 실행
npm run test:all
```

**실행 과정**:
1. ✅ Supabase 확인/시작
2. ✅ 백엔드 서버 시작 (localhost:3000)
3. ✅ Frontend 서버 시작 (localhost:3001)
4. ✅ Admin 계정 생성 (admin@test.com)
5. ✅ Playwright E2E 테스트 실행

---

### 단계별 실행

```bash
# 1. 환경 준비만
npm run test:setup

# 2. 테스트만 실행 (환경이 이미 실행 중일 때)
npm run test:e2e

# 3. 환경 정리
npm run test:cleanup
```

---

## 🖐️ 수동 테스트 (브라우저에서 직접 확인)

### 1. 환경 시작

```bash
npm run test:setup
```

**출력 확인**:
```
✅ Supabase is running (http://localhost:54321)
✅ Backend started at http://localhost:3000
✅ Frontend started at http://localhost:3001
✅ Admin created: admin@test.com / Test1234!

🎉 Test Environment Ready!
```

---

### 2. 브라우저에서 테스트

```
URL: http://localhost:3001/login

Admin 계정:
  Email:    admin@test.com
  Password: Test1234!
```

---

### 3. 테스트 시나리오

#### 시나리오 1: 로그인
1. http://localhost:3001/login 접속
2. Email: `admin@test.com`
3. Password: `Test1234!`
4. Login 버튼 클릭
5. ✅ Dashboard로 리다이렉트 확인

#### 시나리오 2: 앱 생성 (Show-Once Secret 패턴)
1. Dashboard → Apps 메뉴 클릭
2. "New App" 버튼 클릭
3. 폼 작성:
   - Name: `Test App`
   - Description: `My test application`
   - Redirect URL: `http://localhost:4000/callback`
   - Allowed Origin: `http://localhost:4000`
4. "Create Application" 클릭
5. ✅ **Success 화면에서 API Secret 복사** (한 번만 표시됨!)
6. "I've Saved My Credentials" 클릭
7. ✅ Apps 목록에서 생성된 앱 확인

#### 시나리오 3: 앱 상세 확인
1. Apps 목록에서 앱 클릭
2. ✅ API Key 표시 확인
3. ✅ API Secret은 "hidden" 또는 "not shown" 확인
4. ✅ 통계 카드 확인 (Logins, Token Exchanges)
5. ✅ Redirect URLs, Allowed Origins 확인

#### 시나리오 4: 검색 & 필터
1. Apps 목록 페이지
2. 검색창에 앱 이름 입력
3. ✅ 실시간 필터링 확인
4. "Active Only" 버튼 클릭
5. ✅ 활성 앱만 표시 확인

#### 시나리오 5: 보안 확인
1. 개발자 도구 열기 (F12)
2. Application → Local Storage 확인
3. ✅ `sso_admin_token`이 **없어야 함** (httpOnly cookie 사용)
4. Application → Cookies 확인
5. ✅ `sso_admin_token` 쿠키 확인
6. ✅ HttpOnly 체크박스 확인

---

## 🎭 Playwright UI 모드 (시각적 테스트)

```bash
cd admin-dashboard
npx playwright test --ui
```

**기능**:
- 테스트 목록 확인
- 각 테스트 단계별 실행
- 스크린샷 확인
- 에러 발생 시 자동 녹화

---

## 🧪 Playwright 명령어

### 모든 테스트 실행

```bash
cd admin-dashboard
npm run test:e2e
```

### 특정 테스트만 실행

```bash
# 로그인 테스트만
npx playwright test login.spec.ts

# Apps 테스트만
npx playwright test apps.spec.ts

# Secret 패턴 테스트만
npx playwright test secret.spec.ts

# 보안 테스트만
npx playwright test security.spec.ts
```

### 브라우저 보면서 실행 (디버깅용)

```bash
npm run test:e2e:headed
```

### 디버그 모드 (단계별 실행)

```bash
npm run test:e2e:debug
```

### 특정 브라우저만 테스트

```bash
# Chromium만
npx playwright test --project=chromium

# Firefox만
npx playwright test --project=firefox

# Webkit (Safari)만
npx playwright test --project=webkit
```

---

## 📊 테스트 리포트 확인

테스트 실행 후 HTML 리포트 생성:

```bash
npx playwright show-report
```

**포함 내용**:
- 테스트 결과 요약
- 실패한 테스트 스크린샷
- 실패한 테스트 비디오
- 타임라인

---

## 🐛 트러블슈팅

### 문제 1: Supabase 시작 안됨

**증상**: `Supabase is not running`

**해결**:
```bash
# Docker Desktop 실행 확인
docker ps

# Supabase 재시작
npx supabase stop
npx supabase start
```

---

### 문제 2: 포트 이미 사용 중

**증상**: `Port 3000 already in use`

**해결**:
```bash
# 포트 강제 종료
npx kill-port 3000 3001

# 또는
npm run test:cleanup
```

---

### 문제 3: Admin 계정 없음

**증상**: Login fails with 403

**해결**:
```bash
node scripts/setup-admin-user.js
```

---

### 문제 4: Frontend dependencies 없음

**증상**: `Cannot find module 'next'`

**해결**:
```bash
cd admin-dashboard
npm install
```

---

### 문제 5: Playwright 브라우저 없음

**증상**: `Executable doesn't exist`

**해결**:
```bash
cd admin-dashboard
npx playwright install
```

---

### 문제 6: 테스트 타임아웃

**증상**: `Test timeout of 30000ms exceeded`

**해결**:
```bash
# 환경이 준비되었는지 확인
npm run test:check

# 서버 수동 시작 후 테스트만 실행
npm run test:e2e
```

---

## 📋 테스트 체크리스트

### ✅ 로그인 테스트
- [ ] 유효한 관리자 로그인 성공
- [ ] 잘못된 자격증명 거부
- [ ] 비관리자 사용자 거부 (403)
- [ ] httpOnly 쿠키 확인

### ✅ Apps CRUD 테스트
- [ ] Apps 목록 표시
- [ ] 앱 검색 기능
- [ ] 앱 상세 페이지 이동
- [ ] 페이지네이션 작동
- [ ] 상태별 필터링

### ✅ Show-Once Secret 테스트
- [ ] 앱 생성 시 Secret 한 번만 표시
- [ ] Secret이 localStorage에 없음
- [ ] Secret이 React Query 캐시에 없음
- [ ] 모달 닫은 후 Secret 메모리에서 삭제
- [ ] 앱 상세 페이지에서 Secret 숨김

### ✅ 보안 테스트
- [ ] httpOnly 쿠키 사용 (localStorage 사용 안함)
- [ ] SameSite=Lax 속성 확인
- [ ] CSP 헤더 존재
- [ ] X-Frame-Options 헤더 존재
- [ ] 로그아웃 시 쿠키 삭제
- [ ] 미인증 시 /login으로 리다이렉트

---

## 📝 테스트 작성 가이드

새로운 테스트 추가 시:

```typescript
// tests/e2e/my-feature.spec.ts
import { test, expect } from '@playwright/test'
import { loginAsAdmin } from '../helpers/auth'

test.describe('My Feature', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('should do something', async ({ page }) => {
    await page.goto('/my-page')

    // Your test logic
    await expect(page.locator('h1')).toContainText('My Page')
  })
})
```

---

## 🔧 환경 변수

테스트 환경에서 사용하는 환경 변수:

**Backend** (`server/.env`):
```bash
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=...
JWT_SECRET=...
PORT=3000
```

**Frontend** (`admin-dashboard/.env.local`):
```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
JWT_SECRET=...
NODE_ENV=development
```

---

## 📚 추가 리소스

- [Playwright 공식 문서](https://playwright.dev)
- [E2E Test Workflow](./E2E_TEST_WORKFLOW.md)
- [Apps UI Implementation](../admin-dashboard/APPS_UI_IMPLEMENTATION.md)

---

**마지막 업데이트**: 2025-01-12
**테스트 버전**: v0.2.0
