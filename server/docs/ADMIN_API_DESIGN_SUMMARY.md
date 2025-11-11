# SSO Admin Dashboard - Backend Design Summary

**Version**: 1.0.0
**Date**: 2025-01-12
**Status**: Design Complete - Ready for Implementation
**Related PRD**: [PRD-0003](../../tasks/prds/0003-prd-sso-admin-dashboard.md)

---

## Executive Summary

This document provides a quick overview of the Admin Dashboard Backend API design. Complete details are available in the linked documents below.

### What We're Building

A secure, admin-only REST API for managing SSO applications through a web dashboard, eliminating the need for manual SQL operations.

### Key Features

1. **App Management (CRUD)**: Create, read, update, delete apps via API
2. **Credential Management**: Auto-generate API keys/secrets, regenerate when needed
3. **Analytics**: Track login trends, active users, errors per app
4. **Security**: JWT authentication, admin role enforcement, rate limiting, audit logging

### Timeline

**Phase 1 (Week 1)**: Backend API implementation - **5 days**

---

## Design Documents

### 1. Architecture Document
**File**: [ADMIN_API_ARCHITECTURE.md](./ADMIN_API_ARCHITECTURE.md)

**Contents**:
- System architecture diagram
- Component breakdown (middleware, routes, utilities)
- Data flow diagrams
- Security architecture
- Database schema updates
- Error handling strategy
- Performance & scalability plan
- Testing strategy

**When to Read**: Start here for overall system understanding.

---

### 2. API Specification
**File**: [API_ADMIN_SPEC.md](./API_ADMIN_SPEC.md)

**Contents**:
- Complete OpenAPI-style API reference
- All 8 endpoints with request/response schemas
- Authentication flow
- Error codes and messages
- Code examples (JavaScript/TypeScript, curl)
- Postman collection setup

**When to Read**: When implementing frontend or testing API endpoints.

---

### 3. File Structure & Code Interfaces
**File**: [ADMIN_API_FILE_STRUCTURE.md](./ADMIN_API_FILE_STRUCTURE.md)

**Contents**:
- Complete directory tree
- Every file to be created (with NEW/UPDATE markers)
- Function signatures and interfaces
- Implementation templates
- Test structure
- Dependencies per file

**When to Read**: Before starting implementation to understand all files needed.

---

## API Endpoints Overview

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/admin/apps` | List apps (paginated, searchable) | Admin |
| POST | `/admin/apps` | Create new app | Admin |
| GET | `/admin/apps/:id` | Get app details | Admin |
| PUT | `/admin/apps/:id` | Update app | Admin |
| DELETE | `/admin/apps/:id` | Delete/deactivate app | Admin |
| POST | `/admin/apps/:id/regenerate-secret` | Regenerate API secret | Admin |
| GET | `/admin/apps/:id/analytics` | Get app analytics | Admin |
| GET | `/admin/dashboard` | Global dashboard stats | Admin |

**Base URL**: `https://sso-system-ruby.vercel.app/api/v1`

**Authentication**: `Authorization: Bearer <jwt_token>` (Admin role required)

---

## Database Changes

### New Table: app_analytics

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

- `app_usage_stats` - Extended with analytics data

**Migration File**: `supabase/migrations/20250113000001_app_analytics.sql`

---

## File Structure Summary

### New Files (18 total)

**Middleware** (3 files):
- `server/src/middleware/authenticateAdmin.js` - JWT + role check
- `server/src/middleware/adminRateLimiter.js` - Rate limiting
- `server/src/middleware/errorHandler.js` - Error handling

**Routes** (1 file):
- `server/src/routes/admin.js` - All 8 admin endpoints

**Utilities** (3 files):
- `server/src/utils/crypto.js` - Key generation, hashing
- `server/src/utils/validators.js` - Input validation
- `server/src/utils/analytics.js` - Event recording

**Tests** (5 files):
- Unit tests for middleware, utilities
- Integration tests for routes

**Documentation** (3 files):
- Architecture doc (this set)
- API spec
- File structure guide

**Configuration** (2 files):
- `jest.config.js` - Test configuration
- Database migration file

**Postman** (1 file):
- `Admin_API.json` - API collection

### Files to Update (3 files)

