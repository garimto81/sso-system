# SSO Admin Dashboard API Specification

**Version**: 1.0.0
**Base URL**: `https://sso-system-ruby.vercel.app/api/v1`
**Authentication**: Bearer JWT Token (Admin role required)

---

## Authentication

All endpoints require admin authentication:

```http
Authorization: Bearer <jwt_token>
```

The JWT token must belong to a user with `role = 'admin'` in the `profiles` table.

### Error Responses

**401 Unauthorized**:
```json
{
  "error": "unauthorized",
  "message": "Missing or invalid authorization header"
}
```

**403 Forbidden**:
```json
{
  "error": "forbidden",
  "message": "Admin access required"
}
```

---

## Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/apps` | List all apps (paginated, searchable) |
| POST | `/admin/apps` | Create new app |
| GET | `/admin/apps/:id` | Get app details |
| PUT | `/admin/apps/:id` | Update app |
| DELETE | `/admin/apps/:id` | Delete/deactivate app |
| POST | `/admin/apps/:id/regenerate-secret` | Regenerate API secret |
| GET | `/admin/apps/:id/analytics` | Get app analytics |
| GET | `/admin/dashboard` | Global dashboard stats |

---

## 1. List Apps

### `GET /admin/apps`

List all registered apps with pagination, search, and filtering.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| search | string | No | - | Case-insensitive search in app name |
| status | enum | No | 'all' | Filter: 'all', 'active', 'inactive' |
| page | number | No | 1 | Page number (min: 1) |
| limit | number | No | 20 | Items per page (min: 1, max: 100) |
| sort | enum | No | 'name' | Sort by: 'name', 'created_at' |
| order | enum | No | 'asc' | Sort order: 'asc', 'desc' |

#### Request Example

```http
GET /api/v1/admin/apps?search=ojt&status=active&page=1&limit=20&sort=created_at&order=desc
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Response (200 OK)

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
      "created_at": "2025-01-12T10:30:00.000Z",
      "updated_at": "2025-01-12T10:30:00.000Z",
      "owner": {
        "id": "user-uuid",
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

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| apps | array | Array of app objects |
| apps[].id | uuid | App unique identifier |
| apps[].name | string | App display name |
| apps[].description | string | App description (nullable) |
| apps[].api_key | uuid | Public API key (client ID) |
| apps[].auth_method | enum | Authentication method |
| apps[].is_active | boolean | App activation status |
| apps[].owner | object | App owner information |
| apps[].stats | object | Usage statistics (30-day) |
| pagination | object | Pagination metadata |

---

## 2. Create App

### `POST /admin/apps`

Register a new application in the SSO system.

#### Request Body

```json
{
  "name": "New App",
  "description": "Optional description (max 500 chars)",
  "redirect_urls": [
    "http://localhost:3000/callback",
    "https://app.example.com/callback"
  ],
  "allowed_origins": [
    "http://localhost:3000",
    "https://app.example.com"
  ],
  "auth_method": "token_exchange",
  "owner_email": "dev@example.com"
}
```

#### Request Fields

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| name | string | Yes | 3-100 chars, alphanumeric + spaces/hyphens, unique |
| description | string | No | Max 500 chars |
| redirect_urls | array | Yes | Min 1, max 10 valid HTTP(S) URLs |
| allowed_origins | array | No | Valid HTTP(S) URLs |
| auth_method | enum | Yes | 'token_exchange', 'shared_cookie', 'hybrid' |
| owner_email | string | Yes | Valid email, must exist in profiles |

#### Response (201 Created)

```json
{
  "message": "App registered successfully",
  "app": {
    "id": "new-uuid",
    "name": "New App",
    "description": "Optional description",
    "api_key": "generated-uuid",
    "api_secret": "64-char-hex-string-SHOWN-ONLY-ONCE",
    "redirect_urls": ["http://localhost:3000/callback"],
    "allowed_origins": ["http://localhost:3000"],
    "auth_method": "token_exchange",
    "owner": {
      "email": "dev@example.com",
      "display_name": "Developer"
    },
    "is_active": true,
    "created_at": "2025-01-12T10:30:00.000Z",
    "updated_at": "2025-01-12T10:30:00.000Z"
  }
}
```

**IMPORTANT**: The `api_secret` field is shown **only once** in this response. It cannot be retrieved later. If lost, the owner must regenerate it.

#### Error Responses

**400 Bad Request** (Validation Error):
```json
{
  "error": "validation_error",
  "message": "Validation failed",
  "details": {
    "name": "App name already exists",
    "redirect_urls": "At least one redirect URL is required"
  }
}
```

**404 Not Found** (Owner not found):
```json
{
  "error": "not_found",
  "message": "Owner email not found in system"
}
```

---

## 3. Get App Details

### `GET /admin/apps/:id`

Retrieve detailed information about a specific app.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | uuid | Yes | App unique identifier |

#### Request Example

```http
GET /api/v1/admin/apps/a3f2b8c1-1234-5678-90ab-cdef12345678
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Response (200 OK)

