/**
 * Analytics Event Recording Utility
 *
 * Purpose: Record analytics events for app usage, admin actions, and errors
 *
 * Event Types:
 * - Admin Actions: app_created, app_updated, app_deleted, secret_regenerated
 * - Auth Events: login, token_exchange, token_refresh, token_revoke
 * - Errors: error
 *
 * Usage:
 *   import { recordAnalyticsEvent, getAppAnalytics, getDashboardStats } from './analytics.js';
 *
 *   // Record event
 *   await recordAnalyticsEvent('app-uuid', 'login', 'user-uuid', { ip: req.ip }, req);
 *
 *   // Get analytics
 *   const analytics = await getAppAnalytics('app-uuid', 30);
 */

import { supabaseAdmin } from './supabase.js';
import { logger } from './logger.js';

/**
 * Valid event types for analytics
 */
const VALID_EVENT_TYPES = [
  'app_created',
  'app_updated',
  'app_deleted',
  'secret_regenerated',
  'login',
  'token_exchange',
  'token_refresh',
  'token_revoke',
  'error',
];

/**
 * Record Analytics Event
 *
 * @param {string} appId - App UUID
 * @param {string} eventType - Event type (see VALID_EVENT_TYPES)
 * @param {string|null} userId - User UUID (optional)
 * @param {object} metadata - Additional event data (optional)
 * @param {object} req - Express request object (optional, for extracting IP and User-Agent)
 * @returns {Promise<void>}
 *
 * Note: Errors are logged but not thrown - analytics failures shouldn't break main application flow
 */
export async function recordAnalyticsEvent(
  appId,
  eventType,
  userId = null,
  metadata = {},
  req = null
) {
  try {
    // Validate event type
    if (!VALID_EVENT_TYPES.includes(eventType)) {
      logger.error('[Analytics] Invalid event type', {
        eventType,
        appId,
        validTypes: VALID_EVENT_TYPES,
      });
      return;
    }

    // Validate app ID
    if (!appId || typeof appId !== 'string') {
      logger.error('[Analytics] Invalid app ID', { appId, eventType });
      return;
    }

    // Extract IP and User-Agent from request if provided
    let ipAddress = null;
    let userAgent = null;

    if (req) {
      // Get IP address (handle X-Forwarded-For header for proxies)
      ipAddress =
        req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.ip ||
        req.connection?.remoteAddress ||
        null;

      // Get User-Agent
      userAgent = req.headers['user-agent'] || null;
    }

    // Insert analytics event
    const { error } = await supabaseAdmin.from('app_analytics').insert({
      app_id: appId,
      event_type: eventType,
      user_id: userId,
      ip_address: ipAddress,
      user_agent: userAgent,
      metadata: metadata || {},
      created_at: new Date().toISOString(),
    });

    if (error) {
      logger.error('[Analytics] Failed to record event', {
        error: error.message,
        code: error.code,
        appId,
        eventType,
        userId,
      });
      return;
    }

    // Log successful recording (debug level to avoid noise)
    logger.debug('[Analytics] Event recorded', {
      appId,
      eventType,
      userId,
      hasMetadata: Object.keys(metadata || {}).length > 0,
    });
  } catch (err) {
    // Catch unexpected errors
    logger.error('[Analytics] Unexpected error', {
      error: err.message,
      stack: err.stack,
      appId,
      eventType,
    });
  }
}

/**
 * Get App Analytics
 *
 * Retrieve analytics data for a specific app
 *
 * @param {string} appId - App UUID
 * @param {number} days - Number of days to look back (default: 30)
 * @returns {Promise<object>} Analytics data
 */
