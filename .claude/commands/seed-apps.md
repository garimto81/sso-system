# Seed Test Apps

테스트용 애플리케이션 데이터를 자동으로 생성합니다.

**생성되는 데이터**:
1. **5개의 테스트 앱**:
   - OJT Platform (Active)
   - Contents Factory (Active)
   - HR System (Inactive)
   - Customer Portal (Active)
   - Analytics Dashboard (Active)

2. **각 앱마다**:
   - API Key/Secret (자동 생성)
   - Redirect URLs (localhost + production)
   - Allowed Origins
   - Owner (Admin 계정)
   - 생성일/수정일 (랜덤)

3. **Analytics 이벤트** (최근 30일):
   - 로그인 이벤트 (100-500개/앱)
   - Token Exchange (50-200개/앱)
   - 에러 이벤트 (0-10개/앱)
   - 랜덤 타임스탬프 분포

**실행 절차**:
1. Admin 계정 확인 (없으면 생성)
2. apps 테이블에 5개 앱 INSERT:
   ```javascript
   const apps = [
     {
       name: 'OJT Platform',
       description: 'Employee training and onboarding system',
       api_key: generateUUID(),
       api_secret_hash: hashSecret(generateSecret()),
       redirect_urls: ['http://localhost:3001/callback', 'https://ojt.example.com/callback'],
       allowed_origins: ['http://localhost:3001', 'https://ojt.example.com'],
       is_active: true,
       owner_id: adminUserId
     },
     // ... 4개 더
   ];
   ```
3. app_analytics 테이블에 이벤트 생성:
   ```javascript
   // 각 앱마다 랜덤 이벤트 생성
   for (let app of apps) {
     for (let i = 0; i < randomInt(100, 500); i++) {
       await supabase.from('app_analytics').insert({
         app_id: app.id,
         event_type: 'login',
         user_id: randomUserId(),
         metadata: { ip: randomIP() },
         created_at: randomDateLast30Days()
       });
     }
   }
   ```

4. 결과 출력:
   ```
   ✅ Test Data Seeding Complete!
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Apps Created:        5
   Analytics Events:    1,847
   Time Taken:          3.2s

   📱 Apps Summary:
   ┌────┬─────────────────────┬──────────┬─────────┐
   │ ID │ Name                │ Status   │ Events  │
   ├────┼─────────────────────┼──────────┼─────────┤
   │ 1  │ OJT Platform        │ ✅ Active│ 456     │
   │ 2  │ Contents Factory    │ ✅ Active│ 328     │
   │ 3  │ HR System           │ 🔴 Inactive│ 0     │
   │ 4  │ Customer Portal     │ ✅ Active│ 542     │
   │ 5  │ Analytics Dashboard │ ✅ Active│ 521     │
   └────┴─────────────────────┴──────────┴─────────┘

   🔑 API Credentials saved to: seed-data-credentials.txt
   ⚠️  Keep this file secure and delete after testing!
   ```

**옵션**:
- `--count=N` : 생성할 앱 개수 (기본: 5)
- `--events=N` : 앱당 평균 이벤트 수 (기본: 300)
- `--days=N` : 이벤트 분포 기간 (기본: 30일)
- `--clean` : 기존 테스트 데이터 삭제 후 생성

**사용 사례**:
- Admin Dashboard UI 개발 시 샘플 데이터 필요
- Analytics 차트 테스트
- 검색/필터링 기능 테스트
- 성능 테스트 (대량 데이터)

**주의사항**:
- 프로덕션 환경에서 실행 금지
- 기존 데이터와 충돌 가능 (--clean 옵션 주의)
- 생성된 API Secret은 seed-data-credentials.txt에 저장됨
