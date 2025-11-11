/**
 * Tests for Analytics Utility
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import {
  recordAnalyticsEvent,
  getAppAnalytics,
  getDashboardStats,
} from '../analytics.js';
import { supabaseAdmin } from '../supabase.js';
import { logger } from '../logger.js';

// Mock dependencies
jest.mock('../supabase.js');
jest.mock('../logger.js');

describe('recordAnalyticsEvent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully record an analytics event', async () => {
    const mockInsert = jest.fn().mockResolvedValue({
      data: { id: 'event-uuid' },
      error: null,
    });

    supabaseAdmin.from = jest.fn().mockReturnValue({
      insert: mockInsert,
    });

    await recordAnalyticsEvent('app-uuid', 'login', 'user-uuid', {
      source: 'web',
    });

    expect(supabaseAdmin.from).toHaveBeenCalledWith('app_analytics');
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        app_id: 'app-uuid',
        event_type: 'login',
        user_id: 'user-uuid',
        metadata: { source: 'web' },
      })
    );
  });

  it('should extract IP and User-Agent from request object', async () => {
    const mockInsert = jest.fn().mockResolvedValue({
      data: { id: 'event-uuid' },
      error: null,
    });

    supabaseAdmin.from = jest.fn().mockReturnValue({
      insert: mockInsert,
    });

    const mockReq = {
      ip: '192.168.1.1',
      headers: {
        'user-agent': 'Mozilla/5.0 Test Browser',
      },
    };

    await recordAnalyticsEvent(
      'app-uuid',
      'login',
      'user-uuid',
      {},
      mockReq
    );

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0 Test Browser',
      })
    );
  });

  it('should handle X-Forwarded-For header for proxied requests', async () => {
    const mockInsert = jest.fn().mockResolvedValue({
      data: { id: 'event-uuid' },
      error: null,
    });

    supabaseAdmin.from = jest.fn().mockReturnValue({
      insert: mockInsert,
    });

    const mockReq = {
      ip: '10.0.0.1',
      headers: {
        'x-forwarded-for': '203.0.113.1, 198.51.100.1',
        'user-agent': 'Mozilla/5.0',
      },
    };

    await recordAnalyticsEvent('app-uuid', 'login', null, {}, mockReq);

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        ip_address: '203.0.113.1', // First IP from X-Forwarded-For
      })
    );
  });

  it('should work without request object', async () => {
    const mockInsert = jest.fn().mockResolvedValue({
      data: { id: 'event-uuid' },
      error: null,
    });

    supabaseAdmin.from = jest.fn().mockReturnValue({
      insert: mockInsert,
    });

    await recordAnalyticsEvent('app-uuid', 'app_created', 'admin-uuid');

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        app_id: 'app-uuid',
        event_type: 'app_created',
        user_id: 'admin-uuid',
        ip_address: null,
        user_agent: null,
      })
    );
  });

  it('should handle null userId gracefully', async () => {
    const mockInsert = jest.fn().mockResolvedValue({
      data: { id: 'event-uuid' },
      error: null,
    });

    supabaseAdmin.from = jest.fn().mockReturnValue({
      insert: mockInsert,
    });

    await recordAnalyticsEvent('app-uuid', 'token_exchange', null);

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: null,
      })
    );
  });

  it('should log error but not throw on database failure', async () => {
    const mockInsert = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'Database error', code: '23505' },
    });

    supabaseAdmin.from = jest.fn().mockReturnValue({
      insert: mockInsert,
    });

    // Should not throw
    await expect(
      recordAnalyticsEvent('app-uuid', 'login', 'user-uuid')
    ).resolves.not.toThrow();

    expect(logger.error).toHaveBeenCalledWith(
      '[Analytics] Failed to record event',
      expect.objectContaining({
        error: 'Database error',
        code: '23505',
      })
    );
  });

  it('should validate event type and reject invalid types', async () => {
    await recordAnalyticsEvent('app-uuid', 'invalid_event', 'user-uuid');

    expect(logger.error).toHaveBeenCalledWith(
      '[Analytics] Invalid event type',
      expect.objectContaining({
        eventType: 'invalid_event',
      })
    );

    expect(supabaseAdmin.from).not.toHaveBeenCalled();
  });

  it('should validate app ID', async () => {
    await recordAnalyticsEvent(null, 'login', 'user-uuid');

    expect(logger.error).toHaveBeenCalledWith(
      '[Analytics] Invalid app ID',
      expect.objectContaining({
        appId: null,
      })
    );

    expect(supabaseAdmin.from).not.toHaveBeenCalled();
  });

  it('should handle unexpected errors gracefully', async () => {
    supabaseAdmin.from = jest.fn().mockImplementation(() => {
      throw new Error('Unexpected error');
    });

    await expect(
      recordAnalyticsEvent('app-uuid', 'login', 'user-uuid')
    ).resolves.not.toThrow();

    expect(logger.error).toHaveBeenCalledWith(
      '[Analytics] Unexpected error',
      expect.objectContaining({
        error: 'Unexpected error',
      })
    );
  });

  it('should accept all valid event types', async () => {
    const validEventTypes = [
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

    const mockInsert = jest.fn().mockResolvedValue({
      data: { id: 'event-uuid' },
      error: null,
    });

    supabaseAdmin.from = jest.fn().mockReturnValue({
      insert: mockInsert,
    });

    for (const eventType of validEventTypes) {
      await recordAnalyticsEvent('app-uuid', eventType, 'user-uuid');
      expect(mockInsert).toHaveBeenCalled();
      jest.clearAllMocks();
    }
  });

  it('should default metadata to empty object if not provided', async () => {
    const mockInsert = jest.fn().mockResolvedValue({
      data: { id: 'event-uuid' },
      error: null,
    });

    supabaseAdmin.from = jest.fn().mockReturnValue({
      insert: mockInsert,
    });

    await recordAnalyticsEvent('app-uuid', 'login', 'user-uuid');

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: {},
      })
    );
  });
});

describe('getAppAnalytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch and return analytics data for an app', async () => {
    const mockStats = {
      app_id: 'app-uuid',
      app_name: 'Test App',
      active_users_30d: 100,
      logins_30d: 500,
      token_requests_30d: 300,
      error_rate_30d: 1.5,
    };

    const mockLoginTrend = [
      { date: '2025-01-01', login_count: 10 },
      { date: '2025-01-02', login_count: 15 },
    ];

    const mockTopUsers = [
      {
        user_id: 'user1',
        email: 'user1@test.com',
        display_name: 'User One',
        login_count: 50,
        last_login: '2025-01-12T10:00:00Z',
      },
    ];

    const mockErrors = [
      {
        created_at: '2025-01-12T09:00:00Z',
        event_type: 'error',
        user_id: 'user1',
        metadata: { error_type: 'token_invalid' },
        profiles: { email: 'user1@test.com', display_name: 'User One' },
      },
    ];

    // Mock chain for stats
    supabaseAdmin.from = jest
      .fn()
      .mockImplementation((table) => {
        if (table === 'app_usage_stats') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                single: jest
                  .fn()
                  .mockResolvedValue({ data: mockStats, error: null }),
              }),
            }),
          };
        }
        if (table === 'app_analytics') {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnThis(),
              gte: jest.fn().mockReturnThis(),
              order: jest.fn().mockReturnThis(),
              limit: jest
                .fn()
                .mockResolvedValue({ data: mockErrors, error: null }),
            }),
          };
        }
      });

    supabaseAdmin.rpc = jest.fn().mockImplementation((funcName) => {
      if (funcName === 'get_login_trend') {
        return Promise.resolve({ data: mockLoginTrend, error: null });
      }
      if (funcName === 'get_top_users') {
        return Promise.resolve({ data: mockTopUsers, error: null });
      }
    });

    const result = await getAppAnalytics('app-uuid', 30);

    expect(result).toEqual({
      period: '30d',
      metrics: {
        total_logins: 500,
        active_users: 100,
        token_requests: 300,
        error_rate: 1.5,
        avg_logins_per_day: 16.7,
      },
      login_trend: mockLoginTrend,
      top_users: mockTopUsers,
      recent_errors: [
        {
          timestamp: '2025-01-12T09:00:00Z',
          error_type: 'token_invalid',
          user_id: 'user1',
          user_email: 'user1@test.com',
          metadata: { error_type: 'token_invalid' },
        },
      ],
    });

    expect(supabaseAdmin.rpc).toHaveBeenCalledWith('get_login_trend', {
      p_app_id: 'app-uuid',
      p_days: 30,
    });

    expect(supabaseAdmin.rpc).toHaveBeenCalledWith('get_top_users', {
      p_app_id: 'app-uuid',
      p_limit: 10,
    });
  });

  it('should handle different time periods', async () => {
    supabaseAdmin.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    });

    supabaseAdmin.rpc = jest
      .fn()
      .mockResolvedValue({ data: [], error: null });

    await getAppAnalytics('app-uuid', 7);

    expect(supabaseAdmin.rpc).toHaveBeenCalledWith(
      'get_login_trend',
      expect.objectContaining({ p_days: 7 })
    );
  });

  it('should handle no data scenario', async () => {
    supabaseAdmin.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { code: 'PGRST116' },
          }),
        }),
      }),
    });

    supabaseAdmin.rpc = jest
      .fn()
      .mockResolvedValue({ data: [], error: null });

    const result = await getAppAnalytics('app-uuid', 30);

    expect(result).toEqual({
      period: '30d',
      metrics: {
        total_logins: 0,
        active_users: 0,
        token_requests: 0,
        error_rate: 0,
        avg_logins_per_day: 0,
      },
      login_trend: [],
      top_users: [],
      recent_errors: [],
    });
  });

  it('should validate app ID', async () => {
    await expect(getAppAnalytics(null, 30)).rejects.toThrow('Invalid app ID');
    await expect(getAppAnalytics('', 30)).rejects.toThrow('Invalid app ID');
  });

  it('should validate days parameter', async () => {
    await expect(getAppAnalytics('app-uuid', 0)).rejects.toThrow(
      'Days must be between 1 and 365'
    );
    await expect(getAppAnalytics('app-uuid', 400)).rejects.toThrow(
      'Days must be between 1 and 365'
    );
    await expect(getAppAnalytics('app-uuid', 'invalid')).rejects.toThrow(
      'Days must be between 1 and 365'
    );
  });

  it('should log errors when database queries fail', async () => {
    supabaseAdmin.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      }),
    });

    supabaseAdmin.rpc = jest.fn().mockResolvedValue({
      data: null,
      error: { message: 'RPC error' },
    });

    const result = await getAppAnalytics('app-uuid', 30);

    expect(logger.error).toHaveBeenCalledWith(
      '[Analytics] Failed to fetch login trend',
      expect.anything()
    );

    expect(logger.error).toHaveBeenCalledWith(
      '[Analytics] Failed to fetch top users',
      expect.anything()
    );

    // Should still return data structure even with errors
    expect(result).toHaveProperty('metrics');
    expect(result).toHaveProperty('login_trend');
  });

  it('should calculate avg_logins_per_day correctly', async () => {
    const mockStats = {
      logins_30d: 60,
      active_users_30d: 10,
      token_requests_30d: 30,
      error_rate_30d: 0,
    };

    supabaseAdmin.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          single: jest
            .fn()
            .mockResolvedValue({ data: mockStats, error: null }),
        }),
      }),
    });

    supabaseAdmin.rpc = jest
      .fn()
      .mockResolvedValue({ data: [], error: null });

    const result = await getAppAnalytics('app-uuid', 10);

    expect(result.metrics.avg_logins_per_day).toBe(6); // 60 logins / 10 days = 6
  });
});

describe('getDashboardStats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch and return dashboard statistics', async () => {
    const mockApps = [
      { id: 'app1', name: 'App 1', is_active: true },
      { id: 'app2', name: 'App 2', is_active: true },
      { id: 'app3', name: 'App 3', is_active: false },
    ];

    const mockTopApps = [
      {
        app_id: 'app1',
        app_name: 'App 1',
        logins_30d: 100,
        active_users_30d: 50,
      },
      {
        app_id: 'app2',
        app_name: 'App 2',
        logins_30d: 80,
        active_users_30d: 40,
      },
    ];

    const mockActivity = [
      {
        created_at: '2025-01-12T10:00:00Z',
        event_type: 'app_created',
        app_id: 'app1',
        user_id: 'admin1',
        apps: { name: 'App 1' },
        profiles: { email: 'admin@test.com' },
      },
    ];

    let callCount = 0;
    supabaseAdmin.from = jest.fn().mockImplementation((table) => {
      if (table === 'apps') {
        return {
          select: jest
            .fn()
            .mockResolvedValue({ data: mockApps, error: null }),
        };
      }
      if (table === 'profiles') {
        return {
          select: jest
            .fn()
            .mockResolvedValue({ data: null, count: 150, error: null }),
        };
      }
      if (table === 'app_analytics') {
        callCount++;
        if (callCount <= 2) {
          // First two calls for login counts
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gte: jest
                  .fn()
                  .mockResolvedValue({
                    data: null,
                    count: callCount === 1 ? 20 : 500,
                    error: null,
                  }),
              }),
            }),
          };
        } else {
          // Third call for recent activity
          return {
            select: jest.fn().mockReturnValue({
              in: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest
                    .fn()
                    .mockResolvedValue({ data: mockActivity, error: null }),
                }),
              }),
            }),
          };
        }
      }
      if (table === 'app_usage_stats') {
        return {
          select: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest
                .fn()
                .mockResolvedValue({ data: mockTopApps, error: null }),
            }),
          }),
        };
      }
    });

    const result = await getDashboardStats();

    expect(result).toEqual({
      summary: {
        total_apps: 3,
        active_apps: 2,
        total_users: 150,
        logins_today: 20,
        logins_30d: 500,
      },
      top_apps: [
        {
          app_id: 'app1',
          app_name: 'App 1',
          login_count: 100,
          active_users: 50,
        },
        {
          app_id: 'app2',
          app_name: 'App 2',
          login_count: 80,
          active_users: 40,
        },
      ],
      recent_activity: [
        {
          type: 'app_created',
          app_name: 'App 1',
          user: 'admin@test.com',
          timestamp: '2025-01-12T10:00:00Z',
        },
      ],
    });
  });

  it('should handle database errors gracefully', async () => {
    supabaseAdmin.from = jest.fn().mockImplementation((table) => {
      if (table === 'apps') {
        return {
          select: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        };
      }
    });

    await expect(getDashboardStats()).rejects.toThrow(
      'Failed to fetch apps: Database error'
    );
  });

  it('should handle no data scenario', async () => {
    supabaseAdmin.from = jest.fn().mockImplementation((table) => {
      if (table === 'apps') {
        return {
          select: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      if (table === 'profiles') {
        return {
          select: jest
            .fn()
            .mockResolvedValue({ data: null, count: 0, error: null }),
        };
      }
      if (table === 'app_analytics') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              gte: jest
                .fn()
                .mockResolvedValue({ data: null, count: 0, error: null }),
            }),
            in: jest.fn().mockReturnValue({
              order: jest.fn().mockReturnValue({
                limit: jest
                  .fn()
                  .mockResolvedValue({ data: [], error: null }),
              }),
            }),
          }),
        };
      }
      if (table === 'app_usage_stats') {
        return {
          select: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        };
      }
    });

    const result = await getDashboardStats();

    expect(result).toEqual({
      summary: {
        total_apps: 0,
        active_apps: 0,
        total_users: 0,
        logins_today: 0,
        logins_30d: 0,
      },
      top_apps: [],
      recent_activity: [],
    });
  });

  it('should log errors when individual queries fail', async () => {
    let firstCall = true;

    supabaseAdmin.from = jest.fn().mockImplementation((table) => {
      if (table === 'apps') {
        return {
          select: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      if (table === 'profiles') {
        return {
          select: jest.fn().mockResolvedValue({
            data: null,
            count: null,
            error: { message: 'Users query failed' },
          }),
        };
      }
      if (table === 'app_analytics') {
        if (firstCall) {
          firstCall = false;
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gte: jest.fn().mockResolvedValue({
                  data: null,
                  count: null,
                  error: { message: 'Login query failed' },
                }),
              }),
            }),
          };
        } else {
          return {
            select: jest.fn().mockReturnValue({
              eq: jest.fn().mockReturnValue({
                gte: jest
                  .fn()
                  .mockResolvedValue({ data: null, count: 0, error: null }),
              }),
              in: jest.fn().mockReturnValue({
                order: jest.fn().mockReturnValue({
                  limit: jest
                    .fn()
                    .mockResolvedValue({ data: [], error: null }),
                }),
              }),
            }),
          };
        }
      }
      if (table === 'app_usage_stats') {
        return {
          select: jest.fn().mockReturnValue({
            order: jest.fn().mockReturnValue({
              limit: jest.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        };
      }
    });

    const result = await getDashboardStats();

    expect(logger.error).toHaveBeenCalledWith(
      '[Analytics] Failed to fetch users count',
      expect.anything()
    );

    expect(logger.error).toHaveBeenCalledWith(
      '[Analytics] Failed to fetch today logins',
      expect.anything()
    );

    // Should still return data structure even with errors
    expect(result).toHaveProperty('summary');
    expect(result.summary.total_users).toBe(0);
  });
});
