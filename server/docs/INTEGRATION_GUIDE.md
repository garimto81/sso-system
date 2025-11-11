# SSO Integration Guide

**Version**: 1.0.0
**Last Updated**: 2025-01-11

Complete guide for integrating your application with the SSO System.

---

## Table of Contents

1. [Overview](#overview)
2. [Before You Start](#before-you-start)
3. [Registration Process](#registration-process)
4. [Integration Steps](#integration-steps)
5. [Code Examples](#code-examples)
6. [Testing Your Integration](#testing-your-integration)
7. [Production Checklist](#production-checklist)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The SSO System uses **OAuth 2.0 Authorization Code Flow** for secure authentication:

```
┌─────────┐                ┌─────────┐                ┌─────────┐
│  User   │                │Your App │                │   SSO   │
└────┬────┘                └────┬────┘                └────┬────┘
     │                          │                          │
     │  1. Click "Login"        │                          │
     ├─────────────────────────>│                          │
     │                          │                          │
     │                          │  2. Redirect to SSO      │
     │                          ├─────────────────────────>│
     │                          │                          │
     │  3. Login form (SSO UI) <────────────────────────────┤
     ├─────────────────────────────────────────────────────┤
     │  4. Submit credentials   │                          │
     ├─────────────────────────────────────────────────────>│
     │                          │                          │
     │                          │  5. Redirect with code   │
     │                          │<─────────────────────────┤
     │                          │                          │
     │                          │  6. Exchange code        │
     │                          ├─────────────────────────>│
     │                          │                          │
     │                          │  7. Return tokens        │
     │                          │<─────────────────────────┤
     │                          │                          │
     │  8. Set session cookie   │                          │
     │<─────────────────────────┤                          │
     │                          │                          │
     │  9. Redirect to home     │                          │
     │<─────────────────────────┤                          │
     │                          │                          │
```

---

## Before You Start

### Prerequisites

1. **Contact Admin**: Request SSO integration for your application
2. **Prepare Information**:
   - Application name
   - Description
   - Redirect URLs (production and staging)
   - Allowed origins (for CORS)
   - Owner email

3. **Technical Requirements**:
   - Backend server (Node.js, Python, Java, etc.)
   - Session management (cookies or JWT storage)
   - HTTPS in production (required)

### What You'll Receive

After registration, admin will provide:
- **API Key** (UUID format): `660e8400-e29b-41d4-a716-446655440001`
- **API Secret** (64-char hex): `a1b2c3d4e5f6g7h8...` (shown ONLY ONCE!)
- **SSO Server URL**: `https://sso-system.vercel.app` or custom domain

⚠️ **IMPORTANT**: Save the API secret immediately - it cannot be retrieved later!

---

## Registration Process

### Option 1: Self-Service (If Enabled)

Contact your SSO admin to create an account with admin privileges, then:

1. **Login to Admin Dashboard**
   ```
   https://sso-admin.example.com
   ```

2. **Create New App**
   - Navigate to "Apps" → "Create New App"
   - Fill in application details
   - Copy `api_secret` immediately (shown only once!)

### Option 2: Request via Admin

Send email to SSO admin with:
```
Subject: SSO Integration Request - [Your App Name]

App Name: Customer Portal
Description: Main customer-facing application
Redirect URLs:
  - https://portal.example.com/auth/callback (production)
  - https://staging.portal.example.com/auth/callback (staging)
  - http://localhost:3000/auth/callback (development)
Allowed Origins:
  - https://portal.example.com
  - https://staging.portal.example.com
  - http://localhost:3000
Auth Method: token_exchange (recommended)
Owner Email: tech-lead@example.com
```

Admin will respond with `api_key` and `api_secret`.

---

## Integration Steps

### Step 1: Store Credentials

**Environment Variables** (recommended):
```bash
# .env
SSO_SERVER_URL=https://sso-system.vercel.app
SSO_API_KEY=660e8400-e29b-41d4-a716-446655440001
SSO_API_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2
SSO_REDIRECT_URL=https://myapp.com/auth/callback
```

**Security Rules**:
- ✅ Add `.env` to `.gitignore`
- ✅ Use secret management tools in production (AWS Secrets Manager, Vault)
- ✅ Never commit secrets to Git
- ✅ Rotate secrets every 90 days

### Step 2: Install HTTP Client

**Node.js**:
```bash
npm install axios
```

**Python**:
```bash
pip install requests
```

**Go**:
```bash
go get github.com/go-resty/resty/v2
```

### Step 3: Implement Login Redirect

Create a "Login with SSO" button that redirects to:
```
GET {SSO_SERVER_URL}/auth/login?app_id={api_key}&redirect_url={your_callback_url}
```

**Example URLs**:
```
# Development
https://sso-system.vercel.app/auth/login?app_id=660e8400-e29b-41d4-a716-446655440001&redirect_url=http://localhost:3000/auth/callback

# Production
https://sso-system.vercel.app/auth/login?app_id=660e8400-e29b-41d4-a716-446655440001&redirect_url=https://myapp.com/auth/callback
```

### Step 4: Handle Callback

SSO will redirect back with authorization code:
```
https://myapp.com/auth/callback?code=abc123xyz789
```

Your callback endpoint must:
1. Extract `code` from query parameter
2. Exchange code for tokens (backend)
3. Store tokens securely (session or cookies)
4. Redirect user to homepage

### Step 5: Exchange Code for Tokens

**Endpoint**: `POST {SSO_SERVER_URL}/api/token-exchange`

**Request**:
```json
{
  "code": "abc123xyz789",
  "api_key": "660e8400-e29b-41d4-a716-446655440001",
  "api_secret": "a1b2c3d4e5f6g7h8..."
}
```

**Response**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "v1.MjAyNS0wMS0xMVQxMDowMDowMC4wMDBa...",
  "expires_in": 3600,
  "user": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "email": "user@example.com",
    "display_name": "John Doe",
    "role": "user"
  }
}
```

### Step 6: Store Tokens Securely

**Option A: HTTP-Only Cookies** (Recommended for web apps)
```javascript
// Set secure cookies (server-side)
res.cookie('access_token', tokens.access_token, {
  httpOnly: true,
  secure: true, // HTTPS only
  sameSite: 'lax',
  maxAge: 3600000 // 1 hour
});

res.cookie('refresh_token', tokens.refresh_token, {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  maxAge: 2592000000 // 30 days
});
```

**Option B: Server-Side Session Store**
```javascript
// Store in Redis, Memcached, or database
session.set(userId, {
  access_token: tokens.access_token,
  refresh_token: tokens.refresh_token,
  expires_at: Date.now() + tokens.expires_in * 1000
});
```

**Option C: Encrypted LocalStorage** (SPA only, less secure)
```javascript
// Encrypt before storing (use crypto library)
const encrypted = encrypt(tokens.access_token, SECRET_KEY);
localStorage.setItem('access_token', encrypted);
```

### Step 7: Use Access Token

Include access token in API requests:
```http
GET /api/user/profile HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 8: Validate Token (Optional)

Validate token on your backend:

**Endpoint**: `POST {SSO_SERVER_URL}/api/validate-token`

**Request**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```
**Headers**:
```
Authorization: Bearer {api_key}
```

**Response**:
```json
{
  "valid": true,
  "user": {
    "id": "770e8400-e29b-41d4-a716-446655440002",
    "email": "user@example.com",
    "display_name": "John Doe",
    "role": "user"
  }
}
```

### Step 9: Refresh Tokens

When access token expires (after 1 hour):

**Endpoint**: `POST {SSO_SERVER_URL}/api/refresh-token`

**Request**:
```json
{
  "refresh_token": "v1.MjAyNS0wMS0xMVQxMDowMDowMC4wMDBa..."
}
```
**Headers**:
```
Authorization: Bearer {api_key}
```

**Response**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "v1.MjAyNS0wMS0xMVQxMTowMDowMC4wMDBa...",
  "expires_in": 3600
}
```

### Step 10: Handle Logout

Clear tokens and redirect:
```javascript
// Clear cookies
res.clearCookie('access_token');
res.clearCookie('refresh_token');

// Or clear session
session.destroy(userId);

// Redirect to login
res.redirect('/login');
```

---

## Code Examples

### Node.js + Express

**Full Integration**:

```javascript
// auth.js
import express from 'express';
import axios from 'axios';

const router = express.Router();

const SSO_SERVER_URL = process.env.SSO_SERVER_URL;
const SSO_API_KEY = process.env.SSO_API_KEY;
const SSO_API_SECRET = process.env.SSO_API_SECRET;
const SSO_REDIRECT_URL = process.env.SSO_REDIRECT_URL;

// 1. Login - Redirect to SSO
router.get('/login', (req, res) => {
  const loginUrl = `${SSO_SERVER_URL}/auth/login?app_id=${SSO_API_KEY}&redirect_url=${encodeURIComponent(SSO_REDIRECT_URL)}`;
  res.redirect(loginUrl);
});

// 2. Callback - Exchange code for tokens
router.get('/callback', async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ error: 'Missing authorization code' });
    }

    // Exchange code for tokens
    const response = await axios.post(`${SSO_SERVER_URL}/api/token-exchange`, {
      code,
      api_key: SSO_API_KEY,
      api_secret: SSO_API_SECRET,
    });

    const { access_token, refresh_token, expires_in, user } = response.data;

    // Store tokens in HTTP-only cookies
    res.cookie('access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: expires_in * 1000,
    });

    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    // Optional: Store user info in session
    req.session.user = user;

    // Redirect to homepage
    res.redirect('/');
  } catch (error) {
    console.error('Token exchange failed:', error.response?.data || error.message);
    res.redirect('/login?error=auth_failed');
  }
});

// 3. Middleware - Authenticate requests
export async function authenticateUser(req, res, next) {
  try {
    const access_token = req.cookies.access_token;

    if (!access_token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Validate token with SSO
    const response = await axios.post(
      `${SSO_SERVER_URL}/api/validate-token`,
      { access_token },
      { headers: { Authorization: `Bearer ${SSO_API_KEY}` } }
    );

    if (!response.data.valid) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Attach user to request
    req.user = response.data.user;
    next();
  } catch (error) {
    // Try to refresh token
    try {
      const refresh_token = req.cookies.refresh_token;
      if (!refresh_token) {
        return res.status(401).json({ error: 'Not authenticated' });
      }

      const refreshResponse = await axios.post(
        `${SSO_SERVER_URL}/api/refresh-token`,
        { refresh_token },
        { headers: { Authorization: `Bearer ${SSO_API_KEY}` } }
      );

      const { access_token, refresh_token: new_refresh_token, expires_in } = refreshResponse.data;

      // Update cookies
      res.cookie('access_token', access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: expires_in * 1000,
      });

      res.cookie('refresh_token', new_refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      // Retry validation
      const retryResponse = await axios.post(
        `${SSO_SERVER_URL}/api/validate-token`,
        { access_token },
        { headers: { Authorization: `Bearer ${SSO_API_KEY}` } }
      );

      req.user = retryResponse.data.user;
      next();
    } catch (refreshError) {
      return res.status(401).json({ error: 'Authentication failed' });
    }
  }
}

// 4. Logout
router.get('/logout', (req, res) => {
  res.clearCookie('access_token');
  res.clearCookie('refresh_token');
  req.session.destroy();
  res.redirect('/login');
});

export default router;
```

**Usage in app**:
```javascript
// index.js
import express from 'express';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import authRoutes, { authenticateUser } from './auth.js';

const app = express();

app.use(cookieParser());
app.use(session({ secret: 'your-session-secret', resave: false, saveUninitialized: false }));

// Mount auth routes
app.use('/auth', authRoutes);

// Protected route example
app.get('/api/user/profile', authenticateUser, (req, res) => {
  res.json({ user: req.user });
});

app.listen(3000, () => console.log('App running on http://localhost:3000'));
```

### Python + Flask

```python
# auth.py
from flask import Blueprint, request, redirect, session, jsonify, make_response
import requests
import os

auth_bp = Blueprint('auth', __name__)

SSO_SERVER_URL = os.getenv('SSO_SERVER_URL')
SSO_API_KEY = os.getenv('SSO_API_KEY')
SSO_API_SECRET = os.getenv('SSO_API_SECRET')
SSO_REDIRECT_URL = os.getenv('SSO_REDIRECT_URL')

# 1. Login - Redirect to SSO
@auth_bp.route('/login')
def login():
    login_url = f"{SSO_SERVER_URL}/auth/login?app_id={SSO_API_KEY}&redirect_url={SSO_REDIRECT_URL}"
    return redirect(login_url)

# 2. Callback - Exchange code for tokens
@auth_bp.route('/callback')
def callback():
    code = request.args.get('code')

    if not code:
        return jsonify({"error": "Missing authorization code"}), 400

    try:
        # Exchange code for tokens
        response = requests.post(f"{SSO_SERVER_URL}/api/token-exchange", json={
            "code": code,
            "api_key": SSO_API_KEY,
            "api_secret": SSO_API_SECRET
        })
        response.raise_for_status()

        data = response.json()
        access_token = data['access_token']
        refresh_token = data['refresh_token']
        expires_in = data['expires_in']
        user = data['user']

        # Store in session
        session['access_token'] = access_token
        session['refresh_token'] = refresh_token
        session['user'] = user

        return redirect('/')

    except requests.exceptions.RequestException as e:
        print(f"Token exchange failed: {e}")
        return redirect('/login?error=auth_failed')

# 3. Middleware - Authenticate requests
def authenticate_user(f):
    from functools import wraps

    @wraps(f)
    def decorated_function(*args, **kwargs):
        access_token = session.get('access_token')

        if not access_token:
            return jsonify({"error": "Not authenticated"}), 401

        try:
            # Validate token
            response = requests.post(
                f"{SSO_SERVER_URL}/api/validate-token",
                json={"access_token": access_token},
                headers={"Authorization": f"Bearer {SSO_API_KEY}"}
            )
            response.raise_for_status()

            data = response.json()
            if not data.get('valid'):
                return jsonify({"error": "Invalid token"}), 401

            request.user = data['user']
            return f(*args, **kwargs)

        except requests.exceptions.RequestException:
            # Try to refresh token
            refresh_token = session.get('refresh_token')
            if not refresh_token:
                return jsonify({"error": "Not authenticated"}), 401

            try:
                refresh_response = requests.post(
                    f"{SSO_SERVER_URL}/api/refresh-token",
                    json={"refresh_token": refresh_token},
                    headers={"Authorization": f"Bearer {SSO_API_KEY}"}
                )
                refresh_response.raise_for_status()

                refresh_data = refresh_response.json()
                session['access_token'] = refresh_data['access_token']
                session['refresh_token'] = refresh_data['refresh_token']

                request.user = data['user']
                return f(*args, **kwargs)

            except requests.exceptions.RequestException:
                return jsonify({"error": "Authentication failed"}), 401

    return decorated_function

# 4. Logout
@auth_bp.route('/logout')
def logout():
    session.clear()
    return redirect('/login')
```

**Usage in app**:
```python
# app.py
from flask import Flask
from auth import auth_bp, authenticate_user

app = Flask(__name__)
app.secret_key = os.getenv('SESSION_SECRET')

# Register auth blueprint
app.register_blueprint(auth_bp, url_prefix='/auth')

# Protected route example
@app.route('/api/user/profile')
@authenticate_user
def user_profile():
    return jsonify({"user": request.user})

if __name__ == '__main__':
    app.run(port=3000)
```

### React (Frontend)

```javascript
// Auth.jsx
import React from 'react';

const SSO_API_BASE = process.env.REACT_APP_API_BASE; // Your backend API

export function LoginButton() {
  const handleLogin = () => {
    // Redirect to your backend, which redirects to SSO
    window.location.href = `${SSO_API_BASE}/auth/login`;
  };

  return <button onClick={handleLogin}>Login with SSO</button>;
}

export function LogoutButton() {
  const handleLogout = async () => {
    await fetch(`${SSO_API_BASE}/auth/logout`, { credentials: 'include' });
    window.location.href = '/login';
  };

  return <button onClick={handleLogout}>Logout</button>;
}

// Protected component
export function ProtectedRoute({ children }) {
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch(`${SSO_API_BASE}/api/user/profile`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => {
        window.location.href = '/login';
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!user) return null;

  return children;
}
```

---

## Testing Your Integration

### 1. Local Testing

**Start your app**:
```bash
npm run dev
# or
python app.py
```

**Test login flow**:
1. Navigate to `http://localhost:3000/auth/login`
2. Should redirect to SSO login page
3. Enter test credentials (created in Supabase)
4. Should redirect back to `http://localhost:3000/auth/callback?code=...`
5. Should exchange code and set cookies
6. Should redirect to homepage

**Test protected routes**:
```bash
curl -X GET http://localhost:3000/api/user/profile \
  --cookie "access_token=..."
```

### 2. Test with Postman

Import SSO endpoints:
1. Create new request: `POST {{sso_url}}/api/token-exchange`
2. Body (JSON):
   ```json
   {
     "code": "test_code_from_callback",
     "api_key": "{{api_key}}",
     "api_secret": "{{api_secret}}"
   }
   ```
3. Send request
4. Copy `access_token` from response
5. Test validation endpoint with token

### 3. Integration Tests

**Node.js (Jest + Supertest)**:
```javascript
// auth.test.js
import request from 'supertest';
import app from './index.js';

describe('SSO Integration', () => {
  it('should redirect to SSO login', async () => {
    const response = await request(app).get('/auth/login');
    expect(response.status).toBe(302);
    expect(response.headers.location).toContain('sso-system.vercel.app');
  });

  it('should exchange code for tokens', async () => {
    // Mock token exchange
    const response = await request(app)
      .get('/auth/callback')
      .query({ code: 'test_code' });

    expect(response.status).toBe(302);
    expect(response.headers['set-cookie']).toBeDefined();
  });
});
```

---

## Production Checklist

Before going live:

### Configuration
- [ ] Environment variables set in production
- [ ] API secret stored in secret management tool
- [ ] HTTPS enabled and enforced
- [ ] CORS origins configured correctly
- [ ] Redirect URLs whitelisted with SSO admin

### Security
- [ ] Cookies use `secure: true` and `httpOnly: true`
- [ ] Session secret is strong (32+ random chars)
- [ ] `.env` file added to `.gitignore`
- [ ] Rate limiting enabled on auth endpoints
- [ ] CSRF protection enabled (if using cookies)

### Error Handling
- [ ] User-friendly error messages
- [ ] Logging for auth failures
- [ ] Retry logic for token refresh
- [ ] Graceful fallback for SSO downtime

### Monitoring
- [ ] Track login success/failure rates
- [ ] Alert on high error rates
- [ ] Monitor token expiration issues
- [ ] Log all auth events

### Documentation
- [ ] Internal docs for developers
- [ ] Runbook for auth issues
- [ ] Contact info for SSO admin
- [ ] Emergency rollback plan

---

## Troubleshooting

### "Invalid redirect_url"

**Cause**: Redirect URL not whitelisted

**Solution**: Contact SSO admin to add your redirect URL

### "Invalid api_key or api_secret"

**Cause**: Incorrect credentials

**Solution**:
- Verify credentials in environment variables
- Check for typos (copy-paste from email)
- Contact admin to regenerate if lost

### "Code has expired"

**Cause**: Authorization code used after 10 minutes

**Solution**: Codes expire quickly - exchange immediately after redirect

### "Invalid or expired token"

**Cause**: Access token expired (1 hour lifetime)

**Solution**: Implement token refresh logic

### "CORS error"

**Cause**: Origin not whitelisted

**Solution**: Contact admin to add your domain to `allowed_origins`

### User stuck in login loop

**Cause**: Cookies not being set

**Solution**:
- Check browser allows cookies
- Verify `secure: true` only in production (not localhost HTTP)
- Check `sameSite` attribute
- Verify cookie domain matches your app domain

### Tokens not persisting across requests

**Cause**: Session storage misconfigured

**Solution**:
- Check session middleware is configured
- Verify `credentials: 'include'` in fetch requests
- Check `Access-Control-Allow-Credentials` header

---

## Support

- **SSO Admin**: Contact your SSO administrator
- **Documentation**: [ADMIN_GUIDE.md](./ADMIN_GUIDE.md)
- **GitHub Issues**: https://github.com/garimto81/sso-system/issues

---

**End of Integration Guide**
