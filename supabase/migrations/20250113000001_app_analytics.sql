-- ============================================================================
-- Migration: app_analytics table and analytics infrastructure
-- Created: 2025-01-13
-- Version: 1.0.0
-- Description: Analytics and audit logging for SSO Admin Dashboard
-- ============================================================================

-- ============================================================================
-- Step 1: Create app_analytics table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.app_analytics (
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

COMMENT ON TABLE public.app_analytics IS 'Analytics and audit log for app usage and admin actions';
COMMENT ON COLUMN public.app_analytics.event_type IS 'Type of event: admin actions (app_created, app_updated, app_deleted, secret_regenerated), auth events (login, token_exchange, token_refresh, token_revoke), errors (error)';
COMMENT ON COLUMN public.app_analytics.user_id IS 'User who triggered the event (nullable for anonymous or system events)';
COMMENT ON COLUMN public.app_analytics.ip_address IS 'IP address of the request (for security audit)';
COMMENT ON COLUMN public.app_analytics.metadata IS 'Additional event-specific data (JSON)';

-- ============================================================================
-- Step 2: Create performance indexes
-- ============================================================================

-- Primary index for querying app analytics by time
CREATE INDEX idx_app_analytics_app_time
  ON public.app_analytics(app_id, created_at DESC);

-- Index for filtering by event type
CREATE INDEX idx_app_analytics_event_type
  ON public.app_analytics(event_type);

-- Index for user-specific queries (only when user_id is present)
CREATE INDEX idx_app_analytics_user
  ON public.app_analytics(user_id)
  WHERE user_id IS NOT NULL;

-- Index for time-based queries
CREATE INDEX idx_app_analytics_created_at
  ON public.app_analytics(created_at DESC);

-- Composite index for common analytics queries (app + event + time)
CREATE INDEX idx_app_analytics_app_event
  ON public.app_analytics(app_id, event_type);

-- ============================================================================
-- Step 3: Update app_usage_stats view
-- ============================================================================

-- Drop existing view and recreate with analytics data
DROP VIEW IF EXISTS public.app_usage_stats CASCADE;

CREATE VIEW public.app_usage_stats AS
SELECT
  a.id as app_id,
  a.name as app_name,
  a.is_active,

  -- 30-day metrics
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

  -- Error rate (percentage)
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

  -- Last activity timestamp
  MAX(an.created_at) FILTER (
    WHERE an.event_type IN ('login', 'token_exchange')
  ) as last_used

FROM public.apps a
LEFT JOIN public.app_analytics an ON a.id = an.app_id
GROUP BY a.id, a.name, a.is_active;

GRANT SELECT ON public.app_usage_stats TO authenticated;

COMMENT ON VIEW public.app_usage_stats IS 'Aggregated usage statistics per app (30-day window)';

-- ============================================================================
-- Step 4: Create get_login_trend function
-- ============================================================================

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

COMMENT ON FUNCTION public.get_login_trend IS 'Get daily login counts for an app over specified period (for charts)';

-- ============================================================================
-- Step 5: Create get_top_users function
-- ============================================================================

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

COMMENT ON FUNCTION public.get_top_users IS 'Get most active users for an app (30-day window)';

-- ============================================================================
-- Step 6: Enable RLS and create policies
-- ============================================================================

ALTER TABLE public.app_analytics ENABLE ROW LEVEL SECURITY;

-- Service role can insert analytics (backend writes)
CREATE POLICY "Service role can insert analytics"
  ON public.app_analytics
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Admins can view all analytics
CREATE POLICY "Admins can view all analytics"
  ON public.app_analytics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- App owners can view their own app analytics
CREATE POLICY "Owners can view own app analytics"
  ON public.app_analytics
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.apps
      WHERE id = app_analytics.app_id
      AND owner_id = auth.uid()
    )
  );

-- ============================================================================
-- Step 7: Verification Query
-- ============================================================================

SELECT 'Migration complete: app_analytics table created' as status;

-- Verify all objects created
SELECT 'Table' as type, 'app_analytics' as name
UNION ALL
SELECT 'Index', 'idx_app_analytics_app_time'
UNION ALL
SELECT 'Index', 'idx_app_analytics_event_type'
UNION ALL
SELECT 'Index', 'idx_app_analytics_user'
UNION ALL
SELECT 'Index', 'idx_app_analytics_created_at'
UNION ALL
SELECT 'Index', 'idx_app_analytics_app_event'
UNION ALL
SELECT 'View', 'app_usage_stats (updated)'
UNION ALL
SELECT 'Function', 'get_login_trend'
UNION ALL
SELECT 'Function', 'get_top_users'
UNION ALL
SELECT 'Policy', 'Service role can insert analytics'
UNION ALL
SELECT 'Policy', 'Admins can view all analytics'
UNION ALL
SELECT 'Policy', 'Owners can view own app analytics'
ORDER BY type, name;

-- ============================================================================
-- Analytics Migration Complete! v1.0.0
-- ============================================================================
-- Expected result: 12 rows (5 Indexes, 2 Functions, 3 Policies, 1 Table, 1 View)
-- Next: Use analytics.js utility to record events
-- ============================================================================
