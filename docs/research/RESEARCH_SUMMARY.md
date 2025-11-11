# Backend Best Practices Research Summary

**Research Date**: 2025-01-12
**Target**: SSO Admin API Development
**Full Document**: [backend-best-practices-2025.md](./backend-best-practices-2025.md)

---

## Quick Overview

This research aggregates the latest (2024-2025) best practices for building production-grade admin APIs using Express.js, Supabase, and Node.js. All recommendations are based on official documentation, industry surveys, and current OWASP guidelines.

---

## Key Findings Summary

### 1. Express.js (2024-2025)
- **Error Handling**: Centralized async error handler is standard (73% faster incident response)
- **Middleware Order**: HTTPS → Security → CORS → Parsing → Logging → Rate Limiting → Routes → 404 → Error
- **Logging**: Structured JSON logging with Winston (replaces console.log)

### 2. Security (OWASP 2025)
- **helmet**: Required for security headers (CSP, HSTS, XSS protection)
- **Rate Limiting**: express-rate-limit v8+ with Redis for production
- **Input Validation**: Joi schemas with stripUnknown: true
- **SQL Injection**: Always use parameterized queries (Supabase auto-handles)

### 3. JWT Authentication
- **Token Expiration**: Access 15min, Refresh 7d, API 1h, SSO 8h
- **Algorithm**: ES256 (ECDSA) or EdDSA (quantum-resistant)
- **Refresh Tokens**: Implement rotation (one-time use) for security
- **Storage**: Memory > SessionStorage > LocalStorage

### 4. Supabase Best Practices
- **Service Role Key**: Server-side ONLY (never expose to client)
- **Connection Pooling**: Transaction mode for serverless, Session for long-lived
- **RLS**: Use .select() with minimal fields when RLS is strict
- **Query Optimization**: Select only needed columns, use count for pagination

### 5. API Design (2025 Standards)
- **Versioning**: URI versioning (/api/v1) is most practical
- **Resources**: Plural nouns, no verbs in URLs
- **Pagination**: limit=25, offset=0 as defaults
- **Error Format**: Standardized JSON with statusCode, message, errors array

### 6. Testing
- **Stack**: Jest + Supertest (industry standard)
- **Coverage**: 80%+ for production
- **Structure**: Unit tests + Integration tests + E2E for critical paths
- **Mocking**: Mock Supabase for unit tests, use real DB for integration

---

## Priority Implementation Roadmap

### Phase 1: Security (Week 1)
```
Priority: CRITICAL
Tasks:
- [ ] Centralized error handling middleware
- [ ] Input validation with Joi
- [ ] Rate limiting (tiered: admin/auth/public)
- [ ] Audit logging for admin actions
- [ ] RBAC middleware
```

### Phase 2: Authentication (Week 2)
```
Priority: HIGH
Tasks:
- [ ] JWT refresh token rotation
- [ ] Token revocation endpoint
- [ ] Token blacklist mechanism
- [ ] Session management
```

### Phase 3: API Standards (Week 3)
```
Priority: MEDIUM
Tasks:
- [ ] Standardize error responses
- [ ] Pagination for all list endpoints
- [ ] Filtering and sorting support
- [ ] API versioning structure
```

### Phase 4: Testing (Week 4)
```
Priority: HIGH
Tasks:
- [ ] Jest + Supertest setup
- [ ] Unit tests (80% coverage)
- [ ] Integration tests for OAuth
- [ ] CI/CD integration
```

---

## Code Snippets (Quick Reference)

### Centralized Error Handler
```javascript
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
  }
}

app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    status: 'error',
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});
```

### Async Handler Wrapper
```javascript
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
```

### RBAC Middleware
```javascript
const requireRole = (roles) => async (req, res, next) => {
  if (!req.user || !roles.some(r => req.user.roles.includes(r))) {
    throw new AppError('Insufficient permissions', 403);
  }
  next();
};
```

### Rate Limiting
```javascript
import rateLimit from 'express-rate-limit';

export const adminRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  message: 'Too many requests'
});
```

### Input Validation
```javascript
import Joi from 'joi';

const createAppSchema = Joi.object({
  name: Joi.string().min(3).max(50).required(),
  domain: Joi.string().domain().required()
});

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body);
  if (error) throw new AppError('Validation failed', 400);
  req.validatedBody = value;
  next();
};
```

---

## Critical Security Checklist

### Must-Have Before Production
- [x] Helmet configured (already in codebase)
- [x] Rate limiting implemented (already in codebase)
- [ ] **Centralized error handler**
- [ ] **Input validation with Joi**
- [ ] **Audit logging for admin actions**
- [ ] **JWT refresh token rotation**
- [ ] **Token revocation mechanism**
- [ ] **RBAC middleware**
- [ ] **Environment variable validation**
- [ ] **Dependency security scanning (npm audit)**

### Recommended
- [ ] Structured logging (Winston)
- [ ] Error tracking (Sentry)
- [ ] API documentation (Swagger/OpenAPI)
- [ ] Performance monitoring
- [ ] Database query optimization

---

## Testing Strategy

### Coverage Goals
```
Unit Tests:       80%+ (functions, utilities)
Integration:      Critical paths (OAuth flow)
E2E:              Key user journeys (login → authorize → token)
```

### Test Structure
```
tests/
├── unit/
│   ├── middleware/
│   ├── utils/
│   └── validators/
├── integration/
│   ├── auth.test.js
│   ├── oauth.test.js
│   └── admin.test.js
└── e2e/
    └── complete-flow.test.js
```

---

## Dependencies to Add

### Security
```json
{
  "joi": "^17.11.0",           // Input validation
  "winston": "^3.11.0",        // Structured logging
  "@sentry/node": "^7.92.0"    // Error tracking (optional)
}
```

### Testing
```json
{
  "jest": "^29.7.0",
  "supertest": "^6.3.3",
  "@types/jest": "^29.5.11",
  "@types/supertest": "^6.0.2"
}
```

---

## Performance Optimizations

### Database
- Use .select() with specific columns (not *)
- Add indexes for frequently queried fields
- Use count: 'exact' only when needed
- Implement connection pooling (max: 20)

### API
- Implement response caching for static data
- Use compression middleware
- Set proper cache headers
- Paginate all list endpoints

---

## Monitoring & Logging

### Structured Logging Format
```javascript
logger.info('User action', {
  userId: req.user.id,
  action: 'create_app',
  resource: req.path,
  duration: 145,
  timestamp: new Date().toISOString()
});
```

### Key Metrics to Track
- Request rate (per endpoint)
- Response time (p50, p95, p99)
- Error rate (4xx, 5xx)
- Database query time
- Token generation/validation time

---

## Resources

### Documentation
- [Full Research Document](./backend-best-practices-2025.md)
- [Express.js Official](https://expressjs.com)
- [Supabase Docs](https://supabase.com/docs)
- [OWASP Node.js](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)

### Tools
- express-rate-limit: Rate limiting
- helmet: Security headers
- joi: Input validation
- winston: Logging
- jest + supertest: Testing

---

## Next Steps

1. **Review Current Code**: Compare against checklist
2. **Prioritize Tasks**: Use Phase 1-4 roadmap
3. **Create PRD**: Document admin API requirements
4. **Implement Security**: Start with Phase 1 (critical)
5. **Add Tests**: Set up Jest + Supertest early
6. **Monitor**: Add logging and metrics

---

**Status**: Research Complete ✓
**Ready for**: Implementation Planning
**Estimated Effort**: 4 weeks (1 phase per week)