- `server/src/index.js` - Mount admin routes, add error handler
- `server/src/routes/api.js` - Add analytics recording
- `server/package.json` - Add dependencies

---

## Security Highlights

### 1. Authentication & Authorization
- **JWT Validation**: Every request validates Bearer token
- **Role Check**: Only users with `role='admin'` can access
- **Dual Layer**: Middleware + RLS policies

### 2. API Secret Management
- **Generation**: 256-bit random bytes (64-char hex)
- **Storage**: Bcrypt hashed (never plain text)
- **Display**: Shown only once at creation/regeneration
- **Verification**: Compare hashes during token exchange

### 3. Rate Limiting
- **Admin API**: 100 requests/min per user
- **Prevents**: Accidental DOS, compromised account abuse

### 4. Audit Logging
- **All Actions**: Create, update, delete, regenerate tracked
- **Stored In**: `app_analytics` table
- **Retention**: 90 days (configurable)

### 5. Input Validation
- **Client-Side**: React Hook Form + Zod (frontend)
- **Server-Side**: Custom validators + express-validator
- **Defense in Depth**: Never trust client input

---

## Implementation Workflow

### Week 1: Backend API (5 days)

**Day 1: Foundation**
- [ ] Create database migration
- [ ] Create utility modules (crypto, validators, analytics)
- [ ] Write unit tests for utilities
- [ ] Run tests: `npm test`

**Day 2: Middleware**
- [ ] Create authenticateAdmin middleware
- [ ] Create adminRateLimiter middleware
- [ ] Create errorHandler middleware
- [ ] Write unit tests for middleware
- [ ] Run tests: `npm test`

**Day 3-4: Routes**
- [ ] Create admin.js route file
- [ ] Implement all 8 endpoints
- [ ] Add input validation
- [ ] Write integration tests
- [ ] Run tests: `npm test`

**Day 5: Integration & Documentation**
- [ ] Update index.js to mount routes
- [ ] Update api.js to record analytics
- [ ] Create Postman collection
- [ ] Manual testing with Postman
- [ ] Deploy to staging

---

## Testing Strategy

### Unit Tests (>80% coverage)
- Middleware: authenticateAdmin, errorHandler
- Utilities: crypto, validators, analytics

### Integration Tests
- All 8 API endpoints
- Happy paths + error cases
- Authentication/authorization checks

### Manual Testing
- Postman collection (all endpoints)
- End-to-end workflows
- Security testing (auth bypass attempts)

### Test Commands
```bash
npm test                # Run all tests
npm test:coverage       # With coverage report
npm test:watch          # Watch mode
```

---

## Key Design Decisions

### 1. Why bcrypt for API secrets?
**Decision**: Hash API secrets with bcrypt (like passwords)

**Rationale**:
- If database is compromised, secrets are protected
- Industry standard for password-like credentials
- Allows verification without storing plain text

**Trade-off**: Can't retrieve original secret (by design)

---

### 2. Why show API secret only once?
**Decision**: Display secret only at creation/regeneration

**Rationale**:
- Forces users to save it securely
- Prevents casual secret exposure
- Aligns with security best practices (AWS, GitHub, etc.)

**Trade-off**: Users who lose secret must regenerate

---

### 3. Why rate limit admin API?
**Decision**: 100 requests/min limit for admin endpoints

**Rationale**:
- Prevents accidental DOS from buggy scripts
- Limits damage from compromised admin accounts
- Protects database from excessive queries

**Trade-off**: May need adjustment for batch operations

---

### 4. Why separate analytics table?
**Decision**: Create dedicated `app_analytics` table vs. extending `apps`

**Rationale**:
- High write volume (every login tracked)
- Time-series data (efficient queries with indexes)
- Can prune old data without affecting apps table

**Trade-off**: Additional table to maintain

---

### 5. Why stored functions for analytics?
**Decision**: Use PostgreSQL functions vs. application code

**Rationale**:
- Faster queries (runs in database)
- Reduces data transfer
- Simplifies route handlers

**Trade-off**: Database-specific code (less portable)

---

## Performance Targets

| Operation | Target | Critical |
|-----------|--------|----------|
| List apps | <100ms | <300ms |
| Get app details | <50ms | <150ms |
| Create app | <200ms | <500ms |
| Analytics query | <500ms | <1000ms |

