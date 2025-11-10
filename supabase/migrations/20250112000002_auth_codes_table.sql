-- ============================================================================
-- Migration: Auth Codes Table for Token Exchange
-- Created: 2025-01-12
-- Description: 일회용 인증 코드 테이블 (OAuth 2.0 Authorization Code Flow)
-- ============================================================================

-- ============================================================================
-- 1. auth_codes 테이블
-- ============================================================================
-- Token Exchange 메커니즘에서 사용하는 일회용 코드
--
-- Flow:
-- 1. 사용자가 SSO에서 로그인
-- 2. SSO 서버가 일회용 코드 생성 (예: abc123)
-- 3. auth_codes 테이블에 저장 (5분 만료)
-- 4. 앱의 redirect_uri로 코드 전달
-- 5. 앱 백엔드가 코드 → JWT 교환 요청
-- 6. SSO 서버가 코드 검증 후 삭제 (일회용!)
-- 7. JWT 발급

CREATE TABLE IF NOT EXISTS public.auth_codes (
  code TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id UUID NOT NULL REFERENCES public.apps(id) ON DELETE CASCADE,

  -- 5분 후 자동 만료
  expires_at TIMESTAMPTZ NOT NULL,

  -- CSRF 방어용 state (선택적)
  state TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스: expires_at으로 만료된 코드 빠르게 조회/삭제
CREATE INDEX idx_auth_codes_expires ON public.auth_codes(expires_at);

-- 인덱스: user_id로 사용자별 코드 조회
CREATE INDEX idx_auth_codes_user_id ON public.auth_codes(user_id);

-- 인덱스: app_id로 앱별 코드 조회
CREATE INDEX idx_auth_codes_app_id ON public.auth_codes(app_id);

-- 코멘트 추가
COMMENT ON TABLE public.auth_codes IS 'Token Exchange용 일회용 인증 코드 (OAuth 2.0 Authorization Code)';
COMMENT ON COLUMN public.auth_codes.code IS '일회용 코드 (예: crypto.randomBytes(32).toString("hex"))';
COMMENT ON COLUMN public.auth_codes.expires_at IS '만료 시간 (기본 5분)';
COMMENT ON COLUMN public.auth_codes.state IS 'CSRF 방어용 state 파라미터 (선택적)';

-- ============================================================================
-- 2. 만료된 코드 자동 삭제 함수
-- ============================================================================
-- 주기적으로 실행하여 만료된 코드 정리

CREATE OR REPLACE FUNCTION public.cleanup_expired_auth_codes()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.auth_codes
  WHERE expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.cleanup_expired_auth_codes IS '만료된 auth_codes 삭제 (크론잡 또는 pg_cron으로 주기 실행)';

-- ============================================================================
-- 3. (선택) pg_cron으로 자동 정리 스케줄링
-- ============================================================================
-- Supabase Pro 플랜에서 pg_cron 사용 가능
-- 무료 플랜에서는 API 레벨에서 정리하거나 수동 실행

-- 5분마다 만료된 코드 삭제 (Pro 플랜)
-- SELECT cron.schedule(
--   'cleanup-expired-auth-codes',
--   '*/5 * * * *', -- Every 5 minutes
--   $$SELECT public.cleanup_expired_auth_codes();$$
-- );

-- 무료 플랜에서는 API에서 주기적 호출:
-- setInterval(() => {
--   supabase.rpc('cleanup_expired_auth_codes');
-- }, 5 * 60 * 1000); // 5분

-- ============================================================================
-- Migration 완료
-- ============================================================================
-- 다음 마이그레이션: 20250112000003_rls_policies.sql
