# SSO Server

**Version**: 1.0.0
**License**: MIT

OAuth 2.0-based Single Sign-On (SSO) authentication server with Admin Dashboard for centralized application management.

---

## Features

### Core SSO Features
- ✅ OAuth 2.0 Authorization Code Flow
- ✅ JWT-based authentication via Supabase Auth
- ✅ Multi-tenant application support
- ✅ Secure token exchange and validation
- ✅ CORS and redirect URL validation

### Admin Dashboard (NEW in v1.0.0)
- 🎯 **No-Code App Registration**: Add apps via web UI without SQL
- 🔐 **Secure Credential Management**: Bcrypt-hashed API secrets
- 📊 **Analytics Dashboard**: Monitor logins, users, errors per app
- 🔄 **API Secret Regeneration**: One-click secret rotation
- 🔍 **Audit Logging**: Track all admin actions
- ⚡ **Rate Limiting**: 100 req/min per admin

---

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database (via Supabase)
- Supabase project with Auth enabled

### Installation

```bash
# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your Supabase credentials

# Run database migrations
npx supabase db push

# Start development server
npm run dev
```

Server runs at: `http://localhost:3001`

---

## Project Structure

```
server/
├── src/
│   ├── index.js              # Express app entry point
│   ├── routes/
│   │   ├── auth.js           # SSO OAuth endpoints
│   │   ├── api.js            # SSO API endpoints (token validation)
│   │   └── admin.js          # Admin Dashboard API (NEW)
│   ├── middleware/
│   │   ├── auth.js           # Client app authentication
│   │   ├── authenticateAdmin.js  # Admin authentication (NEW)
│   │   └── adminRateLimiter.js   # Admin rate limiting (NEW)
│   └── utils/
│       ├── supabase.js       # Supabase client
│       ├── sanitize.js       # Input sanitization (NEW)
│       ├── logger.js         # Winston logging (NEW)
│       ├── analytics.js      # Analytics tracking (NEW)
│       ├── crypto.js         # API key/secret generation (NEW)
│       └── validators.js     # Input validation (NEW)
├── docs/
│   ├── ADMIN_GUIDE.md        # Admin Dashboard user guide (NEW)
│   ├── TESTING_GUIDE.md      # Testing documentation (NEW)
│   ├── INTEGRATION_GUIDE.md  # App integration guide (NEW)
│   ├── ADMIN_API_ARCHITECTURE.md  # Technical architecture
│   ├── api/
│   │   └── openapi.yaml      # OpenAPI 3.0 spec (NEW)
│   └── postman/
│       └── Admin_API.postman_collection.json  # Postman tests (NEW)
├── supabase/
│   ├── migrations/           # Database migrations
│   └── seed.sql              # Seed data
└── package.json
```

---

## API Documentation

### SSO Endpoints (Client Apps)

#### 1. Initiate OAuth Flow
```
GET /auth/login?app_id={api_key}&redirect_url={callback_url}
```
Redirects user to Supabase Auth login page.

#### 2. OAuth Callback
```
GET /auth/callback?code={code}
```
Handles OAuth callback and redirects back to client app with authorization code.

#### 3. Token Exchange
```
POST /api/token-exchange
Content-Type: application/json

{
  "code": "auth_code_from_callback",
  "api_key": "your-api-key",
  "api_secret": "your-api-secret"
}

Response:
{
  "access_token": "jwt_token",
  "refresh_token": "refresh_token",
  "expires_in": 3600,
  "user": { "id": "...", "email": "..." }
}
```

#### 4. Validate Token
```
POST /api/validate-token
Content-Type: application/json
Authorization: Bearer {api_key}

{
  "access_token": "jwt_token"
}

Response:
{
  "valid": true,
  "user": { "id": "...", "email": "..." }
}
```

#### 5. Refresh Token
```
POST /api/refresh-token
Content-Type: application/json
Authorization: Bearer {api_key}

{
  "refresh_token": "refresh_token"
}

Response:
{
  "access_token": "new_jwt_token",
  "refresh_token": "new_refresh_token",
  "expires_in": 3600
}
```

### Admin API Endpoints (NEW)

All Admin API endpoints require:
- **JWT Authentication**: `Authorization: Bearer {jwt_token}`
- **Admin Role**: User must have `role = 'admin'`
- **Base Path**: `/api/v1/admin`

#### Apps Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/apps` | List all applications (pagination, search, filter) |
| POST | `/apps` | Create new application with auto-generated credentials |
| GET | `/apps/:id` | Get application details with stats |
| PUT | `/apps/:id` | Update application configuration |
| DELETE | `/apps/:id` | Delete application (soft or hard delete) |
| POST | `/apps/:id/regenerate-secret` | Regenerate API secret |

#### Analytics

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/apps/:id/analytics` | Get app-specific analytics (logins, users, errors) |
| GET | `/dashboard` | Get global dashboard statistics |

**📚 Complete Documentation:**
- **User Guide**: [docs/ADMIN_GUIDE.md](./docs/ADMIN_GUIDE.md)
- **OpenAPI Spec**: [docs/api/openapi.yaml](./docs/api/openapi.yaml)
- **Integration Guide**: [docs/INTEGRATION_GUIDE.md](./docs/INTEGRATION_GUIDE.md)
- **Postman Collection**: [docs/postman/Admin_API.postman_collection.json](./docs/postman/Admin_API.postman_collection.json)

---

## Environment Variables

```bash
# Server Configuration
PORT=3001
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT Configuration
JWT_SECRET=your-jwt-secret-min-32-chars
SESSION_SECRET=your-session-secret-min-32-chars

# Generate secure secrets:
# node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000

