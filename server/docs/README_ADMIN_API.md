# SSO Admin Dashboard - Backend API Documentation

**Welcome to the Admin Dashboard Backend API documentation!**

This directory contains complete design documentation for the backend API that powers the SSO Admin Dashboard.

---

## Quick Navigation

### 📋 Start Here
- **[Design Summary](./ADMIN_API_DESIGN_SUMMARY.md)** - 5-minute overview of the entire design

### 📚 Complete Documentation

1. **[Architecture Document](./ADMIN_API_ARCHITECTURE.md)** (MAIN)
   - System overview & diagrams
   - Component architecture
   - Data flow
   - Security architecture
   - Database schema
   - Error handling
   - Testing strategy
   - **READ THIS FIRST** for complete understanding

2. **[API Specification](./API_ADMIN_SPEC.md)**
   - Complete API reference
   - All 8 endpoints
   - Request/response schemas
   - Error codes
   - Code examples
   - **USE THIS** when implementing frontend or testing

3. **[File Structure & Interfaces](./ADMIN_API_FILE_STRUCTURE.md)**
   - Every file to create/update
   - Function signatures
   - Implementation templates
   - Test structure
   - **USE THIS** when implementing backend

---

## What's Being Built

A secure, admin-only REST API for managing SSO applications through a web dashboard.

### Key Features

- **App Management**: Create, update, delete apps (no more SQL!)
- **Credential Management**: Auto-generate API keys/secrets
- **Analytics**: Login trends, active users, error tracking
- **Security**: JWT auth, admin role, rate limiting, audit logging

### Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js 4.x
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT (Supabase Auth)
- **Testing**: Jest + Supertest

---

## API Endpoints (8 total)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/admin/apps` | List apps (paginated, searchable) |
| POST | `/admin/apps` | Create new app |
| GET | `/admin/apps/:id` | Get app details |
| PUT | `/admin/apps/:id` | Update app |
| DELETE | `/admin/apps/:id` | Delete/deactivate app |
| POST | `/admin/apps/:id/regenerate-secret` | Regenerate API secret |
| GET | `/admin/apps/:id/analytics` | Get app analytics |
| GET | `/admin/dashboard` | Global dashboard stats |

**Base URL**: `https://sso-system-ruby.vercel.app/api/v1`

**Auth**: `Authorization: Bearer <jwt_token>` (Admin role required)

---

## File Structure Overview

### New Files (18 total)

```
server/
├── src/
│   ├── middleware/
│   │   ├── authenticateAdmin.js        # NEW: JWT + role check
│   │   ├── adminRateLimiter.js         # NEW: Rate limiting
│   │   └── errorHandler.js             # NEW: Error handling
│   ├── routes/
│   │   └── admin.js                    # NEW: 8 admin endpoints
│   ├── utils/
│   │   ├── crypto.js                   # NEW: Key generation
│   │   ├── validators.js               # NEW: Input validation
│   │   └── analytics.js                # NEW: Event recording
│   └── __tests__/                      # NEW: Test files
├── docs/
│   ├── ADMIN_API_ARCHITECTURE.md       # This documentation set
│   ├── API_ADMIN_SPEC.md
│   ├── ADMIN_API_FILE_STRUCTURE.md
│   └── postman/
│       └── Admin_API.json              # NEW: Postman collection
└── jest.config.js                      # NEW: Test config

supabase/
└── migrations/
    └── 20250113000001_app_analytics.sql # NEW: Analytics table
```

### Files to Update (3 files)

- `server/src/index.js` - Mount admin routes
- `server/src/routes/api.js` - Add analytics recording
- `server/package.json` - Add dependencies

---

## Database Changes

### New Table: app_analytics

Tracks all app usage events (logins, token exchanges, errors).

```sql
CREATE TABLE app_analytics (
  id UUID PRIMARY KEY,
  app_id UUID REFERENCES apps(id),
  event_type TEXT,  -- 'login', 'token_exchange', 'error', etc.
  user_id UUID REFERENCES auth.users(id),
  metadata JSONB,
  created_at TIMESTAMPTZ
);
```

### New Functions

- `get_login_trend(app_id, days)` - Daily login counts for charts
- `get_top_users(app_id, limit)` - Most active users per app