```json
{
  "id": "a3f2b8c1-1234-5678-90ab-cdef12345678",
  "name": "OJT Platform",
  "description": "Employee training system",
  "api_key": "a3f2b8c1-1234-5678-90ab-cdef12345678",
  "api_secret": "$2a$10$hashed-bcrypt-secret",
  "redirect_urls": [
    "http://localhost:3000/callback",
    "https://ojt.example.com/callback"
  ],
  "allowed_origins": [
    "http://localhost:3000",
    "https://ojt.example.com"
  ],
  "auth_method": "token_exchange",
  "owner_id": "user-uuid",
  "owner": {
    "id": "user-uuid",
    "email": "admin@example.com",
    "display_name": "Admin User"
  },
  "is_active": true,
  "created_at": "2025-01-12T10:30:00.000Z",
  "updated_at": "2025-01-12T10:30:00.000Z",
  "stats": {
    "total_logins_30d": 1234,
    "active_users_30d": 456,
    "token_requests_30d": 2345,
    "error_rate_30d": 0.2
  }
}
```

**Note**: `api_secret` is returned as bcrypt hash (not plain text). Frontend should show "Show" button to reveal it (requires additional confirmation).

#### Error Responses

**404 Not Found**:
```json
{
  "error": "not_found",
  "message": "App not found"
}
```

---

## 4. Update App

### `PUT /admin/apps/:id`

Update app configuration. Partial updates are allowed.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | uuid | Yes | App unique identifier |

#### Request Body (All fields optional)

```json
{
  "name": "Updated App Name",
  "description": "Updated description",
  "redirect_urls": ["https://newurl.com/callback"],
  "allowed_origins": ["https://newurl.com"],
  "is_active": false
}
```

**Note**: You cannot update `api_key` or `api_secret` via this endpoint. Use the regenerate endpoint instead.

#### Response (200 OK)

```json
{
  "message": "App updated successfully",
  "app": {
    "id": "uuid",
    "name": "Updated App Name",
    "description": "Updated description",
    // ... full app object ...
  }
}
```

#### Error Responses

**400 Bad Request**:
```json
{
  "error": "validation_error",
  "message": "Invalid URL format: not-a-url"
}
```

**404 Not Found**:
```json
{
  "error": "not_found",
  "message": "App not found"
}
```

**409 Conflict**:
```json
{
  "error": "conflict",
  "message": "App name already exists"
}
```

---

## 5. Delete/Deactivate App

### `DELETE /admin/apps/:id`

Delete or deactivate an app.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | uuid | Yes | App unique identifier |

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| permanent | boolean | No | false | If true, permanently delete; else deactivate |

#### Request Examples

**Deactivate (default)**:
```http
DELETE /api/v1/admin/apps/a3f2b8c1-1234-5678-90ab-cdef12345678
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Permanent Delete**:
```http
DELETE /api/v1/admin/apps/a3f2b8c1-1234-5678-90ab-cdef12345678?permanent=true
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Response (200 OK)

**Deactivated**:
```json
{
  "message": "App deactivated successfully",
  "app_id": "uuid"
}
```

**Permanently Deleted**:
```json
{
  "message": "App permanently deleted",
  "app_id": "uuid"
}
```

#### Error Responses

**404 Not Found**:
```json
{
  "error": "not_found",
  "message": "App not found"
}
```

---

## 6. Regenerate API Secret

### `POST /admin/apps/:id/regenerate-secret`

Generate a new API secret for an app. The old secret is immediately invalidated.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | uuid | Yes | App unique identifier |

#### Request Body

```json
{
  "confirmation": "OJT Platform"
}
```

**Note**: The `confirmation` field must match the app name exactly (for security).

#### Response (200 OK)

