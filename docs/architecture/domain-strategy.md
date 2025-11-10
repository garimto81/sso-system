# SSO 도메인 전략 가이드

**버전**: 1.0.0
**작성일**: 2025-01-12
**목적**: 다양한 도메인 구조에서 작동하는 유연한 SSO 시스템 설계

---

## 📊 지원하는 3가지 도메인 시나리오

### 시나리오 A: 동일 최상위 도메인 (권장)

```
sso.yourdomain.com          ← SSO 서버
logger.yourdomain.com       ← VTC_Logger
factory.yourdomain.com      ← contents-factory
admin.yourdomain.com        ← Admin Dashboard
```

**장점**:
- ✅ 쿠키 공유 가능 (`.yourdomain.com`)
- ✅ 한 번 로그인 → 모든 앱 자동 인증
- ✅ 구현 가장 간단
- ✅ CORS 문제 최소화

**단점**:
- ⚠️ 도메인 통합 관리 필요
- ⚠️ 서브도메인 SSL 인증서 필요

**사용 케이스**: 모든 앱을 자체 운영하는 경우

---

### 시나리오 B: 완전히 다른 도메인

```
sso-auth.com                ← SSO 서버
vtc-logger.io               ← VTC_Logger
my-factory.net              ← contents-factory
```

**장점**:
- ✅ 앱들이 독립적으로 운영 가능
- ✅ 각 앱의 브랜딩 유지
- ✅ 도메인 제약 없음

**단점**:
- ⚠️ 쿠키 공유 불가
- ⚠️ Token exchange 메커니즘 필수
- ⚠️ CORS 설정 필요

**사용 케이스**: 서로 다른 팀/회사가 운영하는 앱들

---

### 시나리오 C: 혼합 구조 (로컬 + 프로덕션)

```
# 로컬 개발
localhost:3000              ← SSO 서버
localhost:3001              ← VTC_Logger
localhost:3002              ← contents-factory

# 프로덕션
sso.yourdomain.com          ← SSO 서버
logger.yourdomain.com       ← VTC_Logger
factory.yourdomain.com      ← contents-factory
```

**장점**:
- ✅ 로컬 개발 편리
- ✅ 프로덕션 배포 간편
- ✅ 환경별 설정만 변경

**단점**:
- ⚠️ 로컬에서는 Token exchange 사용
- ⚠️ 환경별 설정 관리 필요

**사용 케이스**: 대부분의 실제 프로젝트 (권장)

---

## 🔧 기술적 구현 방법

### 방법 1: Shared Cookie (시나리오 A)

#### 작동 방식
```
1. 사용자 → sso.yourdomain.com/login
2. 로그인 성공 → JWT를 쿠키에 저장
   Set-Cookie: jwt=xxx; Domain=.yourdomain.com; Secure; HttpOnly
3. logger.yourdomain.com 접속 → 쿠키 자동 전송
4. 앱에서 JWT 검증 → 즉시 로그인 상태
```

#### 구현 코드 (SSO 서버)
```typescript
// SSO 서버: 로그인 성공 시
res.cookie('sso_token', jwt, {
  domain: '.yourdomain.com',  // 모든 서브도메인 공유
  httpOnly: true,              // XSS 방지
  secure: true,                // HTTPS only
  sameSite: 'lax',             // CSRF 방지
  maxAge: 3600000              // 1시간
});
```

