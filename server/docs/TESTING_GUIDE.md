# SSO System Testing Guide

**Version**: 1.0.0
**Last Updated**: 2025-01-11

Comprehensive guide for testing the SSO System.

---

## Table of Contents

1. [Overview](#overview)
2. [Test Infrastructure](#test-infrastructure)
3. [Running Tests](#running-tests)
4. [Unit Tests](#unit-tests)
5. [Integration Tests](#integration-tests)
6. [Manual Testing with Postman](#manual-testing-with-postman)
7. [End-to-End Testing](#end-to-end-testing)
8. [Writing New Tests](#writing-new-tests)
9. [CI/CD Integration](#cicd-integration)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The SSO System uses a comprehensive testing strategy:

- **Unit Tests**: Individual utility functions and helpers
- **Integration Tests**: API endpoints with mocked dependencies
- **Manual Tests**: Postman collection for exploratory testing
- **E2E Tests**: Full authentication flows (future)

### Test Coverage

```
Total Tests: 143+
├── Admin API: 36 tests
├── Auth Middleware: 18 tests
├── Crypto Utils: 32 tests
├── Validators: 57 tests
└── Coverage: 80%+ across all modules
```

---

## Test Infrastructure

### Testing Stack

- **Test Framework**: Jest (v29+)
- **HTTP Testing**: Supertest
- **Mocking**: Jest mock functions
- **Manual Testing**: Postman
- **E2E** (future): Playwright or Cypress

### Project Structure

```
server/
├── src/
│   ├── routes/
│   │   ├── __tests__/
│   │   │   └── admin.test.js       # Admin API integration tests
│   │   ├── admin.js
│   │   └── ...
│   ├── middleware/
│   │   ├── __tests__/
│   │   │   ├── authenticateAdmin.test.js
│   │   │   └── adminRateLimiter.test.js
│   │   └── ...
│   └── utils/
│       ├── __tests__/
│       │   ├── crypto.test.js
│       │   ├── validators.test.js
│       │   └── analytics.test.js
│       └── ...
├── docs/
│   └── postman/
│       └── Admin_API.postman_collection.json
├── jest.config.js
└── package.json
```

### Jest Configuration

```javascript
// jest.config.js
export default {
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.js'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {},
  testMatch: ['**/__tests__/**/*.test.js'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  verbose: true,
  clearMocks: true,
};
```

---

## Running Tests

### All Tests

```bash
# Run all tests
npm test

# Run with coverage report
npm test -- --coverage

# Watch mode (auto-rerun on file changes)
npm test -- --watch
```

### Specific Test Files

```bash
# Run admin API tests
npm test -- src/routes/__tests__/admin.test.js

# Run crypto tests
npm test -- src/utils/__tests__/crypto.test.js

# Run all validator tests
npm test -- src/utils/__tests__/validators.test.js
```

### Filter by Test Name

```bash
# Run tests matching "create app"
npm test -- -t "create app"

# Run tests matching "POST /apps"
npm test -- -t "POST /apps"
```

### Coverage Reports

```bash
# Generate coverage report
npm test -- --coverage

# Open HTML coverage report
open coverage/lcov-report/index.html  # macOS
xdg-open coverage/lcov-report/index.html  # Linux
start coverage/lcov-report/index.html  # Windows
```

**Coverage Output**:
```
-----------------------|---------|----------|---------|---------|-------------------
File                   | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-----------------------|---------|----------|---------|---------|-------------------
All files              |   85.23 |    82.15 |   88.67 |   85.12 |
 routes                |   88.45 |    85.32 |   92.11 |   88.23 |
  admin.js             |   90.12 |    87.45 |   95.23 |   90.34 | 45,67,89
 utils                 |   82.34 |    78.92 |   85.67 |   82.56 |
  crypto.js            |   95.67 |    92.34 |   98.12 |   95.89 | 23
  validators.js        |   91.23 |    88.45 |   93.45 |   91.67 | 34,56
-----------------------|---------|----------|---------|---------|-------------------
```

---

## Unit Tests

Unit tests verify individual functions in isolation.

### Crypto Utilities Tests

**File**: [src/utils/__tests__/crypto.test.js](../src/utils/__tests__/crypto.test.js)

**Tests** (32 total):
- ✅ `generateApiKey()` creates valid UUIDs
- ✅ `generateApiSecret()` creates 64-char hex strings
- ✅ `hashSecret()` uses bcrypt with 10 rounds
- ✅ `verifySecret()` correctly validates secrets

**Example**:
```javascript
describe('generateApiKey', () => {
  it('should generate valid UUID v4', () => {
    const key = generateApiKey();
    expect(key).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('should generate unique keys', () => {
    const key1 = generateApiKey();
    const key2 = generateApiKey();
    expect(key1).not.toBe(key2);
  });
});
```

### Validator Tests

**File**: [src/utils/__tests__/validators.test.js](../src/utils/__tests__/validators.test.js)

**Tests** (57 total):
- ✅ URL validation (HTTPS, HTTP, localhost, invalid)
- ✅ App name validation (length, special chars)
- ✅ UUID validation (format, invalid)
- ✅ Array validation (empty, null, non-array)

**Example**:
```javascript
describe('validateUrls', () => {
  it('should accept valid HTTPS URLs', () => {
    const result = validateUrls(['https://example.com/callback']);
    expect(result.valid).toBe(true);
  });

  it('should reject invalid URLs', () => {
    const result = validateUrls(['not-a-url']);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid URL');
  });

  it('should accept localhost URLs', () => {
    const result = validateUrls(['http://localhost:3000/callback']);
    expect(result.valid).toBe(true);
  });
});
```

### Analytics Tests

**File**: [src/utils/__tests__/analytics.test.js](../src/utils/__tests__/analytics.test.js)

**Tests** (30+ total):
- ✅ Event recording (all event types)
- ✅ Event retrieval with filters
- ✅ Error handling (graceful degradation)

---

## Integration Tests

Integration tests verify API endpoints with mocked dependencies.

### Admin API Tests

**File**: [src/routes/__tests__/admin.test.js](../src/routes/__tests__/admin.test.js)

**Tests** (36 total):

#### Setup
```javascript
import request from 'supertest';
import app from '../../index.js';

// Mock dependencies
jest.mock('../../utils/supabase.js');
jest.mock('../../utils/analytics.js');
jest.mock('../../utils/logger.js');

const testAdminToken = 'test-admin-jwt-token';
const testUserId = '550e8400-e29b-41d4-a716-446655440000';
```

#### Test: Create App (POST /apps)

```javascript
describe('POST /api/v1/admin/apps', () => {
  it('should create new app successfully', async () => {
    // Mock Supabase responses
    supabaseAdmin.from.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { id: 'owner-uuid' },
        error: null
      })
    });

    supabaseAdmin.from.mockReturnValueOnce({
      insert: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: {
          id: 'new-app-uuid',
          name: 'Test App',
          api_key: 'generated-key',
          is_active: true
        },
        error: null
      })
    });

    const response = await request(app)
      .post('/api/v1/admin/apps')
      .set('Authorization', `Bearer ${testAdminToken}`)
      .send({
        name: 'Test App',
        description: 'Test Description',
        redirect_urls: ['https://example.com/callback'],
        allowed_origins: ['https://example.com'],
        auth_method: 'token_exchange',
        owner_email: 'owner@example.com'
      });

    expect(response.status).toBe(201);
    expect(response.body.app).toHaveProperty('api_key');
    expect(response.body.app).toHaveProperty('api_secret');
    expect(response.body.warning).toContain('will not be shown again');
  });

  it('should reject invalid app name', async () => {
    const response = await request(app)
      .post('/api/v1/admin/apps')
      .set('Authorization', `Bearer ${testAdminToken}`)
      .send({
        name: 'ab',  // Too short (min 3)
        redirect_urls: ['https://example.com/callback'],
        owner_email: 'owner@example.com'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('3-100 characters');
  });
});
```

#### Test: List Apps (GET /apps)

```javascript
describe('GET /api/v1/admin/apps', () => {
  it('should list apps with pagination', async () => {
    supabaseAdmin.from.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      range: jest.fn().mockReturnThis(),
      order: jest.fn().mockResolvedValue({
        data: [
          { id: 'app-1', name: 'App 1', is_active: true },
          { id: 'app-2', name: 'App 2', is_active: true }
        ],
        count: 25,
        error: null
      })
    });

    const response = await request(app)
      .get('/api/v1/admin/apps?page=1&limit=20')
      .set('Authorization', `Bearer ${testAdminToken}`);

    expect(response.status).toBe(200);
    expect(response.body.apps).toHaveLength(2);
    expect(response.body.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 25,
      total_pages: 2
    });
  });

  it('should filter by status', async () => {
    const response = await request(app)
      .get('/api/v1/admin/apps?status=active')
      .set('Authorization', `Bearer ${testAdminToken}`);

    expect(response.status).toBe(200);
    // Verify Supabase query called with is_active filter
  });
});
```

#### Test: Regenerate Secret (POST /apps/:id/regenerate-secret)

```javascript
describe('POST /api/v1/admin/apps/:id/regenerate-secret', () => {
  it('should regenerate secret with confirmation', async () => {
    const appId = '550e8400-e29b-41d4-a716-446655440000';

    // Mock get app
    supabaseAdmin.from.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { name: 'Test App' },
        error: null
      })
    });

    // Mock update
    supabaseAdmin.from.mockReturnValueOnce({
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        error: null
      })
    });

    const response = await request(app)
      .post(`/api/v1/admin/apps/${appId}/regenerate-secret`)
      .set('Authorization', `Bearer ${testAdminToken}`)
      .send({ confirmation: 'Test App' });

    expect(response.status).toBe(200);
    expect(response.body.api_secret).toHaveLength(64);
    expect(response.body.warning).toContain('Update your application configuration');
  });

  it('should reject invalid confirmation', async () => {
    const response = await request(app)
      .post('/api/v1/admin/apps/550e8400-e29b-41d4-a716-446655440000/regenerate-secret')
      .set('Authorization', `Bearer ${testAdminToken}`)
      .send({ confirmation: 'Wrong Name' });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Confirmation failed');
  });
});
```

#### Test: Delete App (DELETE /apps/:id)

```javascript
describe('DELETE /api/v1/admin/apps/:id', () => {
  it('should soft delete app by default', async () => {
    const appId = '550e8400-e29b-41d4-a716-446655440000';

    // Mock get app
    supabaseAdmin.from.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({
        data: { name: 'Test App' },
        error: null
      })
    });

    // Mock soft delete (update is_active)
    supabaseAdmin.from.mockReturnValueOnce({
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null })
    });

    const response = await request(app)
      .delete(`/api/v1/admin/apps/${appId}`)
      .set('Authorization', `Bearer ${testAdminToken}`)
      .send({ confirmation: 'Test App' });

    expect(response.status).toBe(200);
    expect(response.body.message).toContain('deleted successfully');
  });

  it('should hard delete with query param', async () => {
    const response = await request(app)
      .delete('/api/v1/admin/apps/550e8400-e29b-41d4-a716-446655440000?hard=true')
      .set('Authorization', `Bearer ${testAdminToken}`)
      .send({ confirmation: 'Test App' });

    expect(response.status).toBe(200);
    // Verify Supabase delete() called instead of update()
  });
});
```

### Auth Middleware Tests

**File**: [src/middleware/__tests__/authenticateAdmin.test.js](../src/middleware/__tests__/authenticateAdmin.test.js)

**Tests** (18 total):
- ✅ Valid admin token passes
- ✅ Missing token returns 401
- ✅ Invalid token returns 401
- ✅ Non-admin role returns 403

---

## Manual Testing with Postman

### Import Postman Collection

1. **Open Postman**
2. **Import** → **File** → Select `server/docs/postman/Admin_API.postman_collection.json`
3. **Set Environment Variables**:
   - `baseUrl`: `http://localhost:3001` or production URL
   - `adminToken`: Your JWT token from Supabase Auth

### Postman Collection Structure

```
SSO Admin API
├── Setup
│   └── Get Admin Token (manual - use Supabase UI)
├── Apps
│   ├── 1. List Apps
│   ├── 2. Create App
│   ├── 3. Get App Details
│   ├── 4. Update App
│   ├── 5. Regenerate Secret
│   └── 6. Delete App
└── Analytics
    ├── 7. Get App Analytics
    └── 8. Get Dashboard Stats
```

### Getting Admin Token

**Via Supabase UI**:
1. Go to Supabase Dashboard → Authentication
2. Create test user or use existing
3. Update profile role:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'admin@example.com';
   ```
4. **Get Token**:
   - Click user in Auth table
   - Copy "Access Token" (JWT)
   - Paste into Postman variable `adminToken`

**Via cURL**:
```bash
curl -X POST https://your-project.supabase.co/auth/v1/token?grant_type=password \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your-password"
  }'
```

### Running Postman Tests

1. **Run Collection**:
   - Click "..." on collection → Run collection
   - Select all requests
   - Click "Run SSO Admin API"

2. **View Results**:
   - Pass/Fail for each test
   - Response times
   - Test assertions

3. **Export Results**:
   - Click "Export Results" → JSON

### Postman Test Assertions

Each request includes test scripts:

```javascript
// Example: Create App test
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

pm.test("Response has api_key", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.app).to.have.property('api_key');
});

pm.test("Response has api_secret", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.app).to.have.property('api_secret');
    pm.expect(jsonData.app.api_secret).to.have.lengthOf(64);
});

// Save app_id for next requests
pm.environment.set("app_id", pm.response.json().app.id);
```

---

## End-to-End Testing

**Status**: Future implementation (Playwright or Cypress)

**Planned Tests**:
- Full OAuth login flow (browser automation)
- Token exchange and validation
- Session persistence across pages
- Logout and cleanup

**Example Playwright Test**:
```javascript
test('complete SSO login flow', async ({ page }) => {
  // 1. Go to client app
  await page.goto('http://localhost:3000');

  // 2. Click "Login with SSO"
  await page.click('button:has-text("Login with SSO")');

  // 3. Should redirect to SSO login
  await expect(page).toHaveURL(/sso-system\.vercel\.app\/auth\/login/);

  // 4. Fill login form
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');

  // 5. Should redirect back to client app
  await expect(page).toHaveURL('http://localhost:3000');

  // 6. User should be logged in
  await expect(page.locator('text=Welcome')).toBeVisible();
});
```

---

## Writing New Tests

### Test File Template

```javascript
// __tests__/myModule.test.js
import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { myFunction } from '../myModule.js';

// Mock dependencies
jest.mock('../utils/supabase.js');

describe('myFunction', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
    jest.clearAllMocks();
  });

  it('should do something', () => {
    const result = myFunction('input');
    expect(result).toBe('expected output');
  });

  it('should handle errors', () => {
    expect(() => myFunction(null)).toThrow('Error message');
  });
});
```

### Best Practices

1. **Test Naming**: Use descriptive names
   ```javascript
   ✅ it('should reject invalid email format')
   ❌ it('test 1')
   ```

2. **AAA Pattern**: Arrange, Act, Assert
   ```javascript
   it('should create app', async () => {
     // Arrange
     const appData = { name: 'Test App', ... };

     // Act
     const response = await request(app).post('/apps').send(appData);

     // Assert
     expect(response.status).toBe(201);
   });
   ```

3. **Mock External Dependencies**:
   ```javascript
   jest.mock('../utils/supabase.js');
   jest.mock('../utils/logger.js');
   ```

4. **Test Edge Cases**:
   - Empty inputs
   - Null/undefined
   - Very long strings
   - Invalid formats

5. **Use Meaningful Assertions**:
   ```javascript
   ✅ expect(response.body.error).toContain('3-100 characters')
   ❌ expect(response.status).not.toBe(200)
   ```

---

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: cd server && npm ci

      - name: Run tests
        run: cd server && npm test -- --coverage
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./server/coverage/lcov.info
```

### Vercel

Tests run automatically on deploy:
```json
// package.json
{
  "scripts": {
    "test": "jest --coverage",
    "vercel-build": "npm test && npm run build"
  }
}
```

---

## Troubleshooting

### "Cannot find module" Error

**Cause**: ESM imports not resolved

**Solution**: Check `jest.config.js` has correct `moduleNameMapper`

### "Timeout of 5000ms exceeded"

**Cause**: Async test taking too long

**Solution**: Increase timeout
```javascript
it('slow test', async () => {
  // ...
}, 10000); // 10 second timeout
```

### Mocks Not Working

**Cause**: Mock defined after import

**Solution**: Define mocks before imports
```javascript
jest.mock('../utils/supabase.js');  // ← First
import { myFunction } from '../myModule.js';  // ← Then import
```

### Coverage Threshold Not Met

**Cause**: New code without tests

**Solution**: Write tests for uncovered lines (check coverage report)

---

## Resources

- **Jest Documentation**: https://jestjs.io/docs/getting-started
- **Supertest Guide**: https://github.com/ladjs/supertest
- **Postman Learning**: https://learning.postman.com/
- **Testing Best Practices**: https://testingjavascript.com/

---

**End of Testing Guide**
