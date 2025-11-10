# SSO 통합 가이드 (앱 연동 방법)

**버전**: 1.0.0
**작성일**: 2025-01-12
**대상**: VTC_Logger, contents-factory 등 SSO를 사용할 앱 개발자

---

## 🎯 3가지 사용자 경험 (A/B/C) 모두 지원

### Experience A: 투명한 인증 (Shared Cookie)
**사용자 경험**:
```
1. sso.yourdomain.com에서 로그인
2. logger.yourdomain.com 방문
3. 즉시 로그인 상태 (리디렉션 없음!)
4. factory.yourdomain.com 방문
5. 역시 즉시 로그인 상태
```

**장점**: 사용자가 SSO를 의식하지 못함
**요구사항**: 모든 앱이 `*.yourdomain.com` 도메인

---

### Experience B: 자동 로그인 (Token Exchange)
**사용자 경험**:
```
1. vtc-logger.io 방문
2. 로그인 필요 → sso-auth.com으로 자동 리디렉션
3. 이미 로그인 상태 → 즉시 다시 앱으로 리디렉션 (1초 이내)
4. my-factory.net 방문
5. 역시 자동 로그인 (SSO에서 인증 확인)
```

**장점**: 도메인 제약 없음, 여전히 빠름
**요구사항**: 없음 (모든 도메인 지원)

---

### Experience C: SSO 게이트웨이 (명시적 인증)
**사용자 경험**:
```
1. 앱 방문
2. "Login with SSO" 버튼 클릭
3. SSO 페이지로 이동
4. 로그인 후 앱으로 복귀
```

**장점**: 사용자가 SSO 사용을 명확히 인지
**사용 케이스**: 보안이 중요한 앱, 선택적 로그인

---

## 📦 SDK 설치 (공통)

### 1. NPM 패키지 설치
```bash
npm install @your-org/sso-sdk
# 또는
yarn add @your-org/sso-sdk
```

### 2. 환경변수 설정
```bash
# .env
SSO_URL=https://sso.yourdomain.com
SSO_APP_ID=your-app-id           # SSO 서버에서 발급
SSO_APP_SECRET=your-app-secret   # SSO 서버에서 발급
SSO_REDIRECT_URI=https://your-app.com/auth/callback
```

---

## 🔧 구현 방법

### Option 1: Express.js 통합 (백엔드)

#### 기본 설정
```javascript
const express = require('express');
const { SSOClient } = require('@your-org/sso-sdk');

const app = express();

// SSO 클라이언트 초기화
const sso = new SSOClient({
  ssoUrl: process.env.SSO_URL,
  appId: process.env.SSO_APP_ID,
  appSecret: process.env.SSO_APP_SECRET,
  redirectUri: process.env.SSO_REDIRECT_URI,
  // 자동으로 환경 감지 (localhost → token_exchange, *.yourdomain.com → shared_cookie)
  autoDetectMethod: true
});

// SSO 미들웨어 적용
app.use(sso.middleware());
```

#### 보호된 라우트
```javascript
// 로그인 필요한 페이지
app.get('/dashboard', sso.requireAuth(), (req, res) => {
  // req.user에 사용자 정보 자동 주입
  res.json({
    message: 'Welcome to dashboard',
    user: req.user
  });
});
```

#### 로그인/로그아웃
```javascript
// 로그인 (자동 리디렉션)
app.get('/login', (req, res) => {
  const loginUrl = sso.getLoginUrl({
    redirectTo: req.query.redirect || '/dashboard'
  });
  res.redirect(loginUrl);
});

// 콜백 (SSO에서 돌아옴)
app.get('/auth/callback', sso.handleCallback(), (req, res) => {
  // 인증 성공 → 원래 페이지로 리디렉션
  res.redirect(req.session.redirectTo || '/dashboard');
});

// 로그아웃
app.get('/logout', (req, res) => {
  sso.logout(req, res, () => {
    res.redirect('/');
  });
});
```

---

### Option 2: Next.js 통합 (풀스택)

#### `app/api/auth/[...nextauth]/route.ts`
```typescript
import { SSOProvider } from '@your-org/sso-sdk/next';

export const { GET, POST } = SSOProvider({
  ssoUrl: process.env.SSO_URL!,
  appId: process.env.SSO_APP_ID!,
  appSecret: process.env.SSO_APP_SECRET!,
});
```

