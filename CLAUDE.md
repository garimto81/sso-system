# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**SSO System** - OAuth 2.0 기반 중앙 통합 인증 시스템

이 프로젝트는 여러 애플리케이션을 하나의 인증으로 관리하는 Single Sign-On 시스템입니다. Backend API는 Phase 1 완료(v1.0.0), Frontend Admin Dashboard는 Phase 2 설계 완료 상태입니다.

### Architecture

```
┌─────────────────────────────────────────────────────┐
│ Supabase (PostgreSQL + Auth)                       │
│ - profiles (users with role: admin/user)           │
│ - apps (registered OAuth applications)             │
│ - app_analytics (event tracking)                   │
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ SSO Server (Express.js + Node 22)                  │
│ - /auth/* - Email/Password authentication          │
│ - /api/v1/* - OAuth 2.0 token exchange             │
│ - /api/v1/admin/* - Admin Dashboard API (8 endpoints)│
└─────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────┐
│ Client Applications                                  │
│ - VTC_Logger, contents-factory, etc.               │
│ - Integrate via OAuth 2.0 Authorization Code Flow  │
└─────────────────────────────────────────────────────┘
```

---

## Development Commands

### Local Development Setup

```bash
# 1. Start Supabase (requires Docker Desktop running)
npx supabase start

# 2. Install server dependencies
cd server
npm install

# 3. Start development server (with hot-reload)
npm run dev
# Server runs at http://localhost:3000 (or PORT in .env)

# 4. Access Supabase Studio
open http://localhost:54323
```

### Testing

```bash
cd server

# Run all tests (Jest with ESM modules)
npm test

# Run tests in watch mode
npm test:watch

# Run tests with coverage (target: 80%+)
npm test:coverage

# Run specific test file
npm test -- src/routes/__tests__/admin.test.js

# Run tests matching pattern
npm test -- -t "create app"
```

### Database Management

```bash
# Create new migration
npx supabase migration new migration_name

# Apply migrations to local database
npx supabase db reset

# Push migrations to remote (production)
npx supabase db push --db-url postgresql://user:pass@host:5432/dbname

# View database diff
npx supabase db diff

# Connect to local PostgreSQL
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres
```

### Integration Testing

```bash
# Manual end-to-end SSO flow test
./test-sso-flow.sh

# API health check
curl http://localhost:3000/health
```

### GitHub Workflow

```bash
# Setup GitHub labels (one-time)
bash scripts/setup-github-labels.sh

# Start development from GitHub Issue
bash scripts/github-issue-dev.sh <issue_number>
# Creates branch: feature/issue-N-description
```

---

## Code Architecture

### Backend Server Structure (Phase 1 ✅)

```
server/src/
├── index.js                    # Express app entry point
├── routes/
│   ├── auth.js                 # POST /auth/login, /signup (Email/Password)
│   ├── api.js                  # OAuth 2.0 endpoints (authorize, token/exchange)
│   └── admin.js                # 8 Admin API endpoints (CRUD apps, analytics)
├── middleware/
│   ├── auth.js                 # JWT validation (client apps)
│   ├── authenticateAdmin.js    # Admin JWT + role check
│   ├── adminRateLimiter.js     # 100 req/min for admins
│   └── rateLimiter.js          # General rate limits
└── utils/
    ├── supabase.js             # Supabase client (Admin + Anon)
    ├── crypto.js               # API key/secret generation (bcrypt)
    ├── validators.js           # Input validation (URLs, UUIDs, etc.)
    ├── sanitize.js             # XSS prevention (sanitize-html)
    ├── analytics.js            # Event tracking (login, error, etc.)
    └── logger.js               # Winston structured logging
```

### Key Patterns

**1. Server vs Admin Authentication**
- Client apps: `middleware/auth.js` - Validates JWT from OAuth flow
- Admin endpoints: `middleware/authenticateAdmin.js` - Validates JWT + checks `role='admin'`

