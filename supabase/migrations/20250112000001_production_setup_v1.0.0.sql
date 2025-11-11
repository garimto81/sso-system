-- ============================================================================
-- Supabase Cloud CLEAN Migration - v1.0.0 (Fixed)
-- Created: 2025-01-12
-- Description: DROP existing tables and recreate from scratch
-- ============================================================================
-- ⚠️  WARNING: This will DELETE ALL existing data!
-- Run this in Supabase Dashboard SQL Editor:
-- https://supabase.com/dashboard/project/dqkghhlnnskjfwntdtor/sql/new
-- ============================================================================

-- ============================================================================
-- Step 1: DROP existing objects (순서 중요 - 의존성 역순)
-- ============================================================================

-- Drop views first
DROP VIEW IF EXISTS public.app_usage_stats CASCADE;
DROP VIEW IF EXISTS public.auth_code_stats CASCADE;
DROP VIEW IF EXISTS public.apps_public CASCADE;

-- Drop triggers (auth.users 트리거 포함)
DROP TRIGGER IF EXISTS auth_code_rate_limit ON public.auth_codes;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
DROP TRIGGER IF EXISTS set_updated_at_apps ON public.apps;

-- Drop functions
DROP FUNCTION IF EXISTS public.check_auth_code_rate_limit() CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_expired_auth_codes() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;

