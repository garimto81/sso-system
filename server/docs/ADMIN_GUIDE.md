# SSO Admin Dashboard User Guide

**Version**: 1.0.0
**Last Updated**: 2025-01-11

---

## Table of Contents

1. [Overview](#overview)
2. [Getting Started](#getting-started)
3. [Authentication](#authentication)
4. [Managing Applications](#managing-applications)
5. [Security Best Practices](#security-best-practices)
6. [Analytics & Monitoring](#analytics--monitoring)
7. [Troubleshooting](#troubleshooting)
8. [API Reference](#api-reference)

---

## Overview

The SSO Admin Dashboard provides a centralized interface for managing all applications integrated with the SSO system. Admins can:

- **Register new applications** and generate API credentials
- **Manage app configurations** (redirect URLs, origins, auth methods)
- **Monitor usage analytics** (logins, users, errors)
- **Regenerate API secrets** securely
- **Enable/disable applications** without deleting data

### Key Features

- **No-Code App Registration**: Add new apps via web UI without manual SQL
- **Secure Credential Management**: API secrets hashed with bcrypt (10 rounds)
- **One-Time Secret Display**: Plain secrets shown only once for security
- **Comprehensive Analytics**: Track logins, users, errors per app
- **Audit Logging**: All admin actions logged for compliance
- **Rate Limiting**: 100 requests/minute per admin user

---

## Getting Started

### Prerequisites

1. **Admin Account**: You must have an account with `role = 'admin'` in the `profiles` table
2. **JWT Token**: Valid Supabase Auth JWT token
3. **API Access**: Base URL configured (`http://localhost:3001/api/v1` or production URL)

### Initial Setup

1. **Create Admin Account** (via database)
   ```sql
   -- Insert user via Supabase Auth dashboard or API
   -- Then update profile role
   UPDATE profiles
   SET role = 'admin'
   WHERE email = 'admin@example.com';
   ```

2. **Obtain JWT Token**
   ```bash
   # Login via Supabase Auth
   curl -X POST https://your-project.supabase.co/auth/v1/token?grant_type=password \
     -H "apikey: YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@example.com",
       "password": "your-password"
     }'
   ```

3. **Test Authentication**
   ```bash
   curl -X GET http://localhost:3001/api/v1/admin/dashboard \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

---

## Authentication

All Admin API endpoints require:
1. **JWT Token** in `Authorization` header
2. **Admin Role** (`role = 'admin'`) in user profile

### Request Format

```http
GET /api/v1/admin/apps HTTP/1.1
Host: localhost:3001
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### Error Responses

#### 401 Unauthorized
Missing or invalid JWT token:
```json
{
  "error": "Missing or invalid authorization header",
  "code": "UNAUTHORIZED"
}
```

#### 403 Forbidden
User is not an admin:
```json
{
  "error": "Admin access required",
  "code": "INSUFFICIENT_PERMISSIONS"
}
```

### Rate Limiting

- **Limit**: 100 requests per minute per user
- **Headers**:
  - `X-RateLimit-Limit: 100`
  - `X-RateLimit-Remaining: 95`
  - `X-RateLimit-Reset: 1641234567`

When rate limit is exceeded:
```json
{
  "error": "Too many requests, please try again later."
}
```

---

## Managing Applications

### 1. Create New Application

**POST** `/api/v1/admin/apps`

**Request:**
```json
{
  "name": "My Application",
  "description": "Customer portal application",
  "redirect_urls": [
    "https://myapp.com/auth/callback",
    "http://localhost:3000/auth/callback"
  ],
  "allowed_origins": [
    "https://myapp.com",
    "http://localhost:3000"
  ],
  "auth_method": "token_exchange",
  "owner_email": "owner@example.com"
}
```

**Response:**
```json
{
  "message": "App created successfully",
  "app": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "My Application",
    "api_key": "660e8400-e29b-41d4-a716-446655440001",
    "api_secret": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2",
    "redirect_urls": [...],
    "allowed_origins": [...],
    "auth_method": "token_exchange",
    "is_active": true,
    "created_at": "2025-01-11T10:00:00.000Z"
  },
  "warning": "Save the api_secret now - it will not be shown again"
}
```

**⚠️ IMPORTANT**: The `api_secret` is shown **ONLY ONCE**. Copy it immediately and store securely. It cannot be retrieved later.

**Validation Rules:**
- `name`: 3-100 characters
- `redirect_urls`: At least 1 valid HTTPS URL (HTTP allowed for localhost)
- `allowed_origins`: Valid URLs
- `owner_email`: Must exist in `profiles` table

### 2. List Applications

**GET** `/api/v1/admin/apps`

**Query Parameters:**
- `search` (string): Search by app name
- `status` (enum): Filter by `active` or `inactive`
- `page` (integer): Page number (default: 1)
- `limit` (integer): Items per page (default: 20, max: 100)
- `sort` (enum): Sort by `created_at`, `updated_at`, or `name` (default: `created_at`)
- `order` (enum): Sort order `asc` or `desc` (default: `desc`)

**Example:**
```bash
curl -X GET "http://localhost:3001/api/v1/admin/apps?search=customer&status=active&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "apps": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Customer Portal",
      "description": "Main customer application",
      "api_key": "660e8400-e29b-41d4-a716-446655440001",
      "auth_method": "token_exchange",
      "is_active": true,
      "created_at": "2025-01-11T10:00:00.000Z",
      "updated_at": "2025-01-11T10:00:00.000Z",
      "owner": {
        "email": "owner@example.com",
        "display_name": "John Doe"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "total_pages": 8
  }
}
```

### 3. Get Application Details

**GET** `/api/v1/admin/apps/:id`

**Response:**
```json
{
  "app": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "My Application",
    "description": "Customer portal",
    "api_key": "660e8400-e29b-41d4-a716-446655440001",
    "redirect_urls": ["https://myapp.com/callback"],
    "allowed_origins": ["https://myapp.com"],
    "auth_method": "token_exchange",
    "is_active": true,
    "owner_id": "770e8400-e29b-41d4-a716-446655440002",
    "created_at": "2025-01-11T10:00:00.000Z",
    "updated_at": "2025-01-11T10:00:00.000Z",
    "owner": {
      "email": "owner@example.com",
      "display_name": "John Doe"
    },
    "stats": {
      "total_logins": 1523,
      "total_users": 342,
      "last_login_at": "2025-01-11T09:30:00.000Z"
    }
  }
}
```

**Note**: `api_secret` is **never** returned in GET requests for security.

### 4. Update Application

**PUT** `/api/v1/admin/apps/:id`

**Request:**
```json
{
  "name": "Updated App Name",
  "description": "Updated description",
  "redirect_urls": [
    "https://myapp.com/auth/callback",
    "https://myapp.com/auth/callback-v2"
  ],
  "allowed_origins": [
    "https://myapp.com"
  ],
  "is_active": true
}
```

**Response:**
```json
{
  "message": "App updated successfully",
  "app": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Updated App Name",
    // ... updated fields
  }
}
```

### 5. Delete Application

**DELETE** `/api/v1/admin/apps/:id?hard=false`

**Soft Delete** (default): Sets `is_active = false`, preserves data
**Hard Delete**: Permanently removes app and all analytics (use with caution!)

**Request:**
```json
{
  "confirmation": "My Application"
}
```

**Response:**
```json
{
  "message": "App deleted successfully"
}
```

**⚠️ Confirmation Required**: Must type exact app name to confirm deletion.

### 6. Regenerate API Secret

**POST** `/api/v1/admin/apps/:id/regenerate-secret`

**Request:**
```json
{
  "confirmation": "My Application"
}
```

**Response:**
```json
{
  "message": "API secret regenerated successfully",
  "api_secret": "x9y8z7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4z3y2x1w0v9u8",
  "warning": "Update your application configuration immediately"
}
```

**⚠️ CRITICAL**:
- Old secret becomes **invalid immediately**
- New secret shown **ONLY ONCE**
- Update your app config **before closing**
- All active sessions will break until app is updated

---

## Security Best Practices

### API Secret Management

1. **Never commit secrets to Git**
   ```bash
   # .gitignore
   .env
   .env.local
   secrets/
   ```

2. **Store in environment variables**
   ```bash
   # .env
   SSO_API_KEY=660e8400-e29b-41d4-a716-446655440001
   SSO_API_SECRET=a1b2c3d4e5f6g7h8...
   ```

3. **Use secret management tools**
   - AWS Secrets Manager
   - HashiCorp Vault
   - Azure Key Vault
   - Vercel Environment Variables

4. **Rotate secrets regularly**
   - Recommended: Every 90 days
   - Immediately after suspected compromise
   - When team member leaves

### Admin Account Security

1. **Strong passwords** (min 16 chars, mixed case, numbers, symbols)
2. **Enable MFA** (if available via Supabase)
3. **Limit admin accounts** (principle of least privilege)
4. **Monitor audit logs** (check for suspicious activity)
5. **Use unique admin accounts** (no shared credentials)

### Network Security

1. **Use HTTPS in production** (always)
2. **Whitelist IP addresses** (if possible)
3. **Configure CORS properly** (`allowed_origins`)
4. **Monitor rate limit violations**

---

## Analytics & Monitoring

### 7. Get App Analytics

**GET** `/api/v1/admin/apps/:id/analytics?days=30`

**Response:**
```json
{
  "app_id": "550e8400-e29b-41d4-a716-446655440000",
  "app_name": "My Application",
  "summary": {
    "total_events": 5234,
    "total_logins": 1523,
    "total_errors": 12,
    "unique_users": 342
  },
  "events_by_type": [
    { "event_type": "login", "count": 1523 },
    { "event_type": "token_exchange", "count": 1520 },
    { "event_type": "token_refresh", "count": 3180 },
    { "event_type": "error", "count": 12 }
  ],
  "daily_logins": [
    { "date": "2025-01-11", "count": 156 },
    { "date": "2025-01-10", "count": 142 }
  ],
  "top_users": [
    {
      "user_id": "880e8400-e29b-41d4-a716-446655440003",
      "email": "user@example.com",
      "login_count": 45
    }
  ],
  "recent_errors": [
    {
      "event_type": "error",
      "created_at": "2025-01-11T09:15:00.000Z",
      "metadata": {
        "error": "Invalid redirect_url",
        "code": "INVALID_REDIRECT"
      }
    }
  ]
}
```

**Use Cases:**
- Monitor login trends
- Identify error patterns
- Track active users
- Plan capacity

### 8. Get Global Dashboard

**GET** `/api/v1/admin/dashboard`

**Response:**
```json
{
  "total_apps": 12,
  "active_apps": 10,
  "inactive_apps": 2,
  "total_logins_today": 523,
  "total_users": 1245,
  "recent_activity": [
    {
      "app_id": "550e8400-e29b-41d4-a716-446655440000",
      "app_name": "My Application",
      "event_type": "login",
      "created_at": "2025-01-11T10:30:00.000Z",
      "user_email": "user@example.com"
    }
  ]
}
```

**Monitoring Tips:**
- Check dashboard daily for anomalies
- Set up alerts for error spikes
- Review inactive apps monthly
- Track login trends for capacity planning

---

## Troubleshooting

### Common Issues

#### 1. "Admin access required" (403 Forbidden)

**Cause**: User role is not 'admin'

**Solution**:
```sql
-- Check user role
SELECT id, email, role FROM profiles WHERE email = 'your-email@example.com';

-- Update to admin
UPDATE profiles SET role = 'admin' WHERE email = 'your-email@example.com';
```

#### 2. "Invalid or expired token" (401 Unauthorized)

**Cause**: JWT token expired or invalid

**Solution**:
- Re-authenticate via Supabase Auth
- Check token expiration (`exp` claim in JWT)
- Verify JWT_SECRET matches server config

#### 3. "Owner not found" (404 Not Found)

**Cause**: `owner_email` doesn't exist in `profiles` table

**Solution**:
- Create user account first
- Verify email spelling
- Check user has profile entry (auto-created by trigger)

#### 4. "Invalid URL" (400 Bad Request)

**Cause**: Malformed redirect_url or allowed_origin

**Solution**:
- Use full URLs: `https://myapp.com/callback` (not `/callback`)
- Include protocol: `https://` or `http://`
- For localhost: `http://localhost:3000` (OK) or `https://localhost:3000` (if using SSL)

#### 5. "Validation error: App name must be 3-100 characters"

**Cause**: Name too short or too long

**Solution**:
- Minimum: 3 characters
- Maximum: 100 characters
- No special validation (unicode allowed)

#### 6. Rate Limit Exceeded (429 Too Many Requests)

**Cause**: More than 100 requests in 1 minute

**Solution**:
- Wait 60 seconds
- Implement exponential backoff
- Review client code for loops
- Contact support if legitimate traffic

### Debug Mode

Enable detailed logging:
```bash
# .env
LOG_LEVEL=debug
```

Check logs:
```bash
# Local development
tail -f logs/app.log

# Production (Vercel)
vercel logs
```

### Support

- **GitHub Issues**: https://github.com/garimto81/sso-system/issues
- **Documentation**: [README.md](../../README.md)
- **API Reference**: [OpenAPI Spec](./api/openapi.yaml)

---

## API Reference

### Base URLs

- **Development**: `http://localhost:3001/api/v1`
- **Production**: `https://sso-system.vercel.app/api/v1`

### Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/apps` | List all applications |
| POST | `/admin/apps` | Create new application |
| GET | `/admin/apps/:id` | Get app details |
| PUT | `/admin/apps/:id` | Update application |
| DELETE | `/admin/apps/:id` | Delete application |
| POST | `/admin/apps/:id/regenerate-secret` | Regenerate API secret |
| GET | `/admin/apps/:id/analytics` | Get app analytics |
| GET | `/admin/dashboard` | Get global dashboard |

### Complete API Documentation

- **OpenAPI Spec**: [openapi.yaml](./api/openapi.yaml)
- **Postman Collection**: [Admin_API.postman_collection.json](./postman/Admin_API.postman_collection.json)

---

## Appendix

### Auth Methods

**token_exchange** (Recommended):
- Client sends `code` to SSO Server
- SSO Server validates and returns `access_token`
- Most secure, server-side validation

**jwt_validation**:
- Client receives JWT directly from SSO
- Client app validates JWT locally
- Faster, but requires JWT validation in client

### Database Schema

```sql
-- apps table
CREATE TABLE apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  api_key UUID UNIQUE NOT NULL,
  api_secret TEXT NOT NULL, -- bcrypt hash
  redirect_urls TEXT[] NOT NULL,
  allowed_origins TEXT[],
  auth_method TEXT DEFAULT 'token_exchange',
  is_active BOOLEAN DEFAULT true,
  owner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- app_analytics table
CREATE TABLE app_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID REFERENCES apps(id) ON DELETE CASCADE,
  event_type TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Audit Log Format

```json
{
  "level": "info",
  "message": "Admin action",
  "action": "create_app",
  "userId": "770e8400-e29b-41d4-a716-446655440002",
  "timestamp": "2025-01-11T10:00:00.000Z",
  "metadata": {
    "app_id": "550e8400-e29b-41d4-a716-446655440000",
    "app_name": "My Application"
  }
}
```

---

**End of Admin Guide**

*For technical implementation details, see [ADMIN_API_ARCHITECTURE.md](./ADMIN_API_ARCHITECTURE.md)*