### Updated Views

- `app_usage_stats` - Extended with 30-day metrics

**Migration**: `supabase/migrations/20250113000001_app_analytics.sql`

---

## Implementation Timeline

### Week 1: Backend API (5 days)

**Day 1**: Database + Utilities
- Create analytics table migration
- Implement crypto, validators, analytics utils
- Write unit tests

**Day 2**: Middleware
- Implement authenticateAdmin
- Implement adminRateLimiter
- Implement errorHandler
- Write unit tests

**Day 3-4**: Routes
- Implement all 8 admin endpoints
- Add input validation
- Write integration tests

**Day 5**: Integration & Testing
- Mount routes in index.js
- Update api.js for analytics
- Create Postman collection
- Manual testing
- Deploy to staging

---

## Getting Started (Developers)

### 1. Read Documentation (30 minutes)

Start with **[Design Summary](./ADMIN_API_DESIGN_SUMMARY.md)**, then:
- Architecture doc for system understanding
- File Structure doc for implementation guide
- API Spec for endpoint details

### 2. Setup (10 minutes)

```bash
# Create feature branch
git checkout -b feature/admin-dashboard-backend

# Install dependencies
cd server
npm install jest supertest express-validator

# Configure Jest
# (jest.config.js template in File Structure doc)
```

### 3. Implementation Order

Follow this order for smooth development:

1. **Database** (File Structure doc → Migration section)
   - Create migration file
   - Test locally: `supabase migration up`

2. **Utilities** (File Structure doc → Utilities section)
   - Create `crypto.js`, `validators.js`, `analytics.js`
   - Write tests: `npm test utils`

3. **Middleware** (File Structure doc → Middleware section)
   - Create `authenticateAdmin.js`, `adminRateLimiter.js`, `errorHandler.js`
   - Write tests: `npm test middleware`

4. **Routes** (File Structure doc → Routes section)
   - Create `admin.js` with all 8 endpoints
   - Write integration tests: `npm test routes`

5. **Integration** (File Structure doc → Updates section)
   - Update `index.js` to mount routes
   - Update `api.js` to record analytics

6. **Testing** (Architecture doc → Testing section)
   - Run all tests: `npm test`
   - Create Postman collection
   - Manual testing

---

## Testing

### Run Tests

```bash
# All tests
npm test

# With coverage (target >80%)
npm test:coverage

# Watch mode
npm test:watch

# Specific file
npm test authenticateAdmin.test.js
```

### Manual Testing

1. Import Postman collection: `docs/postman/Admin_API.json`
2. Set environment variables:
   - `base_url`: `http://localhost:3000/api/v1`
   - `admin_token`: (get from login)
3. Run collection

---

## Security Checklist

Before deploying to production:

- [ ] All endpoints require admin authentication
- [ ] Rate limiting configured (100 req/min)
- [ ] API secrets never stored in plain text
- [ ] Input validation on all endpoints
- [ ] Error messages don't leak sensitive info
- [ ] Audit logging for all mutations
- [ ] RLS policies tested
- [ ] No SQL injection vulnerabilities
- [ ] JWT expiration set (24 hours)
- [ ] HTTPS enforced in production

---

## Common Tasks

### Add a New Admin Endpoint

1. **Add route** in `routes/admin.js`:
   ```javascript
   router.get('/my-endpoint', myHandler);
   ```

2. **Implement handler**:
   ```javascript
   async function myHandler(req, res, next) {
     try {
       // Business logic
       res.json({ data });
     } catch (err) {
       next(err); // Pass to error handler
     }
   }
   ```

3. **Add validation** (if needed):
   ```javascript
   const validation = validateMyData(req.body);
   if (!validation.valid) {
     return res.status(400).json({
       error: 'validation_error',
       details: validation.errors
     });
   }
   ```

4. **Write tests** in `__tests__/routes/admin.test.js`

5. **Update API spec**: Add endpoint documentation

---

### Record Analytics Event

```javascript
import recordAnalyticsEvent from '../utils/analytics.js';

// In route handler
await recordAnalyticsEvent(
  app.id,           // App UUID
  'app_updated',    // Event type
  req.user.id,      // Admin user UUID
  {                 // Optional metadata
    changes: { name: 'New Name' },
    admin_email: req.user.email
  }
);
```

