# Phase 1 검증 가이드

**Version**: 1.0.0
**Last Updated**: 2025-01-11

Phase 1 Backend API 구현이 정상적으로 작동하는지 확인하는 종합 가이드입니다.

---

## 목차

1. [빠른 검증 (5분)](#빠른-검증-5분)
2. [로컬 환경 검증 (15분)](#로컬-환경-검증-15분)
3. [API 엔드포인트 검증 (30분)](#api-엔드포인트-검증-30분)
4. [테스트 실행 검증 (10분)](#테스트-실행-검증-10분)
5. [데이터베이스 검증 (10분)](#데이터베이스-검증-10분)
6. [문서 검증 (5분)](#문서-검증-5분)
7. [프로덕션 검증 (선택)](#프로덕션-검증-선택)

---

## 빠른 검증 (5분)

### ✅ 체크리스트

```bash
# 1. 파일 존재 확인
ls server/src/routes/admin.js                    # ✓ Admin API 라우트
ls server/src/utils/crypto.js                    # ✓ Crypto 유틸리티
ls server/src/utils/validators.js                # ✓ Validator 유틸리티
ls server/src/middleware/authenticateAdmin.js    # ✓ Admin 인증
ls server/docs/ADMIN_GUIDE.md                    # ✓ Admin 가이드
ls server/docs/api/openapi.yaml                  # ✓ OpenAPI 스펙
```

**예상 결과**: 모든 파일이 존재해야 함

### ✅ 코드 확인

```bash
# 2. 라인 수 확인 (구현 완성도)
wc -l server/src/routes/admin.js        # ~893 lines
wc -l server/src/utils/crypto.js        # ~85 lines
wc -l server/docs/ADMIN_GUIDE.md        # ~660 lines
```

### ✅ 테스트 파일 확인

```bash
ls server/src/routes/__tests__/admin.test.js
ls server/src/utils/__tests__/crypto.test.js
ls server/src/utils/__tests__/validators.test.js
```

**통과 조건**: 모든 파일이 존재하고 라인 수가 예상 범위 내

---

## 로컬 환경 검증 (15분)

### Step 1: 환경 변수 확인

```bash
cd server

# .env 파일 존재 확인
cat .env

# 필수 환경변수 확인
grep -E "SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY|JWT_SECRET" .env
```

**체크 항목**:
- ✅ `SUPABASE_URL` 설정
- ✅ `SUPABASE_SERVICE_ROLE_KEY` 설정
- ✅ `JWT_SECRET` 설정 (최소 32자)
- ✅ `PORT=3001` 설정

### Step 2: 의존성 설치

```bash
npm install
```

**예상 결과**:
```
added 150 packages, and audited 151 packages in 15s
```

**확인**: `node_modules` 폴더 생성 및 `bcrypt`, `express`, `@supabase/supabase-js` 설치 확인

### Step 3: 서버 시작

```bash
npm run dev
```

**예상 출력**:
```
Server running on http://localhost:3001
```

**확인**: 에러 없이 서버가 시작되어야 함

### Step 4: Health Check

**새 터미널에서**:
```bash
curl http://localhost:3001/
```

**예상 응답**:
```json
{
  "message": "SSO Server is running"
}
```

**통과 조건**: 200 OK 응답

---

## API 엔드포인트 검증 (30분)

### 준비: Admin JWT 토큰 얻기

#### Option 1: Supabase Dashboard 사용

1. **Supabase Dashboard 접속**
   ```
   https://app.supabase.com/project/YOUR_PROJECT_ID
   ```

2. **테스트 사용자 생성**
   - Authentication → Users → Add User
   - Email: `admin@example.com`
   - Password: `Test1234!`
   - Confirm

3. **Admin 역할 부여**
   - SQL Editor → New Query
   ```sql
   UPDATE profiles
   SET role = 'admin'
   WHERE email = 'admin@example.com';
   ```

4. **토큰 얻기**
   ```bash
   curl -X POST "https://YOUR_PROJECT.supabase.co/auth/v1/token?grant_type=password" \
     -H "apikey: YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "email": "admin@example.com",
       "password": "Test1234!"
     }'
   ```

5. **토큰 저장**
   ```bash
   export ADMIN_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
   ```

#### Option 2: Postman 사용

1. Postman 열기
2. 새 Request 생성
3. `POST https://YOUR_PROJECT.supabase.co/auth/v1/token?grant_type=password`
4. Headers: `apikey: YOUR_ANON_KEY`
5. Body (JSON):
   ```json
   {
     "email": "admin@example.com",
     "password": "Test1234!"
   }
   ```
6. Send → `access_token` 복사

### 1. Dashboard 엔드포인트 검증

```bash
curl -X GET "http://localhost:3001/api/v1/admin/dashboard" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**예상 응답**:
```json
{
  "total_apps": 0,
  "active_apps": 0,
  "inactive_apps": 0,
  "total_logins_today": 0,
  "total_users": 1,
  "recent_activity": []
}
```

**✅ 통과**: 200 OK, JSON 응답

### 2. Create App 검증 (가장 중요!)

```bash
curl -X POST "http://localhost:3001/api/v1/admin/apps" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test App",
    "description": "Test application for verification",
    "redirect_urls": ["https://example.com/callback", "http://localhost:3000/callback"],
    "allowed_origins": ["https://example.com", "http://localhost:3000"],
    "auth_method": "token_exchange",
    "owner_email": "admin@example.com"
  }'
```

**예상 응답**:
```json
{
  "message": "App created successfully",
  "app": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Test App",
    "description": "Test application for verification",
    "api_key": "660e8400-e29b-41d4-a716-446655440001",
    "api_secret": "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f2",
    "redirect_urls": ["https://example.com/callback", "http://localhost:3000/callback"],
    "allowed_origins": ["https://example.com", "http://localhost:3000"],
    "auth_method": "token_exchange",
    "is_active": true,
    "created_at": "2025-01-11T10:00:00.000Z"
  },
  "warning": "Save the api_secret now - it will not be shown again"
}
```

**✅ 체크 항목**:
- ✅ 201 Created 응답
- ✅ `api_key` 생성됨 (UUID 형식)
- ✅ `api_secret` 생성됨 (64자 hex)
- ✅ `warning` 메시지 포함
- ✅ `created_at` 타임스탬프 있음

**⚠️ 중요**: `app.id`와 `api_secret`을 저장하세요 (다음 테스트에서 사용)

```bash
export APP_ID="<응답의 app.id>"
export API_SECRET="<응답의 api_secret>"
```

### 3. List Apps 검증

```bash
curl -X GET "http://localhost:3001/api/v1/admin/apps?page=1&limit=20" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**예상 응답**:
```json
{
  "apps": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Test App",
      "description": "Test application for verification",
      "api_key": "660e8400-e29b-41d4-a716-446655440001",
      "auth_method": "token_exchange",
      "is_active": true,
      "created_at": "2025-01-11T10:00:00.000Z",
      "updated_at": "2025-01-11T10:00:00.000Z",
      "owner": {
        "email": "admin@example.com",
        "display_name": null
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "total_pages": 1
  }
}
```

**✅ 체크 항목**:
- ✅ 200 OK
- ✅ `apps` 배열에 방금 생성한 앱 포함
- ✅ `api_secret` 없음 (보안상 GET에서는 반환 안 됨)
- ✅ `pagination` 정보 정확

### 4. Get App Details 검증

```bash
curl -X GET "http://localhost:3001/api/v1/admin/apps/$APP_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**예상 응답**:
```json
{
  "app": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Test App",
    "description": "Test application for verification",
    "api_key": "660e8400-e29b-41d4-a716-446655440001",
    "redirect_urls": [...],
    "allowed_origins": [...],
    "auth_method": "token_exchange",
    "is_active": true,
    "owner": {
      "email": "admin@example.com",
      "display_name": null
    },
    "stats": {
      "total_logins": 0,
      "total_users": 0,
      "last_login_at": null
    }
  }
}
```

**✅ 체크**: 200 OK, `stats` 포함, `api_secret` 없음

### 5. Update App 검증

```bash
curl -X PUT "http://localhost:3001/api/v1/admin/apps/$APP_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test App Updated",
    "description": "Updated description",
    "is_active": true
  }'
```

**예상 응답**:
```json
{
  "message": "App updated successfully",
  "app": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Test App Updated",
    "description": "Updated description",
    ...
  }
}
```

**✅ 체크**: 200 OK, `name`과 `description` 업데이트됨

### 6. Regenerate Secret 검증

```bash
curl -X POST "http://localhost:3001/api/v1/admin/apps/$APP_ID/regenerate-secret" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "confirmation": "Test App Updated"
  }'
```

**예상 응답**:
```json
{
  "message": "API secret regenerated successfully",
  "api_secret": "x9y8z7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4z3y2x1w0v9u8",
  "warning": "Update your application configuration immediately"
}
```

**✅ 체크 항목**:
- ✅ 200 OK
- ✅ 새 `api_secret` 반환 (64자 hex)
- ✅ 이전 secret과 다름
- ✅ `warning` 메시지 포함

### 7. Get Analytics 검증

```bash
curl -X GET "http://localhost:3001/api/v1/admin/apps/$APP_ID/analytics?days=30" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**예상 응답**:
```json
{
  "app_id": "550e8400-e29b-41d4-a716-446655440000",
  "app_name": "Test App Updated",
  "summary": {
    "total_events": 2,
    "total_logins": 0,
    "total_errors": 0,
    "unique_users": 0
  },
  "events_by_type": [
    { "event_type": "app_created", "count": 1 },
    { "event_type": "secret_regenerated", "count": 1 }
  ],
  "daily_logins": [],
  "top_users": [],
  "recent_errors": []
}
```

**✅ 체크**: 200 OK, `app_created`와 `secret_regenerated` 이벤트 2개 기록됨

### 8. Delete App 검증 (Soft Delete)

```bash
curl -X DELETE "http://localhost:3001/api/v1/admin/apps/$APP_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "confirmation": "Test App Updated"
  }'
```

**예상 응답**:
```json
{
  "message": "App deleted successfully"
}
```

**✅ 체크**: 200 OK

**확인**: 앱이 비활성화되었는지 확인
```bash
curl -X GET "http://localhost:3001/api/v1/admin/apps/$APP_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**예상**: `is_active: false`

### ❌ 에러 케이스 검증

#### 1. 인증 없이 요청
```bash
curl -X GET "http://localhost:3001/api/v1/admin/dashboard"
```

**예상**: 401 Unauthorized
```json
{
  "error": "Missing or invalid authorization header",
  "code": "UNAUTHORIZED"
}
```

#### 2. 잘못된 토큰
```bash
curl -X GET "http://localhost:3001/api/v1/admin/dashboard" \
  -H "Authorization: Bearer invalid_token"
```

**예상**: 401 Unauthorized

#### 3. Non-admin 사용자
```bash
# 일반 사용자 토큰으로 시도
curl -X GET "http://localhost:3001/api/v1/admin/dashboard" \
  -H "Authorization: Bearer $USER_TOKEN"
```

**예상**: 403 Forbidden
```json
{
  "error": "Admin access required",
  "code": "INSUFFICIENT_PERMISSIONS"
}
```

#### 4. Invalid Input
```bash
curl -X POST "http://localhost:3001/api/v1/admin/apps" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "ab",
    "redirect_urls": ["invalid-url"],
    "owner_email": "admin@example.com"
  }'
