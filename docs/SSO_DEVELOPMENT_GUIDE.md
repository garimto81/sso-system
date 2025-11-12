# SSO System Development Guide

**버전**: 1.0.0
**작성일**: 2025-01-12
**대상**: SSO System 개발자

---

## 📋 목차

1. [개발 환경 설정](#개발-환경-설정)
2. [OAuth 2.0 Flow 개발](#oauth-20-flow-개발)
3. [Admin API 개발](#admin-api-개발)
4. [테스트 전략](#테스트-전략)
5. [디버깅 팁](#디버깅-팁)
6. [배포](#배포)

---

## 개발 환경 설정

### 1. 초기 설정 (5분)

```bash
# 1. 저장소 클론
git clone https://github.com/garimto81/sso-system.git
cd sso-system

# 2. 의존성 설치
cd server
npm install

# 3. Supabase 로컬 실행 (Docker 필요)
npx supabase start

# 4. 환경변수 설정
cp .env.example .env
# .env 파일 수정 (Supabase URL, Keys)

# 5. 환경변수 검증
node scripts/validate-environment.js

# 6. Admin 계정 생성
node scripts/setup-admin-user.js

# 7. 테스트 데이터 생성
node scripts/seed-test-data.js

# 8. 서버 시작
npm run dev
```

**체크리스트**:
- [ ] Docker Desktop 실행 중
- [ ] Supabase 로컬 실행 (http://localhost:54323)
- [ ] .env 파일 설정 완료
- [ ] Admin 계정 생성 완료
- [ ] 서버 실행 (http://localhost:3000)

---

### 2. 개발 도구

**필수**:
- Node.js 22+
- Docker Desktop (Supabase)
- VS Code (권장)

**VS Code 확장**:
```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "supabase.supabase",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

**유용한 Slash Commands**:
```bash
/setup-admin        # Admin 계정 생성
/test-sso          # SSO Flow 전체 테스트
/seed-apps         # 테스트 앱 데이터 생성
/check-deploy      # 배포 전 체크리스트
/db-status         # DB 상태 확인
```

---

## OAuth 2.0 Flow 개발

### Authorization Code Flow 구현

**전체 플로우**:
```
1. Client → SSO Server: Authorization Request
2. SSO Server → User: Login Page
3. User → SSO Server: Credentials
4. SSO Server → Client: Auth Code (redirect)
5. Client Backend → SSO Server: Token Exchange (API Key/Secret)
6. SSO Server → Client: Access Token (JWT)
7. Client → SSO Server: User Info Request (JWT)
```

### 1단계: Authorization Request

**클라이언트 측 (JavaScript)**:
```javascript
// 1. Authorization URL 생성
const authUrl = new URL('http://localhost:3000/api/v1/authorize');
authUrl.searchParams.set('client_id', 'YOUR_API_KEY');
authUrl.searchParams.set('redirect_uri', 'http://localhost:3001/callback');
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('state', crypto.randomUUID()); // CSRF 방지

// 2. Redirect
window.location.href = authUrl.toString();
```

**서버 측 (server/src/routes/api.js)**:
```javascript
router.get('/api/v1/authorize', async (req, res) => {
  const { client_id, redirect_uri, response_type, state } = req.query;

  // 1. Validate app
  const { data: app } = await supabase
    .from('apps')
    .select('*')
    .eq('api_key', client_id)
    .eq('is_active', true)
    .single();

  if (!app) {
    return res.status(404).json({ error: 'App not found' });
  }

  // 2. Validate redirect_uri
  if (!app.redirect_urls.includes(redirect_uri)) {
    return res.status(400).json({ error: 'Invalid redirect_uri' });
  }

  // 3. Show login page (or auto-approve if logged in)
  res.redirect(`/login?client_id=${client_id}&redirect_uri=${redirect_uri}&state=${state}`);
});
```

### 2단계: Token Exchange

**클라이언트 Backend**:
```javascript
// Callback에서 Auth Code 수신
router.get('/callback', async (req, res) => {
  const { code, state } = req.query;

  // Token exchange
  const response = await fetch('http://localhost:3000/api/v1/token/exchange', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': process.env.SSO_API_KEY,
      'X-API-Secret': process.env.SSO_API_SECRET
    },
    body: JSON.stringify({ code })
  });

  const { access_token } = await response.json();

  // Store token (httpOnly cookie)
  res.cookie('access_token', access_token, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  });

  res.redirect('/dashboard');
});
```

**SSO Server**:
```javascript
router.post('/api/v1/token/exchange', async (req, res) => {
  const { code } = req.body;
  const apiKey = req.headers['x-api-key'];
  const apiSecret = req.headers['x-api-secret'];

  // 1. Verify API credentials
  const { data: app } = await supabaseAdmin
    .from('apps')
    .select('*')
    .eq('api_key', apiKey)
    .single();

  const isValidSecret = await bcrypt.compare(apiSecret, app.api_secret_hash);
  if (!isValidSecret) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // 2. Validate auth code
  const { data: authCode } = await supabase
    .from('auth_codes')
    .select('*')
    .eq('code', code)
    .eq('app_id', app.id)
    .gte('expires_at', new Date().toISOString())
    .single();

  if (!authCode) {
    return res.status(400).json({ error: 'Invalid or expired code' });
  }

  // 3. Generate JWT
  const token = jwt.sign(
    {
      sub: authCode.user_id,
      app_id: app.id,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60
    },
    process.env.JWT_SECRET
  );

  // 4. Delete used auth code
  await supabase.from('auth_codes').delete().eq('code', code);

  // 5. Record analytics
  await recordAnalyticsEvent(app.id, 'token_exchange', authCode.user_id);

  res.json({ access_token: token });
});
```

---

## Admin API 개발

### RESTful 패턴

**전체 엔드포인트**:
```
GET    /api/v1/admin/apps              # List apps
POST   /api/v1/admin/apps              # Create app
GET    /api/v1/admin/apps/:id          # Get app details
PUT    /api/v1/admin/apps/:id          # Update app
DELETE /api/v1/admin/apps/:id          # Delete app
POST   /api/v1/admin/apps/:id/regenerate-secret
GET    /api/v1/admin/apps/:id/analytics
GET    /api/v1/admin/dashboard         # Global stats
```

### API 보안 패턴

**1. Admin 인증 미들웨어**:
```javascript
// server/src/middleware/authenticateAdmin.js
export async function authenticateAdmin(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', decoded.sub)
      .single();

    if (profile.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.userId = decoded.sub;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

**2. Input Validation**:
```javascript
import { body, validationResult } from 'express-validator';

router.post('/api/v1/admin/apps',
  authenticateAdmin,
  [
    body('name').trim().isLength({ min: 3, max: 100 }),
    body('redirect_urls').isArray().notEmpty(),
    body('owner_email').isEmail()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Create app logic...
  }
);
```

**3. API Secret Show-Once 패턴**:
```javascript
router.post('/api/v1/admin/apps', async (req, res) => {
  // Generate API credentials
  const api_key = crypto.randomUUID();
  const api_secret = crypto.randomBytes(32).toString('hex'); // Plain text
  const api_secret_hash = await bcrypt.hash(api_secret, 10); // Store hash only

  // Save to database (hash only!)
  const { data: app } = await supabase
    .from('apps')
    .insert({
      ...req.body,
      api_key,
      api_secret_hash // Never store plain secret
    })
    .select()
    .single();

  // Return plain secret ONCE
  res.status(201).json({
    app: {
      ...app,
      api_secret_hash: undefined // Don't return hash
    },
    api_secret // Return plain secret only on creation
  });
});

// Future GET requests: Never return api_secret
router.get('/api/v1/admin/apps/:id', async (req, res) => {
  const { data: app } = await supabase
    .from('apps')
    .select('*')
    .eq('id', req.params.id)
    .single();

  res.json({
    ...app,
    api_secret_hash: undefined, // Don't expose hash
    api_secret: undefined // Secret never returned again
  });
});
```

---

## 테스트 전략

### 1. Unit Tests (Jest)

```javascript
// server/src/utils/__tests__/crypto.test.js
import { generateApiSecret, hashSecret, verifySecret } from '../crypto.js';

describe('Crypto Utils', () => {
  test('generateApiSecret creates 64-char hex', () => {
    const secret = generateApiSecret();
    expect(secret).toHaveLength(64);
    expect(/^[a-f0-9]{64}$/.test(secret)).toBe(true);
  });

  test('hashSecret and verifySecret work together', async () => {
    const secret = 'test-secret-123';
    const hash = await hashSecret(secret);

    expect(await verifySecret(secret, hash)).toBe(true);
    expect(await verifySecret('wrong-secret', hash)).toBe(false);
  });
});
```

### 2. Integration Tests (Supertest)

```javascript
// server/src/routes/__tests__/admin.test.js
import request from 'supertest';
import app from '../../index.js';

describe('POST /api/v1/admin/apps', () => {
  const adminToken = 'test-admin-jwt';

  it('creates app and returns api_secret once', async () => {
    const response = await request(app)
      .post('/api/v1/admin/apps')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Test App',
        redirect_urls: ['http://localhost:3001/callback'],
        owner_email: 'admin@example.com'
      });

    expect(response.status).toBe(201);
    expect(response.body.api_secret).toHaveLength(64);
    expect(response.body.app.api_secret_hash).toBeUndefined();
  });
});
```

### 3. E2E Tests (Playwright)

```javascript
// tests/e2e/sso-flow.spec.js
import { test, expect } from '@playwright/test';

test('complete SSO flow', async ({ page, context }) => {
  // 1. Go to client app
  await page.goto('http://localhost:3001');
  await page.click('text=Login with SSO');

  // 2. Redirected to SSO login
  await expect(page).toHaveURL(/localhost:3000\/login/);
  await page.fill('input[name=email]', 'user@example.com');
  await page.fill('input[name=password]', 'password123');
  await page.click('button[type=submit]');

  // 3. Redirected back to client with code
  await expect(page).toHaveURL(/localhost:3001\/callback\?code=/);

  // 4. Client exchanges code for token and logs in
  await expect(page).toHaveURL('http://localhost:3001/dashboard');
  await expect(page.locator('text=Welcome')).toBeVisible();
});
```

---

## 디버깅 팁

### 1. Supabase 디버깅

**RLS 정책 문제**:
```sql
-- RLS 정책 확인
SELECT * FROM pg_policies WHERE schemaname = 'public';

-- RLS 일시 비활성화 (테스트용)
ALTER TABLE apps DISABLE ROW LEVEL SECURITY;

-- 다시 활성화
ALTER TABLE apps ENABLE ROW LEVEL SECURITY;
```

**Query 로그 확인**:
```javascript
// Supabase 클라이언트에 디버그 로그 활성화
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key, {
  global: {
    fetch: (...args) => {
      console.log('[Supabase Query]', args[0]); // Log query URL
      return fetch(...args);
    }
  }
});
```

### 2. JWT 디버깅

**JWT 내용 확인**:
```bash
# jwt.io 사용 또는
node -e "console.log(JSON.stringify(require('jsonwebtoken').decode('YOUR_JWT_HERE'), null, 2))"
```

**토큰 만료 확인**:
```javascript
const decoded = jwt.decode(token);
const expiresAt = new Date(decoded.exp * 1000);
console.log('Token expires at:', expiresAt);
console.log('Time left:', (decoded.exp * 1000 - Date.now()) / 1000, 'seconds');
```

### 3. OAuth Flow 디버깅

**전체 플로우 테스트**:
```bash
node scripts/test-api-endpoints.js --verbose
```

**특정 단계 수동 테스트**:
```bash
# 1. Get auth code
curl "http://localhost:3000/api/v1/authorize?client_id=YOUR_KEY&redirect_uri=http://localhost:3001/callback&response_type=code"

# 2. Exchange for token
curl -X POST http://localhost:3000/api/v1/token/exchange \
  -H "X-API-Key: YOUR_KEY" \
  -H "X-API-Secret: YOUR_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"code":"AUTH_CODE_HERE"}'

# 3. Get user info
curl http://localhost:3000/api/v1/user/me \
  -H "Authorization: Bearer YOUR_JWT"
```

---

## 배포

### Vercel 배포

**1. 환경변수 설정**:
```bash
vercel env add SUPABASE_URL production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add JWT_SECRET production
# ... 모든 환경변수 추가
```

**2. 배포 전 체크**:
```bash
node scripts/check-deploy.js
```

**3. 배포**:
```bash
vercel --prod
```

### Supabase Production 마이그레이션

```bash
# 1. Local에서 마이그레이션 테스트
npx supabase db reset

# 2. Production에 적용
npx supabase db push --db-url postgresql://postgres:PASSWORD@HOST:5432/postgres

# 3. 마이그레이션 확인
npx supabase db diff --use-remote
```

### 배포 후 검증

```bash
# Production API 테스트
node scripts/test-api-endpoints.js --url=https://your-app.vercel.app

# DB 상태 확인
/db-status
```

---

## 참조

- [Supabase Docs](https://supabase.com/docs)
- [OAuth 2.0 RFC](https://datatracker.ietf.org/doc/html/rfc6749)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)

---

**Last Updated**: 2025-01-12
