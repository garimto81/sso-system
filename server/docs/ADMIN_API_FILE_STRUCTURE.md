# SSO Admin Dashboard - File Structure & Code Interfaces

**Version**: 1.0.0
**Date**: 2025-01-12
**Status**: Design Phase

This document provides a detailed breakdown of all files to be created for the Admin Dashboard Backend API, including their interfaces, function signatures, and dependencies.

---

## Table of Contents

1. [Directory Tree](#directory-tree)
2. [Middleware Files](#middleware-files)
3. [Route Files](#route-files)
4. [Utility Files](#utility-files)
5. [Test Files](#test-files)
6. [Database Migration](#database-migration)
7. [Configuration Files](#configuration-files)

---

## Directory Tree

```
server/
├── src/
│   ├── index.js                        # Entry point (UPDATE existing)
│   │
│   ├── middleware/
│   │   ├── auth.js                     # Existing
│   │   ├── authenticateAdmin.js        # NEW
│   │   ├── adminRateLimiter.js         # NEW
│   │   ├── rateLimiter.js              # Existing
│   │   ├── httpsRedirect.js            # Existing
│   │   └── errorHandler.js             # NEW
│   │
│   ├── routes/
│   │   ├── auth.js                     # Existing
│   │   ├── api.js                      # Existing (UPDATE for analytics)
│   │   └── admin.js                    # NEW
│   │
│   ├── utils/
│   │   ├── supabase.js                 # Existing
│   │   ├── crypto.js                   # NEW
│   │   ├── validators.js               # NEW
│   │   └── analytics.js                # NEW
│   │
│   └── __tests__/
│       ├── middleware/
│       │   ├── authenticateAdmin.test.js
│       │   └── errorHandler.test.js
│       ├── routes/
│       │   └── admin.test.js
│       └── utils/
│           ├── crypto.test.js
│           ├── validators.test.js
│           └── analytics.test.js
│
├── docs/
│   ├── ADMIN_API_ARCHITECTURE.md       # Design doc (created)
│   ├── API_ADMIN_SPEC.md               # API spec (created)
│   ├── ADMIN_API_FILE_STRUCTURE.md     # This file
│   └── postman/
│       └── Admin_API.json              # Postman collection (to be created)
│
├── package.json                        # UPDATE (add dependencies)
├── jest.config.js                      # NEW
└── .env.example                        # Existing (no changes)

supabase/
└── migrations/
    └── 20250113000001_app_analytics.sql # NEW
```

---

## Middleware Files

### 1. server/src/middleware/authenticateAdmin.js (NEW)

**Purpose**: Authenticate admin users for dashboard API access.

**Dependencies**:
- `@supabase/supabase-js` (supabaseAdmin)
- `dotenv` (for env vars)

**Interface**:
```javascript
/**
 * Middleware: Authenticate Admin
 * Validates JWT token and checks admin role
 *
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 * @returns {void}
 *
 * Side effects:
 * - Sets req.user = { id, email, role }
 * - Calls next() on success
 * - Sends 401/403 response on failure
 */
async function authenticateAdmin(req, res, next)

export default authenticateAdmin;
```

**Implementation Template**:
```javascript
/**
 * Admin Authentication Middleware
 * Validates JWT and enforces admin role
 */

import { supabaseAdmin } from '../utils/supabase.js';

/**
 * Middleware: Authenticate Admin
 *
 * Flow:
 * 1. Extract Authorization header
 * 2. Verify Bearer token format
 * 3. Validate token with Supabase
 * 4. Query profiles table for role
 * 5. Check role === 'admin'
 * 6. Attach user to req.user
 */
async function authenticateAdmin(req, res, next) {
  try {
    // 1. Extract token
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Missing or invalid authorization header'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // 2. Verify token with Supabase
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Invalid or expired token'
      });
    }

    // 3. Check admin role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'admin') {
      // Log failed admin access attempt for security audit
      console.warn(`[Security] Non-admin access attempt: ${user.email}`);

      return res.status(403).json({
        error: 'forbidden',
        message: 'Admin access required'
      });
    }

    // 4. Attach user to request
    req.user = {
      id: user.id,
      email: user.email,
      role: profile.role
    };

    next();

  } catch (err) {
    console.error('[authenticateAdmin] Error:', err);
    res.status(500).json({
      error: 'internal_error',
      message: 'Authentication failed'
    });
  }
}

export default authenticateAdmin;
```

**Test Cases** (authenticateAdmin.test.js):
1. ✅ Should return 401 if no Authorization header
2. ✅ Should return 401 if token is invalid
3. ✅ Should return 403 if user is not admin
4. ✅ Should call next() and set req.user if admin
5. ✅ Should handle database errors gracefully

---

### 2. server/src/middleware/adminRateLimiter.js (NEW)

**Purpose**: Rate limit admin API requests to prevent abuse.

**Dependencies**:
- `express-rate-limit`

**Interface**:
```javascript
/**
 * Rate limiter for admin endpoints
 * Limit: 100 requests per minute per user
 */
import rateLimit from 'express-rate-limit';

const adminRateLimiter = rateLimit({
  windowMs: 60 * 1000,           // 1 minute
  max: 100,                      // 100 requests per window
  keyGenerator: (req) => req.user?.id || req.ip, // Per user (or IP if no user)
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'rate_limit_exceeded',
      message: 'Too many requests. Please try again in 1 minute.',
      retryAfter: 60
    });
  }
});

export default adminRateLimiter;
```

---

### 3. server/src/middleware/errorHandler.js (NEW)

**Purpose**: Centralized error handling for consistent error responses.

**Dependencies**: None (built-in)

**Interface**:
```javascript
/**
 * Centralized Error Handler
 * Formats errors and sends consistent responses
 *
 * @param {Error} err - Error object
 * @param {Request} req - Express request
 * @param {Response} res - Express response
 * @param {NextFunction} next - Express next
 */
function errorHandler(err, req, res, next)

export default errorHandler;
```

**Implementation Template**:
```javascript
/**
 * Centralized Error Handler Middleware
 */

function errorHandler(err, req, res, next) {
  // Log error with context
  console.error('[Error]', {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    user: req.user?.email || 'anonymous',
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Handle specific error types

  // Supabase/PostgreSQL errors
  if (err.code?.startsWith('PGRST') || err.code?.startsWith('23')) {
    if (err.code === '23505') { // Unique constraint violation
      return res.status(409).json({
        error: 'conflict',
        message: 'Resource already exists',
        details: err.message
      });
    }

    return res.status(500).json({
      error: 'database_error',
      message: 'Database operation failed',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  // Validation errors (custom or from express-validator)
  if (err.name === 'ValidationError' || err.error === 'validation_error') {
    return res.status(400).json({
      error: 'validation_error',
      message: err.message || 'Validation failed',
      details: err.details || err.errors
    });
  }

  // Rate limit errors
  if (err.name === 'RateLimitError') {
    return res.status(429).json({
      error: 'rate_limit_exceeded',
      message: 'Too many requests. Please try again later.',
      retryAfter: err.retryAfter
    });
  }

  // Default error response
  const statusCode = err.status || err.statusCode || 500;
  const errorCode = err.error || (statusCode === 500 ? 'internal_error' : 'request_failed');

  res.status(statusCode).json({
    error: errorCode,
    message: err.message || 'An unexpected error occurred',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}

export default errorHandler;
```

---

## Route Files

### 4. server/src/routes/admin.js (NEW)

**Purpose**: Admin dashboard API endpoints for app management.

**Dependencies**:
- `express`
- `../middleware/authenticateAdmin.js`
- `../middleware/adminRateLimiter.js`
- `../utils/supabase.js` (supabaseAdmin)
- `../utils/crypto.js`
- `../utils/validators.js`
- `../utils/analytics.js`

**Interface**:
```javascript
/**
 * Admin Dashboard Routes
 * All routes require admin authentication
 */
import express from 'express';
import authenticateAdmin from '../middleware/authenticateAdmin.js';
import adminRateLimiter from '../middleware/adminRateLimiter.js';

const router = express.Router();

// Apply middleware to all routes
router.use(authenticateAdmin);
router.use(adminRateLimiter);

// Route handlers
router.get('/apps', listApps);
router.post('/apps', createApp);
router.get('/apps/:id', getApp);
router.put('/apps/:id', updateApp);
router.delete('/apps/:id', deleteApp);
router.post('/apps/:id/regenerate-secret', regenerateSecret);
router.get('/apps/:id/analytics', getAppAnalytics);
router.get('/dashboard', getDashboard);

export default router;
```

**Route Handler Signatures**:

```javascript
/**
 * GET /api/v1/admin/apps
 * List all apps with pagination, search, filter
 */
async function listApps(req, res, next) {
  // Query params: search, status, page, limit, sort, order
  // Returns: { apps: [], pagination: {} }
}

/**
 * POST /api/v1/admin/apps
 * Create new app
 */
async function createApp(req, res, next) {
  // Body: { name, description, redirect_urls, allowed_origins, auth_method, owner_email }
  // Returns: { message, app: { id, api_key, api_secret (plain!) } }
}

/**
 * GET /api/v1/admin/apps/:id
 * Get app details
 */
async function getApp(req, res, next) {
  // Params: id
  // Returns: { id, name, api_key, api_secret (hashed), owner, stats, ... }
}

/**
 * PUT /api/v1/admin/apps/:id
 * Update app (partial updates allowed)
 */
async function updateApp(req, res, next) {
  // Params: id
  // Body: { name?, description?, redirect_urls?, is_active?, ... }
  // Returns: { message, app: {} }
}

/**
 * DELETE /api/v1/admin/apps/:id
 * Delete or deactivate app
 */
async function deleteApp(req, res, next) {
  // Params: id
  // Query: permanent (boolean)
  // Returns: { message, app_id }
}

/**
 * POST /api/v1/admin/apps/:id/regenerate-secret
 * Regenerate API secret
 */
async function regenerateSecret(req, res, next) {
  // Params: id
  // Body: { confirmation: "app-name" }
  // Returns: { message, api_secret (plain!), warning }
}

/**
 * GET /api/v1/admin/apps/:id/analytics
 * Get app analytics
 */
async function getAppAnalytics(req, res, next) {
  // Params: id
  // Query: period ('7d' | '30d' | '90d')
  // Returns: { period, metrics, login_trend, top_users, recent_errors }
}

/**
 * GET /api/v1/admin/dashboard
 * Global dashboard stats
 */
async function getDashboard(req, res, next) {
  // Returns: { summary, top_apps, recent_activity }
}
```

**Implementation Notes**:
- Each handler should wrap logic in `try-catch`
- Pass errors to `next(err)` for centralized handling
- Use utility functions for validation and crypto
- Record analytics events for all mutations

---

### 5. server/src/index.js (UPDATE existing)

**Changes Required**:

```javascript
// Add import
import adminRoutes from './routes/admin.js';
import errorHandler from './middleware/errorHandler.js';

// Mount admin routes (after existing routes)
app.use('/api/v1/admin', adminRoutes);

// Add error handler (MUST be last middleware)
app.use(errorHandler);
```

---

### 6. server/src/routes/api.js (UPDATE existing)

**Changes Required**: Add analytics recording to existing endpoints.

```javascript
// Add import
import { recordAnalyticsEvent } from '../utils/analytics.js';

// In /authorize endpoint (after generating code):
await recordAnalyticsEvent(app.id, 'login', user.id, {
  ip_address: req.ip,
  user_agent: req.headers['user-agent']
});

// In /token/exchange endpoint (after token generation):
await recordAnalyticsEvent(app.id, 'token_exchange', authCode.user_id, {
  ip_address: req.ip,
  user_agent: req.headers['user-agent']
});

// In error handlers:
await recordAnalyticsEvent(app_id, 'error', user_id || null, {
  error_type: 'token_invalid',
  error_message: error.message
});
```

---

## Utility Files

### 7. server/src/utils/crypto.js (NEW)

**Purpose**: Cryptographic utilities for key generation and secret hashing.

**Dependencies**:
- `crypto` (built-in)
- `bcryptjs`

**Interface**:
```javascript
/**
 * Generate API Key (UUID v4)
 * @returns {string} UUID
 */
function generateApiKey()

/**
 * Generate API Secret (64-char hex string)
 * @returns {string} 64-character hex string
 */
function generateApiSecret()

/**
 * Hash API Secret with bcrypt
 * @param {string} secret - Plain text secret
 * @returns {Promise<string>} Bcrypt hash
 */
async function hashSecret(secret)

/**
 * Verify API Secret against hash
 * @param {string} plain - Plain text secret
 * @param {string} hash - Bcrypt hash
 * @returns {Promise<boolean>} True if match
 */
async function verifySecret(plain, hash)

export { generateApiKey, generateApiSecret, hashSecret, verifySecret };
```

**Implementation**:
```javascript
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

export function generateApiKey() {
  return crypto.randomUUID();
}

export function generateApiSecret() {
  return crypto.randomBytes(32).toString('hex'); // 64 characters
}

export async function hashSecret(secret) {
  return bcrypt.hash(secret, 10); // 10 rounds
}

export async function verifySecret(plain, hash) {
  return bcrypt.compare(plain, hash);
}
```

**Test Cases**:
1. ✅ generateApiKey returns valid UUID
2. ✅ generateApiSecret returns 64-char hex string
3. ✅ hashSecret produces bcrypt hash
4. ✅ verifySecret correctly validates hashes
5. ✅ Different secrets produce different hashes

---

### 8. server/src/utils/validators.js (NEW)

**Purpose**: Input validation helpers for app data.

**Dependencies**: None (built-in)

**Interface**:
```javascript
/**
 * Validate redirect URL
 * @param {string} url - URL to validate
 * @returns {{ valid: boolean, error?: string }}
 */
function validateRedirectUrl(url)

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {{ valid: boolean, error?: string }}
 */
function validateEmail(email)

/**
 * Validate app name
 * @param {string} name - App name to validate
 * @returns {{ valid: boolean, error?: string }}
 */
function validateAppName(name)

/**
 * Validate app data (comprehensive)
 * @param {object} data - App data object
 * @returns {{ valid: boolean, errors?: object }}
 */
function validateAppData(data)

export { validateRedirectUrl, validateEmail, validateAppName, validateAppData };
```

**Implementation**:
```javascript
export function validateRedirectUrl(url) {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'URL must be HTTP or HTTPS' };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }
  return { valid: true };
}

export function validateAppName(name) {
  if (!name || name.length < 3 || name.length > 100) {
    return { valid: false, error: 'Name must be 3-100 characters' };
  }
  if (!/^[a-zA-Z0-9\s\-]+$/.test(name)) {
    return { valid: false, error: 'Name can only contain letters, numbers, spaces, and hyphens' };
  }
  return { valid: true };
}

export function validateAppData(data) {
  const errors = {};

  // Validate name
  const nameValidation = validateAppName(data.name);
  if (!nameValidation.valid) {
    errors.name = nameValidation.error;
  }

  // Validate redirect_urls
  if (!data.redirect_urls || data.redirect_urls.length === 0) {
    errors.redirect_urls = 'At least one redirect URL is required';
  } else {
    const invalidUrls = data.redirect_urls.filter(url => !validateRedirectUrl(url).valid);
    if (invalidUrls.length > 0) {
      errors.redirect_urls = `Invalid URLs: ${invalidUrls.join(', ')}`;
    }
  }

  // Validate owner_email
  if (data.owner_email) {
    const emailValidation = validateEmail(data.owner_email);
    if (!emailValidation.valid) {
      errors.owner_email = emailValidation.error;
    }
  }

  // Validate auth_method
  const validAuthMethods = ['token_exchange', 'shared_cookie', 'hybrid'];
  if (data.auth_method && !validAuthMethods.includes(data.auth_method)) {
    errors.auth_method = `Must be one of: ${validAuthMethods.join(', ')}`;
  }

  return Object.keys(errors).length > 0
    ? { valid: false, errors }
    : { valid: true };
}
```

**Test Cases**:
1. ✅ validateRedirectUrl accepts valid HTTP(S) URLs
2. ✅ validateRedirectUrl rejects invalid URLs
3. ✅ validateEmail accepts valid emails
4. ✅ validateEmail rejects invalid emails
5. ✅ validateAppName enforces length and format
6. ✅ validateAppData returns all validation errors

---

### 9. server/src/utils/analytics.js (NEW)

**Purpose**: Record analytics events for app usage and admin actions.

**Dependencies**:
- `../utils/supabase.js` (supabaseAdmin)

**Interface**:
```javascript
/**
 * Record Analytics Event
 * Inserts event into app_analytics table
 *
 * @param {string} app_id - App UUID
 * @param {string} event_type - Event type (login, token_exchange, etc.)
 * @param {string|null} user_id - User UUID (optional)
 * @param {object} metadata - Additional event data (optional)
 * @returns {Promise<void>}
 *
 * Note: Errors are logged but not thrown (analytics failure shouldn't break main flow)
 */
async function recordAnalyticsEvent(app_id, event_type, user_id = null, metadata = {})

export default recordAnalyticsEvent;
```

**Implementation**:
```javascript
import { supabaseAdmin } from './supabase.js';

/**
 * Record Analytics Event
 *
 * Event types:
 * - app_created, app_updated, app_deleted, secret_regenerated
 * - login, token_exchange, token_refresh, token_revoke
 * - error
 */
async function recordAnalyticsEvent(app_id, event_type, user_id = null, metadata = {}) {
  try {
    const { error } = await supabaseAdmin
      .from('app_analytics')
      .insert({
        app_id,
        event_type,
        user_id,
        metadata,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('[Analytics] Failed to record event:', {
        app_id,
        event_type,
        error: error.message
      });
      // Don't throw - analytics failure shouldn't break main flow
    }
  } catch (err) {
    console.error('[Analytics] Unexpected error:', err);
  }
}

export default recordAnalyticsEvent;
```

**Test Cases**:
1. ✅ Successfully inserts event into database
2. ✅ Handles null user_id gracefully
3. ✅ Logs errors but doesn't throw
4. ✅ Accepts metadata object
5. ✅ Works with all event types

---

## Test Files

### 10. server/src/__tests__/middleware/authenticateAdmin.test.js

**Purpose**: Unit tests for admin authentication middleware.

**Test Suite Structure**:
```javascript
import authenticateAdmin from '../../middleware/authenticateAdmin.js';
import { supabaseAdmin } from '../../utils/supabase.js';

jest.mock('../../utils/supabase.js');

describe('authenticateAdmin middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {}, user: null };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('Authorization header validation', () => {
    test('should return 401 if no Authorization header', async () => { /* ... */ });
    test('should return 401 if not Bearer format', async () => { /* ... */ });
  });

  describe('Token validation', () => {
    test('should return 401 if token is invalid', async () => { /* ... */ });
    test('should return 401 if token is expired', async () => { /* ... */ });
  });

  describe('Role validation', () => {
    test('should return 403 if user is not admin', async () => { /* ... */ });
    test('should return 403 if profile not found', async () => { /* ... */ });
  });

  describe('Success cases', () => {
    test('should call next() and set req.user if admin', async () => { /* ... */ });
    test('should attach correct user data to req', async () => { /* ... */ });
  });

  describe('Error handling', () => {
    test('should handle database errors gracefully', async () => { /* ... */ });
  });
});
```

---

### 11. server/src/__tests__/routes/admin.test.js

**Purpose**: Integration tests for admin API endpoints.

**Test Suite Structure**:
```javascript
import request from 'supertest';
import app from '../../index.js';
import { supabaseAdmin } from '../../utils/supabase.js';

describe('Admin API Endpoints', () => {
  let adminToken;

  beforeAll(async () => {
    // Setup: Create test admin user and get token
    adminToken = await createTestAdminUser();
  });

  afterAll(async () => {
    // Cleanup: Delete test data
    await cleanupTestData();
  });

  describe('POST /api/v1/admin/apps', () => {
    test('should create app with valid data', async () => { /* ... */ });
    test('should return 400 if name already exists', async () => { /* ... */ });
    test('should return 400 if redirect_urls invalid', async () => { /* ... */ });
    test('should return 401 if not authenticated', async () => { /* ... */ });
    test('should return 403 if not admin', async () => { /* ... */ });
  });

  describe('GET /api/v1/admin/apps', () => {
    test('should list all apps', async () => { /* ... */ });
    test('should support pagination', async () => { /* ... */ });
    test('should support search', async () => { /* ... */ });
    test('should support status filter', async () => { /* ... */ });
  });

  describe('GET /api/v1/admin/apps/:id', () => {
    test('should return app details', async () => { /* ... */ });
    test('should return 404 if app not found', async () => { /* ... */ });
  });

  describe('PUT /api/v1/admin/apps/:id', () => {
    test('should update app', async () => { /* ... */ });
    test('should support partial updates', async () => { /* ... */ });
    test('should return 409 if name conflicts', async () => { /* ... */ });
  });

  describe('DELETE /api/v1/admin/apps/:id', () => {
    test('should deactivate app by default', async () => { /* ... */ });
    test('should permanently delete if permanent=true', async () => { /* ... */ });
  });

  describe('POST /api/v1/admin/apps/:id/regenerate-secret', () => {
    test('should regenerate secret with confirmation', async () => { /* ... */ });
    test('should return 400 if confirmation mismatch', async () => { /* ... */ });
  });

  describe('GET /api/v1/admin/apps/:id/analytics', () => {
    test('should return analytics data', async () => { /* ... */ });
    test('should support period filter', async () => { /* ... */ });
  });

  describe('GET /api/v1/admin/dashboard', () => {
    test('should return dashboard stats', async () => { /* ... */ });
  });
});
```

---

## Database Migration

### 12. supabase/migrations/20250113000001_app_analytics.sql (NEW)

**Purpose**: Create analytics table, views, functions, and policies.

**Content**:
```sql
-- ============================================================================
-- Migration: app_analytics table and related objects
-- Created: 2025-01-13
-- ============================================================================

-- Step 1: Create app_analytics table
CREATE TABLE IF NOT EXISTS public.app_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'app_created', 'app_updated', 'app_deleted', 'secret_regenerated',
    'login', 'token_exchange', 'token_refresh', 'token_revoke', 'error'
  )),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Step 2: Create indexes
CREATE INDEX idx_app_analytics_app_time
  ON public.app_analytics(app_id, created_at DESC);

CREATE INDEX idx_app_analytics_event_type
  ON public.app_analytics(event_type);

CREATE INDEX idx_app_analytics_user
  ON public.app_analytics(user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX idx_app_analytics_created
  ON public.app_analytics(created_at DESC);

-- Partial index for recent events (last 90 days)
CREATE INDEX idx_app_analytics_recent
  ON public.app_analytics(app_id, event_type, created_at DESC)
  WHERE created_at > NOW() - INTERVAL '90 days';

-- Step 3: Update app_usage_stats view
CREATE OR REPLACE VIEW public.app_usage_stats AS
SELECT
  a.id as app_id,
  a.name as app_name,
  a.is_active,
  COUNT(DISTINCT an.user_id) FILTER (
    WHERE an.created_at > NOW() - INTERVAL '30 days'
  ) as active_users_30d,
  COUNT(*) FILTER (
    WHERE an.event_type = 'login'
    AND an.created_at > NOW() - INTERVAL '30 days'
  ) as logins_30d,
  COUNT(*) FILTER (
    WHERE an.event_type = 'token_exchange'
    AND an.created_at > NOW() - INTERVAL '30 days'
  ) as token_requests_30d,
  ROUND(
    100.0 *
    COUNT(*) FILTER (
      WHERE an.event_type = 'error'
      AND an.created_at > NOW() - INTERVAL '30 days'
    ) /
    NULLIF(
      COUNT(*) FILTER (
        WHERE an.created_at > NOW() - INTERVAL '30 days'
      ),
      0
    ),
    2
  ) as error_rate_30d,
  MAX(an.created_at) FILTER (
    WHERE an.event_type IN ('login', 'token_exchange')
  ) as last_used
FROM public.apps a
LEFT JOIN public.app_analytics an ON a.id = an.app_id
GROUP BY a.id, a.name, a.is_active;

GRANT SELECT ON public.app_usage_stats TO authenticated;

-- Step 4: Create get_login_trend function
CREATE OR REPLACE FUNCTION public.get_login_trend(
  p_app_id UUID,
  p_days INT DEFAULT 30
)
RETURNS TABLE (
  date DATE,
  login_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(created_at) as date,
    COUNT(*) as login_count
  FROM public.app_analytics
  WHERE app_id = p_app_id
    AND event_type = 'login'
    AND created_at > NOW() - (p_days || ' days')::INTERVAL
  GROUP BY DATE(created_at)
  ORDER BY date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_login_trend(UUID, INT) TO authenticated;

-- Step 5: Create get_top_users function
CREATE OR REPLACE FUNCTION public.get_top_users(
  p_app_id UUID,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  display_name TEXT,
  login_count BIGINT,
  last_login TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    an.user_id,
    p.email,
    p.display_name,
    COUNT(*) as login_count,
    MAX(an.created_at) as last_login
  FROM public.app_analytics an
  JOIN public.profiles p ON an.user_id = p.id
  WHERE an.app_id = p_app_id
    AND an.event_type = 'login'
    AND an.created_at > NOW() - INTERVAL '30 days'
  GROUP BY an.user_id, p.email, p.display_name
  ORDER BY login_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_top_users(UUID, INT) TO authenticated;

-- Step 6: Enable RLS and create policies
ALTER TABLE public.app_analytics ENABLE ROW LEVEL SECURITY;

-- Service role can insert (for backend)
CREATE POLICY "Service role can insert analytics"
  ON public.app_analytics
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Admins can view all analytics
CREATE POLICY "Admins can view all analytics"
  ON public.app_analytics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- App owners can view their own app analytics
CREATE POLICY "Owners can view own app analytics"
  ON public.app_analytics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.apps
      WHERE id = app_analytics.app_id
      AND owner_id = auth.uid()
    )
  );

-- Add comments
COMMENT ON TABLE public.app_analytics IS 'Analytics and audit log for app usage';
COMMENT ON COLUMN public.app_analytics.event_type IS 'Type of event tracked';
COMMENT ON COLUMN public.app_analytics.metadata IS 'Additional event data (JSON)';

-- Verification
SELECT 'Migration complete: app_analytics table created' as status;
```

---

## Configuration Files

### 13. jest.config.js (NEW)

**Purpose**: Jest test configuration.

**Content**:
```javascript
export default {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/__tests__/**',
    '!src/index.js'
  ],
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80
    }
  },
  transform: {},
  moduleFileExtensions: ['js'],
  verbose: true
};
```

---

### 14. server/package.json (UPDATE existing)

**Changes Required**:

Add new dependencies:
```json
{
  "dependencies": {
    "express-validator": "^7.0.1"
  },
  "devDependencies": {
    "jest": "^29.7.0",
    "supertest": "^6.3.3",
    "@types/jest": "^29.5.11"
  },
  "scripts": {
    "test": "node --experimental-vm-modules node_modules/jest/bin/jest.js",
    "test:watch": "node --experimental-vm-modules node_modules/jest/bin/jest.js --watch",
    "test:coverage": "node --experimental-vm-modules node_modules/jest/bin/jest.js --coverage"
  }
}
```

---

## Implementation Checklist

### Phase 1: Database & Utilities (1 day)
- [ ] Create migration file `20250113000001_app_analytics.sql`
- [ ] Test migration locally
- [ ] Create `utils/crypto.js` with tests
- [ ] Create `utils/validators.js` with tests
- [ ] Create `utils/analytics.js` with tests
- [ ] Run `npm test` - all utility tests pass

### Phase 2: Middleware (1 day)
- [ ] Create `middleware/authenticateAdmin.js` with tests
- [ ] Create `middleware/adminRateLimiter.js`
- [ ] Create `middleware/errorHandler.js` with tests
- [ ] Run `npm test` - all middleware tests pass

### Phase 3: Routes (2 days)
- [ ] Create `routes/admin.js` with all 8 endpoints
- [ ] Update `index.js` to mount admin routes
- [ ] Update `routes/api.js` to record analytics
- [ ] Write integration tests for all endpoints
- [ ] Run `npm test` - all route tests pass

### Phase 4: Documentation & Deployment (1 day)
- [ ] Create Postman collection
- [ ] Test all endpoints manually with Postman
- [ ] Deploy to staging and run migration
- [ ] Smoke test all endpoints on staging
- [ ] Deploy to production

---

## Testing Commands

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run tests with coverage
npm test:coverage

# Run tests in watch mode
npm test:watch

# Test specific file
npm test authenticateAdmin.test.js

# Test specific suite
npm test -- --testNamePattern="POST /api/v1/admin/apps"
```

---

## Success Criteria

**Code Quality**:
- [ ] All files follow ESM module syntax
- [ ] All functions have JSDoc comments
- [ ] Consistent error handling across all routes
- [ ] No console.log in production code (use console.error for errors)

**Testing**:
- [ ] Unit test coverage > 80%
- [ ] All integration tests pass
- [ ] All endpoints manually tested with Postman

**Performance**:
- [ ] List apps: < 100ms (p95)
- [ ] Get app details: < 50ms (p95)
- [ ] Analytics: < 500ms (p95)

**Security**:
- [ ] All endpoints require admin authentication
- [ ] Rate limiting works correctly
- [ ] API secrets never exposed in plain text (except at creation)
- [ ] All errors properly logged

---

**Next Steps**:
1. Review this file structure with team
2. Create GitHub issues for each file group
3. Assign tasks to developers
4. Begin implementation

---

*End of File Structure Document*
