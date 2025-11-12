# Test SSO Flow

SSO OAuth 2.0 Authorization Code Flow 전체를 자동으로 테스트합니다.

**테스트 시나리오**:
1. ✅ 서버 헬스 체크 (GET /health)
2. ✅ Admin 로그인 (POST /auth/login)
3. ✅ 앱 생성 (POST /api/v1/admin/apps)
4. ✅ Authorization URL 생성 (GET /api/v1/authorize)
5. ✅ 인증 후 Auth Code 발급 (시뮬레이션)
6. ✅ Token Exchange (POST /api/v1/token/exchange)
7. ✅ JWT 검증 및 사용자 정보 확인
8. ✅ Analytics 기록 확인

**실행 절차**:
1. 서버 실행 여부 확인:
   ```bash
   curl http://localhost:3000/health
   ```
2. 테스트용 Admin 계정으로 로그인:
   ```bash
   curl -X POST http://localhost:3000/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"test-admin@example.com","password":"test123"}'
   ```
3. 테스트 앱 생성 (API Key/Secret 저장):
   ```bash
   curl -X POST http://localhost:3000/api/v1/admin/apps \
     -H "Authorization: Bearer {admin_jwt}" \
     -H "Content-Type: application/json" \
     -d '{
       "name": "Test SSO App",
       "redirect_urls": ["http://localhost:3001/callback"],
       "owner_email": "test-admin@example.com"
     }'
   ```
4. SSO Flow 실행:
   - Authorization URL 생성
   - 사용자 인증 시뮬레이션
   - Auth Code → Access Token 교환
   - Token으로 사용자 정보 조회

5. 결과 리포트 출력:
   ```
   ✅ SSO Flow Test Results
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Health Check:        PASS (120ms)
   Admin Login:         PASS (245ms)
   App Creation:        PASS (567ms)
   Authorization:       PASS (89ms)
   Token Exchange:      PASS (234ms)
   User Info Fetch:     PASS (156ms)
   Analytics Recorded:  PASS (78ms)

   Total Time: 1.489s
   Status: ALL TESTS PASSED ✅
   ```

**실패 시 디버깅**:
- 서버 미실행 → `npm run dev` 안내
- DB 연결 실패 → Supabase 상태 확인
- 인증 실패 → Admin 계정 존재 확인
- Token 교환 실패 → API Secret 검증

**환경 요구사항**:
- 서버 실행 중 (localhost:3000)
- Supabase 연결됨
- Admin 계정 존재
- .env 파일 올바름

**자동화 옵션**:
- `--ci` 플래그: CI/CD 환경용 (JSON 출력)
- `--verbose` 플래그: 상세 로그 출력
- `--cleanup` 플래그: 테스트 후 데이터 삭제
