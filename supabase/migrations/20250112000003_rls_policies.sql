-- ============================================================================
-- Migration: Row Level Security (RLS) Policies
-- Created: 2025-01-12
-- Description: RLS 정책으로 데이터 접근 제어
-- ============================================================================

-- ============================================================================
-- 1. profiles 테이블 RLS
-- ============================================================================

-- RLS 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 정책 1: 본인 프로필 읽기
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- 정책 2: 본인 프로필 수정
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 정책 3: Admin은 모든 프로필 읽기
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 정책 4: Admin은 모든 프로필 수정
CREATE POLICY "Admins can update all profiles"
  ON public.profiles
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 정책 5: 신규 사용자는 자동으로 생성 (트리거가 처리, 정책 불필요)
-- 하지만 명시적으로 허용하지 않으면 INSERT 실패할 수 있으므로 Service Role 사용

COMMENT ON POLICY "Users can view own profile" ON public.profiles IS '사용자는 본인 프로필만 조회 가능';
COMMENT ON POLICY "Users can update own profile" ON public.profiles IS '사용자는 본인 프로필만 수정 가능';
COMMENT ON POLICY "Admins can view all profiles" ON public.profiles IS '관리자는 모든 프로필 조회 가능';
COMMENT ON POLICY "Admins can update all profiles" ON public.profiles IS '관리자는 모든 프로필 수정 가능';

-- ============================================================================
-- 2. apps 테이블 RLS
-- ============================================================================

-- RLS 활성화
ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;

-- 정책 1: 활성화된 앱은 누구나 조회 가능 (공개 앱 목록)
CREATE POLICY "Anyone can view active apps"
  ON public.apps
  FOR SELECT
  USING (is_active = true);

-- 정책 2: App owner는 자신의 앱 조회 가능 (비활성화 포함)
CREATE POLICY "Owners can view own apps"
  ON public.apps
  FOR SELECT
  USING (auth.uid() = owner_id);

-- 정책 3: App owner는 자신의 앱 수정 가능
CREATE POLICY "Owners can update own apps"
  ON public.apps
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- 정책 4: App owner는 자신의 앱 생성 가능
CREATE POLICY "App owners can create apps"
  ON public.apps
  FOR INSERT
  WITH CHECK (
    auth.uid() = owner_id AND
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('app_owner', 'admin')
    )
  );

-- 정책 5: App owner는 자신의 앱 삭제 가능
CREATE POLICY "Owners can delete own apps"
  ON public.apps
  FOR DELETE
  USING (auth.uid() = owner_id);

-- 정책 6: Admin은 모든 앱 관리 가능
CREATE POLICY "Admins can manage all apps"
  ON public.apps
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

COMMENT ON POLICY "Anyone can view active apps" ON public.apps IS '활성화된 앱은 공개 (앱 목록 조회용)';
COMMENT ON POLICY "Owners can view own apps" ON public.apps IS '소유자는 본인 앱 조회 (비활성화 포함)';
COMMENT ON POLICY "Owners can update own apps" ON public.apps IS '소유자는 본인 앱 수정';
COMMENT ON POLICY "App owners can create apps" ON public.apps IS 'app_owner 또는 admin 역할만 앱 생성 가능';
COMMENT ON POLICY "Owners can delete own apps" ON public.apps IS '소유자는 본인 앱 삭제';
COMMENT ON POLICY "Admins can manage all apps" ON public.apps IS '관리자는 모든 앱 관리';

-- ============================================================================
-- 3. auth_codes 테이블 RLS
-- ============================================================================

-- RLS 활성화
ALTER TABLE public.auth_codes ENABLE ROW LEVEL SECURITY;

-- auth_codes는 Service Role에서만 접근 (앱이 아닌 SSO 서버만)
-- 정책 없음 = Service Role만 접근 가능

-- 만약 API에서 사용자가 자신의 코드를 조회해야 한다면:
-- CREATE POLICY "Users can view own codes"
--   ON public.auth_codes
--   FOR SELECT
--   USING (auth.uid() = user_id);

-- 하지만 보안상 권장하지 않음 (일회용 코드는 서버만 관리)

COMMENT ON TABLE public.auth_codes IS 'RLS 정책 없음 → Service Role만 접근 가능 (보안)';

-- ============================================================================
-- 4. RLS 정책 테스트 헬퍼 함수
-- ============================================================================

-- 현재 사용자 역할 확인
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

COMMENT ON FUNCTION public.current_user_role IS '현재 로그인 사용자의 역할 반환 (테스트용)';

-- ============================================================================
-- 5. Grant 권한 설정
-- ============================================================================

-- authenticated 사용자에게 테이블 접근 권한 부여
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.apps TO authenticated;

-- Service Role에게 auth_codes 전체 권한
GRANT ALL ON public.auth_codes TO service_role;

-- Anonymous 사용자는 활성화된 앱 목록만 조회 가능
GRANT SELECT ON public.apps TO anon;

-- ============================================================================
-- Migration 완료
-- ============================================================================
-- RLS 정책 설정 완료!
-- 테스트 방법:
-- 1. 일반 사용자로 로그인 → 본인 프로필만 조회 가능
-- 2. Admin으로 로그인 → 모든 프로필 조회 가능
-- 3. App owner로 앱 생성 → 성공
-- 4. 일반 사용자로 앱 생성 → 실패 (403 Forbidden)