**2. API Secret Security (Show-Once Pattern)**
```javascript
// On app creation: Store bcrypt hash, return plain secret ONCE
const api_secret = generateApiSecret(); // 64-char hex
const api_secret_hash = await hashSecret(api_secret); // bcrypt 10 rounds
// Store hash in DB, return plain secret in response
// Future GET requests: Never return api_secret
```

**3. Analytics Event Tracking**
```javascript
// All admin actions tracked in app_analytics table
await recordAnalyticsEvent(
  appId,
  'app_created', // event_type: app_created, secret_regenerated, etc.
  userId,
  { app_name: name }, // metadata (JSONB)
  req // For IP, user-agent
);
```

**4. Dual Supabase Clients**
```javascript
// supabaseAdmin - Full privileges (RLS bypassed)
import { supabaseAdmin } from './utils/supabase.js';

// supabaseAnon - Row-level security enforced
import { supabase } from './utils/supabase.js';
```

### Database Schema (Supabase)

**Core Tables:**
- `profiles` - Users (id, email, role, display_name)
  - `role` ENUM: 'admin', 'user'
  - Auto-created via trigger on `auth.users` insert
- `apps` - Registered OAuth applications
  - `api_key` (UUID), `api_secret` (bcrypt hash)
  - `redirect_urls` (TEXT[]), `allowed_origins` (TEXT[])
  - `is_active` (BOOLEAN) for soft delete
- `app_analytics` - Event tracking
  - `event_type`: app_created, login, token_exchange, error, etc.
  - `metadata` (JSONB) for flexible data

**Security:**
- RLS (Row Level Security) enabled on all tables
- Admin role required for admin endpoints
- Bcrypt (10 rounds) for API secrets

### Admin API (Phase 1 ✅)

**8 Endpoints:**
1. `GET /api/v1/admin/apps` - List apps (pagination, search, filter)
2. `POST /api/v1/admin/apps` - Create app (returns api_secret once!)
3. `GET /api/v1/admin/apps/:id` - App details + stats
4. `PUT /api/v1/admin/apps/:id` - Update app config
5. `DELETE /api/v1/admin/apps/:id?hard=false` - Soft/hard delete
6. `POST /api/v1/admin/apps/:id/regenerate-secret` - New secret (show once!)
7. `GET /api/v1/admin/apps/:id/analytics?days=30` - App analytics
8. `GET /api/v1/admin/dashboard` - Global stats

**Authentication:** All require `Authorization: Bearer <admin_jwt>` + `role='admin'`

### Frontend (Phase 2 - Design Complete 📋)

**Status:** Architecture designed (183+ pages), ready for implementation

**Tech Stack Confirmed:**
- Next.js 14 (App Router + React Server Components)
- shadcn/ui + TailwindCSS v4
- React Query v5 (server state) + Zustand (client state)
- React Hook Form + Zod (forms)
- Recharts (analytics charts)

**Documentation:**
- `docs/design/FRONTEND_ARCHITECTURE.md` - Technical architecture (25p)
- `docs/design/UI_UX_DESIGN.md` - 8 screen wireframes (35p)
- `docs/design/ARCHITECTURE_REVIEW.md` - Score 86/100 (20p)
- `docs/design/SECURITY_AUDIT.md` - Score 72/100 (15p)
- `docs/research/` - Industry research (88p)

**Critical Fixes Required Before Implementation:**
1. JWT Storage: Remove localStorage, use httpOnly cookies only (2h)
2. CSP Headers: Add Content Security Policy to next.config.js (1h)
3. Environment Separation: Add Test/Production toggle UI (12h)

---

## Environment Variables

