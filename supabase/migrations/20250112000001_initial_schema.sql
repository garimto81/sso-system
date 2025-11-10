-- ============================================================================
-- Migration: Initial Schema for SSO System
-- Created: 2025-01-12
-- Description: Create profiles and apps tables for SSO central auth server
-- ============================================================================

-- ============================================================================
-- 1. profiles 테이블
-- ============================================================================
-- Supabase Auth의 auth.users를 확장하는 사용자 프로필 정보
-- 역할 기반 접근 제어 (user, app_owner, admin)

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user'
    CHECK (role IN ('user', 'app_owner', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스: email로 빠른 검색
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- 인덱스: role로 필터링 (admin, app_owner 조회 최적화)
CREATE INDEX idx_profiles_role ON public.profiles(role);

-- 코멘트 추가
COMMENT ON TABLE public.profiles IS '사용자 프로필 및 역할 정보';
COMMENT ON COLUMN public.profiles.id IS 'auth.users.id와 1:1 매핑';
COMMENT ON COLUMN public.profiles.role IS 'user: 일반 사용자, app_owner: 앱 소유자, admin: 시스템 관리자';

-- ============================================================================
-- 2. apps 테이블 (SSO 핵심!)
-- ============================================================================
-- SSO에 등록된 앱 목록
-- 각 앱마다 API Key, Secret 발급하여 Token Exchange 시 검증

CREATE TABLE IF NOT EXISTS public.apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,

  -- API 인증
  api_key TEXT NOT NULL UNIQUE,
  api_secret TEXT NOT NULL, -- bcrypt 해시로 저장

  -- 보안: 리다이렉트 URL 화이트리스트
  redirect_urls TEXT[] NOT NULL DEFAULT '{}',

  -- CORS 설정
  allowed_origins TEXT[] DEFAULT '{}',

  -- 인증 방식: shared_cookie | token_exchange | hybrid
  auth_method TEXT NOT NULL DEFAULT 'token_exchange'
    CHECK (auth_method IN ('shared_cookie', 'token_exchange', 'hybrid')),

  -- 앱 소유자 및 상태
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스: api_key로 빠른 검색 (Token Exchange 시)
CREATE INDEX idx_apps_api_key ON public.apps(api_key);

-- 인덱스: owner_id로 앱 목록 조회
CREATE INDEX idx_apps_owner_id ON public.apps(owner_id);

-- 인덱스: 활성화된 앱만 조회
CREATE INDEX idx_apps_is_active ON public.apps(is_active) WHERE is_active = true;

-- 코멘트 추가
COMMENT ON TABLE public.apps IS 'SSO에 등록된 앱 목록';
COMMENT ON COLUMN public.apps.api_key IS '앱 식별용 키 (공개 가능)';
COMMENT ON COLUMN public.apps.api_secret IS '앱 검증용 비밀 키 (bcrypt 해시)';
COMMENT ON COLUMN public.apps.redirect_urls IS '허용된 리다이렉트 URL 목록 (보안)';
COMMENT ON COLUMN public.apps.auth_method IS '인증 방식: shared_cookie (같은 도메인), token_exchange (다른 도메인), hybrid (자동 선택)';

-- ============================================================================
-- 3. updated_at 자동 업데이트 트리거
-- ============================================================================
-- updated_at 컬럼을 자동으로 현재 시간으로 업데이트

-- 트리거 함수 생성
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- profiles 테이블에 트리거 적용
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- apps 테이블에 트리거 적용
CREATE TRIGGER set_updated_at_apps
  BEFORE UPDATE ON public.apps
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 4. 신규 사용자 자동 프로필 생성 트리거
-- ============================================================================
-- auth.users에 새 사용자 생성 시 자동으로 profiles 레코드 생성

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- auth.users에 트리거 적용
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- Migration 완료
-- ============================================================================
-- 다음 마이그레이션: 20250112000002_auth_codes_table.sql
