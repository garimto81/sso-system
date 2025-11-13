# CORS Fix Summary

## Problem

Backend SSO Server deployed on Vercel was NOT returning the `Access-Control-Allow-Origin` header, causing CORS errors when accessed from the frontend.

**Symptoms:**
- Frontend requests blocked by browser CORS policy
- `curl` tests showed missing `Access-Control-Allow-Origin` header
- Environment variables were correctly set in Vercel

## Root Cause

The CORS middleware configuration was incorrect. The original code:

```javascript
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));
```

**Issue:** When passing an array of origins directly to the `cors` library, the library needs to match the incoming `Origin` header **exactly**. However, there might have been issues with:
1. Whitespace in the environment variable
2. The CORS library not properly handling the array format
3. The way Vercel processes environment variables

## Solution

Implemented a **function-based origin check** instead of passing an array directly:

```javascript
const rawAllowedOrigins = process.env.ALLOWED_ORIGINS;

let corsOptions;
if (!rawAllowedOrigins || rawAllowedOrigins.trim() === '') {
  // No ALLOWED_ORIGINS set - allow all (for development)
  corsOptions = {
    origin: '*',
    credentials: true
  };
} else {
  // Parse and trim origins
  const allowedOrigins = rawAllowedOrigins.split(',').map(origin => origin.trim());

  corsOptions = {
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, Postman, curl)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true
  };
}

app.use(cors(corsOptions));
```

**Additional Fix:** Added `trust proxy` setting for Vercel:

```javascript
app.set('trust proxy', 1);
```

This is required for:
- Rate limiting to work correctly (identify user IPs behind Vercel proxy)
- Proper handling of `X-Forwarded-For` header

## Verification

**Test Results:**

1. **Allowed Origin:**
   ```bash
   curl -I -H "Origin: https://sso-frontend-ecyva32fq-garimto81s-projects.vercel.app" \
     https://sso-backend-eight.vercel.app/health
   ```
   Returns: `Access-Control-Allow-Origin: https://sso-frontend-ecyva32fq-garimto81s-projects.vercel.app` ✅

2. **No Origin (server-to-server):**
   ```bash
   curl -I https://sso-backend-eight.vercel.app/health
   ```
   Returns: `200 OK` (works correctly) ✅

3. **Disallowed Origin:**
   ```bash
   curl -I -H "Origin: https://evil-site.com" https://sso-backend-eight.vercel.app/health
   ```
   Returns: `500 Internal Server Error` (correctly rejected) ✅

## Key Changes

**Files Modified:**
1. `server/src/index.js` - CORS configuration + trust proxy
2. `server/api/index.js` - Added environment variable logging

**Commits:**
- Added function-based CORS origin check with whitespace trimming
- Added `trust proxy` setting for Vercel
- Added debug logging for environment variables

## Deployment

```bash
cd server
vercel --prod --token YOUR_TOKEN --yes
```

## Future Improvements

1. **Environment-specific CORS:**
   - Development: Allow all origins (`*`)
   - Production: Strict whitelist

2. **CORS Logging:**
   - Add structured logging for CORS rejections
   - Track suspicious origin attempts

3. **Multiple Frontends:**
   - Support multiple frontend URLs in ALLOWED_ORIGINS
   - Example: `https://frontend1.com,https://frontend2.com`

## Testing Checklist

- [x] Allowed origin receives `Access-Control-Allow-Origin` header
- [x] Server-to-server requests (no Origin) work correctly
- [x] Disallowed origins are rejected (500 error)
- [x] `credentials: true` is present in all responses
- [x] Rate limiting works without errors
- [x] Frontend can successfully make API calls

## References

- [CORS npm package](https://www.npmjs.com/package/cors)
- [Express trust proxy](https://expressjs.com/en/guide/behind-proxies.html)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

---

**Date:** 2025-11-12
**Status:** ✅ Fixed and Deployed
**Deployed URL:** https://sso-backend-eight.vercel.app
