# ⚡ JWT Verification Fix - Quick Guide

**Problem**: Login works but /admin redirect fails (307 → /login)

**Root Cause**: Wrong JWT secret in Vercel

---

## 🎯 Quick Fix (5 minutes)

### Step 1: Get Correct JWT Secret

Open your Supabase Cloud dashboard:
**https://supabase.com/dashboard/project/dqkghhlnnskjfwntdtor/settings/api**

Find section "JWT Settings" and copy the **JWT Secret** (not anon key!).

### Step 2: Update Vercel Environment Variable

```bash
cd admin-dashboard

# Set the correct secret
vercel env add SUPABASE_JWT_SECRET production
# Paste the JWT secret from Step 1 when prompted

# Redeploy
vercel --prod --yes
```

### Step 3: Test

```bash
node test-production-debug.js
```

Expected result:
```
Step 2: Access /admin with cookie
  Status: 200
  ✅ Access granted
```

---

## ❓ Why This Happened

Your backend uses **Supabase Cloud** which signs JWTs with **Supabase Cloud's JWT secret**.

If Vercel has the **local development JWT secret** instead → verification fails.

**Two different secrets:**
- Local: `super-secret-jwt-token-with-at-least-32-characters-long`
- Cloud: `<different secret from Supabase dashboard>`

**Production must use Cloud secret!**

---

## 📋 Full Details

See: `docs/JWT_VERIFICATION_DIAGNOSIS.md`

---

**Current Deployment**: https://sso-frontend-e7jencwk9-garimto81s-projects.vercel.app
**Status**: ⏳ Waiting for correct JWT secret in Vercel
