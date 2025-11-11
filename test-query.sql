-- Test queries to verify database setup

-- 1. Check profiles
SELECT id, email, display_name, role, created_at
FROM public.profiles;

-- 2. Check apps (hide secret)
SELECT
  id,
  name,
  description,
  api_key,
  LEFT(api_secret, 10) || '...' AS api_secret_preview,
  redirect_urls,
  auth_method,
  owner_id,
  is_active
FROM public.apps;

-- 3. Count records
SELECT 'profiles' AS table_name, COUNT(*) FROM public.profiles
UNION ALL
SELECT 'apps', COUNT(*) FROM public.apps
UNION ALL
SELECT 'auth_codes', COUNT(*) FROM public.auth_codes;