```json
{
  "message": "API secret regenerated successfully",
  "api_secret": "new-64-char-hex-string-SHOWN-ONLY-ONCE",
  "warning": "Update your application configuration immediately. Old secret is now invalid."
}
```

**IMPORTANT**: The new `api_secret` is shown **only once**. It cannot be retrieved later.

#### Error Responses

**400 Bad Request** (Confirmation mismatch):
```json
{
  "error": "validation_error",
  "message": "Confirmation does not match app name"
}
```

**404 Not Found**:
```json
{
  "error": "not_found",
  "message": "App not found"
}
```

---

## 7. Get App Analytics

### `GET /admin/apps/:id/analytics`

Retrieve usage analytics and statistics for a specific app.

#### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| id | uuid | Yes | App unique identifier |

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| period | enum | No | '30d' | Time period: '7d', '30d', '90d' |

#### Request Example

```http
GET /api/v1/admin/apps/a3f2b8c1-1234-5678-90ab-cdef12345678/analytics?period=30d
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Response (200 OK)

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
    {
      "date": "2025-01-01",
      "count": 45
    },
    {
      "date": "2025-01-02",
      "count": 52
    }
    // ... more days ...
  ],
  "top_users": [
    {
      "user_id": "uuid",
      "email": "user@example.com",
      "display_name": "User One",
      "login_count": 45,
      "last_login": "2025-01-12T10:30:00.000Z"
    }
    // ... more users (max 10) ...
  ],
  "recent_errors": [
    {
      "timestamp": "2025-01-12T10:30:00.000Z",
      "error_type": "token_invalid",
      "user_id": "uuid",
      "user_email": "user@example.com",
      "metadata": {
        "ip_address": "203.0.113.1",
        "user_agent": "Mozilla/5.0..."
      }
    }
    // ... more errors (last 50) ...
  ]
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| period | string | Requested time period |
| metrics | object | Aggregated statistics |
| metrics.total_logins | number | Total login events |
| metrics.active_users | number | Unique users who logged in |
| metrics.token_requests | number | Token exchange requests |
| metrics.error_rate | number | Percentage of errors (0-100) |
| metrics.avg_logins_per_day | number | Average logins per day |
| login_trend | array | Daily login counts |
| top_users | array | Most active users (max 10) |
| recent_errors | array | Recent error events (max 50) |

#### Error Responses

**404 Not Found**:
```json
{
  "error": "not_found",
  "message": "App not found"
}
```

---

## 8. Global Dashboard

### `GET /admin/dashboard`

Get overview statistics for all apps in the system.

#### Request Example

```http
GET /api/v1/admin/dashboard
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Response (200 OK)

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
      "login_count": 3456,
      "active_users": 500
    },
    {
      "app_id": "uuid",
      "app_name": "HR System",
      "login_count": 2345,
      "active_users": 300
    }
    // ... more apps (max 10) ...
  ],
  "recent_activity": [
    {
      "type": "app_created",
      "app_name": "New App",
      "timestamp": "2025-01-12T10:30:00.000Z",
      "user": "admin@example.com"
    },
    {
      "type": "login",
      "app_name": "OJT Platform",
      "user": "user@example.com",
      "timestamp": "2025-01-12T10:25:00.000Z"
    }
    // ... more events (last 20) ...
  ]
}
```

#### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| summary | object | System-wide statistics |
| summary.total_apps | number | Total registered apps |
| summary.active_apps | number | Apps with is_active=true |
| summary.total_users | number | Total users in system |
| summary.logins_today | number | Login events today |
| summary.logins_30d | number | Login events last 30 days |
| top_apps | array | Most active apps (max 10) |
| recent_activity | array | Recent system events (last 20) |

---

## Rate Limiting

All admin endpoints are rate limited:

**Limit**: 100 requests per minute per user

**Headers** (included in response):
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1673456789
```

**Error Response** (429 Too Many Requests):
```json
{
  "error": "rate_limit_exceeded",
  "message": "Too many requests. Please try again in 1 minute.",
  "retry_after": 60
}
```

---

## Common Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `validation_error` | Request validation failed |
| 401 | `unauthorized` | Missing or invalid JWT token |
| 403 | `forbidden` | User is not admin |
| 404 | `not_found` | Resource not found |
| 409 | `conflict` | Constraint violation (e.g., duplicate name) |
| 429 | `rate_limit_exceeded` | Too many requests |
| 500 | `database_error` | Database operation failed |
| 500 | `internal_error` | Unexpected server error |