---

### Regenerate API Secret

**Endpoint**: `POST /api/v1/admin/apps/:id/regenerate-secret`

**Frontend Flow**:
1. Show confirmation modal
2. User types app name
3. Submit to API
4. Display new secret **once**
5. Show warning: "Save now, won't be shown again"

**Backend Flow**:
1. Verify confirmation matches app name
2. Generate new secret: `generateApiSecret()`
3. Hash with bcrypt: `hashSecret(secret)`
4. Update database
5. Return **plain secret** (only time shown)
6. Record analytics event

---

## Troubleshooting

### Common Issues

**Issue**: Tests fail with "Cannot find module"
**Fix**: Check import paths use `.js` extension (ESM requirement)

**Issue**: Database queries fail
**Fix**: Ensure `SUPABASE_SERVICE_ROLE_KEY` is set (not anon key)

**Issue**: 401 on admin endpoints
**Fix**: Check JWT token is valid and user has `role='admin'`

**Issue**: Rate limit too restrictive
**Fix**: Adjust `adminRateLimiter.js` max value (default: 100/min)

**Issue**: Analytics not recording
**Fix**: Errors logged but don't throw (check console for error messages)

---

## Performance Tips

### Database Queries

1. **Always paginate** - Use `.range(from, to)`
2. **Use indexes** - Create for frequently queried columns
3. **Use views** - Pre-aggregate data (e.g., `app_usage_stats`)
4. **Limit joins** - Fetch related data separately if needed

### Caching (Future)

```javascript
// Example: Cache app list for 5 minutes
const cacheKey = `apps:list:${JSON.stringify(filters)}`;
const cached = await redis.get(cacheKey);
if (cached) return JSON.parse(cached);

// ... fetch from DB ...

await redis.setex(cacheKey, 300, JSON.stringify(data));
```

### Analytics

- **Batch inserts** for high volume (future)
- **Prune old data** (>90 days) regularly
- **Use partial indexes** for recent queries

---

## FAQ

**Q: Why separate admin API from main API?**
**A**: Security isolation, different auth requirements, easier to rate limit.

**Q: Can app owners access admin API?**
**A**: No, only users with `role='admin'`. Owners get separate portal in v1.2.0.

**Q: What happens if I lose an API secret?**
**A**: Must regenerate via `/regenerate-secret` endpoint. Old secret invalidated.

**Q: How long are analytics stored?**
**A**: Default 90 days, then pruned. Can be configured.

**Q: Can I increase rate limit?**
**A**: Yes, edit `adminRateLimiter.js`. Consider impact on database.

**Q: How do I add a new event type?**
**A**: Add to `app_analytics` table CHECK constraint, update analytics.js JSDoc.

---

## Resources

### Documentation
- [Architecture Document](./ADMIN_API_ARCHITECTURE.md)
- [API Specification](./API_ADMIN_SPEC.md)
- [File Structure Guide](./ADMIN_API_FILE_STRUCTURE.md)
- [Design Summary](./ADMIN_API_DESIGN_SUMMARY.md)

### Related
- [PRD-0003](../../tasks/prds/0003-prd-sso-admin-dashboard.md) - Requirements
- [Task List](../../tasks/0003-tasks-sso-admin-dashboard.md) - Implementation tasks

### External
- [Express.js Docs](https://expressjs.com/)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript/introduction)
- [Jest Testing](https://jestjs.io/)
- [Supertest](https://github.com/ladjs/supertest)

---

## Support

**Questions?**
- Open GitHub issue
- Ask in team chat
- Review documentation above

**Found a bug?**
- Create issue with reproduction steps
- Include error logs
- Mention environment (dev/staging/prod)

**Need help implementing?**
- Review File Structure doc for templates
- Check examples in this doc
- Ask team lead

---

## Status

**Design**: ✅ Complete
**Implementation**: 🔜 Ready to start
**Testing**: ⏳ Pending implementation
**Deployment**: ⏳ Week 1

---

**Last Updated**: 2025-01-12
**Maintained By**: Backend Team

---

*Happy coding! 🚀*
