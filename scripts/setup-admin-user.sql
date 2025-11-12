-- Setup Admin User (SQL Alternative)
-- This script creates an admin account directly via PostgreSQL
--
-- Usage:
--   psql -h 127.0.0.1 -p 54322 -U postgres -d postgres -f scripts/setup-admin-user.sql
--   OR
--   cat scripts/setup-admin-user.sql | PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres -d postgres
--
-- Default credentials:
--   Email: admin@test.com
--   Password: Test1234!

\set ON_ERROR_STOP on

BEGIN;

-- Variables (modify these if needed)
\set admin_email '''admin@test.com'''
\set admin_password '''Test1234!'''
\set admin_display_name '''System Admin'''

-- Step 1: Check if user already exists
DO $$
DECLARE
  v_user_id uuid;
  v_encrypted_password text;
BEGIN
  -- Check existing user
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = 'admin@test.com';

  IF v_user_id IS NOT NULL THEN
    RAISE NOTICE '⚠️  User already exists (ID: %)', v_user_id;

    -- Update profile to admin role
    UPDATE public.profiles
    SET role = 'admin',
        updated_at = now()
    WHERE id = v_user_id;

    RAISE NOTICE '✅ Role updated to admin for existing user';
  ELSE
    -- Step 2: Create new user in auth.users
    -- Note: Password will be hashed by Supabase Auth API
    -- For direct SQL insert, we use crypt() function with bcrypt
    v_encrypted_password := crypt('Test1234!', gen_salt('bf', 10));

    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role,
      aud,
      confirmation_token,
      email_change_token_new,
      recovery_token
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'admin@test.com',
      v_encrypted_password,
      now(),
      now(),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"role":"admin","display_name":"System Admin"}'::jsonb,
      false,
      'authenticated',
      'authenticated',
      '',
      '',
      ''
    ) RETURNING id INTO v_user_id;

    RAISE NOTICE '✅ User created (ID: %)', v_user_id;

    -- Step 3: Create or update profile (might be auto-created by trigger)
    INSERT INTO public.profiles (id, email, role, display_name, created_at, updated_at)
    VALUES (v_user_id, 'admin@test.com', 'admin', 'System Admin', now(), now())
    ON CONFLICT (id)
    DO UPDATE SET
      role = 'admin',
      display_name = 'System Admin',
      updated_at = now();

    RAISE NOTICE '✅ Profile created/updated with admin role';
  END IF;
END $$;

COMMIT;

-- Verification query
\echo '\n📋 Verification:'
\echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
SELECT
  u.id,
  u.email,
  p.role,
  p.display_name,
  u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE u.email = 'admin@test.com';

\echo '\n✅ Admin user setup complete!'
\echo '\n🔑 Admin Credentials:'
\echo '   Email:    admin@test.com'
\echo '   Password: Test1234!'
\echo '\n🧪 Test login with:'
\echo '   curl -X POST http://localhost:3000/auth/login \'
\echo '     -H "Content-Type: application/json" \'
\echo '     -d ''{"email":"admin@test.com","password":"Test1234!"}'''
\echo '\n⚠️  Security reminder:'
\echo '   - Change password in production'
\echo '   - Use strong passwords (16+ chars)'
\echo '   - Enable 2FA if available'
\echo ''