#### 클라이언트 컴포넌트
```typescript
'use client';

import { useSSO } from '@your-org/sso-sdk/react';

export default function DashboardPage() {
  const { user, loading, error, logout } = useSSO({
    required: true, // 로그인 필수
    redirectTo: '/login'
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <h1>Welcome, {user.display_name}!</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

#### 서버 컴포넌트
```typescript
import { getServerSession } from '@your-org/sso-sdk/next';
import { redirect } from 'next/navigation';

export default async function ProtectedPage() {
  const session = await getServerSession();

  if (!session) {
    redirect('/login');
  }

  return <div>Hello, {session.user.email}</div>;
}
```

---

### Option 3: React SPA 통합 (프론트엔드만)

#### `main.tsx` 또는 `App.tsx`
```typescript
import { SSOProvider } from '@your-org/sso-sdk/react';

function App() {
  return (
    <SSOProvider
      ssoUrl="https://sso.yourdomain.com"
      appId="your-app-id"
      onTokenRefresh={(token) => {
        // 토큰 갱신 시 호출
        localStorage.setItem('sso_token', token);
      }}
    >
      <YourApp />
    </SSOProvider>
  );
}
```

#### 보호된 페이지
```typescript
import { useSSO, ProtectedRoute } from '@your-org/sso-sdk/react';

function DashboardPage() {
  const { user, logout } = useSSO();

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Logged in as: {user.email}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

// 라우터 설정
function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute fallback="/login">
            <DashboardPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
```

---

### Option 4: Vue.js/Nuxt 통합

#### `plugins/sso.ts`
```typescript
import { SSOPlugin } from '@your-org/sso-sdk/vue';

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.use(SSOPlugin, {
    ssoUrl: 'https://sso.yourdomain.com',
    appId: process.env.SSO_APP_ID
  });
});
```

#### 컴포넌트
```vue
<template>
  <div v-if="$sso.isAuthenticated">
    <h1>Welcome, {{ $sso.user.display_name }}</h1>
    <button @click="$sso.logout()">Logout</button>
  </div>
  <div v-else>
    <button @click="$sso.login()">Login</button>
  </div>
</template>

<script setup>
const { $sso } = useNuxtApp();
</script>
```

---

## 🔐 권한 체크

### 역할 기반 접근 제어 (RBAC)
```javascript
// 백엔드 미들웨어
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (req.user.role !== role && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }

    next();
  };
};

// 사용 예시
app.get('/admin/users', sso.requireAuth(), requireRole('admin'), (req, res) => {
  // admin만 접근 가능
});
```

### 프론트엔드 권한 체크
```typescript
import { useSSO } from '@your-org/sso-sdk/react';

function AdminPanel() {
  const { user, hasRole } = useSSO();

  if (!hasRole('admin')) {
    return <div>Access Denied</div>;
  }

  return <div>Admin Panel</div>;
}
```

---

## 📊 사용자 정보 접근

### 백엔드 (Express)
```javascript
app.get('/api/profile', sso.requireAuth(), (req, res) => {
  // req.user 객체 구조
  const user = {
    id: req.user.id,              // UUID
    email: req.user.email,        // string
    display_name: req.user.display_name,  // string | null
    avatar_url: req.user.avatar_url,      // string | null
    role: req.user.role,          // 'user' | 'app_owner' | 'admin'
    created_at: req.user.created_at       // Date
  };

  res.json(user);
});
```

### 프론트엔드 (React)
```typescript
const { user } = useSSO();

console.log(user);
// {
//   id: 'uuid-here',
//   email: 'user@example.com',
//   display_name: 'John Doe',
//   avatar_url: 'https://...',
//   role: 'user'
// }
```

---

## 🧪 테스트

### 로컬 테스트 (Token Exchange)
```bash
# 1. SSO 서버 시작
cd sso-system
npm run dev  # localhost:3000

# 2. 앱 시작
cd vtc-logger
npm run dev  # localhost:3001

# 3. 브라우저에서 localhost:3001 접속
# → localhost:3000으로 리디렉션
# → 로그인 후 localhost:3001로 복귀
```

### 프로덕션 테스트 (Shared Cookie)
```bash
# /etc/hosts 또는 C:\Windows\System32\drivers\etc\hosts
127.0.0.1 sso.test.local
127.0.0.1 logger.test.local

