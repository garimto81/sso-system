-- Supabase Cloud에서 Admin 계정 생성
-- Supabase Studio → SQL Editor에서 실행

-- 기존 계정 확인 (선택)
SELECT id, email, role
FROM auth.users
WHERE email = 'admin@sso.local';

-- Admin 계정 생성
-- 비밀번호: Test1234!
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
  '{"role":"admin"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
)
ON CONFLICT (email) DO NOTHING;

-- Profile 자동 생성 확인 (Trigger에 의해 자동 생성됨)
SELECT
  p.id,
  p.email,
  p.role,
  p.display_name,
  p.created_at
FROM profiles p
WHERE p.email = 'admin@sso.local';

-- 결과 확인:
-- id                                   | email            | role  | display_name | created_at
-- -------------------------------------|------------------|-------|--------------|------------------
-- [UUID]                               | admin@sso.local  | admin | NULL         | 2025-01-12 ...

-- 성공 메시지
SELECT
  '✅ Admin 계정 생성 완료!' as status,
  'Email: admin@sso.local' as login,
  'Password: Test1234!' as password;
