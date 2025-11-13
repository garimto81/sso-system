-- ============================================================================
-- Supabase Cloud COMPLETE RESET - v1.0.0 (Fixed)
-- Created: 2025-01-12
-- Description: 모든 객체 완전 삭제 후 재생성
-- ============================================================================
-- ⚠️  WARNING: 이 스크립트는 public 스키마의 모든 것을 삭제합니다!
-- Run this in Supabase Dashboard SQL Editor:
-- https://supabase.com/dashboard/project/dqkghhlnnskjfwntdtor/sql/new
-- ============================================================================

-- ============================================================================
-- Step 1: PUBLIC 스키마 완전 초기화
-- ============================================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all tables
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;

    -- Drop all views
    FOR r IN (SELECT table_name FROM information_schema.views WHERE table_schema = 'public') LOOP
        EXECUTE 'DROP VIEW IF EXISTS public.' || quote_ident(r.table_name) || ' CASCADE';
    END LOOP;

    -- Drop all functions
    FOR r IN (SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public') LOOP
        EXECUTE 'DROP FUNCTION IF EXISTS public.' || quote_ident(r.routine_name) || ' CASCADE';
    END LOOP;

    -- Drop all triggers on auth.users
    FOR r IN (SELECT trigger_name FROM information_schema.triggers
              WHERE trigger_schema = 'auth' AND event_object_table = 'users'
              AND trigger_name NOT LIKE 'pg_%') LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(r.trigger_name) || ' ON auth.users CASCADE';
    END LOOP;
END $$;

-- 최종 확인
SELECT 'Tables remaining: ' || COUNT(*)::TEXT as status FROM pg_tables WHERE schemaname = 'public';

-- ============================================================================
-- Step 2: CREATE profiles 테이블
-- ============================================================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'app_owner', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_role ON public.profiles(role);

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
  auth_method TEXT NOT NULL DEFAULT 'token_exchange' CHECK (auth_method IN ('shared_cookie', 'token_exchange', 'hybrid')),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_apps_api_key ON public.apps(api_key);
CREATE INDEX idx_apps_owner_id ON public.apps(owner_id);
CREATE INDEX idx_apps_is_active ON public.apps(is_active) WHERE is_active = true;
CREATE INDEX idx_apps_owner_active ON public.apps(owner_id, is_active);

ALTER TABLE public.apps ADD CONSTRAINT check_redirect_urls_not_empty CHECK (array_length(redirect_urls, 1) > 0);

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
CREATE INDEX idx_auth_codes_validation ON public.auth_codes(code, app_id, expires_at);
CREATE INDEX idx_auth_codes_user_app ON public.auth_codes(user_id, app_id, expires_at);

ALTER TABLE public.auth_codes ADD CONSTRAINT check_expires_future CHECK (expires_at > created_at);

-- ============================================================================
-- Step 5: CREATE Functions & Triggers
-- ============================================================================

CREATE FUNCTION public.handle_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_apps
  BEFORE UPDATE ON public.apps FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS NULL THEN
    RAISE EXCEPTION 'User email cannot be null';
  END IF;
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email))
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email, updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE FUNCTION public.cleanup_expired_auth_codes() RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.auth_codes WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

CREATE FUNCTION public.check_auth_code_rate_limit() RETURNS TRIGGER AS $$
DECLARE
  recent_codes INTEGER;
BEGIN
  SELECT COUNT(*) INTO recent_codes FROM public.auth_codes
  WHERE user_id = NEW.user_id AND created_at > NOW() - INTERVAL '1 minute';
  IF recent_codes >= 10 THEN
    RAISE EXCEPTION 'Rate limit exceeded: too many auth codes (max 10 per minute)';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auth_code_rate_limit
  BEFORE INSERT ON public.auth_codes FOR EACH ROW EXECUTE FUNCTION public.check_auth_code_rate_limit();

-- ============================================================================
-- Step 6: Row Level Security (RLS)
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Anyone can view active apps" ON public.apps FOR SELECT USING (is_active = true);
CREATE POLICY "Owners can view own apps" ON public.apps FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Owners can update own apps" ON public.apps FOR UPDATE USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "App owners can create apps" ON public.apps FOR INSERT WITH CHECK (auth.uid() = owner_id AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('app_owner', 'admin')));
CREATE POLICY "Owners can delete own apps" ON public.apps FOR DELETE USING (auth.uid() = owner_id);
CREATE POLICY "Admins can manage all apps" ON public.apps FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Service role only" ON public.auth_codes FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- Step 7: Views (v1.0.0)
-- ============================================================================

CREATE VIEW public.apps_public AS
SELECT id, name, description, api_key, redirect_urls, allowed_origins, auth_method, owner_id, is_active, created_at, updated_at
FROM public.apps WHERE is_active = true;

GRANT SELECT ON public.apps_public TO anon, authenticated;

CREATE VIEW public.auth_code_stats AS
SELECT COUNT(*) as total_codes, COUNT(*) FILTER (WHERE expires_at > NOW()) as active_codes,
       COUNT(*) FILTER (WHERE expires_at <= NOW()) as expired_codes, MAX(created_at) as last_generated
FROM public.auth_codes;

GRANT SELECT ON public.auth_code_stats TO authenticated;

CREATE VIEW public.app_usage_stats AS
SELECT a.id, a.name, COUNT(ac.code) as total_auth_codes, MAX(ac.created_at) as last_used
FROM public.apps a LEFT JOIN public.auth_codes ac ON a.id = ac.app_id
GROUP BY a.id, a.name ORDER BY total_auth_codes DESC;

GRANT SELECT ON public.app_usage_stats TO authenticated;

-- ============================================================================
-- Step 8: 최종 검증
-- ============================================================================

SELECT '✅ Migration Complete!' as status;

SELECT type, name FROM (
  SELECT 'Function' as type, routine_name as name FROM information_schema.routines WHERE routine_schema = 'public'
  UNION ALL
  SELECT 'Index', indexname FROM pg_indexes WHERE schemaname = 'public'
  UNION ALL
  SELECT 'Table', table_name FROM information_schema.tables WHERE table_schema = 'public'
  UNION ALL
  SELECT 'Trigger', trigger_name FROM information_schema.triggers WHERE trigger_schema = 'public' OR (trigger_schema = 'auth' AND trigger_name = 'on_auth_user_created')
  UNION ALL
  SELECT 'View', table_name FROM information_schema.views WHERE table_schema = 'public'
) AS all_objects
ORDER BY type, name;

-- Expected: 29 rows (4 Functions, 15 Indexes, 3 Tables, 4 Triggers, 3 Views)

-- ============================================================================
-- 🚀 SSO System v1.0.0 - Production Ready!
-- ============================================================================
