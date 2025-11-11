# SSO API Reference

**Version**: 0.1.0
**Base URL**: `http://localhost:3000` (Development)
**Authentication**: Bearer Token (JWT)

---

## Table of Contents

- [Authentication](#authentication)
- [Authorization Flow](#authorization-flow)
- [API Endpoints](#api-endpoints)
  - [Auth Endpoints](#auth-endpoints)
  - [SSO API Endpoints](#sso-api-endpoints)
- [Error Codes](#error-codes)
- [Examples](#examples)

---

## Authentication

Most endpoints require authentication using Bearer tokens:

```
Authorization: Bearer <access_token>
```

Access tokens are obtained via the `/auth/login` endpoint.

---

## Authorization Flow

SSO uses OAuth 2.0 Authorization Code Flow:

```
┌──────┐                                         ┌──────────┐
│ App  │                                         │   SSO    │
│      │                                         │  Server  │
└──┬───┘                                         └────┬─────┘
   │                                                  │
   │ 1. Redirect to /authorize?app_id=...&redirect_uri=...
   │─────────────────────────────────────────────────>│
   │                                                  │
   │          2. User login (if not logged in)       │
   │                                                  │
   │ 3. Redirect back with code                      │
   │<─────────────────────────────────────────────────│
   │                                                  │
   │ 4. POST /token/exchange with code & app_secret  │
   │─────────────────────────────────────────────────>│
   │                                                  │
   │ 5. Receive access_token                         │
   │<─────────────────────────────────────────────────│
```

---

## API Endpoints

### Auth Endpoints

#### POST /auth/login

Email/Password login

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "authenticated"
  },
  "session": {
    "access_token": "eyJhbGc...",
    "refresh_token": "refresh...",
    "expires_in": 3600
  }
}
```

**Errors:**
- `400` - Missing credentials
- `401` - Invalid credentials

---

#### POST /auth/signup

Create new user account

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "displayName": "John Doe"
}
```

**Response (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  },
  "message": "User created successfully"
}
```

**Errors:**
- `400` - Missing credentials or signup failed
- `500` - Internal server error

---

#### POST /auth/logout

Logout current user

**Response (200):**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### SSO API Endpoints

#### GET /api/v1/apps

List all active apps

**Authentication:** None (public endpoint)

**Response (200):**
```json
{
  "apps": [
    {
      "id": "uuid",
      "name": "VTC_Logger",
      "description": "로그 관리 시스템",
      "api_key": "vtc-logger-xxx",
      "auth_method": "hybrid"
    }
  ],
  "count": 3
}
```

---

#### GET /api/v1/authorize

Request authorization code (OAuth 2.0 Authorization Code Flow)

**Authentication:** Required (Bearer token)

**Query Parameters:**
- `app_id` (required) - App API key
- `redirect_uri` (required) - Callback URL (must be whitelisted)
- `state` (optional) - CSRF protection token

**Success Response (302 Redirect):**
```
Location: {redirect_uri}?code={authorization_code}&state={state}
```

**Error Responses:**
- `400` - Invalid request (missing parameters)
- `400` - Invalid client (app not found or inactive)
- `400` - Invalid redirect_uri (not whitelisted)
- `401` - Login required (user not authenticated)
- `401` - Invalid token (expired or invalid)
- `500` - Server error

**Example Request:**
```bash
curl -X GET "http://localhost:3000/api/v1/authorize?app_id=vtc-logger-xxx&redirect_uri=http://localhost:3001/auth/callback&state=random-state" \
  -H "Authorization: Bearer eyJhbGc..."
```

**Flow:**
1. User clicks "Login with SSO" in your app
2. App redirects to `/api/v1/authorize` with Bearer token in header
3. SSO verifies user is logged in and app is valid
4. SSO generates authorization code (5 min expiry)
5. SSO redirects to your `redirect_uri` with code

---

#### POST /api/v1/token/exchange

Exchange authorization code for access token

**Authentication:** None (uses app_secret instead)

**Request Body:**
```json
{
  "code": "authorization_code_from_authorize_endpoint",
  "app_id": "vtc-logger-xxx",
  "app_secret": "your-app-secret"
}
```

**Response (200):**
```json
{
  "access_token": "eyJhbGc...",
  "refresh_token": "refresh...",
  "expires_in": 3600,
  "token_type": "Bearer",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "display_name": "John Doe",
    "role": "user"
  }
}
```

**Error Responses:**
- `400` - Invalid request (missing parameters)
- `400` - Invalid grant (code expired or invalid)
- `401` - Invalid client (app_id or app_secret incorrect)
- `500` - Server error

**Example Request:**
```bash
curl -X POST "http://localhost:3000/api/v1/token/exchange" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "abc123...",
    "app_id": "vtc-logger-xxx",
    "app_secret": "your-secret"
  }'
```

**Important Notes:**
- Authorization codes are **one-time use only** and deleted after exchange
- Codes expire after **5 minutes**
- `app_secret` must match the bcrypt-hashed secret in database
- The returned `access_token` is a valid Supabase JWT

---

## Error Codes

| Code | Error | Description |
|------|-------|-------------|
| 400 | `invalid_request` | Missing required parameters |
| 400 | `invalid_client` | Invalid app credentials |
| 400 | `invalid_redirect_uri` | Redirect URI not whitelisted |
| 400 | `invalid_grant` | Authorization code invalid/expired |
| 401 | `login_required` | User must be logged in |
| 401 | `invalid_token` | Bearer token invalid/expired |
| 401 | `unauthorized` | Missing authorization header |
| 403 | `forbidden` | Insufficient permissions |
| 500 | `server_error` | Internal server error |

---

## Examples

### Complete Authorization Flow

#### Step 1: User logs in
```bash
curl -X POST "http://localhost:3000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@sso.local",
    "password": "admin123!@#"
  }'

# Response:
{
  "success": true,
  "session": {
    "access_token": "eyJhbGc...",
    ...
  }
}
```

#### Step 2: Request authorization code
```bash
curl -X GET "http://localhost:3000/api/v1/authorize?app_id=vtc-logger-xxx&redirect_uri=http://localhost:3001/auth/callback&state=abc123" \
  -H "Authorization: Bearer eyJhbGc..."

# Response: 302 Redirect
# Location: http://localhost:3001/auth/callback?code=def456&state=abc123
```

#### Step 3: Exchange code for token
```bash
curl -X POST "http://localhost:3000/api/v1/token/exchange" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "def456",
    "app_id": "vtc-logger-xxx",
    "app_secret": "your-app-secret"
  }'

