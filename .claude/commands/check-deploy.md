# Check Deployment Readiness

프로덕션 배포 전 체크리스트를 자동으로 실행합니다.

**체크 항목** (20개):

### 1. 환경 설정 (5개)
- [x] .env 파일 존재 및 필수 변수 확인
- [x] JWT_SECRET 길이 ≥ 32자
- [x] NODE_ENV=production 설정
- [x] SUPABASE_URL HTTPS 사용
- [x] ALLOWED_ORIGINS 프로덕션 도메인 포함

### 2. 보안 (5개)
- [x] API Secret bcrypt 해싱 사용
- [x] Rate Limiting 활성화
- [x] HTTPS Redirect 미들웨어 적용
- [x] Helmet 보안 헤더 설정
- [x] .env 파일 .gitignore 포함

### 3. 데이터베이스 (4개)
- [x] Supabase 연결 성공
- [x] 모든 마이그레이션 적용됨
- [x] RLS 정책 활성화
- [x] 인덱스 생성 확인

### 4. 테스트 (3개)
- [x] 단위 테스트 통과 (npm test)
- [x] E2E 테스트 통과 (Playwright)
- [x] 테스트 커버리지 ≥ 80%

### 5. 성능 (3개)
- [x] 프로덕션 빌드 성공
- [x] 번들 사이즈 < 500KB
- [x] Lighthouse 점수 > 90

**실행 절차**:
1. 환경변수 검증:
   ```javascript
   const requiredEnvVars = [
     'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY',
     'JWT_SECRET', 'SESSION_SECRET', 'NODE_ENV'
   ];
   for (let key of requiredEnvVars) {
     if (!process.env[key]) {
       errors.push(`Missing ${key}`);
     }
   }
   ```

2. 보안 체크:
   ```bash
   # Helmet 미들웨어 확인
   grep -r "helmet()" server/src/

   # Rate limiting 확인
   grep -r "rateLimit" server/src/middleware/

   # .gitignore 확인
   grep "\.env" .gitignore
   ```

3. DB 상태 확인:
   ```javascript
   // Supabase 연결 테스트
   const { data, error } = await supabase.from('apps').select('count');

   // 마이그레이션 버전 확인
   const { data: migrations } = await supabase
     .from('supabase_migrations')
     .select('*')
     .order('version', { ascending: false });
   ```

4. 테스트 실행:
   ```bash
   npm test -- --coverage
   npx playwright test --reporter=json
   ```

5. 빌드 및 성능:
   ```bash
   npm run build
   npx @vercel/ncc build server/src/index.js
   npm run lighthouse -- --budget
   ```

6. 결과 리포트:
   ```
   ✅ Deployment Readiness Check
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   📋 Environment:         ✅ 5/5 passed
   🔒 Security:            ✅ 5/5 passed
   💾 Database:            ✅ 4/4 passed
   🧪 Tests:               ✅ 3/3 passed
   ⚡ Performance:         ⚠️  2/3 passed

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Overall:                19/20 passed (95%)

   ⚠️  Issues Found:
   1. Bundle size: 523KB (target: 500KB)
      → Suggestion: Enable tree shaking in webpack config

   ✅ READY FOR DEPLOYMENT

   Next Steps:
   1. Review warnings above
   2. Run: vercel --prod
   3. Monitor logs after deployment
   ```

**실패 시 액션**:
- 환경변수 누락 → .env.example 참조
- 테스트 실패 → npm test 재실행 및 에러 확인
- 마이그레이션 미적용 → npx supabase db push
- 보안 체크 실패 → 해당 미들웨어 추가

**CI/CD 통합**:
```yaml
# .github/workflows/deploy.yml
- name: Check Deployment Readiness
  run: node scripts/check-deployment.js --ci

- name: Deploy to Vercel
  if: success()
  run: vercel --prod
```

**출력 형식**:
- `--json` : JSON 형식 출력 (CI/CD용)
- `--verbose` : 상세 로그
- `--fix` : 자동 수정 가능한 항목 수정 (실험적)
