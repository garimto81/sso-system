# SSO System v1.0.0 Refactoring Plan

**Branch**: `refactor/v1.0.0-security-architecture`
**Target Version**: v1.0.0
**Estimated Duration**: 5-7 days
**Status**: In Progress

---

## 🎯 Refactoring Goals

### Primary Objectives
1. **Security Hardening**: Fix all CRITICAL and HIGH severity issues
2. **Architecture Improvement**: Refactor SSOClient into manager classes
3. **Production Readiness**: Make system production-ready with v1.0.0 quality

### Success Criteria
- ✅ All CRITICAL security issues resolved
- ✅ Code quality score: 8.5+/10
- ✅ Security score: 9+/10
- ✅ Test coverage: 80%+
- ✅ Architecture score: 9+/10

---

## 📊 Current State (v0.1.0)

| Aspect | Score | Status |
|--------|-------|--------|
| Code Quality | 8/10 | ✅ Good |
| Architecture | 7.2/10 | ⚠️ Needs refactoring |
| Database | 8.5/10 | ⚠️ Minor fixes needed |
| Security | 5.5/10 | 🔴 Critical issues |
| **Overall** | **7.3/10** | ⚠️ Not production-ready |

### Critical Issues Found
1. 🔴 appSecret exposed in client-side code
2. 🔴 Missing token refresh/revoke endpoints
3. 🔴 No rate limiting
4. 🔴 No HTTPS enforcement
5. ⚠️ SSOClient god class (395 lines)
6. ⚠️ Promise.resolve() anti-pattern (13 occurrences)
7. ⚠️ No centralized HTTP client
8. ⚠️ Database index optimization needed

---

## 🗓️ Phase-by-Phase Plan

### **Phase 1: Critical Security Fixes (Day 1-2)**

#### 1.1 Backend Proxy Pattern Implementation
**Goal**: Remove appSecret from client-side SDK

**Changes**:
- Create new server endpoint: `POST /api/v1/token/exchange/proxy`
- SDK calls app backend instead of SSO server directly
- App backend stores appSecret, proxies token exchange

**Files**:
- `server/src/routes/api.js` - Add proxy endpoint
- `sdk/src/SSOClient.ts` - Remove appSecret from config
- `sdk/src/types.ts` - Update SSOConfig type
- `sdk/README.md` - Update integration guide

**New Flow**:
```
Browser (SDK) → App Backend → SSO Server
              (appSecret)
```

#### 1.2 Token Refresh & Revoke Endpoints
**Goal**: Implement missing critical endpoints

**Endpoints**:
- `POST /api/v1/token/refresh`
- `POST /api/v1/token/revoke`

**Files**:
- `server/src/routes/api.js`
- Tests: `server/tests/api.test.js`

#### 1.3 Rate Limiting
**Goal**: Prevent brute-force and DoS attacks

**Implementation**:
```javascript
import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
});

const tokenLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
});
```

**Files**:
- `server/src/middleware/rateLimiter.js` - New file
- `server/src/routes/auth.js` - Apply limiter
- `server/src/routes/api.js` - Apply limiter

#### 1.4 Security Headers (Helmet)
**Goal**: Add security headers

**Files**:
- `server/src/index.js` - Add helmet middleware
- `server/package.json` - Add helmet dependency

#### 1.5 HTTPS Enforcement
**Goal**: Force HTTPS in production

**Files**:
- `server/src/middleware/httpsRedirect.js` - New file
- `server/src/index.js` - Apply middleware

**Deliverables**:
- ✅ appSecret removed from client SDK
- ✅ Token refresh/revoke working
- ✅ Rate limiting active
- ✅ Security headers enabled
- ✅ HTTPS redirect in production
- ✅ Security score: 9+/10

---

### **Phase 2: Database Optimization (Day 2)**

#### 2.1 Create Performance & Security Migration
**File**: `supabase/migrations/20250112000004_performance_security_fixes.sql`

