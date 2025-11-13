-- ============================================================================
-- Supabase Cloud - Admin 계정 생성 (Clean Version v2)
-- ============================================================================
-- 실행 방법:
-- 1. https://supabase.com/dashboard/project/dqkghhlnnskjfwntdtor/sql/new
-- 2. 이 파일 내용 전체 복사 & 붙여넣기
-- 3. "Run" 버튼 클릭
-- ============================================================================

-- Step 1: Admin 사용자 생성 (auth.users)
DO $$
DECLARE
  new_user_id UUID;
BEGIN
  -- 기존 계정 확인
  SELECT id INTO new_user_id
  FROM auth.users
  WHERE email = 'admin@sso.local';

  -- 없으면 생성
  IF new_user_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@sso.local',
      crypt('Test1234!', gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"display_name":"Admin User"}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    )
    RETURNING id INTO new_user_id;

    RAISE NOTICE '✅ Admin user created: %', new_user_id;
  ELSE
    RAISE NOTICE 'ℹ️  Admin user already exists: %', new_user_id;
  END IF;

  -- Step 2: Profile에 admin role 설정 (trigger가 자동 생성하므로 UPDATE만)
  UPDATE public.profiles
  SET role = 'admin',
      display_name = 'Admin User'
  WHERE id = new_user_id;

  RAISE NOTICE '✅ Admin role granted to profile';
END $$;

-- ============================================================================
-- Verification
-- ============================================================================

-- auth.users 확인
SELECT
  id,
  email,
  email_confirmed_at IS NOT NULL as email_confirmed,
  created_at
FROM auth.users
WHERE email = 'admin@sso.local';

-- profiles 확인
SELECT
  id,
  email,
  role,
  display_name,
  created_at
FROM public.profiles
WHERE email = 'admin@sso.local';

-- Success Message
SELECT
  '✅ Admin Account Ready!' as status,
  'Email: admin@sso.local' as credentials,
  'Password: Test1234!' as password,
  'Role: admin' as role;

-- ============================================================================
-- Next Steps:
-- 1. Backend 배포 (Vercel)
-- 2. 환경 변수 설정
-- 3. Frontend 배포
-- 4. 로그인 테스트: admin@sso.local / Test1234!
-- ============================================================================
