# SSO Admin Dashboard - Backend API Architecture

**Version**: 1.0.0
**Date**: 2025-01-12
**Status**: Design Phase
**Related PRD**: [PRD-0003](../../tasks/prds/0003-prd-sso-admin-dashboard.md)

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Principles](#architecture-principles)
3. [Component Architecture](#component-architecture)
4. [API Specification](#api-specification)
5. [Database Schema](#database-schema)
6. [Security Architecture](#security-architecture)
7. [Error Handling Strategy](#error-handling-strategy)
8. [Performance & Scalability](#performance--scalability)
9. [Testing Strategy](#testing-strategy)
10. [File Structure](#file-structure)

---

## System Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Admin Dashboard Frontend                      │
│                          (Next.js 14 + TS)                          │
└────────────────────────────┬────────────────────────────────────────┘
                             │ HTTPS + JWT Bearer Token
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Express.js API Server (v1.0.0)                   │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                      Middleware Stack                         │  │
│  │  1. CORS (origin validation)                                  │  │
│  │  2. Helmet (security headers)                                 │  │
│  │  3. Body Parser (JSON)                                        │  │
│  │  4. Rate Limiter (100 req/min per user)                      │  │
│  │  5. authenticateAdmin (JWT + Role Check)                      │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Admin API Routes                           │  │
│  │  /api/v1/admin/apps                                           │  │
│  │    GET    /              → List apps (paginated, searchable) │  │
│  │    POST   /              → Create new app                    │  │
│  │    GET    /:id           → Get app details                   │  │
│  │    PUT    /:id           → Update app                        │  │
│  │    DELETE /:id           → Deactivate/delete app             │  │
│  │    POST   /:id/regenerate-secret → Regenerate API secret     │  │
│  │    GET    /:id/analytics → Get app analytics                 │  │
│  │                                                               │  │
│  │  /api/v1/admin/dashboard                                      │  │
│  │    GET    /              → Global dashboard stats            │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Utility Modules                            │  │
│  │  - Analytics Recorder (recordAnalyticsEvent)                 │  │
│  │  - Crypto Utils (generateApiKey, generateSecret)             │  │
│  │  - Validators (validateRedirectUrl, validateAppData)         │  │
│  └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────┬────────────────────────────────────────┘
                             │ Supabase Client (Service Role)
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  Supabase PostgreSQL + Auth                         │
│  ┌──────────────┬──────────────┬──────────────┬─────────────────┐  │
│  │ auth.users   │ profiles     │ apps         │ auth_codes      │  │
│  │              │              │              │                 │  │
│  │ - id         │ - id (FK)    │ - id         │ - code          │  │
│  │ - email      │ - email      │ - name       │ - user_id (FK)  │  │
│  │              │ - role       │ - api_key    │ - app_id (FK)   │  │
│  │              │   • user     │ - api_secret │ - expires_at    │  │
│  │              │   • admin    │ - owner_id   │                 │  │
│  │              │   • app_owner│ - is_active  │                 │  │
│  └──────────────┴──────────────┴──────────────┴─────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    app_analytics (New)                        │  │
│  │  - id                    UUID                                 │  │
│  │  - app_id                UUID (FK → apps)                     │  │
│  │  - event_type            TEXT (login, token_exchange, error) │  │
│  │  - user_id               UUID (FK → auth.users) NULLABLE     │  │
│  │  - ip_address            INET                                 │  │
│  │  - user_agent            TEXT                                 │  │
│  │  - metadata              JSONB                                │  │
│  │  - created_at            TIMESTAMPTZ                          │  │
│  └──────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Views & Functions                          │  │
│  │  - app_usage_stats (view)                                     │  │
│  │  - get_login_trend(app_id, days) → TABLE                      │  │
│  │  - get_top_users(app_id, limit) → TABLE                       │  │
│  └──────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow: Create New App

```
Frontend                 API Middleware              Route Handler              Database
   │                           │                           │                       │
   │  POST /api/v1/admin/apps  │                           │                       │
   ├──────────────────────────>│                           │                       │
   │  Headers:                 │                           │                       │
   │   Authorization: Bearer   │                           │                       │
   │  Body:                    │                           │                       │
   │   {name, redirect_urls}   │                           │                       │
   │                           │                           │                       │
   │                           │  1. CORS Check            │                       │
   │                           │  2. Rate Limit (100/min)  │                       │
   │                           │  3. authenticateAdmin()   │                       │
   │                           │     ├─ Extract JWT        │                       │
   │                           │     ├─ Verify with Supabase                      │
   │                           │     │                     │  getUser(token)       │
   │                           │     │                     ├──────────────────────>│
   │                           │     │                     │<──────────────────────┤
   │                           │     ├─ Check role='admin'│                       │
   │                           │     │                     │  profiles WHERE id    │
   │                           │     │                     ├──────────────────────>│
   │                           │     │                     │<──────────────────────┤
   │                           │     └─ Attach req.user    │                       │
   │                           │                           │                       │
   │                           │  4. Validation Passed     │                       │
   │                           ├──────────────────────────>│                       │
   │                           │                           │                       │
   │                           │                           │  5. Validate Input    │
   │                           │                           │     - Check name unique
   │                           │                           │     - Validate URLs   │
   │                           │                           │     - Check owner exists
   │                           │                           │                       │
   │                           │                           │  6. Generate Keys     │
   │                           │                           │     api_key = uuid()  │
   │                           │                           │     api_secret = randomBytes(32)
   │                           │                           │                       │
   │                           │                           │  7. Hash Secret       │
   │                           │                           │     bcrypt.hash()     │
   │                           │                           │                       │
   │                           │                           │  8. Insert App        │
   │                           │                           ├──────────────────────>│
   │                           │                           │  INSERT INTO apps     │
   │                           │                           │<──────────────────────┤
   │                           │                           │                       │
   │                           │                           │  9. Record Analytics  │
   │                           │                           ├──────────────────────>│
   │                           │                           │  INSERT INTO app_analytics
   │                           │                           │  (event: app_created) │
   │                           │                           │<──────────────────────┤
   │                           │                           │                       │
   │                           │  10. Return Response      │                       │
   │                           │<──────────────────────────┤                       │
   │  Response:                │                           │                       │
   │  {                        │                           │                       │
   │    message: "Success",    │                           │                       │
   │    app: {                 │                           │                       │
   │      id, api_key,         │                           │                       │
   │      api_secret (plain)   │  ← ONLY shown once!      │                       │
   │    }                      │                           │                       │
   │  }                        │                           │                       │
   │<──────────────────────────┤                           │                       │
```

---

## Architecture Principles

### 1. Security-First Design
- **Zero Trust**: Validate every request, even from admin users
- **Defense in Depth**: Multiple layers (JWT, role check, RLS, input validation)
- **Least Privilege**: Admin middleware only grants access to necessary data
- **Audit Trail**: All sensitive operations logged

### 2. Separation of Concerns
- **Middleware**: Authentication, rate limiting, CORS
- **Routes**: Request handling, response formatting
- **Services**: Business logic (e.g., app creation, analytics)
- **Utilities**: Reusable functions (crypto, validators)
- **Database**: Data persistence, constraints, triggers

### 3. Fail-Safe Defaults
- API Secret shown **only once** at creation
- Apps default to `is_active = true` but require explicit approval
- Rate limits prevent abuse (100 requests/min per user)
- Input validation on both client and server

### 4. Scalability & Performance
- Pagination for all list endpoints (default 20 items/page)
- Database indexes on frequently queried columns
- Debounced search on frontend (300ms)
- Future: Redis caching for analytics (5-min TTL)

### 5. Observability
- Structured logging (JSON format)
- Analytics events recorded for all operations
- Error tracking with stack traces (dev only)
- Future: APM integration (DataDog, Sentry)

---

## Component Architecture

### 1. Middleware Layer

#### authenticateAdmin.js
**Purpose**: Validate JWT and enforce admin role

**Interface**:
```javascript
async function authenticateAdmin(req, res, next)
```

**Flow**:
1. Extract `Authorization: Bearer <token>` header
2. Verify token with Supabase Admin API (`getUser()`)
3. Query `profiles` table for user role
4. Check `role = 'admin'`
5. Attach `req.user` object
6. Call `next()` or return `401/403`

**Error Responses**:
- `401`: Missing or invalid token
- `403`: User is not admin
- `500`: Internal error (DB connection failure)

**Dependencies**:
- `@supabase/supabase-js` (supabaseAdmin client)
- Environment: `SUPABASE_SERVICE_ROLE_KEY`

**Security Considerations**:
- Use **Service Role Key** to bypass RLS (admins need full access)
- Log failed admin access attempts for security audit
- Never expose Service Role Key to frontend

---

#### adminRateLimiter.js (New)
**Purpose**: Rate limit admin API requests

**Configuration**:
```javascript
{
  windowMs: 60 * 1000,        // 1 minute
  max: 100,                   // 100 requests per window
  keyGenerator: (req) => req.user.id, // Per user
  message: 'Too many requests, please try again later'
}
```

**Why Admin Needs Rate Limiting**:
- Prevent accidental DOS from buggy scripts
- Mitigate compromised admin account abuse
- Protect database from excessive queries

---

### 2. Route Handlers (server/src/routes/admin.js)

#### GET /api/v1/admin/apps
**Purpose**: List all apps with search, filter, pagination

**Query Parameters**:
- `search` (string, optional): Case-insensitive search in app name
- `status` (enum: 'all' | 'active' | 'inactive', default: 'all')
- `page` (number, default: 1)
- `limit` (number, default: 20, max: 100)
- `sort` (enum: 'name' | 'created_at', default: 'name')
- `order` (enum: 'asc' | 'desc', default: 'asc')

**Request Example**:
```http
GET /api/v1/admin/apps?search=ojt&status=active&page=1&limit=20
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response Schema**:
```json
{
  "apps": [
    {
      "id": "a3f2b8c1-1234-5678-90ab-cdef12345678",
      "name": "OJT Platform",
      "description": "Employee training system",
      "api_key": "a3f2b8c1-1234-5678-90ab-cdef12345678",
      "auth_method": "token_exchange",
      "is_active": true,
      "created_at": "2025-01-12T10:30:00Z",
      "updated_at": "2025-01-12T10:30:00Z",
      "owner": {
        "id": "uuid",
        "email": "admin@example.com",
        "display_name": "Admin User"
      },
      "stats": {
        "total_logins_30d": 1234,
        "active_users_30d": 456
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

**Implementation Notes**:
- Use `.select()` with JOIN to get owner info
- Use `.range()` for pagination
- Use `.ilike()` for case-insensitive search
- Calculate `stats` from `app_analytics` table (use view)

**Error Responses**:
- `401`: Not authenticated
- `403`: Not admin
- `500`: Database error

---

#### POST /api/v1/admin/apps
**Purpose**: Create new app and generate credentials

**Request Schema**:
```json
{
  "name": "New App",
  "description": "Optional description",
  "redirect_urls": ["http://localhost:3000/callback", "https://app.example.com/callback"],
  "allowed_origins": ["http://localhost:3000", "https://app.example.com"],
  "auth_method": "token_exchange",
  "owner_email": "dev@example.com"
}
```

**Validation Rules**:
- `name`: Required, 3-100 chars, alphanumeric + spaces/hyphens, unique
- `description`: Optional, max 500 chars
- `redirect_urls`: Required, array of valid HTTP(S) URLs, min 1, max 10
- `allowed_origins`: Optional, array of valid HTTP(S) URLs
- `auth_method`: Required, enum: ['token_exchange', 'shared_cookie', 'hybrid']
- `owner_email`: Required, valid email, must exist in `profiles` table

**Response Schema**:
```json
{
  "message": "App registered successfully",
  "app": {
    "id": "uuid",
    "name": "New App",
    "api_key": "generated-uuid",
    "api_secret": "64-char-hex-string",  // SHOWN ONLY ONCE!
    "redirect_urls": ["..."],
    "auth_method": "token_exchange",
    "owner": { "email": "dev@example.com" },
    "is_active": true,
    "created_at": "2025-01-12T10:30:00Z"
  }
}
```

**Implementation Flow**:
1. Validate input (express-validator or Zod)
2. Check if app name already exists
3. Verify owner email exists in `profiles`
4. Generate `api_key` (UUID v4)
5. Generate `api_secret` (crypto.randomBytes(32).toString('hex'))
6. Hash secret with bcrypt (`bcrypt.hash(api_secret, 10)`)
7. Insert into `apps` table (store hashed secret)
8. Record analytics event: `app_created`
9. Return app with **plain secret** (only time it's shown)

**Security Notes**:
- API Secret is **never stored in plain text** (only bcrypt hash)
- Return plain secret in response, then it's gone forever
- Frontend must warn: "Copy now - won't be shown again"

**Error Responses**:
- `400`: Validation error (duplicate name, invalid URL, etc.)
- `404`: Owner email not found
- `500`: Database error

---

#### GET /api/v1/admin/apps/:id
**Purpose**: Get detailed app information

**Response Schema**:
```json
{
  "id": "uuid",
  "name": "OJT Platform",
  "description": "...",
  "api_key": "uuid",
  "api_secret": "hashed-secret",  // bcrypt hash (NOT plain text)
  "redirect_urls": ["http://localhost:3000/callback"],
  "allowed_origins": ["http://localhost:3000"],
  "auth_method": "token_exchange",
  "owner_id": "uuid",
  "owner": {
    "id": "uuid",
    "email": "admin@example.com",
    "display_name": "Admin User"
  },
  "is_active": true,
  "created_at": "2025-01-12T10:30:00Z",
  "updated_at": "2025-01-12T10:30:00Z",
  "stats": {
    "total_logins_30d": 1234,
    "active_users_30d": 456,
    "token_requests_30d": 2345,
    "error_rate_30d": 0.2
  }
}
```

**Implementation**:
- Join with `profiles` for owner info
- Join with `app_usage_stats` view for stats
- Return `api_secret` as-is (hashed) - frontend shows "Show" button

**Error Responses**:
- `404`: App not found
- `500`: Database error

---

#### PUT /api/v1/admin/apps/:id
**Purpose**: Update app configuration

**Request Schema** (partial update allowed):
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "redirect_urls": ["https://newurl.com/callback"],
  "allowed_origins": ["https://newurl.com"],
  "is_active": false
}
```

**Validation**:
- Same rules as POST (except not all fields required)
- `api_key` and `api_secret` cannot be updated (use regenerate endpoint)

**Response**:
```json
{
  "message": "App updated successfully",
  "app": { /* updated app object */ }
}
```

**Implementation**:
1. Validate input
2. Check if new name conflicts with existing apps
3. Update database
4. Record analytics event: `app_updated`
5. Return updated app

**Error Responses**:
- `400`: Validation error
- `404`: App not found
- `409`: Name conflict
- `500`: Database error

---

#### DELETE /api/v1/admin/apps/:id
**Purpose**: Deactivate or permanently delete app

**Query Parameters**:
- `permanent` (boolean, default: false): If true, delete from DB; else deactivate

**Response**:
```json
{
  "message": "App deactivated"  // or "App permanently deleted"
}
```

**Implementation**:
- **Deactivate** (default): Set `is_active = false`
- **Permanent Delete**: `DELETE FROM apps WHERE id = ?` (CASCADE deletes auth_codes)
- Record analytics event: `app_deactivated` or `app_deleted`

**Security**:
- Frontend must show strong confirmation for permanent delete
- Consider soft delete only (never truly delete for audit trail)

**Error Responses**:
- `404`: App not found
- `500`: Database error

---

#### POST /api/v1/admin/apps/:id/regenerate-secret
**Purpose**: Generate new API secret (invalidates old one)

**Request Schema**:
```json
{
  "confirmation": "app-name"  // User must type app name to confirm
}
```

**Response**:
```json
{
  "message": "API secret regenerated successfully",
  "api_secret": "new-64-char-hex-string",  // SHOWN ONLY ONCE!
  "warning": "Update your application configuration immediately"
}
```

**Implementation**:
1. Validate confirmation matches app name
2. Generate new secret (crypto.randomBytes(32).toString('hex'))
3. Hash with bcrypt
4. Update `apps` table
5. Record analytics event: `secret_regenerated`
6. (Optional) Send email to app owner
7. Return new plain secret

**Security**:
- Require strong confirmation (typing app name)
- Old secret is immediately invalidated
- Log event for audit

**Error Responses**:
- `400`: Confirmation mismatch
- `404`: App not found
- `500`: Database error

---

#### GET /api/v1/admin/apps/:id/analytics
**Purpose**: Get app usage analytics

**Query Parameters**:
- `period` (enum: '7d' | '30d' | '90d', default: '30d')

**Response Schema**:
```json
{
  "period": "30d",
  "metrics": {
    "total_logins": 1234,
    "active_users": 456,
    "token_requests": 2345,
    "error_rate": 0.2,
    "avg_logins_per_day": 41.1
  },
  "login_trend": [
    { "date": "2025-01-01", "count": 45 },
    { "date": "2025-01-02", "count": 52 }
  ],
  "top_users": [
    {
      "user_id": "uuid",
      "email": "user@example.com",
      "display_name": "User One",
      "login_count": 45,
      "last_login": "2025-01-12T10:30:00Z"
    }
  ],
  "recent_errors": [
    {
      "timestamp": "2025-01-12T10:30:00Z",
      "error_type": "token_invalid",
      "user_id": "uuid",
      "user_email": "user@example.com",
      "metadata": { /* additional error info */ }
    }
  ]
}
```

**Implementation**:
- Query `app_analytics` table with date range filter
- Use stored functions for aggregations:
  - `get_login_trend(app_id, days)`
  - `get_top_users(app_id, limit)`
- Calculate metrics in SQL for performance
- Consider caching results (5-min TTL)

**Error Responses**:
- `404`: App not found
- `500`: Database error

---

#### GET /api/v1/admin/dashboard
**Purpose**: Global dashboard overview (all apps)

**Response Schema**:
```json
{
  "summary": {
    "total_apps": 10,
    "active_apps": 8,
    "total_users": 1500,
    "logins_today": 234,
    "logins_30d": 7890
  },
  "top_apps": [
    {
      "app_id": "uuid",
      "app_name": "OJT Platform",
      "login_count": 3456
    }
  ],
  "recent_activity": [
    {
      "type": "app_created",
      "app_name": "New App",
      "timestamp": "2025-01-12T10:30:00Z",
      "user": "admin@example.com"
    },
    {
      "type": "login",
      "app_name": "OJT Platform",
      "user": "user@example.com",
      "timestamp": "2025-01-12T10:25:00Z"
    }
  ]
}
```

**Implementation**:
- Aggregate data from multiple tables
- Use database views for performance
- Cache results (60-second TTL)

---

### 3. Utility Modules

#### server/src/utils/analytics.js
**Purpose**: Record analytics events

**Interface**:
```javascript
async function recordAnalyticsEvent(app_id, event_type, user_id = null, metadata = {})
```

**Event Types**:
- `app_created`
- `app_updated`
- `app_deleted`
- `secret_regenerated`
- `login`
- `token_exchange`
- `token_refresh`
- `token_revoke`
- `error`

**Implementation**:
```javascript
import { supabaseAdmin } from './supabase.js';

export async function recordAnalyticsEvent(app_id, event_type, user_id = null, metadata = {}) {
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
      console.error('Failed to record analytics:', error);
      // Don't throw - analytics failure shouldn't break main flow
    }
  } catch (err) {
    console.error('Analytics error:', err);
  }
}
```

**Usage**:
```javascript
// In route handler
await recordAnalyticsEvent(app.id, 'app_created', req.user.id, {
  app_name: app.name,
  admin_email: req.user.email
});
```

---

#### server/src/utils/crypto.js
**Purpose**: Key generation utilities

**Interface**:
```javascript
function generateApiKey()      // Returns UUID v4
function generateApiSecret()   // Returns 64-char hex string
async function hashSecret(secret)   // Returns bcrypt hash
async function verifySecret(plain, hash) // Returns boolean
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

---

#### server/src/utils/validators.js
**Purpose**: Input validation helpers

**Interface**:
```javascript
function validateRedirectUrl(url)  // Returns { valid: boolean, error?: string }
function validateEmail(email)      // Returns { valid: boolean, error?: string }
function validateAppName(name)     // Returns { valid: boolean, error?: string }
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
```

---

## API Specification

### OpenAPI 3.0 Schema (Excerpt)

```yaml
openapi: 3.0.0
info:
  title: SSO Admin Dashboard API
  version: 1.0.0
  description: Backend API for managing SSO applications

servers:
  - url: https://sso-system-ruby.vercel.app/api/v1
    description: Production
  - url: http://localhost:3000/api/v1
    description: Local development

security:
  - BearerAuth: []

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    App:
      type: object
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
          minLength: 3
          maxLength: 100
        description:
          type: string
          maxLength: 500
        api_key:
          type: string
          format: uuid
        api_secret:
          type: string
          description: Bcrypt hash (or plain text on creation only)
        redirect_urls:
          type: array
          items:
            type: string
            format: uri
        allowed_origins:
          type: array
          items:
            type: string
            format: uri
        auth_method:
          type: string
          enum: [token_exchange, shared_cookie, hybrid]
        is_active:
          type: boolean
        owner:
          type: object
          properties:
            id:
              type: string
              format: uuid
            email:
              type: string
              format: email
            display_name:
              type: string
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time

    Error:
      type: object
      properties:
        error:
          type: string
        message:
          type: string
        details:
          type: object

paths:
  /admin/apps:
    get:
      summary: List all apps
      tags: [Admin - Apps]
      parameters:
        - name: search
          in: query
          schema:
            type: string
        - name: status
          in: query
          schema:
            type: string
            enum: [all, active, inactive]
        - name: page
          in: query
          schema:
            type: integer
            default: 1
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
            maximum: 100
      responses:
        '200':
          description: List of apps
          content:
            application/json:
              schema:
                type: object
                properties:
                  apps:
                    type: array
                    items:
                      $ref: '#/components/schemas/App'
                  pagination:
                    type: object
                    properties:
                      page: { type: integer }
                      limit: { type: integer }
                      total: { type: integer }
                      total_pages: { type: integer }
        '401':
          $ref: '#/components/responses/Unauthorized'
        '403':
          $ref: '#/components/responses/Forbidden'

    post:
      summary: Create new app
      tags: [Admin - Apps]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [name, redirect_urls, auth_method, owner_email]
              properties:
                name: { type: string }
                description: { type: string }
                redirect_urls: { type: array, items: { type: string, format: uri } }
                allowed_origins: { type: array, items: { type: string, format: uri } }
                auth_method: { type: string, enum: [token_exchange, shared_cookie, hybrid] }
                owner_email: { type: string, format: email }
      responses:
        '201':
          description: App created successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  message: { type: string }
                  app:
                    $ref: '#/components/schemas/App'
        '400':
          $ref: '#/components/responses/BadRequest'

  /admin/apps/{id}:
    get:
      summary: Get app details
      tags: [Admin - Apps]
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: App details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/App'
        '404':
          $ref: '#/components/responses/NotFound'

    put:
      summary: Update app
      tags: [Admin - Apps]
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                name: { type: string }
                description: { type: string }
                redirect_urls: { type: array, items: { type: string } }
                allowed_origins: { type: array, items: { type: string } }
                is_active: { type: boolean }
      responses:
        '200':
          description: App updated
          content:
            application/json:
              schema:
                type: object
                properties:
                  message: { type: string }
                  app:
                    $ref: '#/components/schemas/App'

    delete:
      summary: Delete or deactivate app
      tags: [Admin - Apps]
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
        - name: permanent
          in: query
          schema:
            type: boolean
            default: false
      responses:
        '200':
          description: App deleted/deactivated

  /admin/apps/{id}/regenerate-secret:
    post:
      summary: Regenerate API secret
      tags: [Admin - Apps]
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [confirmation]
              properties:
                confirmation:
                  type: string
                  description: App name for confirmation
      responses:
        '200':
          description: Secret regenerated
          content:
            application/json:
              schema:
                type: object
                properties:
                  message: { type: string }
                  api_secret: { type: string }
                  warning: { type: string }

  /admin/apps/{id}/analytics:
    get:
      summary: Get app analytics
      tags: [Admin - Analytics]
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
        - name: period
          in: query
          schema:
            type: string
            enum: ['7d', '30d', '90d']
            default: '30d'
      responses:
        '200':
          description: Analytics data
          content:
            application/json:
              schema:
                type: object
                properties:
                  period: { type: string }
                  metrics:
                    type: object
                    properties:
                      total_logins: { type: integer }
                      active_users: { type: integer }
                      token_requests: { type: integer }
                      error_rate: { type: number }
                  login_trend:
                    type: array
                    items:
                      type: object
                      properties:
                        date: { type: string, format: date }
                        count: { type: integer }
                  top_users:
                    type: array
                    items:
                      type: object
                      properties:
                        user_id: { type: string }
                        email: { type: string }
                        login_count: { type: integer }
                  recent_errors:
                    type: array
                    items:
                      type: object
                      properties:
                        timestamp: { type: string, format: date-time }
                        error_type: { type: string }
                        user_id: { type: string }

  /admin/dashboard:
    get:
      summary: Global dashboard statistics
      tags: [Admin - Dashboard]
      responses:
        '200':
          description: Dashboard data
          content:
            application/json:
              schema:
                type: object
                properties:
                  summary:
                    type: object
                  top_apps:
                    type: array
                  recent_activity:
                    type: array

components:
  responses:
    Unauthorized:
      description: Not authenticated
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            error: "unauthorized"
            message: "Invalid or expired token"

    Forbidden:
      description: Not authorized (not admin)
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            error: "forbidden"
            message: "Admin access required"

    BadRequest:
      description: Validation error
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            error: "validation_error"
            message: "Invalid input"
            details:
              name: "App name already exists"

    NotFound:
      description: Resource not found
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
          example:
            error: "not_found"
            message: "App not found"
```

---

## Database Schema

### New Table: app_analytics

```sql
-- Migration: 20250113000001_app_analytics.sql

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

-- Indexes for performance
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

COMMENT ON TABLE public.app_analytics IS 'Analytics and audit log for app usage';
COMMENT ON COLUMN public.app_analytics.event_type IS 'Type of event tracked';
COMMENT ON COLUMN public.app_analytics.metadata IS 'Additional event data (JSON)';
```

### Updated View: app_usage_stats

```sql
-- Extend existing view to include analytics data

CREATE OR REPLACE VIEW public.app_usage_stats AS
SELECT
  a.id as app_id,
  a.name as app_name,
  a.is_active,

  -- 30-day metrics
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
```

### New Function: get_login_trend

```sql
-- Function to get daily login counts for charts

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
```

### New Function: get_top_users

```sql
-- Function to get most active users for an app

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
```

### RLS Policies for app_analytics

```sql
-- Enable RLS
ALTER TABLE public.app_analytics ENABLE ROW LEVEL SECURITY;

-- Service role only (backend writes)
CREATE POLICY "Service role can insert analytics"
  ON public.app_analytics
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Admins can read all analytics
CREATE POLICY "Admins can view all analytics"
  ON public.app_analytics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- App owners can read their own app analytics
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
```

---

## Security Architecture

### 1. Authentication Flow

```
Client                     API                      Supabase
  │                         │                           │
  │  1. User logs in        │                           │
  │  POST /auth/login       │                           │
  ├────────────────────────>│                           │
  │                         │  signInWithPassword()     │
  │                         ├──────────────────────────>│
  │                         │<──────────────────────────┤
  │                         │  { user, session }        │
  │                         │  Check role='admin'       │
  │                         ├──────────────────────────>│
  │                         │<──────────────────────────┤
  │  { access_token, ... }  │                           │
  │<────────────────────────┤                           │
  │                         │                           │
  │  2. API request         │                           │
  │  GET /admin/apps        │                           │
  │  Authorization: Bearer  │                           │
  ├────────────────────────>│                           │
  │                         │  authenticateAdmin()      │
  │                         │  - Extract token          │
  │                         │  - Verify with getUser()  │
  │                         ├──────────────────────────>│
  │                         │<──────────────────────────┤
  │                         │  - Check role='admin'     │
  │                         ├──────────────────────────>│
  │                         │<──────────────────────────┤
  │                         │  - Pass to route handler  │
  │  { apps: [...] }        │                           │
  │<────────────────────────┤                           │
```

### 2. Authorization Layers

**Layer 1: JWT Validation** (authenticateAdmin middleware)
- Validates Bearer token
- Verifies token with Supabase
- Checks token expiration

**Layer 2: Role Check** (authenticateAdmin middleware)
- Queries `profiles` table
- Enforces `role = 'admin'`
- Rejects non-admin users (403)

**Layer 3: RLS Policies** (Database)
- Even with Service Role Key, RLS protects data
- Admins can see all data
- App owners can only see their apps
- Regular users cannot access admin endpoints

**Layer 4: Input Validation** (Route handlers)
- Validate all inputs (Zod or express-validator)
- Sanitize user-provided data
- Check business logic constraints (e.g., unique names)

### 3. Secure Secret Management

**API Secret Lifecycle**:
1. **Generation**: `crypto.randomBytes(32)` (256-bit entropy)
2. **Storage**: Bcrypt hash (10 rounds) - **never plain text**
3. **Display**: Shown only once at creation/regeneration
4. **Verification**: `bcrypt.compare(plain, hash)` during token exchange

**Why bcrypt for API secrets?**
- Prevents rainbow table attacks if DB is compromised
- Allows verification without storing plain text
- Industry standard for password-like secrets

**Frontend Warning**:
```
⚠️ IMPORTANT: Save your API Secret now!

This secret will not be shown again for security reasons.
If you lose it, you'll need to regenerate a new one.

[Copy to Clipboard]
```

### 4. Rate Limiting Strategy

**Admin API Rate Limits**:
```javascript
// server/src/middleware/adminRateLimiter.js
import rateLimit from 'express-rate-limit';

export const adminRateLimiter = rateLimit({
  windowMs: 60 * 1000,           // 1 minute
  max: 100,                      // 100 requests per window
  keyGenerator: (req) => req.user.id, // Per admin user
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'rate_limit_exceeded',
    message: 'Too many requests. Please try again in 1 minute.'
  }
});
```

**Why rate limit admins?**
- Prevent accidental DOS from buggy scripts
- Limit damage from compromised admin accounts
- Protect database from excessive queries

### 5. Audit Logging

**All Sensitive Operations Logged**:
- App creation
- App deletion
- Secret regeneration
- Admin login attempts (failed)
- Permission changes

**Log Format** (app_analytics table):
```json
{
  "event_type": "secret_regenerated",
  "app_id": "uuid",
  "user_id": "admin-uuid",
  "metadata": {
    "admin_email": "admin@example.com",
    "app_name": "OJT Platform",
    "ip_address": "203.0.113.1",
    "user_agent": "Mozilla/5.0..."
  },
  "created_at": "2025-01-12T10:30:00Z"
}
```

**Retention Policy**:
- Keep all logs for 90 days (default)
- Archive older logs to cold storage
- Never delete logs of security events

---

## Error Handling Strategy

### 1. Error Response Format

**Standard Error Response**:
```json
{
  "error": "error_code",
  "message": "Human-readable error message",
  "details": {
    "field": "Specific validation error"
  }
}
```

### 2. HTTP Status Codes

| Code | Meaning | Use Case |
|------|---------|----------|
| 400 | Bad Request | Validation errors, malformed input |
| 401 | Unauthorized | Missing or invalid JWT token |
| 403 | Forbidden | User is not admin |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate name, constraint violation |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |

### 3. Error Handling Middleware

```javascript
// server/src/middleware/errorHandler.js

export function errorHandler(err, req, res, next) {
  console.error('[Error]', {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    user: req.user?.email || 'anonymous',
    error: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });

  // Supabase errors
  if (err.code?.startsWith('PGRST')) {
    return res.status(500).json({
      error: 'database_error',
      message: 'Database operation failed',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'validation_error',
      message: err.message,
      details: err.details
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

  // Default error
  res.status(err.status || 500).json({
    error: err.error || 'internal_error',
    message: err.message || 'An unexpected error occurred',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
}
```

### 4. Try-Catch Pattern

**All async route handlers must use try-catch**:
```javascript
router.post('/apps', authenticateAdmin, async (req, res) => {
  try {
    // Business logic here
    const app = await createApp(req.body);
    res.json({ app });
  } catch (err) {
    // Specific error handling
    if (err.code === '23505') { // Unique constraint violation
      return res.status(409).json({
        error: 'duplicate_name',
        message: 'App name already exists'
      });
    }

    // Pass to error handler middleware
    next(err);
  }
});
```

---

## Performance & Scalability

### 1. Database Optimization

**Indexes** (Already in place + new):
```sql
-- Existing indexes (from v1.0.0)
CREATE INDEX idx_apps_api_key ON apps(api_key);
CREATE INDEX idx_apps_owner_id ON apps(owner_id);
CREATE INDEX idx_apps_is_active ON apps(is_active) WHERE is_active = true;

-- New indexes for admin API
CREATE INDEX idx_apps_name ON apps(name);
CREATE INDEX idx_apps_created_at ON apps(created_at DESC);
CREATE INDEX idx_app_analytics_app_time ON app_analytics(app_id, created_at DESC);
CREATE INDEX idx_app_analytics_recent ON app_analytics(app_id, event_type, created_at DESC)
  WHERE created_at > NOW() - INTERVAL '90 days';
```

**Query Performance Targets**:
- List apps: < 100ms (with 1000 apps)
- Get app details: < 50ms
- Analytics query: < 500ms (30-day window)
- Create app: < 200ms

### 2. Pagination Strategy

**Default**: 20 items per page
**Max**: 100 items per page

**Implementation**:
```javascript
const page = parseInt(req.query.page) || 1;
const limit = Math.min(parseInt(req.query.limit) || 20, 100);
const from = (page - 1) * limit;
const to = from + limit - 1;

const { data, count } = await supabaseAdmin
  .from('apps')
  .select('*', { count: 'exact' })
  .range(from, to);

res.json({
  apps: data,
  pagination: {
    page,
    limit,
    total: count,
    total_pages: Math.ceil(count / limit)
  }
});
```

### 3. Caching Strategy (Future)

**Cache Candidates**:
- App list (cache key: `apps:list:${page}:${filters}`)
- App details (cache key: `apps:${id}`)
- Analytics (cache key: `analytics:${app_id}:${period}`)

**Cache TTL**:
- App list: 5 minutes
- App details: 10 minutes
- Analytics: 5 minutes

**Implementation** (using Redis):
```javascript
// Pseudo-code
async function getApps(filters) {
  const cacheKey = `apps:list:${JSON.stringify(filters)}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  const data = await supabaseAdmin.from('apps').select('*');
  await redis.setex(cacheKey, 300, JSON.stringify(data)); // 5 min
  return data;
}
```

### 4. Scalability Considerations

**Current Scale** (v1.1.0):
- Apps: 1-100
- Admins: 1-5
- API requests: ~1,000/day

**Target Scale** (Year 1):
- Apps: 100-1,000
- Admins: 5-20
- API requests: ~100,000/day

**Bottlenecks & Solutions**:
| Bottleneck | Solution |
|------------|----------|
| Database queries | Indexes, pagination, views |
| Analytics queries | Stored functions, partial indexes |
| API response time | Caching, CDN |
| Concurrent requests | Connection pooling (Supabase default) |
| File storage (future) | Supabase Storage for app logos |

---

## Testing Strategy

### 1. Unit Tests (Jest)

**Test Coverage Target**: >80%

**Files to Test**:
- `server/src/middleware/authenticateAdmin.js`
- `server/src/utils/crypto.js`
- `server/src/utils/validators.js`
- `server/src/utils/analytics.js`

**Example Test** (authenticateAdmin):
```javascript
// server/src/middleware/__tests__/authenticateAdmin.test.js

import { authenticateAdmin } from '../authenticateAdmin.js';
import { supabaseAdmin } from '../../utils/supabase.js';

jest.mock('../../utils/supabase.js');

describe('authenticateAdmin middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  test('should return 401 if no Authorization header', async () => {
    await authenticateAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'unauthorized',
      message: expect.any(String)
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('should return 401 if token is invalid', async () => {
    req.headers.authorization = 'Bearer invalid-token';

    supabaseAdmin.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid token' }
    });

    await authenticateAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
  });

  test('should return 403 if user is not admin', async () => {
    req.headers.authorization = 'Bearer valid-token';

    supabaseAdmin.auth.getUser.mockResolvedValue({
      data: { user: { id: 'user-id', email: 'user@example.com' } },
      error: null
    });

    supabaseAdmin.from().select().eq().single.mockResolvedValue({
      data: { role: 'user' },
      error: null
    });

    await authenticateAdmin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  test('should call next() if user is admin', async () => {
    req.headers.authorization = 'Bearer valid-token';

    supabaseAdmin.auth.getUser.mockResolvedValue({
      data: { user: { id: 'admin-id', email: 'admin@example.com' } },
      error: null
    });

    supabaseAdmin.from().select().eq().single.mockResolvedValue({
      data: { role: 'admin' },
      error: null
    });

    await authenticateAdmin(req, res, next);

    expect(req.user).toBeDefined();
    expect(next).toHaveBeenCalled();
  });
});
```

### 2. Integration Tests (Supertest)

**Test Coverage**: All API endpoints

**Example Test** (Create App):
```javascript
// server/src/routes/__tests__/admin.test.js

import request from 'supertest';
import app from '../../index.js';
import { supabaseAdmin } from '../../utils/supabase.js';

describe('POST /api/v1/admin/apps', () => {
  let adminToken;

  beforeAll(async () => {
    // Create test admin user and get token
    adminToken = await getTestAdminToken();
  });

  afterAll(async () => {
    // Cleanup test data
    await cleanupTestData();
  });

  test('should create new app with valid data', async () => {
    const newApp = {
      name: 'Test App',
      description: 'Test description',
      redirect_urls: ['http://localhost:3000/callback'],
      auth_method: 'token_exchange',
      owner_email: 'admin@example.com'
    };

    const res = await request(app)
      .post('/api/v1/admin/apps')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newApp)
      .expect(201);

    expect(res.body.message).toContain('successfully');
    expect(res.body.app).toHaveProperty('id');
    expect(res.body.app).toHaveProperty('api_key');
    expect(res.body.app).toHaveProperty('api_secret');
    expect(res.body.app.api_secret).toHaveLength(64); // 64-char hex
    expect(res.body.app.name).toBe(newApp.name);
  });

  test('should return 400 if name already exists', async () => {
    const duplicateApp = {
      name: 'Test App', // Already exists from previous test
      redirect_urls: ['http://localhost:3000/callback'],
      auth_method: 'token_exchange',
      owner_email: 'admin@example.com'
    };

    const res = await request(app)
      .post('/api/v1/admin/apps')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(duplicateApp)
      .expect(400);

    expect(res.body.error).toBe('duplicate_name');
  });

  test('should return 400 if redirect_urls is invalid', async () => {
    const invalidApp = {
      name: 'Invalid App',
      redirect_urls: ['not-a-url'],
      auth_method: 'token_exchange',
      owner_email: 'admin@example.com'
    };

    const res = await request(app)
      .post('/api/v1/admin/apps')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(invalidApp)
      .expect(400);

    expect(res.body.error).toBe('validation_error');
  });

  test('should return 401 if not authenticated', async () => {
    const newApp = {
      name: 'Unauthorized App',
      redirect_urls: ['http://localhost:3000/callback'],
      auth_method: 'token_exchange',
      owner_email: 'admin@example.com'
    };

    await request(app)
      .post('/api/v1/admin/apps')
      .send(newApp)
      .expect(401);
  });
});
```

### 3. End-to-End Tests (Playwright)

**Critical Paths**:
1. Admin login → List apps
2. Create app → Verify credentials modal
3. Edit app → Save changes
4. Regenerate secret → Verify confirmation
5. Delete app → Verify removal

**Test Strategy**:
- Run against staging environment
- Use test database (not production)
- Clean up test data after each run

---

## File Structure

```
server/
├── src/
│   ├── index.js                        # Express app entry point (existing)
│   │
│   ├── middleware/
│   │   ├── auth.js                     # requireAuth, requireAdmin (existing)
│   │   ├── authenticateAdmin.js        # NEW: Admin JWT validation + role check
│   │   ├── adminRateLimiter.js         # NEW: Rate limiter for admin API
│   │   ├── rateLimiter.js              # Existing rate limiters
│   │   ├── httpsRedirect.js            # Existing HTTPS redirect
│   │   └── errorHandler.js             # NEW: Centralized error handling
│   │
│   ├── routes/
│   │   ├── auth.js                     # Existing auth routes
│   │   ├── api.js                      # Existing SSO API routes
│   │   └── admin.js                    # NEW: Admin dashboard routes
│   │       ├── GET    /api/v1/admin/apps
│   │       ├── POST   /api/v1/admin/apps
│   │       ├── GET    /api/v1/admin/apps/:id
│   │       ├── PUT    /api/v1/admin/apps/:id
│   │       ├── DELETE /api/v1/admin/apps/:id
│   │       ├── POST   /api/v1/admin/apps/:id/regenerate-secret
│   │       ├── GET    /api/v1/admin/apps/:id/analytics
│   │       └── GET    /api/v1/admin/dashboard
│   │
│   ├── utils/
│   │   ├── supabase.js                 # Existing Supabase client
│   │   ├── crypto.js                   # NEW: Key generation utils
│   │   │   ├── generateApiKey()
│   │   │   ├── generateApiSecret()
│   │   │   ├── hashSecret()
│   │   │   └── verifySecret()
│   │   ├── validators.js               # NEW: Input validation helpers
│   │   │   ├── validateRedirectUrl()
│   │   │   ├── validateEmail()
│   │   │   └── validateAppName()
│   │   └── analytics.js                # NEW: Analytics recording
│   │       └── recordAnalyticsEvent()
│   │
│   └── __tests__/                      # Test files mirror src structure
│       ├── middleware/
│       │   └── authenticateAdmin.test.js
│       ├── routes/
│       │   └── admin.test.js
│       └── utils/
│           ├── crypto.test.js
│           └── validators.test.js
│
├── docs/
│   ├── ADMIN_API_ARCHITECTURE.md       # THIS DOCUMENT
│   ├── API_ADMIN.md                    # NEW: API reference for developers
│   └── postman/
│       └── Admin_API.json              # NEW: Postman collection
│
├── package.json                        # Existing (may need new dependencies)
├── jest.config.js                      # NEW: Jest configuration
└── .env.example                        # Existing (no changes needed)

supabase/
└── migrations/
    ├── 20250112000001_production_setup_v1.0.0.sql  # Existing
    └── 20250113000001_app_analytics.sql             # NEW: Analytics table
        ├── CREATE TABLE app_analytics
        ├── CREATE INDEXES (5 indexes)
        ├── CREATE VIEW app_usage_stats (updated)
        ├── CREATE FUNCTION get_login_trend()
        ├── CREATE FUNCTION get_top_users()
        └── ALTER TABLE app_analytics ENABLE RLS
```

### New Dependencies (package.json)

```json
{
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",  // existing
    "bcryptjs": "^3.0.3",                 // existing
    "cors": "^2.8.5",                     // existing
    "crypto": "^1.0.1",                   // existing
    "dotenv": "^16.3.1",                  // existing
    "express": "^4.18.2",                 // existing
    "express-rate-limit": "^8.2.1",       // existing
    "helmet": "^8.1.0",                   // existing
    "express-validator": "^7.0.1"         // NEW: Input validation
  },
  "devDependencies": {
    "nodemon": "^3.0.2",                  // existing
    "jest": "^29.7.0",                    // NEW: Testing framework
    "supertest": "^6.3.3",                // NEW: API testing
    "@types/jest": "^29.5.11"             // NEW: Jest types
  }
}
```

---

## Implementation Checklist

### Phase 1: Backend API (Week 1)

- [ ] **Setup** (2 hours)
  - [ ] Install new dependencies (jest, supertest, express-validator)
  - [ ] Create `jest.config.js`
  - [ ] Update `package.json` scripts

- [ ] **Database** (4 hours)
  - [ ] Create `app_analytics` table migration
  - [ ] Create `get_login_trend()` function
  - [ ] Create `get_top_users()` function
  - [ ] Update `app_usage_stats` view
  - [ ] Test migrations locally

- [ ] **Middleware** (4 hours)
  - [ ] Create `authenticateAdmin.js`
  - [ ] Create `adminRateLimiter.js`
  - [ ] Create `errorHandler.js`
  - [ ] Write unit tests (>90% coverage)

- [ ] **Utilities** (4 hours)
  - [ ] Create `utils/crypto.js`
  - [ ] Create `utils/validators.js`
  - [ ] Create `utils/analytics.js`
  - [ ] Write unit tests

- [ ] **Routes** (12 hours)
  - [ ] Create `routes/admin.js`
  - [ ] Implement 8 endpoints (GET, POST, PUT, DELETE, etc.)
  - [ ] Add input validation
  - [ ] Write integration tests

- [ ] **Integration** (4 hours)
  - [ ] Mount admin routes in `index.js`
  - [ ] Update existing routes to record analytics
  - [ ] Test end-to-end locally

- [ ] **Documentation** (4 hours)
  - [ ] Complete `API_ADMIN.md`
  - [ ] Create Postman collection
  - [ ] Update README

### Phase 2: Testing & Polish (3 days)

- [ ] **Testing**
  - [ ] Run all unit tests (>80% coverage)
  - [ ] Run all integration tests
  - [ ] Manual testing with Postman

- [ ] **Performance**
  - [ ] Verify query performance
  - [ ] Check memory usage
  - [ ] Load test (simulate 100 concurrent requests)

- [ ] **Security**
  - [ ] Audit all endpoints for authorization
  - [ ] Test rate limiting
  - [ ] Verify RLS policies

- [ ] **Deployment**
  - [ ] Deploy to staging
  - [ ] Run migrations on staging DB
  - [ ] Smoke test all endpoints
  - [ ] Deploy to production

---

## Success Metrics

**Performance**:
- [ ] API response time: < 500ms (p95)
- [ ] Database queries: < 100ms (p95)
- [ ] Test coverage: > 80%

**Reliability**:
- [ ] Zero crashes in first week
- [ ] Error rate: < 0.1%
- [ ] Uptime: > 99.9%

**Usability**:
- [ ] All 8 endpoints functional
- [ ] Clear error messages
- [ ] Complete API documentation

---

## Appendices

### A. Error Code Reference

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `unauthorized` | 401 | Missing or invalid JWT token |
| `forbidden` | 403 | User is not admin |
| `validation_error` | 400 | Input validation failed |
| `duplicate_name` | 409 | App name already exists |
| `not_found` | 404 | Resource not found |
| `rate_limit_exceeded` | 429 | Too many requests |
| `database_error` | 500 | Database operation failed |
| `internal_error` | 500 | Unexpected server error |

### B. Analytics Event Types

| Event Type | Description |
|------------|-------------|
| `app_created` | New app registered |
| `app_updated` | App configuration changed |
| `app_deleted` | App deactivated or deleted |
| `secret_regenerated` | API secret regenerated |
| `login` | User logged in via app |
| `token_exchange` | Authorization code exchanged |
| `token_refresh` | Access token refreshed |
| `token_revoke` | Token revoked (logout) |
| `error` | Error occurred |

### C. Database Indexes Summary

| Table | Index Name | Columns | Purpose |
|-------|-----------|---------|---------|
| apps | idx_apps_name | name | Search by name |
| apps | idx_apps_created_at | created_at DESC | Sort by date |
| app_analytics | idx_app_analytics_app_time | app_id, created_at DESC | Query by app + date |
| app_analytics | idx_app_analytics_event_type | event_type | Filter by event |
| app_analytics | idx_app_analytics_recent | app_id, event_type, created_at | Recent events (90d) |
| app_analytics | idx_app_analytics_user | user_id | Query by user |

### D. Rate Limit Configuration

| Endpoint | Window | Max Requests |
|----------|--------|--------------|
| `/auth/*` | 15 min | 5 |
| `/api/v1/token/*` | 1 min | 10 |
| `/api/v1/admin/*` | 1 min | 100 |
| `/health` | 1 min | 1000 |

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-01-12 | System Architect | Initial design document |

---

**Next Steps**:
1. Review this architecture with team
2. Get approval from stakeholders
3. Begin implementation (Phase 1: Backend API)
4. Update task list with implementation details

**Questions?** Contact the system architect or open a GitHub issue.

---

*End of Architecture Document*