**Test Environment**: 1000 apps, 100,000 analytics events

---

## Success Metrics

### Technical
- [ ] Test coverage: >80%
- [ ] All endpoints functional
- [ ] Response times meet targets
- [ ] Zero security vulnerabilities

### User Experience
- [ ] App registration: 5min → 30sec
- [ ] Registration error rate: 10% → <1%
- [ ] Admin satisfaction: 4.5/5

### Reliability
- [ ] Uptime: >99.9%
- [ ] Error rate: <0.1%
- [ ] Zero crashes in first week

---

## Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Admin token leaked | High | Low | Short expiration (24h), rate limiting |
| Database performance | Medium | Medium | Indexes, pagination, caching plan |
| API secret lost | Low | Medium | Clear warnings, regenerate feature |
| Analytics table bloat | Medium | High | Prune old data (>90 days) |

---

## Next Steps

### 1. Review & Approval (1 day)
- [ ] Team reviews design documents
- [ ] Stakeholders approve
- [ ] Address any concerns

### 2. Setup (0.5 day)
- [ ] Create feature branch: `feature/admin-dashboard-backend`
- [ ] Install dependencies: `npm install jest supertest express-validator`
- [ ] Configure Jest

### 3. Implementation (5 days)
- [ ] Follow [ADMIN_API_FILE_STRUCTURE.md](./ADMIN_API_FILE_STRUCTURE.md)
- [ ] Check off tasks in implementation checklist
- [ ] Run tests after each component

### 4. Testing (2 days)
- [ ] Unit tests (>80% coverage)
- [ ] Integration tests (all endpoints)
- [ ] Manual testing (Postman)
- [ ] Security testing

### 5. Deployment (1 day)
- [ ] Deploy to staging
- [ ] Run migrations
- [ ] Smoke tests
- [ ] Deploy to production

---

## Questions & Answers

### Q: Can app owners access admin API?
**A**: No, only users with `role='admin'` can access. App owners will get a separate portal in v1.2.0.

### Q: What happens to analytics data when an app is deleted?
**A**: If **permanent delete**: Analytics are CASCADE deleted. If **deactivate**: Analytics are preserved.

### Q: Can we retrieve a forgotten API secret?
**A**: No, by design. User must regenerate a new secret. This is a security feature.

### Q: How do we handle high analytics write volume?
**A**: Database indexes, async writes (don't block main flow), future: batch inserts.

### Q: What if admin token is compromised?
**A**: Short expiration (24h), rate limiting, audit logging. Revoke via Supabase dashboard.

---

## Resources

### Documentation
- [ADMIN_API_ARCHITECTURE.md](./ADMIN_API_ARCHITECTURE.md) - Full architecture
- [API_ADMIN_SPEC.md](./API_ADMIN_SPEC.md) - API reference
- [ADMIN_API_FILE_STRUCTURE.md](./ADMIN_API_FILE_STRUCTURE.md) - Implementation guide
- [PRD-0003](../../tasks/prds/0003-prd-sso-admin-dashboard.md) - Requirements

### External References
- [Express.js Docs](https://expressjs.com/)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript/introduction)
- [bcrypt.js](https://github.com/dcodeIO/bcrypt.js)
- [Jest Testing](https://jestjs.io/)
- [Supertest](https://github.com/ladjs/supertest)

### Tools
- [Postman](https://www.postman.com/) - API testing
- [TablePlus](https://tableplus.com/) - Database GUI
- [VS Code](https://code.visualstudio.com/) - IDE

---

## Contact

**Questions?**
- Open a GitHub issue in the repo
- Contact the backend team lead
- See documentation links above

**Feedback?**
- Submit suggestions via issue tracker
- Discuss in team channel

---

## Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-01-12 | System Architect | Initial design complete |

---

## Approval Sign-off

**Architecture Approved By**:
- [ ] System Architect: _______________
- [ ] Backend Lead: _______________
- [ ] Security Team: _______________
- [ ] Product Owner: _______________

**Date**: _______________

---

**Status**: ✅ **Design Complete - Ready for Implementation**

**Next Action**: Begin Phase 1 implementation (Week 1: Backend API)

---

*End of Design Summary*