# 브라우저에서 http://logger.test.local:3001 접속
# → Cookie 공유 동작 확인
```

---

## 🚨 문제 해결

### 문제 1: CORS 에러
**증상**: `Access-Control-Allow-Origin` 에러
**해결**:
```javascript
// SSO 서버 (server.js)
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:3001',  // VTC_Logger
    'http://localhost:3002',  // contents-factory
    'https://logger.yourdomain.com',
    'https://factory.yourdomain.com'
  ],
  credentials: true  // 쿠키 포함
}));
```

### 문제 2: 쿠키가 전송되지 않음
**증상**: Shared Cookie 방식에서 쿠키 누락
**해결**:
1. HTTPS 사용 확인 (프로덕션)
2. `sameSite: 'lax'` 설정 확인
3. `Domain=.yourdomain.com` 확인

### 문제 3: JWT 검증 실패
**증상**: `Invalid JWT signature`
**해결**:
```bash
# SSO 서버와 앱의 JWT_SECRET이 동일한지 확인
# .env
JWT_SECRET=your-supabase-jwt-secret  # Supabase Studio에서 확인
```

### 문제 4: 무한 리디렉션 루프
**증상**: SSO ↔ 앱 사이를 계속 왔다갔다
**해결**:
```javascript
// SSO 미들웨어가 /auth/callback 경로는 제외하도록 설정
app.use(sso.middleware({
  except: ['/auth/callback', '/health', '/public/*']
}));
```

---

## 📋 체크리스트

### 앱 등록 (SSO 서버에서)
- [ ] SSO Admin Dashboard에서 앱 등록
- [ ] `app_id`, `app_secret` 발급받기
- [ ] Redirect URI 설정 (예: `https://your-app.com/auth/callback`)
- [ ] 앱 활성화

### 앱 개발 (통합하려는 앱)
- [ ] `@your-org/sso-sdk` 설치
- [ ] 환경변수 설정 (`.env`)
- [ ] SSO 클라이언트 초기화
- [ ] 로그인/로그아웃 라우트 구현
- [ ] 보호된 페이지에 미들웨어 적용
- [ ] 테스트 (로컬 + 프로덕션)

---

## 🎯 빠른 시작 (5분 통합)

### 최소 구현 (Express.js)
```javascript
const express = require('express');
const { SSOClient } = require('@your-org/sso-sdk');

const app = express();
const sso = new SSOClient({
  ssoUrl: 'https://sso.yourdomain.com',
  appId: 'your-app-id',
  appSecret: 'your-app-secret'
});

// 전역 미들웨어
app.use(sso.middleware({ except: ['/public', '/health'] }));

// 보호된 페이지
app.get('/dashboard', (req, res) => {
  res.send(`Hello, ${req.user.email}`);
});

app.listen(3000);
```

---

## 📚 고급 주제

### 커스텀 로그인 UI
```typescript
// SSO 서버의 로그인 페이지를 커스터마이징하지 말고
// 앱에서 자체 로그인 UI 구현 후 SSO API 직접 호출

import { SSOClient } from '@your-org/sso-sdk';

async function customLogin(email: string, password: string) {
  const response = await fetch('https://sso.yourdomain.com/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, app_id: 'your-app-id' })
  });

  const { access_token } = await response.json();

  // JWT 저장
  localStorage.setItem('sso_token', access_token);
}
```

### 토큰 갱신
```javascript
// SDK가 자동으로 갱신하지만, 수동으로도 가능
const newToken = await sso.refreshToken(oldToken);
```

### 사용자 프로필 업데이트
```javascript
// SSO API 호출
await fetch('https://sso.yourdomain.com/api/v1/user/profile', {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    display_name: 'New Name',
    avatar_url: 'https://...'
  })
});
```

---

## 🔗 관련 문서

- [도메인 전략 가이드](./domain-strategy.md)
- [SSO API Reference](./api-reference.md)
- [SDK API Documentation](../../sdk/README.md)
- [보안 가이드라인](./security-guidelines.md)

---

**요약**:
1. SDK 설치 → 2. 환경변수 설정 → 3. 미들웨어 적용 → 완료!
2. A, B, C 모든 사용자 경험을 SDK가 자동으로 지원
3. 개발자는 도메인 구조만 신경쓰면 SDK가 알아서 처리