-- Drop tables (의존성 있는 테이블부터)
DROP TABLE IF EXISTS public.auth_codes CASCADE;
DROP TABLE IF EXISTS public.apps CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ============================================================================
-- Step 2: CREATE profiles 테이블
-- ============================================================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user'
    CHECK (role IN ('user', 'app_owner', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);

COMMENT ON TABLE public.profiles IS '사용자 프로필 및 역할 정보';
COMMENT ON COLUMN public.profiles.id IS 'auth.users.id와 1:1 매핑';
COMMENT ON COLUMN public.profiles.role IS 'user: 일반 사용자, app_owner: 앱 소유자, admin: 시스템 관리자';

-- ============================================================================
-- Step 3: CREATE apps 테이블
-- ============================================================================

CREATE TABLE public.apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  api_key TEXT NOT NULL UNIQUE,
  api_secret TEXT NOT NULL,
  redirect_urls TEXT[] NOT NULL DEFAULT '{}',
  allowed_origins TEXT[] DEFAULT '{}',
  auth_method TEXT NOT NULL DEFAULT 'token_exchange'
    CHECK (auth_method IN ('shared_cookie', 'token_exchange', 'hybrid')),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_apps_api_key ON public.apps(api_key);
CREATE INDEX idx_apps_owner_id ON public.apps(owner_id);
CREATE INDEX idx_apps_is_active ON public.apps(is_active) WHERE is_active = true;
CREATE INDEX idx_apps_owner_active ON public.apps(owner_id, is_active);

COMMENT ON TABLE public.apps IS 'SSO에 등록된 앱 목록';
COMMENT ON COLUMN public.apps.api_key IS '앱 식별용 키 (공개 가능)';
COMMENT ON COLUMN public.apps.api_secret IS '앱 검증용 비밀 키 (bcrypt 해시)';
COMMENT ON COLUMN public.apps.redirect_urls IS '허용된 리다이렉트 URL 목록 (보안)';

-- Validation constraint
ALTER TABLE public.apps
  ADD CONSTRAINT check_redirect_urls_not_empty
  CHECK (array_length(redirect_urls, 1) > 0);

-- ============================================================================
-- Step 4: CREATE auth_codes 테이블
-- ============================================================================

CREATE TABLE public.auth_codes (
  code TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  state TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_auth_codes_expires ON public.auth_codes(expires_at);
CREATE INDEX idx_auth_codes_user_id ON public.auth_codes(user_id);
CREATE INDEX idx_auth_codes_app_id ON public.auth_codes(app_id);

-- v1.0.0 Performance indexes
CREATE INDEX idx_auth_codes_validation ON public.auth_codes(code, app_id, expires_at);
CREATE INDEX idx_auth_codes_user_app ON public.auth_codes(user_id, app_id, expires_at);

COMMENT ON TABLE public.auth_codes IS 'Token Exchange용 일회용 인증 코드 (OAuth 2.0 Authorization Code)';
COMMENT ON COLUMN public.auth_codes.code IS '일회용 코드 (예: crypto.randomBytes(32).toString("hex"))';
COMMENT ON COLUMN public.auth_codes.expires_at IS '만료 시간 (기본 5분)';

-- Validation constraint
ALTER TABLE public.auth_codes
  ADD CONSTRAINT check_expires_future
  CHECK (expires_at > created_at);

-- ============================================================================
-- Step 5: CREATE Triggers & Functions
-- ============================================================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- profiles updated_at trigger
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- apps updated_at trigger
CREATE TRIGGER set_updated_at_apps
  BEFORE UPDATE ON public.apps
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 신규 사용자 자동 프로필 생성
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS NULL THEN
    RAISE EXCEPTION 'User email cannot be null';
  END IF;
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  )
  ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email,
        updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 만료된 auth_codes 정리 함수
CREATE OR REPLACE FUNCTION public.cleanup_expired_auth_codes()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.auth_codes WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Rate limiting trigger (v1.0.0)
CREATE OR REPLACE FUNCTION public.check_auth_code_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  recent_codes INTEGER;
BEGIN
  SELECT COUNT(*) INTO recent_codes
  FROM public.auth_codes
  WHERE user_id = NEW.user_id
    AND created_at > NOW() - INTERVAL '1 minute';

  IF recent_codes >= 10 THEN
    RAISE EXCEPTION 'Rate limit exceeded: too many auth codes (max 10 per minute)';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auth_code_rate_limit
  BEFORE INSERT ON public.auth_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.check_auth_code_rate_limit();

-- ============================================================================
-- Step 6: Row Level Security (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_codes ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Apps policies
CREATE POLICY "Anyone can view active apps"
  ON public.apps
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Owners can view own apps"
  ON public.apps
  FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can update own apps"
  ON public.apps
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "App owners can create apps"
  ON public.apps
  FOR INSERT
  WITH CHECK (
    auth.uid() = owner_id AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('app_owner', 'admin')
    )
  );

CREATE POLICY "Owners can delete own apps"
  ON public.apps
  FOR DELETE
  USING (auth.uid() = owner_id);

CREATE POLICY "Admins can manage all apps"
  ON public.apps
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Auth codes policies (서버만 접근)
CREATE POLICY "Service role only"
  ON public.auth_codes
  FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- Step 7: Views (v1.0.0)
-- ============================================================================

-- Public view without api_secret
CREATE VIEW public.apps_public AS
SELECT id, name, description, api_key, redirect_urls, allowed_origins,
       auth_method, owner_id, is_active, created_at, updated_at
FROM public.apps WHERE is_active = true;

GRANT SELECT ON public.apps_public TO anon;
GRANT SELECT ON public.apps_public TO authenticated;

-- Auth code statistics
CREATE VIEW public.auth_code_stats AS
SELECT
  COUNT(*) as total_codes,
  COUNT(*) FILTER (WHERE expires_at > NOW()) as active_codes,
  COUNT(*) FILTER (WHERE expires_at <= NOW()) as expired_codes,
  MAX(created_at) as last_generated
FROM public.auth_codes;

GRANT SELECT ON public.auth_code_stats TO authenticated;

-- App usage statistics
CREATE VIEW public.app_usage_stats AS
SELECT
  a.id,
  a.name,
  COUNT(ac.code) as total_auth_codes,
  MAX(ac.created_at) as last_used
FROM public.apps a
LEFT JOIN public.auth_codes ac ON a.id = ac.app_id
GROUP BY a.id, a.name
ORDER BY total_auth_codes DESC;

GRANT SELECT ON public.app_usage_stats TO authenticated;

-- ============================================================================
-- Step 8: Verification Query
-- ============================================================================

SELECT 'Migration Complete!' as status;

-- Verify all objects created
SELECT 'Tables' as type, table_name as name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'apps', 'auth_codes')

UNION ALL

SELECT 'Index', indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'apps', 'auth_codes')

UNION ALL

SELECT 'Trigger', trigger_name
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN ('auth_code_rate_limit', 'on_auth_user_created', 'set_updated_at_profiles', 'set_updated_at_apps')

UNION ALL

SELECT 'View', table_name
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name IN ('apps_public', 'auth_code_stats', 'app_usage_stats')

UNION ALL

SELECT 'Function', routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('handle_new_user', 'handle_updated_at', 'cleanup_expired_auth_codes', 'check_auth_code_rate_limit')

ORDER BY type, name;

-- ============================================================================
-- Clean Migration Complete! v1.0.0 🚀
-- ============================================================================
-- Expected result: 24 rows (4 Functions, 15 Indexes, 3 Tables, 4 Triggers, 3 Views)
-- Next: Create admin user and test apps in Supabase Dashboard
-- ============================================================================
