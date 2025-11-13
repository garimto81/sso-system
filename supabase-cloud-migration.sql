-- ============================================================================
-- Supabase Cloud Migration - Complete Database Setup
-- Project: dqkghhlnnskjfwntdtor
-- Created: 2025-01-12
-- Description: Full database schema migration for SSO System
-- ============================================================================

-- ⚠️ INSTRUCTIONS:
-- 1. Go to: https://supabase.com/dashboard/project/dqkghhlnnskjfwntdtor/sql/new
-- 2. Copy this entire file
-- 3. Paste into SQL Editor
-- 4. Click "Run" button
-- 5. Verify "Migration Complete!" message appears
-- ============================================================================

-- ============================================================================
-- PART 1: Production Setup v1.0.0
-- ============================================================================

-- Drop existing objects
DROP VIEW IF EXISTS public.app_usage_stats CASCADE;
DROP VIEW IF EXISTS public.auth_code_stats CASCADE;
DROP VIEW IF EXISTS public.apps_public CASCADE;

DROP TRIGGER IF EXISTS auth_code_rate_limit ON public.auth_codes;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
DROP TRIGGER IF EXISTS set_updated_at_apps ON public.apps;

DROP FUNCTION IF EXISTS public.check_auth_code_rate_limit() CASCADE;
DROP FUNCTION IF EXISTS public.cleanup_expired_auth_codes() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;

DROP TABLE IF EXISTS public.app_analytics CASCADE;
DROP TABLE IF EXISTS public.auth_codes CASCADE;
DROP TABLE IF EXISTS public.apps CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Create profiles table
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

-- Create apps table
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

ALTER TABLE public.apps
  ADD CONSTRAINT check_redirect_urls_not_empty
  CHECK (array_length(redirect_urls, 1) > 0);

-- Create auth_codes table
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
CREATE INDEX idx_auth_codes_validation ON public.auth_codes(code, app_id, expires_at);
CREATE INDEX idx_auth_codes_user_app ON public.auth_codes(user_id, app_id, expires_at);

ALTER TABLE public.auth_codes
  ADD CONSTRAINT check_expires_future
  CHECK (expires_at > created_at);

-- Create functions
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_apps
  BEFORE UPDATE ON public.apps
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

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

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_codes ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Apps policies
CREATE POLICY "Anyone can view active apps"
  ON public.apps FOR SELECT
  USING (is_active = true);

CREATE POLICY "Owners can view own apps"
  ON public.apps FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can update own apps"
  ON public.apps FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "App owners can create apps"
  ON public.apps FOR INSERT
  WITH CHECK (
    auth.uid() = owner_id AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN ('app_owner', 'admin')
    )
  );

CREATE POLICY "Owners can delete own apps"
  ON public.apps FOR DELETE
  USING (auth.uid() = owner_id);

CREATE POLICY "Admins can manage all apps"
  ON public.apps FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Auth codes policies
CREATE POLICY "Service role only"
  ON public.auth_codes FOR ALL
  USING (auth.role() = 'service_role');

-- Create views
CREATE VIEW public.apps_public AS
SELECT id, name, description, api_key, redirect_urls, allowed_origins,
       auth_method, owner_id, is_active, created_at, updated_at
FROM public.apps WHERE is_active = true;

GRANT SELECT ON public.apps_public TO anon;
GRANT SELECT ON public.apps_public TO authenticated;

CREATE VIEW public.auth_code_stats AS
SELECT
  COUNT(*) as total_codes,
  COUNT(*) FILTER (WHERE expires_at > NOW()) as active_codes,
  COUNT(*) FILTER (WHERE expires_at <= NOW()) as expired_codes,
  MAX(created_at) as last_generated
FROM public.auth_codes;

GRANT SELECT ON public.auth_code_stats TO authenticated;

-- ============================================================================
-- PART 2: App Analytics v1.0.0
-- ============================================================================

-- Create app_analytics table
CREATE TABLE public.app_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'app_created', 'app_updated', 'app_deleted', 'secret_regenerated',
    'login', 'token_exchange', 'token_refresh', 'token_revoke', 'error'
  )),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Analytics indexes