#### 구현 코드 (앱 - VTC_Logger)
```typescript
// VTC_Logger: 미들웨어
const ssoMiddleware = async (req, res, next) => {
  const token = req.cookies.sso_token;

  if (!token) {
    // 로그인 안됨 → SSO로 리디렉션
    return res.redirect(`https://sso.yourdomain.com/login?redirect=${req.url}`);
  }

  try {
    // JWT 검증 (Supabase JWT secret 사용)
    const user = await verifyJWT(token);
    req.user = user;
    next();
  } catch (error) {
    // 토큰 만료/유효하지 않음 → SSO로 리디렉션
    res.redirect(`https://sso.yourdomain.com/login?redirect=${req.url}`);
  }
};
```

**설정 요구사항**:
- `config.toml`:
  ```toml
  [auth]
  site_url = "https://sso.yourdomain.com"
  additional_redirect_urls = [
    "https://logger.yourdomain.com/callback",
    "https://factory.yourdomain.com/callback"
  ]
  ```

---

### 방법 2: Token Exchange (시나리오 B)

#### 작동 방식
```
1. 사용자 → vtc-logger.io
2. 인증 필요 → sso-auth.com/authorize?app_id=vtc-logger&redirect=...
3. SSO에서 로그인 (이미 로그인 상태면 스킵)
4. SSO → 일회용 코드(code) 발급
5. vtc-logger.io/callback?code=xxx
6. 앱 백엔드 → SSO API 호출: code → JWT 교환
7. 앱에서 자체 세션 생성
```

#### 구현 코드 (SSO 서버 API)
```typescript
// POST /api/v1/token/exchange
app.post('/api/v1/token/exchange', async (req, res) => {
  const { code, app_id, app_secret } = req.body;

  // 1. 앱 검증
  const app = await db.apps.findOne({
    id: app_id,
    api_key: app_secret
  });
  if (!app) return res.status(401).json({ error: 'Invalid app' });

  // 2. 코드 검증 (Redis에 저장된 일회용 코드)
  const userId = await redis.get(`auth_code:${code}`);
  if (!userId) return res.status(401).json({ error: 'Invalid code' });

  // 3. 코드 삭제 (일회용)
  await redis.del(`auth_code:${code}`);

  // 4. JWT 발급
  const jwt = await supabase.auth.admin.generateJWT({ userId });

  res.json({ access_token: jwt, expires_in: 3600 });
});
```

#### 구현 코드 (앱 - VTC_Logger)
```typescript
// 1. 로그인 필요 시 리디렉션
if (!req.session.user) {
  const redirectUrl = `https://sso-auth.com/authorize?` +
    `app_id=vtc-logger` +
    `&redirect_uri=${encodeURIComponent('https://vtc-logger.io/callback')}` +
    `&state=${generateCSRFToken()}`;
  return res.redirect(redirectUrl);
}

// 2. 콜백 처리
app.get('/callback', async (req, res) => {
  const { code, state } = req.query;

  // CSRF 검증
  if (state !== req.session.csrfToken) {
    return res.status(403).send('Invalid state');
  }

  // 코드 → JWT 교환
  const response = await fetch('https://sso-auth.com/api/v1/token/exchange', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code,
      app_id: process.env.SSO_APP_ID,
      app_secret: process.env.SSO_APP_SECRET
    })
  });

  const { access_token } = await response.json();

  // JWT 검증 및 세션 생성
  const user = await verifyJWT(access_token);
  req.session.user = user;

  res.redirect('/dashboard');
});
```

**설정 요구사항**:
- SSO 서버에 Redis 필요 (일회용 코드 저장)
- 각 앱마다 `app_id`, `app_secret` 발급

---

### 방법 3: Silent Authentication (모든 시나리오)

#### 작동 방식
```
1. 사용자 → logger.yourdomain.com
2. 앱 → iframe으로 sso.yourdomain.com/check-session 로드
3. SSO에서 로그인 상태 확인 → postMessage로 JWT 전송
4. 앱에서 JWT 받아서 세션 생성
```

**장점**: 사용자가 리디렉션을 느끼지 못함
**단점**: 브라우저 third-party cookie 차단 시 동작 안함

---

## 🏗️ 권장 아키텍처 (하이브리드)

### 최종 권장 구조
```
┌─────────────────────────────────────────────┐
│         SSO Central Server                  │
│         sso.yourdomain.com                  │
│                                             │
│  ┌─────────────┐  ┌──────────────────┐    │
│  │ Login Page  │  │ Authorization    │    │
│  │ /login      │  │ API /api/v1/auth │    │
│  └─────────────┘  └──────────────────┘    │
│                                             │
│  ┌────────────────────────────────────┐    │
│  │ Supabase Auth + PostgreSQL         │    │
│  │ - users, profiles, apps, sessions  │    │
│  └────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
              ↓ JWT / Cookie
    ┌─────────┴─────────┬──────────────┐
    ↓                   ↓              ↓