---

## Request/Response Examples

### Example 1: Create App + Get Analytics

**Step 1: Create App**
```bash
curl -X POST https://sso-system-ruby.vercel.app/api/v1/admin/apps \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My App",
    "redirect_urls": ["https://myapp.com/callback"],
    "auth_method": "token_exchange",
    "owner_email": "dev@myapp.com"
  }'
```

**Response**:
```json
{
  "message": "App registered successfully",
  "app": {
    "id": "new-app-uuid",
    "api_key": "generated-key-uuid",
    "api_secret": "64-char-secret-SAVE-THIS",
    ...
  }
}
```

**Step 2: Get Analytics**
```bash
curl https://sso-system-ruby.vercel.app/api/v1/admin/apps/new-app-uuid/analytics?period=7d \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response**:
```json
{
  "period": "7d",
  "metrics": {
    "total_logins": 0,
    "active_users": 0,
    ...
  }
}
```

### Example 2: Search + Update App

**Step 1: Search for App**
```bash
curl "https://sso-system-ruby.vercel.app/api/v1/admin/apps?search=my%20app" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response**:
```json
{
  "apps": [
    {
      "id": "app-uuid",
      "name": "My App",
      ...
    }
  ]
}
```

**Step 2: Update App**
```bash
curl -X PUT https://sso-system-ruby.vercel.app/api/v1/admin/apps/app-uuid \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated description"
  }'
```

---

## SDK / Client Libraries

### JavaScript/TypeScript Example

```typescript
// admin-api-client.ts
class AdminAPIClient {
  private baseURL = 'https://sso-system-ruby.vercel.app/api/v1';
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  async listApps(params: {
    search?: string;
    status?: 'all' | 'active' | 'inactive';
    page?: number;
    limit?: number;
  } = {}) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<{ apps: App[]; pagination: Pagination }>(
      `/admin/apps?${query}`
    );
  }

  async createApp(data: CreateAppInput) {
    return this.request<{ message: string; app: App }>('/admin/apps', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getApp(id: string) {
    return this.request<App>(`/admin/apps/${id}`);
  }

  async updateApp(id: string, data: Partial<App>) {
    return this.request<{ message: string; app: App }>(`/admin/apps/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteApp(id: string, permanent = false) {
    return this.request<{ message: string }>(
      `/admin/apps/${id}?permanent=${permanent}`,
      { method: 'DELETE' }
    );
  }

  async regenerateSecret(id: string, confirmation: string) {
    return this.request<{ message: string; api_secret: string }>(
      `/admin/apps/${id}/regenerate-secret`,
      {
        method: 'POST',
        body: JSON.stringify({ confirmation }),
      }
    );
  }

  async getAnalytics(id: string, period: '7d' | '30d' | '90d' = '30d') {
    return this.request<AnalyticsData>(
      `/admin/apps/${id}/analytics?period=${period}`
    );
  }

  async getDashboard() {
    return this.request<DashboardData>('/admin/dashboard');
  }
}

// Usage:
const client = new AdminAPIClient('your-jwt-token');

const { apps, pagination } = await client.listApps({ search: 'ojt' });
console.log(`Found ${apps.length} apps`);

const newApp = await client.createApp({
  name: 'New App',
  redirect_urls: ['http://localhost:3000/callback'],
  auth_method: 'token_exchange',
  owner_email: 'dev@example.com',
});
console.log('API Secret (save this):', newApp.app.api_secret);
```

---

## Testing with Postman

Import the Postman collection from `server/docs/postman/Admin_API.json`.

### Setup:

1. **Set Environment Variables**:
   - `base_url`: `https://sso-system-ruby.vercel.app/api/v1`
   - `admin_token`: Your JWT token (get from login)

2. **Get Admin Token**:
   - Use the "Login" request in the collection
   - Token will be auto-saved to environment

3. **Test Endpoints**:
   - All requests use `{{admin_token}}` automatically
   - Run the entire collection to test all endpoints

---

## Changelog

### v1.0.0 (2025-01-12)
- Initial API specification
- 8 admin endpoints
- Analytics support
- Rate limiting

---

**Questions or Issues?**
- Open a GitHub issue
- Contact the development team
- See [ADMIN_API_ARCHITECTURE.md](./ADMIN_API_ARCHITECTURE.md) for implementation details

---

*End of API Specification*