**Required for Server:**
```bash
# Supabase (from npx supabase start output)
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Server
PORT=3000
NODE_ENV=development

# JWT (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=your-jwt-secret-min-32-chars
SESSION_SECRET=your-session-secret-min-32-chars

# Frontend
FRONTEND_URL=http://localhost:3000

# Logging
LOG_LEVEL=info  # debug | info | warn | error

# Security
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

**Generate Secure Secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## PRD-Driven Development

This project follows a PRD (Product Requirements Document) workflow:

**Workflow:**
```
Phase 0: PRD 작성 → Phase 0.5: Task List 생성
→ Phase 1: 구현 → Phase 2: 테스트 → Phase 3: 버전 관리
→ Phase 4: Git 커밋 → Phase 5: 검증 → Phase 6: 배포
```

**PRD Location:** `tasks/prds/NNNN-prd-feature-name.md`

**Completed PRDs:**
- PRD-0001: SSO Central Auth Server ✅ (v1.0.0)
- PRD-0003: Admin Dashboard ✅ (Phase 1 Backend complete, Phase 2 Frontend designed)

**Next PRDs:**
- PRD-0002: SSO SDK (Client library) 📋

**Commit Convention:**
```bash
git commit -m "feat: Add feature (v1.0.0) [PRD-0001]"
# Types: feat, fix, docs, refactor, perf, test
```

---

## Testing Strategy

**Test Coverage Target:** 80%+

**Test Files Location:** `server/src/**/__tests__/*.test.js`

**Current Test Suite:**
- Admin API: 36 integration tests
- Auth Middleware: 18 tests
- Crypto Utils: 32 tests
- Validators: 57 tests
- **Total: 143+ tests**

**Test Patterns:**
```javascript
// Mock Supabase
jest.mock('../../utils/supabase.js');

// Mock authenticated admin
const testAdminToken = 'test-admin-jwt-token';

// Integration test with Supertest
import request from 'supertest';
import app from '../../index.js';

describe('POST /api/v1/admin/apps', () => {
  it('should create new app', async () => {
    const response = await request(app)
      .post('/api/v1/admin/apps')
      .set('Authorization', `Bearer ${testAdminToken}`)
      .send({ name: 'Test App', ... });

    expect(response.status).toBe(201);
    expect(response.body.app.api_secret).toHaveLength(64);
  });
});
```

---

## Security Guidelines

**Critical Security Patterns:**

1. **API Secrets:** Always hash with bcrypt (10 rounds), show plain text only once
2. **JWT Storage:** httpOnly cookies only (never localStorage)
3. **Input Validation:** Use Zod schemas + sanitize-html
4. **Rate Limiting:**
   - Admin endpoints: 100 req/min
   - Auth endpoints: 5 req/15min
   - Token endpoints: 10 req/min
5. **RLS:** All tables have Row Level Security policies
6. **HTTPS:** Required in production (httpsRedirect middleware)
7. **CSP:** Content Security Policy headers via Helmet

**Never Commit:**
- `.env` files (use `.env.example` as template)
- API keys, tokens, secrets
- `tasks/prds/*-internal.md` (internal PRDs)

---

## Documentation

**For Developers:**
- `server/README.md` - Server API overview
- `server/docs/ADMIN_GUIDE.md` - Admin API user guide (47p)
- `server/docs/TESTING_GUIDE.md` - Testing instructions (34p)
- `server/docs/INTEGRATION_GUIDE.md` - Client app integration (38p)
- `server/docs/api/openapi.yaml` - OpenAPI 3.0 spec

**For Frontend Developers:**
- `docs/design/FRONTEND_QUICK_START.md` - 5-minute setup
- `docs/design/FRONTEND_ARCHITECTURE.md` - Architecture details
- `docs/design/CODE_EXAMPLES.md` - Ready-to-use code snippets

**For Product/Design:**
- `docs/design/UI_UX_DESIGN.md` - 8 screen wireframes
- `docs/design/PHASE2_EXECUTIVE_SUMMARY.md` - Phase 2 overview

**For Research:**
- `docs/research/frontend-stack-2025.md` - Next.js 14, React Query v5
- `docs/research/ui-ux-trends-2025.md` - TailwindCSS v4, shadcn/ui
- `docs/research/competitor-analysis-2025.md` - Vercel, Stripe, Auth0

---

## Common Workflows

### Adding a New Admin API Endpoint

1. **Define route** in `server/src/routes/admin.js`:
```javascript
router.post('/apps/:id/action', sanitizeBody, async (req, res) => {
  // 1. Validate input with validators.js
  // 2. Query Supabase with supabaseAdmin
  // 3. Record analytics event
  // 4. Log admin action with logger
  // 5. Return response
});
```

2. **Add validation** in `server/src/utils/validators.js`
3. **Write tests** in `server/src/routes/__tests__/admin.test.js`
4. **Update OpenAPI spec** in `server/docs/api/openapi.yaml`
5. **Run tests:** `npm test`

### Creating a Database Migration

```bash
# 1. Create migration file
npx supabase migration new add_new_table

# 2. Edit SQL file in supabase/migrations/
vim supabase/migrations/TIMESTAMP_add_new_table.sql

# 3. Test locally
npx supabase db reset

# 4. Verify in Studio
open http://localhost:54323
```

### Deploying to Production (Vercel)

```bash
# 1. Set environment variables
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_ROLE_KEY
# ... add all required env vars

# 2. Deploy
vercel --prod

# 3. Apply database migrations
npx supabase db push --db-url postgresql://postgres:password@host:5432/postgres

# 4. Verify deployment
curl https://your-app.vercel.app/health
```

---

## Project Status

**Phase 1: Backend API** ✅ v1.0.0 (Complete)
- SSO OAuth 2.0 server
- Admin Dashboard API (8 endpoints)
- Authentication & Authorization
- Analytics tracking
- Comprehensive tests (143+)
- Documentation (120+ pages)

**Phase 2: Frontend Admin Dashboard** 📋 (Design Complete)
- Architecture designed (86/100 score)
- UI/UX wireframes (8 screens)
- Security audit (72/100 score)
- 3 critical fixes identified
- Ready for implementation (6-8 weeks)

**Phase 3: Client SDK** 📋 (Planned)
- JavaScript/TypeScript SDK
- Easy integration for client apps
- PRD-0002 pending

---

## Key Technical Decisions

**Why Supabase?**
- PostgreSQL + Auth in one platform
- RLS for security
- Real-time capabilities (future)
- Self-hostable

**Why Express over Next.js API Routes?**
- Backend is separate concern from admin UI
- Easier to scale independently
- Better for microservices architecture

**Why bcrypt for API Secrets?**
- Industry standard (Stripe, Auth0 use bcrypt)
- 10 rounds = good security/performance balance
- One-way hashing prevents secret recovery

**Why Show-Once Pattern?**
- Security best practice (Stripe, GitHub)
- Forces secure storage on client
- Prevents accidental exposure in logs/UI

---

## Troubleshooting

**"Admin access required" (403)**
```sql
-- Check user role
SELECT id, email, role FROM profiles WHERE email = 'admin@example.com';

-- Grant admin role
UPDATE profiles SET role = 'admin' WHERE email = 'admin@example.com';
```

**"Supabase connection failed"**
```bash
# 1. Check Docker is running
docker ps

# 2. Restart Supabase
npx supabase stop
npx supabase start

# 3. Verify .env has correct keys
cat .env | grep SUPABASE
```

**"Tests failing"**
```bash
# Clear Jest cache
npm test -- --clearCache

# Run specific test
npm test -- src/routes/__tests__/admin.test.js -t "create app"

# Check mocks
cat server/src/**/__tests__/*.test.js | grep "jest.mock"
```

**"Port already in use"**
```bash
# Kill process on port 3000
npx kill-port 3000

# Or use different port
PORT=3001 npm run dev
```

---

## Resources

**Official Documentation:**
- [Supabase Docs](https://supabase.com/docs)
- [Next.js 14 Docs](https://nextjs.org/docs)
- [shadcn/ui](https://ui.shadcn.com)

**Internal Documentation:**
- Backend: `server/docs/ADMIN_GUIDE.md`
- Frontend: `docs/design/FRONTEND_ARCHITECTURE.md`
- Research: `docs/research/README.md`

**GitHub:**
- Issues: https://github.com/garimto81/sso-system/issues
- PRs: https://github.com/garimto81/sso-system/pulls

---

**Last Updated:** 2025-01-12
**Current Version:** v1.0.0 (Backend), v0.0.0 (Frontend - design phase)