```

**예상**: 400 Bad Request
```json
{
  "error": "App name must be 3-100 characters"
}
```

---

## 테스트 실행 검증 (10분)

### 1. 전체 테스트 실행

```bash
cd server
npm test
```

**예상 출력**:
```
 PASS  src/routes/__tests__/admin.test.js (15.234 s)
 PASS  src/utils/__tests__/crypto.test.js (2.145 s)
 PASS  src/utils/__tests__/validators.test.js (1.892 s)
 PASS  src/middleware/__tests__/authenticateAdmin.test.js (3.567 s)

Test Suites: 4 passed, 4 total
Tests:       143 passed, 143 total
Snapshots:   0 total
Time:        23.156 s
```

**✅ 통과 조건**:
- ✅ 모든 테스트 통과 (143+ tests)
- ✅ 에러 없음
- ✅ 실패한 테스트 없음

### 2. Coverage 리포트

```bash
npm test -- --coverage
```

**예상 출력**:
```
-----------------------|---------|----------|---------|---------|-------------------
File                   | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
-----------------------|---------|----------|---------|---------|-------------------
All files              |   85.23 |    82.15 |   88.67 |   85.12 |
 routes                |   88.45 |    85.32 |   92.11 |   88.23 |
  admin.js             |   90.12 |    87.45 |   95.23 |   90.34 |
 utils                 |   82.34 |    78.92 |   85.67 |   82.56 |
  crypto.js            |   95.67 |    92.34 |   98.12 |   95.89 |
  validators.js        |   91.23 |    88.45 |   93.45 |   91.67 |