# Logging
LOG_LEVEL=info  # debug | info | warn | error
```

See [.env.example](../.env.example) for complete configuration.

---

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- src/routes/__tests__/admin.test.js

# Watch mode
npm test -- --watch
```

**Test Coverage:**
- 36 integration tests (admin API)
- 32 crypto utility tests
- 57 validator tests
- 18 auth middleware tests
- **Total: 143+ tests**

See [docs/TESTING_GUIDE.md](./docs/TESTING_GUIDE.md) for detailed testing documentation.

### Code Quality

```bash
# Lint code
npm run lint

# Format code
npm run format

# Type check (if using TypeScript)
npm run type-check
```

### Database Migrations

```bash
# Create new migration
npx supabase migration new migration_name

# Apply migrations locally
npx supabase db push

# Reset database
npx supabase db reset
```

---

## Deployment

### Vercel (Recommended)

1. **Configure Environment Variables**
   ```bash
   vercel env add SUPABASE_URL
   vercel env add SUPABASE_ANON_KEY
   vercel env add SUPABASE_SERVICE_ROLE_KEY
   vercel env add JWT_SECRET
   vercel env add SESSION_SECRET
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

3. **Apply Database Migrations**
   ```bash
   # Connect to production database
   npx supabase db push --db-url postgresql://user:pass@host:5432/dbname
   ```

### Docker

```bash
# Build image
docker build -t sso-server .

# Run container
docker run -p 3001:3001 --env-file .env sso-server
```

---

## Security

### Best Practices

✅ **Secrets Management**
- Never commit `.env` files to Git
- Use environment variables in production
- Rotate API secrets every 90 days
- Use secret management tools (AWS Secrets Manager, Vault)

✅ **Authentication**
- JWT tokens expire after 1 hour
- Refresh tokens expire after 30 days
- Admin endpoints require `role = 'admin'`
- Rate limiting: 100 req/min per admin

✅ **Input Validation**
- All inputs sanitized with `sanitize-html`
- URL validation for redirect_urls and origins
- UUID validation for IDs
- String length validation (3-100 chars for names)

✅ **Database Security**
- Row Level Security (RLS) enabled on all tables
- API secrets hashed with bcrypt (10 rounds)
- Prepared statements prevent SQL injection
- Audit logging for all admin actions

✅ **Network Security**
- CORS enabled with whitelist
- HTTPS required in production
- Security headers (Helmet.js)
- Rate limiting on all endpoints

### Security Auditing

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Check dependencies
npm outdated
```

---

## Monitoring

### Logs

**Development:**
```bash
# Console logs (colorized)
npm run dev
```

**Production:**
```bash
# Winston JSON logs
tail -f logs/app.log

# Vercel logs
vercel logs
```

**Log Levels:**
- `debug`: Detailed debugging info
- `info`: General informational messages
- `warn`: Warning messages (e.g., secret regeneration)
- `error`: Error messages with stack traces

### Analytics

Admin Dashboard provides:
- **App-level**: Logins, users, errors, daily trends
- **Global**: Total apps, active apps, logins today
- **Event tracking**: All auth events, token operations
- **Error monitoring**: Recent errors with metadata

See [docs/ADMIN_GUIDE.md#analytics--monitoring](./docs/ADMIN_GUIDE.md#analytics--monitoring)

---

## Troubleshooting

### Common Issues

#### "Admin access required" (403)
**Solution**: Update user role to admin
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'admin@example.com';
```

#### "Invalid or expired token" (401)
**Solution**: Re-authenticate via Supabase Auth
```bash
curl -X POST https://your-project.supabase.co/auth/v1/token?grant_type=password \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"email":"admin@example.com","password":"your-password"}'
```

#### "Owner not found" (404)
**Solution**: Create user account first, then create app

#### Port already in use
**Solution**: Change port in `.env` or kill process
```bash
# Kill process on port 3001
npx kill-port 3001
```

See [docs/ADMIN_GUIDE.md#troubleshooting](./docs/ADMIN_GUIDE.md#troubleshooting) for more issues.

---

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `refactor:` Code refactoring
- `test:` Add or update tests
- `chore:` Maintenance tasks

---

## License

MIT License - see [LICENSE](../LICENSE) file

---

## Support

- **Documentation**: [docs/](./docs/)
- **GitHub Issues**: https://github.com/garimto81/sso-system/issues
- **Email**: support@example.com

---

## Changelog

### v1.0.0 (2025-01-11)

#### New Features
- 🎉 **Admin Dashboard API** (8 endpoints)
  - No-code app registration
  - Secure credential management
  - Analytics & monitoring
- 🔐 **Security Hardening**
  - Bcrypt hashing for API secrets
  - Input sanitization (XSS prevention)
  - Structured logging with Winston
  - Admin authentication & rate limiting
- 📊 **Analytics System**
  - Event tracking (logins, errors, token operations)
  - App-level and global statistics
  - Top users and error reporting
- ✅ **Comprehensive Testing**
  - 143+ tests (Jest + Supertest)
  - Postman collection for manual testing
  - 80%+ code coverage

#### Documentation
- 📚 Admin User Guide (47 pages)
- 📚 OpenAPI 3.0 Specification
- 📚 Testing Guide
- 📚 Integration Guide
- 📚 Architecture Documentation

#### Migration Notes
- Run database migrations: `npx supabase db push`
- Install new dependencies: `npm install`
- Update environment variables (see `.env.example`)
- Create admin user (see [docs/ADMIN_GUIDE.md](./docs/ADMIN_GUIDE.md))

---

**Built with ❤️ using Node.js, Express, Supabase, and PostgreSQL**