# Response:
{
  "access_token": "eyJhbGc...",
  "refresh_token": "refresh...",
  "expires_in": 3600,
  "user": {
    "id": "uuid",
    "email": "admin@sso.local",
    ...
  }
}
```

#### Step 4: Use access token
```bash
curl -X GET "https://your-app.com/api/protected-resource" \
  -H "Authorization: Bearer eyJhbGc..."
```

---

## Testing

### Manual Testing

Use the test script:
```bash
./test-sso-flow.sh
```

### Integration Testing

1. Start Supabase: `supabase start`
2. Start SSO Server: `cd server && npm start`
3. Test login: `curl -X POST http://localhost:3000/auth/login ...`
4. Test authorize: `curl -X GET http://localhost:3000/api/v1/authorize ...`

---

## Security Considerations

1. **HTTPS Required**: Use HTTPS in production
2. **app_secret Protection**: Never expose app_secret client-side
3. **redirect_uri Whitelist**: All redirect URIs must be pre-registered
4. **Code Expiry**: Authorization codes expire in 5 minutes
5. **One-Time Use**: Codes are deleted after exchange
6. **CSRF Protection**: Always use `state` parameter
7. **Token Storage**: Store access_tokens securely (httpOnly cookies recommended)

---

## Support

- GitHub Issues: https://github.com/your-repo/sso-system/issues
- Documentation: `/docs`
- PRD: [tasks/prds/0001-prd-sso-central-auth-server.md](../tasks/prds/0001-prd-sso-central-auth-server.md)

---

**Last Updated**: 2025-01-11
**Version**: 0.1.0
