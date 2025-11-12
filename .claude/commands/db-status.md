# Database Status Check

Supabase 데이터베이스 상태를 실시간으로 확인합니다.

**확인 항목**:
1. ✅ 연결 상태 (Latency)
2. 📊 데이터 통계 (테이블별 Row 수)
3. 🔐 RLS 정책 상태
4. 📈 인덱스 사용률
5. 🔄 최근 마이그레이션
6. ⚠️ 경고 및 권장사항

**실행 절차**:
1. Supabase 연결 테스트:
   ```javascript
   const startTime = Date.now();
   const { data, error } = await supabase.from('apps').select('count');
   const latency = Date.now() - startTime;
   ```

2. 테이블별 통계 조회:
   ```sql
   SELECT
     schemaname,
     tablename,
     n_live_tup as row_count,
     n_dead_tup as dead_rows,
     last_vacuum,
     last_analyze
   FROM pg_stat_user_tables
   WHERE schemaname = 'public'
   ORDER BY n_live_tup DESC;
   ```

3. RLS 정책 확인:
   ```sql
   SELECT
     tablename,
     policyname,
     permissive,
     roles,
     cmd,
     qual
   FROM pg_policies
   WHERE schemaname = 'public';
   ```

4. 인덱스 상태:
   ```sql
   SELECT
     schemaname,
     tablename,
     indexname,
     idx_scan,
     idx_tup_read,
     idx_tup_fetch
   FROM pg_stat_user_indexes
   WHERE schemaname = 'public'
   ORDER BY idx_scan DESC;
   ```

5. 마이그레이션 이력:
   ```sql
   SELECT
     version,
     name,
     executed_at
   FROM supabase_migrations.schema_migrations
   ORDER BY version DESC
   LIMIT 10;
   ```

6. 결과 출력:
   ```
   ✅ Supabase Database Status
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   🔌 Connection:
   Status:              ✅ Connected
   Latency:             45ms
   Region:              ap-northeast-1
   Version:             PostgreSQL 15.1

   📊 Tables:
   ┌─────────────────┬───────────┬────────────┐
   │ Table           │ Rows      │ RLS        │
   ├─────────────────┼───────────┼────────────┤
   │ apps            │ 12        │ ✅ Enabled │
   │ profiles        │ 45        │ ✅ Enabled │
   │ app_analytics   │ 8,234     │ ✅ Enabled │
   │ auth_codes      │ 156       │ ✅ Enabled │
   └─────────────────┴───────────┴────────────┘

   🔐 RLS Policies:
   apps:               3 policies (SELECT, INSERT, UPDATE)
   profiles:           2 policies (SELECT, UPDATE)
   app_analytics:      1 policy (SELECT)

   📈 Indexes:
   ┌───────────────────────────┬─────────┬─────────┐
   │ Index                     │ Scans   │ Usage   │
   ├───────────────────────────┼─────────┼─────────┤
   │ idx_apps_owner            │ 1,234   │ ✅ High │
   │ idx_apps_active           │ 890     │ ✅ High │
   │ idx_app_analytics_app     │ 456     │ ✅ Med  │
   │ idx_auth_codes_code       │ 12      │ ⚠️ Low  │
   └───────────────────────────┴─────────┴─────────┘

   🔄 Recent Migrations:
   1. 20250112_add_analytics_table (2 days ago)
   2. 20250110_add_admin_routes (4 days ago)
   3. 20250108_initial_schema (6 days ago)

   ⚠️  Recommendations:
   1. app_analytics table growing fast (8k rows)
      → Consider partitioning by created_at
   2. idx_auth_codes_code low usage
      → Review if index is needed

   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Overall Health:      ✅ GOOD
   Last Vacuum:         2 hours ago
   Next Analyze:        In 4 hours
   ```

**경고 알림**:
- 🔴 연결 실패 → Supabase 상태 페이지 확인
- ⚠️ Latency > 200ms → 네트워크 문제 또는 리전 거리
- ⚠️ Dead Rows > 10% → VACUUM ANALYZE 필요
- ⚠️ RLS 비활성화 → 보안 위험

**옵션**:
- `--table=apps` : 특정 테이블만 확인
- `--detailed` : 상세 통계 (쿼리 플랜, 디스크 사용량)
- `--export=json` : JSON 파일로 내보내기

**사용 사례**:
- 프로덕션 모니터링
- 성능 문제 디버깅
- 마이그레이션 전후 비교
- 정기 헬스 체크 (cron)

**자동화**:
```bash
# 매일 오전 9시 DB 상태 체크
0 9 * * * /db-status --export=json >> logs/db-status.log
```
