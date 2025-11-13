# JWT Verification Failure - Root Cause Analysis

**Date**: 2025-11-13
**Issue**: Production login redirect fails due to JWT verification failure
**Deployment**: https://sso-frontend-e7jencwk9-garimto81s-projects.vercel.app

---

## 🔍 Problem Summary

**Symptom**: Login succeeds (200 OK), cookie is set, but accessing /admin redirects back to /login (307).

**Root Cause**: JWT signature verification failing in middleware.

---

## 🧪 Test Results

### Working: JWT Verification Disabled
**Deployment**: https://sso-frontend-1nv93kep1-garimto81s-projects.vercel.app
**Status**: ✅ Access to /admin works

```typescript
// Middleware with verification disabled
const payload = null // await verifyToken(token)
if (false && !payload) {
  // Verification bypassed
}
```

### Failing: JWT Verification Enabled
**Deployment**: https://sso-frontend-e7jencwk9-garimto81s-projects.vercel.app
**Status**: ❌ Access denied, redirects to /login

```typescript
// Middleware with verification enabled
const payload = await verifyToken(token)
if (!payload) {
  // Verification fails here!
  return NextResponse.redirect(new URL('/login', request.url))
}
```

---

## 🔑 Critical Discovery: JWT Secret Mismatch

### The JWT Flow

```
┌─────────────────────────────────────────────────────┐
│ 1. User logs in                                      │
│    → POST /api/auth/login                           │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 2. Backend calls Supabase Cloud                     │
│    → supabase.auth.signInWithPassword()             │
│    → Supabase CLOUD signs JWT with ITS secret       │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 3. Frontend stores JWT in httpOnly cookie          │
│    → sso_admin_token = <JWT from Supabase Cloud>   │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ 4. Middleware verifies JWT                         │
│    → jose.jwtVerify(token, JWT_SECRET)             │
│    → JWT_SECRET must match Supabase Cloud's secret │
│    ❌ FAILS if using wrong secret                   │
└─────────────────────────────────────────────────────┘
```

### ❗ The Problem

**Two different Supabase instances:**

1. **Local Supabase** (for development)
   - URL: `http://127.0.0.1:54321`
   - JWT Secret: `super-secret-jwt-token-with-at-least-32-characters-long`
   - Used for: Local testing only

2. **Supabase Cloud** (for production)
   - URL: `https://dqkghhlnnskjfwntdtor.supabase.co`
   - JWT Secret: **Different from local!**
   - Used for: Production backend (sso-backend-eight.vercel.app)

**Current Issue:**
- Backend uses **Supabase Cloud** → JWT signed with **Cloud JWT secret**
- Frontend middleware uses `process.env.SUPABASE_JWT_SECRET`
- If Vercel has **local JWT secret** → verification fails ❌
- If Vercel has **cloud JWT secret** → verification succeeds ✅

---

## ✅ Solution

### Step 1: Find Correct Supabase Cloud JWT Secret

Go to your Supabase Cloud project dashboard:

1. Open: https://supabase.com/dashboard/project/dqkghhlnnskjfwntdtor
2. Navigate to: **Settings** → **API**
3. Find section: **JWT Settings**
4. Copy: **JWT Secret** (NOT the anon key!)

Example location:
```
Settings → API → JWT Settings
┌─────────────────────────────────────────┐
│ JWT Secret                               │
│ ••••••••••••••••••••••••••••••••••••••  │
│ [Show] [Copy]                            │
└─────────────────────────────────────────┘
```

### Step 2: Set Environment Variable in Vercel

Option A: Via Vercel CLI
```bash
cd admin-dashboard

# Remove old value if exists
vercel env rm SUPABASE_JWT_SECRET production

# Add correct cloud JWT secret
vercel env add SUPABASE_JWT_SECRET production
# Paste the JWT secret from Step 1 when prompted
```

Option B: Via Vercel Dashboard
1. Go to: https://vercel.com/garimto81s-projects/sso-frontend/settings/environment-variables
2. Find: `SUPABASE_JWT_SECRET`
3. Click: **Edit**
4. Replace with: JWT secret from Supabase Cloud (Step 1)
5. Ensure scope: **Production** is checked
6. Save changes

