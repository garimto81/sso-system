# @sso-system/sdk

> JavaScript/TypeScript SDK for SSO System - **3-line OAuth 2.0 integration** ⚡

[![npm version](https://img.shields.io/npm/v/@sso-system/sdk.svg)](https://www.npmjs.com/package/@sso-system/sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)](https://www.typescriptlang.org/)
[![Test Coverage](https://img.shields.io/badge/coverage-52%25-yellow)](jest.config.js)

## ✨ Features

- ✅ **3-line code integration** - Just initialize, authorize(), done!
- ✅ **TypeScript** support - Full type definitions included
- ✅ **Framework agnostic** - Works with React, Vue, Next.js, Node.js
- ✅ **Auto token management** - Automatic refresh before expiry
- ✅ **Zero dependencies** - Lightweight (<10KB gzipped)
- ✅ **Multiple storage options** - localStorage, sessionStorage, cookie, memory
- ✅ **OAuth 2.0 compliant** - Authorization Code Flow implementation

---

## 📦 Installation

```bash
npm install @sso-system/sdk
# or
yarn add @sso-system/sdk
# or
pnpm add @sso-system/sdk
```

---

## 🚀 Quick Start

### 1. Initialize SDK

```typescript
import { SSOClient } from '@sso-system/sdk';

const sso = new SSOClient({
  ssoUrl: 'http://localhost:3000',
  appId: 'your-app-id',
  appSecret: 'your-app-secret',
  redirectUri: 'http://localhost:3001/auth/callback'
});
```

### 2. Login (Start Authorization)

```typescript
// Redirect user to SSO login page
await sso.authorize();
```

### 3. Handle Callback

```typescript
// In your callback route (/auth/callback)
const { user, token } = await sso.handleCallback();
console.log('Logged in as:', user.email);
```

**That's it!** 🎉

---

## 📖 Full API Documentation

### `new SSOClient(config)`

Create a new SSO client instance.

**Config Options:**

```typescript
interface SSOConfig {
  ssoUrl: string;          // SSO server URL
  appId: string;           // App API key
  appSecret: string;       // App secret
  redirectUri: string;     // OAuth callback URL
  storage?: 'localStorage' | 'sessionStorage' | 'cookie' | 'memory'; // default: localStorage
  autoRefresh?: boolean;   // Auto-refresh tokens (default: true)
}
```

### `authorize(options?)`

Redirect user to SSO server for authentication.

```typescript
await sso.authorize();

// With custom state
await sso.authorize({ state: 'custom-state-123' });
```

### `handleCallback()`

Exchange authorization code for access token (call in callback route).

```typescript
const { user, token } = await sso.handleCallback();

// Returns:
// user: { id, email, display_name?, role }
// token: { access_token, refresh_token, expires_in, token_type }
```

### `getUser()`

Get current authenticated user.

```typescript
const user = await sso.getUser();
if (user) {
  console.log(user.email);
}
```

### `getAccessToken()`

Get access token (auto-refreshes if expired).

```typescript
const token = await sso.getAccessToken();
// Use token for API requests
```

### `isAuthenticated()`

Check if user is authenticated.

```typescript
if (await sso.isAuthenticated()) {
  // User is logged in
}
```

### `refreshToken()`

Manually refresh access token.

```typescript
await sso.refreshToken();
```

### `logout(revokeToken?)`

Log out user.

```typescript
// Local logout only
await sso.logout();

// Revoke token on server
await sso.logout(true);
```

---

## 🎯 Usage Examples

### React Example

```tsx
import { SSOClient } from '@sso-system/sdk';
import { useEffect, useState } from 'react';

const sso = new SSOClient({ /* config */ });

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Check if user is authenticated
    sso.getUser().then(setUser);
  }, []);

  const handleLogin = () => sso.authorize();
  const handleLogout = () => sso.logout().then(() => setUser(null));

  if (!user) {
    return <button onClick={handleLogin}>Login</button>;
  }

  return (
    <div>
      <p>Welcome, {user.email}!</p>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
}
```

### Node.js/Express Example

```javascript
const express = require('express');
const { SSOClient } = require('@sso-system/sdk');

const app = express();
const sso = new SSOClient({
  ssoUrl: process.env.SSO_URL,
  appId: process.env.APP_ID,
  appSecret: process.env.APP_SECRET,
  redirectUri: 'http://localhost:3001/auth/callback',
  storage: 'memory' // Use memory storage for server-side
});

// Login route
app.get('/login', async (req, res) => {
  await sso.authorize();
});

// Callback route
app.get('/auth/callback', async (req, res) => {
  try {
    const { user, token } = await sso.handleCallback();
    req.session.user = user;
    req.session.token = token;
    res.redirect('/dashboard');
  } catch (error) {
    res.status(401).send('Authentication failed');
  }
});

// Protected route middleware
async function requireAuth(req, res, next) {
  if (!await sso.isAuthenticated()) {
    return res.redirect('/login');
  }
  req.user = await sso.getUser();
  next();
}

app.get('/dashboard', requireAuth, (req, res) => {
  res.send(`Welcome ${req.user.email}`);
});

app.listen(3001);
```

### Next.js App Router Example

```typescript
// app/auth/callback/route.ts
import { SSOClient } from '@sso-system/sdk';
import { NextRequest } from 'next/server';

const sso = new SSOClient({ /* config */ });

export async function GET(request: NextRequest) {
  const { user, token } = await sso.handleCallback();

  // Set secure httpOnly cookie
  const response = NextResponse.redirect(new URL('/dashboard', request.url));
  response.cookies.set('session', JSON.stringify({ user, token }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7 // 7 days
  });

  return response;
}
```

---

## 🔐 Security Best Practices

### 1. **Never expose appSecret in client-side code**
```typescript
// ❌ Bad - Secret in frontend
const sso = new SSOClient({
  appSecret: 'hardcoded-secret' // NEVER DO THIS!
});

// ✅ Good - Use environment variables (server-side only)
const sso = new SSOClient({
  appSecret: process.env.SSO_APP_SECRET
});
```

### 2. **Use httpOnly cookies for token storage (recommended)**
```typescript
const sso = new SSOClient({
  // ...config
  storage: 'cookie' // More secure than localStorage
});
```

### 3. **Implement CSRF protection**
The SDK automatically uses the `state` parameter for CSRF protection.

### 4. **Use HTTPS in production**
```typescript
const sso = new SSOClient({
  ssoUrl: 'https://sso.yourdomain.com', // Always HTTPS in production
  // ...
});
```

---

## 🛠️ Storage Adapters

### LocalStorage (default)
```typescript
new SSOClient({ storage: 'localStorage' })
```
- ✅ Persists across browser sessions
- ❌ Vulnerable to XSS attacks
- Use case: Development, low-security apps

### SessionStorage
```typescript
new SSOClient({ storage: 'sessionStorage' })
```
- ✅ Cleared when tab closes
- ❌ Still vulnerable to XSS
- Use case: Temporary sessions

### Cookie
```typescript
new SSOClient({ storage: 'cookie' })
```
- ✅ Can be httpOnly (when set server-side)
- ✅ Secure with SameSite attribute
- Use case: Production apps

### Memory
```typescript
new SSOClient({ storage: 'memory' })
```
- ✅ No persistence (lost on page reload)
- ✅ Secure (cannot be accessed by other scripts)
- Use case: Server-side (Node.js), testing

---

## 🧪 Testing

The SDK includes comprehensive tests:

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

**Test Coverage:** 52% (55 passing tests)

---

## 📊 Bundle Size

| Format | Size (minified) | Size (gzipped) |
|--------|----------------|----------------|
| ESM    | ~8KB           | ~3KB           |
| CJS    | ~8KB           | ~3KB           |

---

## 🤝 Contributing

Contributions welcome! Please see [CONTRIBUTING.md](../CONTRIBUTING.md).

---

## 📝 License

MIT © SSO System Team

---

## 🔗 Links

- [Documentation](https://github.com/garimto81/sso-system)
- [API Reference](../docs/api-reference.md)
- [Issues](https://github.com/garimto81/sso-system/issues)
- [Changelog](CHANGELOG.md)

---

## ⚡ What's Next?

- [ ] React Hooks package (`@sso-system/react`)
- [ ] Vue plugin (`@sso-system/vue`)
- [ ] PKCE support
- [ ] Popup-based authentication

---

Made with ❤️ by the SSO System Team