**Changes**:
1. Composite index for auth code validation
2. Unique constraint on user-app auth codes
3. Rate limiting trigger
4. Data validation constraints
5. Public view without api_secret
6. Monitoring views

#### 2.2 Apply Migration
```bash
npx supabase migration up
```

#### 2.3 Test Migration
- Query performance tests
- Rate limit trigger tests
- Unique constraint tests

**Deliverables**:
- ✅ Database migration applied
- ✅ Performance improved (2-3x faster token exchange)
- ✅ Security hardened (api_secret protected)
- ✅ Database score: 9.5+/10

---

### **Phase 3: SDK Architecture Refactoring (Day 3-4)**

#### 3.1 Create Manager Classes

**New Structure**:
```
sdk/src/
├── SSOClient.ts (orchestrator, ~100 lines)
├── managers/
│   ├── AuthorizationManager.ts (~120 lines)
│   ├── TokenManager.ts (~150 lines)
│   ├── UserManager.ts (~80 lines)
│   └── NetworkClient.ts (~100 lines)
├── storage/ (unchanged)
├── utils/ (unchanged)
└── types.ts (updated)
```

#### 3.2 AuthorizationManager
**Responsibilities**:
- `authorize()` - Start OAuth flow
- `handleCallback()` - Exchange code for token
- State parameter management

**File**: `sdk/src/managers/AuthorizationManager.ts`

#### 3.3 TokenManager
**Responsibilities**:
- `exchange()` - Exchange code for token
- `refresh()` - Refresh access token
- `getValid()` - Get valid token (auto-refresh)
- `setupAutoRefresh()` - Timer management
- `clearAutoRefresh()` - Cleanup

**File**: `sdk/src/managers/TokenManager.ts`

#### 3.4 UserManager
**Responsibilities**:
- `fetch()` - Fetch user from API
- `get()` - Get cached user
- `invalidate()` - Clear cache
- Cache TTL management

**File**: `sdk/src/managers/UserManager.ts`

#### 3.5 NetworkClient
**Responsibilities**:
- Centralized HTTP client
- Error mapping
- Retry logic
- Timeout handling
- Request/response interceptors

**File**: `sdk/src/managers/NetworkClient.ts`

#### 3.6 Update SSOClient
**New Structure**:
```typescript
export class SSOClient {
  private auth: AuthorizationManager;
  private tokens: TokenManager;
  private users: UserManager;

  constructor(config: SSOConfig) {
    const network = new NetworkClient(config);
    const storage = StorageFactory.create(config.storage);

    this.auth = new AuthorizationManager(storage, network, config);
    this.tokens = new TokenManager(storage, network, config);
    this.users = new UserManager(storage, network, this.tokens);
  }

  // Delegate to managers
  authorize(opts?) { return this.auth.authorize(opts); }
  handleCallback() { return this.auth.handleCallback(); }
  getUser() { return this.users.get(); }
  getAccessToken() { return this.tokens.getValid(); }
  refreshToken() { return this.tokens.refresh(); }
  logout(revoke?) { return this.tokens.clear(revoke); }
  destroy() { this.tokens.clearAutoRefresh(); }
}
```

**Deliverables**:
- ✅ 4 manager classes created
- ✅ SSOClient refactored to ~100 lines
- ✅ Single Responsibility Principle achieved
- ✅ Architecture score: 9+/10

---

### **Phase 4: Storage & Promise Refactoring (Day 4)**

#### 4.1 Synchronous Storage Adapters
**Goal**: Remove Promise.resolve() anti-pattern

**Changes**:
```typescript
// Old (async/sync mix)
abstract class StorageAdapter {
  abstract getToken(): Promise<StoredTokenData | null> | StoredTokenData | null;
}

// New (synchronous)
abstract class StorageAdapter {
  abstract getToken(): StoredTokenData | null;
  abstract setToken(data: StoredTokenData): void;
  abstract removeToken(): void;
  abstract setState(state: string): void;
  abstract getState(): string | null;
  abstract removeState(): void;
  abstract clear(): void;
}
```