### Step 3: Redeploy

The environment variable change won't take effect until you redeploy:

```bash
cd admin-dashboard
vercel --prod --yes
```

Or trigger redeploy via Vercel Dashboard:
- Go to Deployments → Latest deployment → ⋯ → Redeploy

### Step 4: Verify Fix

```bash
# Test login flow
node test-production-debug.js
```

Expected output:
```
Step 1: Login API
  Status: 200
  ✅ Cookie set

Step 2: Access /admin with cookie
  Status: 200
  ✅ Access granted
```

---

## 🧪 Diagnostic Enhancements Added

### Enhanced Middleware Logging

File: `admin-dashboard/middleware.ts`

```typescript
async function verifyToken(token: string) {
  try {
    // DEBUG: Log token and secret info
    console.log('[Middleware] JWT Verification Debug:', {
      tokenLength: token?.length || 0,
      tokenFirstChars: token?.substring(0, 20),
      hasJwtSecret: !!process.env.SUPABASE_JWT_SECRET,
      jwtSecretLength: process.env.SUPABASE_JWT_SECRET?.length || 0,
      jwtSecretFirstChars: process.env.SUPABASE_JWT_SECRET?.substring(0, 10),
    })

    const { payload } = await jose.jwtVerify(token, JWT_SECRET)
    console.log('[Middleware] JWT verification successful')
    return payload
  } catch (error) {
    console.error('[Middleware] JWT verification failed:', {
      error: error.message,
      errorName: error.name,
    })
    return null
  }
}
```

### Debug Endpoint

File: `admin-dashboard/app/api/debug/env/route.ts`

**Purpose**: Check if environment variables are accessible in production.

**Usage** (after setting `ENABLE_DEBUG=true` in Vercel):
```bash
curl https://sso-frontend-<deployment-id>.vercel.app/api/debug/env
```

**Response**:
```json
{
  "secrets": {
    "SUPABASE_JWT_SECRET": {
      "exists": true,
      "length": 64,
      "firstChars": "eyJhbGciOi...",
      "lastChars": "...Qssw5c"
    }
  }
}
```

---

## 📊 Comparison: Local vs Cloud

| Property | Local Supabase | Supabase Cloud |
|----------|----------------|----------------|
| URL | `http://127.0.0.1:54321` | `https://dqkghhlnnskjfwntdtor.supabase.co` |
| JWT Secret | `super-secret-jwt...` | `<different secret>` |
| Used by | Development only | Production backend |
| JWT issuer | Local instance | Cloud instance |
| Valid in middleware | ❌ No (production) | ✅ Yes (production) |

---

## ⚠️ Security Notes

**After fixing:**
1. Remove debug logging from middleware (contains sensitive info)
2. Remove `/api/debug/*` endpoint (security risk)
3. Verify SUPABASE_JWT_SECRET is marked as **sensitive** in Vercel

**Edit**: `admin-dashboard/middleware.ts`
```typescript
// Remove all console.log statements with token/secret info
async function verifyToken(token: string) {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET)
    return payload
  } catch (error) {
    return null
  }
}
```

**Delete**: `admin-dashboard/app/api/debug/`

---

## 📝 Related Issues

- **Issue #19**: JWT verification failing in production
- **PR #17**: Previous hotfix for window.location.href redirect
- **Deployment**: https://sso-frontend-e7jencwk9-garimto81s-projects.vercel.app

---

## 🎯 Next Steps

1. [ ] Get Supabase Cloud JWT secret from dashboard
2. [ ] Set SUPABASE_JWT_SECRET in Vercel (production)
3. [ ] Redeploy admin dashboard
4. [ ] Test login flow
5. [ ] Remove debug logging
6. [ ] Remove debug endpoint
7. [ ] Close Issue #19

---

**Status**: Waiting for user to set correct Supabase Cloud JWT secret in Vercel.

**ETA**: 5 minutes (once correct secret is added).