-----------------------|---------|----------|---------|---------|-------------------
```

**✅ 통과 조건**:
- ✅ Overall coverage > 80%
- ✅ All categories > 80%

### 3. 특정 테스트 파일 실행

```bash
# Admin API 테스트
npm test -- src/routes/__tests__/admin.test.js

# Crypto 테스트
npm test -- src/utils/__tests__/crypto.test.js
```

**예상**: 각 파일의 모든 테스트 통과

---

## 데이터베이스 검증 (10분)

### 1. Supabase Dashboard 확인

1. **Tables 확인**
   ```
   Supabase Dashboard → Database → Tables
   ```

   **예상 테이블**:
   - ✅ `apps` (앱 정보)
   - ✅ `app_analytics` (분석 이벤트)
   - ✅ `profiles` (사용자 프로필)

2. **apps 테이블 데이터**
   ```sql
   SELECT id, name, api_key, is_active, created_at
   FROM apps
   ORDER BY created_at DESC
   LIMIT 5;
   ```

   **예상**: 테스트로 생성한 앱들이 보임

3. **app_analytics 테이블 데이터**
   ```sql
   SELECT event_type, COUNT(*) as count
   FROM app_analytics
   GROUP BY event_type;
   ```

   **예상**:
   ```
   event_type          | count
   --------------------|------
   app_created         | 1
   secret_regenerated  | 1
   ```

### 2. SQL Editor 검증

**테이블 구조 확인**:
```sql
-- apps 테이블
\d apps;