┌─────────┐      ┌──────────┐    ┌─────────┐
│VTC_Logger│      │contents  │    │  AppN   │
│(SDK 통합)│      │-factory  │    │(SDK 통합)│
└─────────┘      └──────────┘    └─────────┘
```

### 단계별 동작

#### 로컬 개발 (Token Exchange)
```
localhost:3000 (SSO) + localhost:3001 (Logger)
→ Token exchange 방식 사용
```

#### 프로덕션 (Shared Cookie)
```
*.yourdomain.com
→ Cookie 공유 방식 사용 (더 빠름)
```

---

## 📋 구현 체크리스트

### Phase 1: SSO 서버 (PRD-0001)
- [ ] Supabase Auth 설정
- [ ] 로그인 UI (`/login`, `/signup`)
- [ ] OAuth 콜백 (`/callback`)
- [ ] Authorization endpoint (`/authorize`)
- [ ] Token exchange API (`/api/v1/token/exchange`)

### Phase 2: SDK 개발 (PRD-0002)
- [ ] JWT 검증 미들웨어
- [ ] SSO 리디렉션 헬퍼
- [ ] 세션 관리 유틸
- [ ] Express/Next.js/Nuxt.js 어댑터

### Phase 3: 앱 통합 (PRD-0003)
- [ ] VTC_Logger에 SDK 통합
- [ ] contents-factory에 SDK 통합
- [ ] 통합 테스트

---

## 🔐 보안 고려사항

### OAuth 설정 (Google)
```
Google Console 설정:
- Authorized redirect URIs:
  https://sso.yourdomain.com/callback (하나만!)

각 앱은 SSO를 통해 인증받으므로 Google 설정 불필요
```

### CSRF 방어
```typescript
// State 매개변수 사용
const state = crypto.randomBytes(16).toString('hex');
req.session.csrfToken = state;

// 리디렉션
res.redirect(`/authorize?state=${state}`);

// 콜백에서 검증
if (req.query.state !== req.session.csrfToken) {
  throw new Error('CSRF attack detected');
}
```

### XSS 방어
- JWT를 HttpOnly 쿠키에 저장
- 또는 localStorage (XSS 주의)

---

## 📊 도메인 전략 결정 가이드

### 질문 1: 모든 앱을 직접 운영하나요?
- ✅ **YES** → 시나리오 A (Shared Cookie)
- ❌ **NO** → 시나리오 B (Token Exchange)

### 질문 2: 서브도메인 설정 가능한가요?
- ✅ **YES** → 시나리오 A 강력 권장
- ❌ **NO** → 시나리오 B

### 질문 3: 로컬 개발은?
- **항상 시나리오 C** (localhost는 쿠키 공유 안됨)

---

## 🎯 프로젝트별 추천

### 프로젝트: SSO System (현재)
**추천**: **시나리오 C (하이브리드)**

**이유**:
1. 로컬 개발 편리성
2. 프로덕션에서 Shared Cookie 사용 가능
3. 유연한 확장성 (나중에 외부 앱 추가 가능)

**구현 전략**:
```javascript
// 환경별 설정
const SSO_CONFIG = {
  development: {
    method: 'token_exchange',  // localhost 간
    ssoUrl: 'http://localhost:3000'
  },
  production: {
    method: 'shared_cookie',   // *.yourdomain.com
    ssoUrl: 'https://sso.yourdomain.com',
    cookieDomain: '.yourdomain.com'
  }
};
```

---

## 📚 참고 자료

### 실제 SSO 구현 사례
- **Auth0**: Token exchange 방식
- **Okta**: SAML + OAuth2
- **Keycloak**: 오픈소스 SSO (참고용)
- **Supabase**: Native Auth (단일 앱용)

### 표준 프로토콜
- **OAuth 2.0**: Authorization Code Flow
- **OpenID Connect**: Identity layer on OAuth 2.0
- **SAML 2.0**: Enterprise SSO (복잡함, 현재 프로젝트엔 과함)

---

## 💡 Quick Decision Table

| 상황 | 방법 | 복잡도 | 보안 | 속도 |
|------|------|--------|------|------|
| 같은 도메인 (*.yourdomain.com) | Shared Cookie | ⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| 다른 도메인 (sso.com, app.io) | Token Exchange | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| localhost 개발 | Token Exchange | ⭐⭐ | ⭐⭐ | ⭐⭐ |
| 하이브리드 (권장) | 환경별 자동 선택 | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |

---

**결론**:
- **로컬 개발**: Token Exchange
- **프로덕션**: Shared Cookie (*.yourdomain.com 사용 시)
- **SDK가 자동으로 환경 감지하여 적절한 방법 선택**

**다음 단계**: 이 가이드를 기반으로 PRD-0001 수정
