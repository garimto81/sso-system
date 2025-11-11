-- ============================================================================
-- Seed Data for SSO System (Development Only)
-- Created: 2025-01-12
-- ⚠️  경고: 프로덕션에서는 절대 사용하지 마세요!
-- ============================================================================

-- ============================================================================
-- 1. 테스트 사용자 생성
-- ============================================================================
-- Supabase Auth를 통해 생성해야 하지만, 개발 환경에서는 직접 삽입
-- 실제로는 SSO 로그인 페이지에서 회원가입 필요

-- Admin 계정 (profiles 테이블에만 삽입, auth.users는 수동 생성 필요)
-- 실제 사용 시:
-- 1. http://localhost:54323 (Supabase Studio) 접속
-- 2. Authentication → Users → Create User
-- 3. Email: admin@sso.local, Password: admin123!@#
-- 4. User ID 복사 후 아래 INSERT의 UUID 교체

-- 예시 UUID (실제로는 Supabase Auth에서 생성된 UUID 사용)
-- Admin: 00000000-0000-0000-0000-000000000001
-- App Owner: 00000000-0000-0000-0000-000000000002
-- Regular User: 00000000-0000-0000-0000-000000000003

-- ============================================================================
-- 2. Admin 사용자 생성 및 프로필 설정
-- ============================================================================

-- 개발 환경용 임시 Admin 사용자 생성
-- ⚠️ 프로덕션에서는 절대 사용하지 마세요!

-- Step 1: auth.users에 Admin 사용자 생성 (트리거가 profiles 자동 생성)
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'admin@sso.local',
  crypt('admin123!@#', gen_salt('bf')), -- 비밀번호: admin123!@#
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Step 2: Admin 역할로 업데이트 (트리거는 'user' 역할로 생성하므로)
UPDATE public.profiles
SET role = 'admin', display_name = 'System Admin'
WHERE id = '00000000-0000-0000-0000-000000000001';

-- ============================================================================
-- 3. 테스트 앱 등록
-- ============================================================================

-- VTC_Logger 앱
INSERT INTO public.apps (
  id,
  name,
  description,
  api_key,
  api_secret,
  redirect_urls,
  allowed_origins,
  auth_method,
  owner_id,
  is_active
) VALUES (
  gen_random_uuid(),
  'VTC_Logger',
  '로그 관리 시스템',
  'vtc-logger-' || substr(md5(random()::text), 1, 16), -- 랜덤 API Key
  crypt('vtc-logger-secret-' || md5(random()::text), gen_salt('bf')), -- bcrypt 해시
  ARRAY[
    'http://localhost:3001/auth/callback',
    'http://logger.test.local:3001/auth/callback',
    'https://logger.yourdomain.com/auth/callback'
  ],
  ARRAY[
    'http://localhost:3001',
    'http://logger.test.local:3001',
    'https://logger.yourdomain.com'
  ],
  'hybrid', -- 로컬: token_exchange, 프로덕션: shared_cookie
  (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1), -- Admin 소유
  true
) ON CONFLICT (name) DO NOTHING;

-- contents-factory 앱
INSERT INTO public.apps (
  id,
  name,
  description,
  api_key,
  api_secret,
  redirect_urls,
  allowed_origins,
  auth_method,
  owner_id,
  is_active
) VALUES (
  gen_random_uuid(),
  'contents-factory',
  '콘텐츠 관리 시스템',
  'factory-' || substr(md5(random()::text), 1, 16),
  crypt('factory-secret-' || md5(random()::text), gen_salt('bf')),
  ARRAY[
    'http://localhost:3002/auth/callback',
    'http://factory.test.local:3002/auth/callback',
    'https://factory.yourdomain.com/auth/callback'
  ],
  ARRAY[
    'http://localhost:3002',
    'http://factory.test.local:3002',
    'https://factory.yourdomain.com'
  ],
  'hybrid',
  (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1),
  true
) ON CONFLICT (name) DO NOTHING;

-- Admin Dashboard (SSO 자체 관리 UI)
INSERT INTO public.apps (
  id,
  name,
  description,
  api_key,
  api_secret,
  redirect_urls,
  allowed_origins,
  auth_method,
  owner_id,
  is_active
) VALUES (
  gen_random_uuid(),
  'SSO Admin Dashboard',
  'SSO 시스템 관리 대시보드',
  'admin-dashboard-' || substr(md5(random()::text), 1, 16),
  crypt('admin-dashboard-secret-' || md5(random()::text), gen_salt('bf')),
  ARRAY[
    'http://localhost:3000/auth/callback',
    'https://sso.yourdomain.com/auth/callback'
  ],
  ARRAY[
    'http://localhost:3000',
    'https://sso.yourdomain.com'
  ],
  'shared_cookie', -- 같은 도메인이므로 쿠키 공유
  (SELECT id FROM public.profiles WHERE role = 'admin' LIMIT 1),
  true
) ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 4. Seed 데이터 확인 쿼리
-- ============================================================================

-- 등록된 앱 목록 조회
-- SELECT
--   id,
--   name,
--   description,
--   api_key,
--   LEFT(api_secret, 10) || '...' AS api_secret_preview,
--   redirect_urls,
--   auth_method,
--   is_active
-- FROM public.apps;

-- 프로필 목록 조회
-- SELECT id, email, display_name, role, created_at
-- FROM public.profiles;

-- ============================================================================
-- 5. 개발 환경 초기화 스크립트
-- ============================================================================

-- 전체 데이터 삭제 (주의!)
-- TRUNCATE public.auth_codes, public.apps, public.profiles CASCADE;

-- ============================================================================
-- 사용 방법
-- ============================================================================
-- 1. Supabase Studio (http://localhost:54323) 접속
-- 2. Authentication → Users → 다음 사용자 생성:
--    - admin@sso.local (Password: admin123!@#)
--    - developer@sso.local (Password: dev123!@#)
--    - user@sso.local (Password: user123!@#)
--
-- 3. SQL Editor에서 프로필 역할 업데이트:
--    UPDATE public.profiles
--    SET role = 'admin', display_name = 'System Admin'
--    WHERE email = 'admin@sso.local';
--
--    UPDATE public.profiles
--    SET role = 'app_owner', display_name = 'App Developer'
--    WHERE email = 'developer@sso.local';
--
-- 4. 이 seed.sql은 자동으로 실행됨 (supabase db reset 시)
--
-- 5. API Key 확인:
--    SELECT name, api_key FROM public.apps WHERE is_active = true;
--
-- 6. .env 파일에 API Key 복사하여 앱 설정
-- ============================================================================

-- 확인 메시지
DO $$
BEGIN
  RAISE NOTICE '=== SSO Seed Data Loaded ===';
  RAISE NOTICE 'Apps created: %', (SELECT COUNT(*) FROM public.apps);
  RAISE NOTICE 'Please create users in Supabase Studio:';
  RAISE NOTICE '  - admin@sso.local (admin role)';
  RAISE NOTICE '  - developer@sso.local (app_owner role)';
  RAISE NOTICE '  - user@sso.local (user role)';
  RAISE NOTICE '================================';
END $$;