export async function getAppAnalytics(appId, days = 30) {
  try {
    // Validate inputs
    if (!appId || typeof appId !== 'string') {
      throw new Error('Invalid app ID');
    }

    const daysInt = parseInt(days);
    if (isNaN(daysInt) || daysInt < 1 || daysInt > 365) {
      throw new Error('Days must be between 1 and 365');
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysInt);

    // Fetch metrics from view
    const { data: statsData, error: statsError } = await supabaseAdmin
      .from('app_usage_stats')
      .select('*')
      .eq('app_id', appId)
      .single();

    if (statsError && statsError.code !== 'PGRST116') {
      // PGRST116 = no rows returned
      logger.error('[Analytics] Failed to fetch stats', {
        error: statsError.message,
        appId,
      });
    }

    // Fetch login trend using stored function
    const { data: loginTrend, error: trendError } = await supabaseAdmin.rpc(
      'get_login_trend',
      {
        p_app_id: appId,
        p_days: daysInt,
      }
    );

    if (trendError) {
      logger.error('[Analytics] Failed to fetch login trend', {
        error: trendError.message,
        appId,
      });
    }

    // Fetch top users using stored function
    const { data: topUsers, error: usersError } = await supabaseAdmin.rpc(
      'get_top_users',
      {
        p_app_id: appId,
        p_limit: 10,
      }
    );

    if (usersError) {
      logger.error('[Analytics] Failed to fetch top users', {
        error: usersError.message,
        appId,
      });
    }

    // Fetch recent errors
    const { data: recentErrors, error: errorsError } = await supabaseAdmin
      .from('app_analytics')
      .select(
        `
        created_at,
        event_type,
        user_id,
        metadata,
        profiles:user_id (email, display_name)
      `
      )
      .eq('app_id', appId)
      .eq('event_type', 'error')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(50);

    if (errorsError) {
      logger.error('[Analytics] Failed to fetch recent errors', {
        error: errorsError.message,
        appId,
      });
    }

    // Calculate total logins
    const totalLogins = statsData?.logins_30d || 0;
    const avgLoginsPerDay =
      totalLogins > 0 && daysInt > 0
        ? Math.round((totalLogins / daysInt) * 10) / 10
        : 0;

    // Format response
    return {
      period: `${daysInt}d`,
      metrics: {
        total_logins: totalLogins,
        active_users: statsData?.active_users_30d || 0,
        token_requests: statsData?.token_requests_30d || 0,
        error_rate: parseFloat(statsData?.error_rate_30d || 0),
        avg_logins_per_day: avgLoginsPerDay,
      },
      login_trend: loginTrend || [],
      top_users: topUsers || [],
      recent_errors:
        recentErrors?.map((err) => ({
          timestamp: err.created_at,
          error_type: err.metadata?.error_type || 'unknown',
          user_id: err.user_id,
          user_email: err.profiles?.email || null,
          metadata: err.metadata || {},
        })) || [],
    };
  } catch (err) {
    logger.error('[Analytics] Failed to get app analytics', {
      error: err.message,
      stack: err.stack,
      appId,
      days,
    });
    throw err;
  }
}

/**
 * Get Dashboard Statistics
 *
 * Retrieve global dashboard statistics across all apps
 *
 * @returns {Promise<object>} Dashboard data
 */
export async function getDashboardStats() {
  try {
    // Get total and active apps count
    const { data: appsData, error: appsError } = await supabaseAdmin
      .from('apps')
      .select('id, name, is_active');

    if (appsError) {
      throw new Error(`Failed to fetch apps: ${appsError.message}`);
    }

    const totalApps = appsData?.length || 0;
    const activeApps = appsData?.filter((app) => app.is_active).length || 0;

    // Get total users count
    const { count: totalUsers, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (usersError) {
      logger.error('[Analytics] Failed to fetch users count', {
        error: usersError.message,
      });
    }

    // Get today's login count
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count: loginsToday, error: todayError } = await supabaseAdmin
      .from('app_analytics')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'login')
      .gte('created_at', today.toISOString());

    if (todayError) {
      logger.error('[Analytics] Failed to fetch today logins', {
        error: todayError.message,
      });
    }

    // Get 30-day login count
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: logins30d, error: monthError } = await supabaseAdmin
      .from('app_analytics')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'login')
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (monthError) {
      logger.error('[Analytics] Failed to fetch 30d logins', {
        error: monthError.message,
      });
    }

    // Get top apps by login count
    const { data: topAppsData, error: topAppsError } = await supabaseAdmin
      .from('app_usage_stats')
      .select('app_id, app_name, logins_30d, active_users_30d')
      .order('logins_30d', { ascending: false })
      .limit(10);

    if (topAppsError) {
      logger.error('[Analytics] Failed to fetch top apps', {
        error: topAppsError.message,
      });
    }

    // Get recent activity
    const { data: recentActivity, error: activityError } = await supabaseAdmin
      .from('app_analytics')
      .select(
        `
        created_at,
        event_type,
        app_id,
        user_id,
        apps:app_id (name),
        profiles:user_id (email)
      `
      )
      .in('event_type', [
        'app_created',
        'app_updated',
        'app_deleted',
        'secret_regenerated',
        'login',
      ])
      .order('created_at', { ascending: false })
      .limit(20);

    if (activityError) {
      logger.error('[Analytics] Failed to fetch recent activity', {
        error: activityError.message,
      });
    }

    // Format response
    return {
      summary: {
        total_apps: totalApps,
        active_apps: activeApps,
        total_users: totalUsers || 0,
        logins_today: loginsToday || 0,
        logins_30d: logins30d || 0,
      },
      top_apps:
        topAppsData?.map((app) => ({
          app_id: app.app_id,
          app_name: app.app_name,
          login_count: app.logins_30d || 0,
          active_users: app.active_users_30d || 0,
        })) || [],
      recent_activity:
        recentActivity?.map((activity) => ({
          type: activity.event_type,
          app_name: activity.apps?.name || 'Unknown',
          user: activity.profiles?.email || 'System',
          timestamp: activity.created_at,
        })) || [],
    };
  } catch (err) {
    logger.error('[Analytics] Failed to get dashboard stats', {
      error: err.message,
      stack: err.stack,
    });
    throw err;
  }
}

export default recordAnalyticsEvent;