-- app_analytics 테이블
\d app_analytics;
```

**예상**: 모든 컬럼과 인덱스가 migration 대로 생성됨

### 3. RLS 정책 확인

```sql
-- RLS 정책 확인
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public';
```

**예상**: `apps`와 `app_analytics` 테이블에 RLS 정책 있음

### 4. 인덱스 확인

```sql
SELECT tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('app_analytics', 'apps');
```

**예상**:
- `idx_app_analytics_app_time`
- `idx_app_analytics_event_type`
- `idx_app_analytics_user_id`
- `apps_pkey`
- `apps_api_key_key`

---

## 문서 검증 (5분)

### 1. 문서 파일 존재 확인

```bash
ls -lh server/docs/ADMIN_GUIDE.md
ls -lh server/docs/INTEGRATION_GUIDE.md
ls -lh server/docs/TESTING_GUIDE.md
ls -lh server/docs/api/openapi.yaml
ls -lh server/README.md
```

**예상**: 모든 파일 존재, 파일 크기 > 10KB

### 2. 문서 내용 확인

```bash
# OpenAPI 엔드포인트 개수 확인
grep -c "operationId:" server/docs/api/openapi.yaml
```

**예상**: 8 (8개 엔드포인트)

```bash
# Admin Guide 섹션 개수 확인
grep -c "^## " server/docs/ADMIN_GUIDE.md
```

**예상**: 10+ 섹션

### 3. README 링크 확인

```bash
grep -o "docs/.*\.md" server/README.md
```

**예상**:
```
docs/ADMIN_GUIDE.md
docs/api/openapi.yaml
docs/INTEGRATION_GUIDE.md
docs/postman/Admin_API.postman_collection.json
docs/TESTING_GUIDE.md
```

---

## 프로덕션 검증 (선택)

### Vercel 배포 확인

1. **Deployment URL 확인**
   ```bash
   vercel --prod
   ```

2. **Health Check**
   ```bash
   curl https://sso-system.vercel.app/
   ```

3. **Dashboard API 테스트**
   ```bash
   curl -X GET "https://sso-system.vercel.app/api/v1/admin/dashboard" \
     -H "Authorization: Bearer $ADMIN_TOKEN"
   ```

**✅ 통과**: 로컬과 동일한 응답

---

## 종합 체크리스트

### ✅ 파일 구조 (16개)
- [ ] `server/src/routes/admin.js` (893 lines)
- [ ] `server/src/utils/crypto.js` (85 lines)
- [ ] `server/src/utils/validators.js` (183 lines)
- [ ] `server/src/utils/analytics.js` (405 lines)
- [ ] `server/src/middleware/authenticateAdmin.js` (160 lines)
- [ ] `server/src/middleware/adminRateLimiter.js`
- [ ] `server/src/routes/__tests__/admin.test.js` (36 tests)
- [ ] `server/src/utils/__tests__/crypto.test.js` (32 tests)
- [ ] `server/src/utils/__tests__/validators.test.js` (57 tests)
- [ ] `server/docs/ADMIN_GUIDE.md` (660 lines)
- [ ] `server/docs/INTEGRATION_GUIDE.md` (874 lines)
- [ ] `server/docs/TESTING_GUIDE.md` (788 lines)
- [ ] `server/docs/api/openapi.yaml` (842 lines)
- [ ] `server/docs/postman/Admin_API.postman_collection.json`
- [ ] `server/README.md` (510 lines)
- [ ] `server/jest.config.js`

### ✅ API 엔드포인트 (8개)
- [ ] GET /api/v1/admin/apps (200 OK)
- [ ] POST /api/v1/admin/apps (201 Created, api_secret 반환)
- [ ] GET /api/v1/admin/apps/:id (200 OK, stats 포함)
- [ ] PUT /api/v1/admin/apps/:id (200 OK, 업데이트 확인)
- [ ] DELETE /api/v1/admin/apps/:id (200 OK, soft delete)
- [ ] POST /api/v1/admin/apps/:id/regenerate-secret (200 OK, 새 secret)
- [ ] GET /api/v1/admin/apps/:id/analytics (200 OK, events 있음)
- [ ] GET /api/v1/admin/dashboard (200 OK, stats 반환)

### ✅ 보안 (6개)
- [ ] JWT 인증 작동 (401 without token)
- [ ] Admin 역할 확인 (403 for non-admin)
- [ ] API Secret bcrypt 해싱 (DB에 hash 저장)
- [ ] Plain secret 1회만 표시 (GET에서 반환 안 됨)
- [ ] Input sanitization (XSS 방지)
- [ ] Rate limiting (100 req/min)

### ✅ 테스트 (143+ tests)
- [ ] 모든 테스트 통과
- [ ] Coverage > 80%
- [ ] 에러 없음

### ✅ 데이터베이스 (3개)
- [ ] `apps` 테이블 존재 및 데이터 확인
- [ ] `app_analytics` 테이블 존재 및 이벤트 기록
- [ ] 인덱스 5개 생성 확인

### ✅ 문서 (5개)
- [ ] Admin Guide 완성 (47 페이지)
- [ ] Integration Guide 완성 (38 페이지)
- [ ] Testing Guide 완성 (34 페이지)
- [ ] OpenAPI Spec 완성 (8 endpoints)
- [ ] Server README 완성

---

## 트러블슈팅

### 서버 시작 실패
**증상**: `npm run dev` 에러
**해결**:
```bash
# 의존성 재설치
rm -rf node_modules package-lock.json
npm install