**Files**:
- `sdk/src/storage/StorageAdapter.ts`
- All storage adapter implementations
- All manager classes (remove Promise.resolve())

#### 4.2 Async Storage Support (Future)
**File**: `sdk/src/storage/AsyncStorageAdapter.ts` (new base class)

For IndexedDB or other async storage needs:
```typescript
abstract class AsyncStorageAdapter {
  abstract getToken(): Promise<StoredTokenData | null>;
  // ... all async
}
```

**Deliverables**:
- ✅ All storage adapters synchronous
- ✅ Promise.resolve() removed (13 occurrences)
- ✅ Cleaner async/sync boundaries
- ✅ Code quality score: 9+/10

---

### **Phase 5: Testing & Coverage (Day 5)**

#### 5.1 Manager Classes Tests
**New Test Files**:
- `sdk/tests/managers/AuthorizationManager.test.ts`
- `sdk/tests/managers/TokenManager.test.ts`
- `sdk/tests/managers/UserManager.test.ts`
- `sdk/tests/managers/NetworkClient.test.ts`

#### 5.2 Storage Adapter Tests
**Goal**: Increase coverage from 19% to 80%+

**Files**:
- `sdk/tests/storage/LocalStorage.test.ts` (new)
- `sdk/tests/storage/SessionStorage.test.ts` (new)
- `sdk/tests/storage/CookieStorage.test.ts` (new)
- Update existing `storage.test.ts`

#### 5.3 Integration Tests
**File**: `sdk/tests/integration/oauth-flow.test.ts` (new)

Full OAuth flow test with mocked server.

#### 5.4 Server Endpoint Tests
**Files**:
- `server/tests/routes/api.test.js` (new)
- `server/tests/routes/auth.test.js` (new)
- `server/tests/middleware/rateLimiter.test.js` (new)

**Target Coverage**:
- SDK: 80%+ (currently 52%)
- Server: 70%+

**Deliverables**:
- ✅ Test coverage: 80%+ (SDK)
- ✅ All manager classes tested
- ✅ Storage adapters fully tested
- ✅ Server endpoints tested

---

### **Phase 6: Documentation & Release (Day 6-7)**

#### 6.1 Update README Files
**Files**:
- `sdk/README.md` - Update with backend proxy pattern
- `server/README.md` - Add rate limiting, helmet docs
- Main `README.md` - Update v1.0.0 features

#### 6.2 Security Guide
**File**: `docs/SECURITY.md` (new)

Contents:
- Security best practices
- Backend proxy implementation guide
- HTTPS setup guide
- Rate limiting configuration
- Helmet configuration

#### 6.3 Migration Guide
**File**: `docs/MIGRATION_v0.1_to_v1.0.md` (new)

Contents:
- Breaking changes
- appSecret removal steps
- Backend proxy setup
- Database migration instructions

#### 6.4 API Documentation
**File**: `docs/api-reference.md` (update)

Add:
- Token refresh endpoint
- Token revoke endpoint
- Rate limit headers

#### 6.5 CHANGELOG
**File**: `CHANGELOG.md` (update)

```markdown
## [1.0.0] - 2025-01-13

### 🚀 Major Changes
- Complete security hardening (9+/10 score)
- Architecture refactoring (Manager classes)
- Production-ready release

### ⚠️ Breaking Changes
- Removed `appSecret` from client SDK config
- Requires backend proxy for token exchange
- Database migration required

### ✨ Added
- Token refresh endpoint
- Token revoke endpoint
- Rate limiting on all auth endpoints
- Security headers (helmet)
- HTTPS enforcement
- Backend proxy pattern
- Manager-based architecture
- Comprehensive test coverage (80%)

### 🔒 Security
- Fixed: appSecret client-side exposure
- Fixed: Missing rate limiting
- Fixed: Missing security headers
- Fixed: HTTPS enforcement
- Enhanced: Database RLS policies
- Enhanced: Auth code validation

### 🏗️ Architecture
- Refactored: SSOClient (395→100 lines)
- Added: AuthorizationManager
- Added: TokenManager
- Added: UserManager
- Added: NetworkClient
- Removed: Promise.resolve() anti-pattern

### 🗄️ Database
- Added: Composite indexes for performance
- Added: Unique constraints for data integrity
- Added: Rate limiting trigger
- Added: Public view without secrets
- Added: Monitoring views

### 🧪 Testing
- Coverage increased: 52% → 80%
- Added: Manager class tests
- Added: Storage adapter tests
- Added: Integration tests
- Added: Server endpoint tests

### 📚 Documentation
- Added: Security guide
- Added: Migration guide (v0.1→v1.0)
- Updated: API reference
- Updated: README with backend proxy
```