CREATE INDEX idx_app_analytics_app_time
  ON public.app_analytics(app_id, created_at DESC);

CREATE INDEX idx_app_analytics_event_type
  ON public.app_analytics(event_type);

CREATE INDEX idx_app_analytics_user
  ON public.app_analytics(user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX idx_app_analytics_created_at
  ON public.app_analytics(created_at DESC);

CREATE INDEX idx_app_analytics_app_event
  ON public.app_analytics(app_id, event_type);

-- Update app_usage_stats view
CREATE VIEW public.app_usage_stats AS
SELECT
  a.id as app_id,
  a.name as app_name,
  a.is_active,
  COUNT(DISTINCT an.user_id) FILTER (
    WHERE an.created_at > NOW() - INTERVAL '30 days'
    AND an.user_id IS NOT NULL
  ) as active_users_30d,
  COUNT(*) FILTER (
    WHERE an.event_type = 'login'
    AND an.created_at > NOW() - INTERVAL '30 days'
  ) as logins_30d,
  COUNT(*) FILTER (
    WHERE an.event_type IN ('token_exchange', 'token_refresh')
    AND an.created_at > NOW() - INTERVAL '30 days'
  ) as token_requests_30d,
  ROUND(
    100.0 *
    COUNT(*) FILTER (
      WHERE an.event_type = 'error'
      AND an.created_at > NOW() - INTERVAL '30 days'
    )::numeric /
    NULLIF(
      COUNT(*) FILTER (
        WHERE an.created_at > NOW() - INTERVAL '30 days'
      ),
      0
    ),
    2
  ) as error_rate_30d,
  MAX(an.created_at) FILTER (
    WHERE an.event_type IN ('login', 'token_exchange')
  ) as last_used
FROM public.apps a
LEFT JOIN public.app_analytics an ON a.id = an.app_id
GROUP BY a.id, a.name, a.is_active;

GRANT SELECT ON public.app_usage_stats TO authenticated;

-- Analytics functions
CREATE OR REPLACE FUNCTION public.get_login_trend(
  p_app_id UUID,
  p_days INT DEFAULT 30
)
RETURNS TABLE (
  date DATE,
  login_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(created_at) as date,
    COUNT(*) as login_count
  FROM public.app_analytics
  WHERE app_id = p_app_id
    AND event_type = 'login'
    AND created_at > NOW() - (p_days || ' days')::INTERVAL
  GROUP BY DATE(created_at)
  ORDER BY date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_login_trend(UUID, INT) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_top_users(
  p_app_id UUID,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  display_name TEXT,
  login_count BIGINT,
  last_login TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    an.user_id,
    p.email,
    p.display_name,
    COUNT(*) as login_count,
    MAX(an.created_at) as last_login
  FROM public.app_analytics an
  JOIN public.profiles p ON an.user_id = p.id
  WHERE an.app_id = p_app_id
    AND an.event_type = 'login'
    AND an.created_at > NOW() - INTERVAL '30 days'
    AND an.user_id IS NOT NULL
  GROUP BY an.user_id, p.email, p.display_name
  ORDER BY login_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_top_users(UUID, INT) TO authenticated;

-- Analytics RLS
ALTER TABLE public.app_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can insert analytics"
  ON public.app_analytics FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins can view all analytics"
  ON public.app_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Owners can view own app analytics"
  ON public.app_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.apps
      WHERE id = app_analytics.app_id
      AND owner_id = auth.uid()
    )
  );

-- ============================================================================
-- Verification
-- ============================================================================

SELECT '✅ Migration Complete!' as status;

-- Verify all objects
SELECT type, name FROM (
  SELECT 'Table' as type, table_name as name
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'apps', 'auth_codes', 'app_analytics')

  UNION ALL

  SELECT 'View', table_name
  FROM information_schema.views
  WHERE table_schema = 'public'

  UNION ALL

  SELECT 'Function', routine_name
  FROM information_schema.routines
  WHERE routine_schema = 'public'
) AS all_objects
ORDER BY type, name;

-- ============================================================================
-- Migration Complete! 🚀
-- Next Step: Create admin user with scripts/create-admin-supabase-cloud.sql
-- ============================================================================