# 환경변수 확인
cat .env
```

### 401 Unauthorized (토큰 문제)
**증상**: 모든 API 요청이 401
**해결**:
1. Supabase에서 새 토큰 발급
2. 토큰 만료 확인 (1시간)
3. Admin 역할 확인 (`SELECT role FROM profiles WHERE email = '...'`)

### 테스트 실패
**증상**: Jest 테스트 실패
**해결**:
```bash
# Mock 초기화
npm test -- --clearCache

# 특정 테스트만 실행
npm test -- -t "POST /apps"
```

### Database 연결 실패
**증상**: Supabase 연결 에러
**해결**:
1. `SUPABASE_URL` 확인
2. `SUPABASE_SERVICE_ROLE_KEY` 확인 (anon key 아님!)
3. Supabase 프로젝트 active 확인

---

## 성공 기준

### ✅ 최소 요구사항 (필수)
- 8개 API 엔드포인트 모두 작동
- 테스트 143개 모두 통과
- Admin 인증 및 역할 확인 작동
- API Secret 생성 및 bcrypt 해싱
- 문서 5개 모두 완성

### ✅ 품질 기준 (권장)
- API 응답 시간 < 200ms
- Test coverage > 80%
- 에러 로깅 작동 (Winston)
- Rate limiting 작동
- Analytics 이벤트 기록

### ✅ 프로덕션 준비 (선택)
- Vercel 배포 성공
- HTTPS 작동
- CORS 설정 확인
- 환경변수 secret manager에 저장

---

## 다음 단계

Phase 1 검증 완료 후:

1. **Phase 2 시작**: Frontend Core 개발
2. **Demo 준비**: Admin 대시보드 시연
3. **문서 공유**: 팀원에게 Integration Guide 전달

---

**End of Phase 1 Verification Guide**