#### 6.6 Version Bumps
**Files**:
- `sdk/package.json` - 0.1.0 → 1.0.0
- `server/package.json` - 0.1.0 → 1.0.0
- All package-lock.json files

**Deliverables**:
- ✅ All documentation updated
- ✅ Migration guide complete
- ✅ CHANGELOG comprehensive
- ✅ Version bumped to 1.0.0

---

## 📋 Task Checklist

### Phase 1: Critical Security Fixes ⏳
- [ ] 1.1 Backend proxy pattern
- [ ] 1.2 Token refresh/revoke endpoints
- [ ] 1.3 Rate limiting
- [ ] 1.4 Security headers (helmet)
- [ ] 1.5 HTTPS enforcement

### Phase 2: Database Optimization ⏳
- [ ] 2.1 Create migration file
- [ ] 2.2 Apply migration
- [ ] 2.3 Test migration

### Phase 3: SDK Architecture Refactoring ⏳
- [ ] 3.1 Create manager classes structure
- [ ] 3.2 AuthorizationManager
- [ ] 3.3 TokenManager
- [ ] 3.4 UserManager
- [ ] 3.5 NetworkClient
- [ ] 3.6 Update SSOClient

### Phase 4: Storage Refactoring ⏳
- [ ] 4.1 Synchronous storage adapters
- [ ] 4.2 Remove Promise.resolve()

### Phase 5: Testing & Coverage ⏳
- [ ] 5.1 Manager tests
- [ ] 5.2 Storage adapter tests
- [ ] 5.3 Integration tests
- [ ] 5.4 Server tests

### Phase 6: Documentation & Release ⏳
- [ ] 6.1 Update README files
- [ ] 6.2 Security guide
- [ ] 6.3 Migration guide
- [ ] 6.4 API documentation
- [ ] 6.5 CHANGELOG
- [ ] 6.6 Version bumps

---

## 🎯 Success Metrics

### Before (v0.1.0)
- Code Quality: 8/10
- Architecture: 7.2/10
- Security: 5.5/10
- Coverage: 52%
- Lines: 395 (SSOClient)

### After (v1.0.0 Target)
- Code Quality: 9+/10
- Architecture: 9+/10
- Security: 9+/10
- Coverage: 80%+
- Lines: ~100 (SSOClient)

---

## 🚀 Release Plan

### v1.0.0-alpha.1 (Day 3)
- Security fixes complete
- Database migration complete

### v1.0.0-beta.1 (Day 5)
- Architecture refactoring complete
- Tests at 70%+

### v1.0.0-rc.1 (Day 6)
- All tests passing
- Coverage 80%+
- Documentation complete

### v1.0.0 (Day 7)
- Final review
- Merge to master
- NPM publish
- GitHub release

---

## 📞 Rollback Plan

If critical issues arise:
1. Revert to master branch
2. Deploy v0.1.0 as v0.1.1 with minimal fixes
3. Schedule v1.0.0 for later

**Rollback Triggers**:
- Breaking changes cannot be completed in 7 days
- Test coverage cannot reach 70%+
- Critical bugs discovered during refactoring

---

**Document Created**: 2025-01-12
**Last Updated**: 2025-01-12
**Status**: In Progress
**Next Milestone**: Phase 1 Complete (Day 2)
