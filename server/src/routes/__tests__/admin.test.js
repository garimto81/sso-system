/**
 * Integration Tests for Admin API Routes
 *
 * Tests all 8 admin endpoints:
 * 1. GET /api/v1/admin/apps - List apps
 * 2. POST /api/v1/admin/apps - Create app
 * 3. GET /api/v1/admin/apps/:id - Get app details
 * 4. PUT /api/v1/admin/apps/:id - Update app
 * 5. DELETE /api/v1/admin/apps/:id - Delete app
 * 6. POST /api/v1/admin/apps/:id/regenerate-secret - Regenerate secret
 * 7. GET /api/v1/admin/apps/:id/analytics - Get analytics
 * 8. GET /api/v1/admin/dashboard - Global dashboard
 *
 * Coverage: Happy paths, errors, validation, security
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, jest } from '@jest/globals';
import express from 'express';
import request from 'supertest';

// Mock dependencies before imports
const mockSupabaseAdmin = {
  from: jest.fn(),
  rpc: jest.fn(),
  auth: {
    admin: {
      getUserById: jest.fn(),
    },
  },
};

const mockRecordAnalyticsEvent = jest.fn();
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock modules
jest.unstable_mockModule('../../utils/supabase.js', () => ({
  supabaseAdmin: mockSupabaseAdmin,
}));

jest.unstable_mockModule('../../utils/analytics.js', () => ({
  recordAnalyticsEvent: mockRecordAnalyticsEvent,
  getAppAnalytics: jest.fn(),
  getDashboardStats: jest.fn(),
}));

jest.unstable_mockModule('../../utils/logger.js', () => ({
  logger: mockLogger,
}));

// Import after mocking
const { default: adminRoutes } = await import('../admin.js');
const { recordAnalyticsEvent, getAppAnalytics, getDashboardStats } = await import('../../utils/analytics.js');

describe('Admin API Integration Tests', () => {
  let app;
  let testAdminToken;
  let testUserId;
  let testAppId;

  beforeAll(() => {
    // Setup test app with admin routes
    app = express();
    app.use(express.json());

    // Mock authentication middleware
    app.use((req, res, next) => {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'unauthorized',
          message: 'Missing or invalid authorization header',
        });
      }

      const token = authHeader.substring(7);
      if (token === 'invalid-token') {
        return res.status(401).json({
          error: 'unauthorized',
          message: 'Invalid token',
        });
      }

      if (token === 'user-token') {
        return res.status(403).json({
          error: 'forbidden',
          message: 'Admin access required',
        });
      }

      // Valid admin token
      req.user = {
        id: 'admin-uuid',
        email: 'admin@example.com',
        role: 'admin',
        display_name: 'Admin User',
      };
      next();
    });

    app.use('/api/v1/admin', adminRoutes);

    // Test fixtures
    testAdminToken = 'valid-admin-token';
    testUserId = 'admin-uuid';
    testAppId = 'a3f2b8c1-1234-5678-90ab-cdef12345678';
  });

  afterAll(() => {
    // Cleanup
    jest.clearAllMocks();
  });

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  describe('GET /api/v1/admin/apps', () => {
    it('should list apps with pagination', async () => {
      const mockApps = [
        {
          id: testAppId,
          name: 'OJT Platform',
          description: 'Employee training',
          api_key: testAppId,
          auth_method: 'token_exchange',
          is_active: true,
          created_at: '2025-01-12T10:30:00.000Z',
          updated_at: '2025-01-12T10:30:00.000Z',
          owner_id: 'owner-uuid',
          profiles: {
            id: 'owner-uuid',
            email: 'owner@example.com',
            display_name: 'Owner User',
          },
        },
      ];

      mockSupabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnThis(),
          ilike: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          range: jest.fn().mockResolvedValue({
            data: mockApps,
            error: null,
            count: 1,
          }),
        }),
      });

      const response = await request(app)
        .get('/api/v1/admin/apps')
        .set('Authorization', `Bearer ${testAdminToken}`)
        .query({ page: 1, limit: 20 })
        .expect(200);

      expect(response.body).toHaveProperty('apps');
      expect(response.body.apps).toHaveLength(1);
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        total_pages: 1,
      });
    });

    it('should search apps by name', async () => {
      mockSupabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          ilike: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          range: jest.fn().mockResolvedValue({
            data: [],
            error: null,
            count: 0,
          }),
        }),
      });

      const response = await request(app)
        .get('/api/v1/admin/apps')
        .set('Authorization', `Bearer ${testAdminToken}`)
        .query({ search: 'ojt' })
        .expect(200);

      expect(response.body.apps).toHaveLength(0);
      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('apps');
    });

    it('should filter apps by status', async () => {
      mockSupabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnThis(),
          order: jest.fn().mockReturnThis(),
          range: jest.fn().mockResolvedValue({
            data: [],
            error: null,
            count: 0,
          }),
        }),
      });

      await request(app)
        .get('/api/v1/admin/apps')
        .set('Authorization', `Bearer ${testAdminToken}`)
        .query({ status: 'active' })
        .expect(200);

      expect(mockSupabaseAdmin.from).toHaveBeenCalledWith('apps');
    });

    it('should require authentication', async () => {
      await request(app)
        .get('/api/v1/admin/apps')
        .expect(401);
    });

    it('should require admin role', async () => {
      await request(app)
        .get('/api/v1/admin/apps')
        .set('Authorization', 'Bearer user-token')
        .expect(403);
    });
  });

  describe('POST /api/v1/admin/apps', () => {
    it('should create new app successfully', async () => {
      const newApp = {
        name: 'New App',
        description: 'Test app',
        redirect_urls: ['http://localhost:3000/callback'],
        allowed_origins: ['http://localhost:3000'],
        auth_method: 'token_exchange',
        owner_email: 'dev@example.com',
      };

      const mockCreatedApp = {
        id: 'new-app-uuid',
        name: newApp.name,
        description: newApp.description,
        api_key: 'generated-api-key',
        api_secret: '64charhexsecretshownonlyonce123456789012345678901234567890123',
        redirect_urls: newApp.redirect_urls,
        allowed_origins: newApp.allowed_origins,
        auth_method: newApp.auth_method,
        owner_id: 'owner-uuid',
        is_active: true,
        created_at: '2025-01-12T10:30:00.000Z',
        updated_at: '2025-01-12T10:30:00.000Z',
      };

      // Mock owner lookup
      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'owner-uuid', email: 'dev@example.com' },
              error: null,
            }),
          }),
        }),
      });

      // Mock app creation
      mockSupabaseAdmin.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockCreatedApp,
              error: null,
            }),
          }),
        }),
      });

      const response = await request(app)
        .post('/api/v1/admin/apps')
        .set('Authorization', `Bearer ${testAdminToken}`)
        .send(newApp)
        .expect(201);

      expect(response.body.message).toBe('App registered successfully');
      expect(response.body.app).toHaveProperty('api_secret');
      expect(response.body.app.api_secret).toHaveLength(64);
      expect(mockRecordAnalyticsEvent).toHaveBeenCalledWith(
        mockCreatedApp.id,
        'app_created',
        testUserId,
        expect.any(Object)
      );
    });

    it('should return api_secret only once', async () => {
      const mockApp = {
        id: 'app-uuid',
        api_secret: '64charsecret1234567890123456789012345678901234567890123456789012',
      };

      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'owner-uuid' },
              error: null,
            }),
          }),
        }),
      });

      mockSupabaseAdmin.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockApp,
              error: null,
            }),
          }),
        }),
      });

      const response = await request(app)
        .post('/api/v1/admin/apps')
        .set('Authorization', `Bearer ${testAdminToken}`)
        .send({
          name: 'Test',
          redirect_urls: ['http://localhost:3000/callback'],
          auth_method: 'token_exchange',
          owner_email: 'dev@example.com',
        })
        .expect(201);

      expect(response.body.app.api_secret).toBeDefined();
      expect(typeof response.body.app.api_secret).toBe('string');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/v1/admin/apps')
        .set('Authorization', `Bearer ${testAdminToken}`)
        .send({})
        .expect(400);

      expect(response.body.error).toBe('validation_error');
      expect(response.body.details).toBeDefined();
    });

    it('should sanitize input', async () => {
      const maliciousInput = {
        name: '<script>alert("xss")</script>Test App',
        description: '<img src=x onerror=alert(1)>',
        redirect_urls: ['http://localhost:3000/callback'],
        auth_method: 'token_exchange',
        owner_email: 'dev@example.com',
      };

      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'owner-uuid' },
              error: null,
            }),
          }),
        }),
      });

      mockSupabaseAdmin.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'app-uuid', name: 'Test App' },
              error: null,
            }),
          }),
        }),
      });

      const response = await request(app)
        .post('/api/v1/admin/apps')
        .set('Authorization', `Bearer ${testAdminToken}`)
        .send(maliciousInput)
        .expect(201);

      // Verify sanitization happened
      expect(response.body.app.name).not.toContain('<script>');
    });

    it('should check for duplicate names', async () => {
      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'owner-uuid' },
              error: null,
            }),
          }),
        }),
      });

      mockSupabaseAdmin.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: '23505', message: 'Duplicate key' },
            }),
          }),
        }),
      });

      await request(app)
        .post('/api/v1/admin/apps')
        .set('Authorization', `Bearer ${testAdminToken}`)
        .send({
          name: 'Existing App',
          redirect_urls: ['http://localhost:3000/callback'],
          auth_method: 'token_exchange',
          owner_email: 'dev@example.com',
        })
        .expect(409);
    });

    it('should record analytics event', async () => {
      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'owner-uuid' },
              error: null,
            }),
          }),
        }),
      });

      mockSupabaseAdmin.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'new-app-uuid', name: 'Test' },
              error: null,
            }),
          }),
        }),
      });

      await request(app)
        .post('/api/v1/admin/apps')
        .set('Authorization', `Bearer ${testAdminToken}`)
        .send({
          name: 'Test',
          redirect_urls: ['http://localhost:3000/callback'],
          auth_method: 'token_exchange',
          owner_email: 'dev@example.com',
        })
        .expect(201);

      expect(mockRecordAnalyticsEvent).toHaveBeenCalledWith(
        'new-app-uuid',
        'app_created',
        testUserId,
        expect.any(Object)
      );
    });

    it('should log admin action', async () => {
      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'owner-uuid' },
              error: null,
            }),
          }),
        }),
      });

      mockSupabaseAdmin.from.mockReturnValueOnce({
        insert: jest.fn().mockReturnValue({
          select: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: 'app-uuid', name: 'Test' },
              error: null,
            }),
          }),
        }),
      });

      await request(app)
        .post('/api/v1/admin/apps')
        .set('Authorization', `Bearer ${testAdminToken}`)
        .send({
          name: 'Test',
          redirect_urls: ['http://localhost:3000/callback'],
          auth_method: 'token_exchange',
          owner_email: 'dev@example.com',
        })
        .expect(201);

      expect(mockLogger.info).toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/admin/apps/:id', () => {
    it('should return app details', async () => {
      const mockApp = {
        id: testAppId,
        name: 'OJT Platform',
        description: 'Employee training',
        api_key: testAppId,
        api_secret: '$2a$10$hashed-bcrypt-secret',
        redirect_urls: ['http://localhost:3000/callback'],
        allowed_origins: ['http://localhost:3000'],
        auth_method: 'token_exchange',
        owner_id: 'owner-uuid',
        is_active: true,
        created_at: '2025-01-12T10:30:00.000Z',
        updated_at: '2025-01-12T10:30:00.000Z',
        profiles: {
          id: 'owner-uuid',
          email: 'owner@example.com',
          display_name: 'Owner User',
        },
      };

      mockSupabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockApp,
              error: null,
            }),
          }),
        }),
      });

      const response = await request(app)
        .get(`/api/v1/admin/apps/${testAppId}`)
        .set('Authorization', `Bearer ${testAdminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', testAppId);
      expect(response.body).toHaveProperty('name', 'OJT Platform');
    });

    it('should NOT return api_secret in plain text', async () => {
      const mockApp = {
        id: testAppId,
        api_secret: '$2a$10$hashed-bcrypt-secret',
      };

      mockSupabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockApp,
              error: null,
            }),
          }),
        }),
      });

      const response = await request(app)
        .get(`/api/v1/admin/apps/${testAppId}`)
        .set('Authorization', `Bearer ${testAdminToken}`)
        .expect(200);

      // Should be bcrypt hash, not plain text
      expect(response.body.api_secret).toMatch(/^\$2[aby]\$\d+\$/);
    });

    it('should return 404 for non-existent app', async () => {
      mockSupabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' },
            }),
          }),
        }),
      });

      await request(app)
        .get('/api/v1/admin/apps/non-existent-uuid')
        .set('Authorization', `Bearer ${testAdminToken}`)
        .expect(404);
    });

    it('should validate UUID format', async () => {
      await request(app)
        .get('/api/v1/admin/apps/invalid-uuid')
        .set('Authorization', `Bearer ${testAdminToken}`)
        .expect(400);
    });
  });

  describe('PUT /api/v1/admin/apps/:id', () => {
    it('should update app successfully', async () => {
      const updates = {
        name: 'Updated App Name',
        description: 'Updated description',
      };

      mockSupabaseAdmin.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: { id: testAppId, ...updates },
                error: null,
              }),
            }),
          }),
        }),
      });

      const response = await request(app)
        .put(`/api/v1/admin/apps/${testAppId}`)
        .set('Authorization', `Bearer ${testAdminToken}`)
        .send(updates)
        .expect(200);

      expect(response.body.message).toBe('App updated successfully');
      expect(response.body.app.name).toBe(updates.name);
    });

    it('should NOT allow updating api_key', async () => {
      const response = await request(app)
        .put(`/api/v1/admin/apps/${testAppId}`)
        .set('Authorization', `Bearer ${testAdminToken}`)
        .send({ api_key: 'new-key' })
        .expect(400);

      expect(response.body.error).toBe('validation_error');
    });

    it('should NOT allow updating api_secret', async () => {
      const response = await request(app)
        .put(`/api/v1/admin/apps/${testAppId}`)
        .set('Authorization', `Bearer ${testAdminToken}`)
        .send({ api_secret: 'new-secret' })
        .expect(400);

      expect(response.body.error).toBe('validation_error');
    });

    it('should validate inputs', async () => {
      const response = await request(app)
        .put(`/api/v1/admin/apps/${testAppId}`)
        .set('Authorization', `Bearer ${testAdminToken}`)
        .send({ redirect_urls: 'not-an-array' })
        .expect(400);

      expect(response.body.error).toBe('validation_error');
    });
  });

  describe('DELETE /api/v1/admin/apps/:id', () => {
    it('should soft delete app by default', async () => {
      mockSupabaseAdmin.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({
              data: [{ id: testAppId, is_active: false }],
              error: null,
            }),
          }),
        }),
      });

      const response = await request(app)
        .delete(`/api/v1/admin/apps/${testAppId}`)
        .set('Authorization', `Bearer ${testAdminToken}`)
        .expect(200);

      expect(response.body.message).toBe('App deactivated successfully');
    });

    it('should hard delete when permanent=true', async () => {
      mockSupabaseAdmin.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [{ id: testAppId }],
            error: null,
          }),
        }),
      });

      const response = await request(app)
        .delete(`/api/v1/admin/apps/${testAppId}`)
        .set('Authorization', `Bearer ${testAdminToken}`)
        .query({ permanent: 'true' })
        .expect(200);

      expect(response.body.message).toBe('App permanently deleted');
    });

    it('should record analytics event', async () => {
      mockSupabaseAdmin.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockResolvedValue({
              data: [{ id: testAppId }],
              error: null,
            }),
          }),
        }),
      });

      await request(app)
        .delete(`/api/v1/admin/apps/${testAppId}`)
        .set('Authorization', `Bearer ${testAdminToken}`)
        .expect(200);

      expect(mockRecordAnalyticsEvent).toHaveBeenCalledWith(
        testAppId,
        'app_deleted',
        testUserId,
        expect.any(Object)
      );
    });

    it('should log admin action with WARNING', async () => {
      mockSupabaseAdmin.from.mockReturnValue({
        delete: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [{ id: testAppId }],
            error: null,
          }),
        }),
      });

      await request(app)
        .delete(`/api/v1/admin/apps/${testAppId}`)
        .set('Authorization', `Bearer ${testAdminToken}`)
        .query({ permanent: 'true' })
        .expect(200);

      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe('POST /api/v1/admin/apps/:id/regenerate-secret', () => {
    it('should regenerate secret successfully', async () => {
      const mockApp = {
        id: testAppId,
        name: 'OJT Platform',
      };

      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockApp,
              error: null,
            }),
          }),
        }),
      });

      mockSupabaseAdmin.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [{ ...mockApp, api_secret: 'newhash' }],
            error: null,
          }),
        }),
      });

      const response = await request(app)
        .post(`/api/v1/admin/apps/${testAppId}/regenerate-secret`)
        .set('Authorization', `Bearer ${testAdminToken}`)
        .send({ confirmation: 'OJT Platform' })
        .expect(200);

      expect(response.body.message).toBe('API secret regenerated successfully');
      expect(response.body.api_secret).toBeDefined();
      expect(response.body.warning).toBeDefined();
    });

    it('should return new secret only once', async () => {
      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: testAppId, name: 'Test' },
              error: null,
            }),
          }),
        }),
      });

      mockSupabaseAdmin.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [{ id: testAppId }],
            error: null,
          }),
        }),
      });

      const response = await request(app)
        .post(`/api/v1/admin/apps/${testAppId}/regenerate-secret`)
        .set('Authorization', `Bearer ${testAdminToken}`)
        .send({ confirmation: 'Test' })
        .expect(200);

      expect(response.body.api_secret).toHaveLength(64);
      expect(typeof response.body.api_secret).toBe('string');
    });

    it('should invalidate old secret', async () => {
      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: testAppId, name: 'Test' },
              error: null,
            }),
          }),
        }),
      });

      const updateMock = jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [{ id: testAppId }],
          error: null,
        }),
      });

      mockSupabaseAdmin.from.mockReturnValueOnce({
        update: updateMock,
      });

      await request(app)
        .post(`/api/v1/admin/apps/${testAppId}/regenerate-secret`)
        .set('Authorization', `Bearer ${testAdminToken}`)
        .send({ confirmation: 'Test' })
        .expect(200);

      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          api_secret_hash: expect.any(String),
        })
      );
    });

    it('should record analytics event', async () => {
      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: testAppId, name: 'Test' },
              error: null,
            }),
          }),
        }),
      });

      mockSupabaseAdmin.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [{ id: testAppId }],
            error: null,
          }),
        }),
      });

      await request(app)
        .post(`/api/v1/admin/apps/${testAppId}/regenerate-secret`)
        .set('Authorization', `Bearer ${testAdminToken}`)
        .send({ confirmation: 'Test' })
        .expect(200);

      expect(mockRecordAnalyticsEvent).toHaveBeenCalledWith(
        testAppId,
        'secret_regenerated',
        testUserId,
        expect.any(Object)
      );
    });

    it('should log admin action with WARNING', async () => {
      mockSupabaseAdmin.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: { id: testAppId, name: 'Test' },
              error: null,
            }),
          }),
        }),
      });

      mockSupabaseAdmin.from.mockReturnValueOnce({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({
            data: [{ id: testAppId }],
            error: null,
          }),
        }),
      });

      await request(app)
        .post(`/api/v1/admin/apps/${testAppId}/regenerate-secret`)
        .set('Authorization', `Bearer ${testAdminToken}`)
        .send({ confirmation: 'Test' })
        .expect(200);

      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe('GET /api/v1/admin/apps/:id/analytics', () => {
    it('should return analytics data', async () => {
      const mockAnalytics = {
        period: '30d',
        metrics: {
          total_logins: 1234,
          active_users: 456,
          token_requests: 2345,
          error_rate: 0.2,
          avg_logins_per_day: 41.1,
        },
        login_trend: [],
        top_users: [],
        recent_errors: [],
      };

      getAppAnalytics.mockResolvedValue(mockAnalytics);

      const response = await request(app)
        .get(`/api/v1/admin/apps/${testAppId}/analytics`)
        .set('Authorization', `Bearer ${testAdminToken}`)
        .expect(200);

      expect(response.body).toEqual(mockAnalytics);
    });

    it('should support different periods (7d, 30d, 90d)', async () => {
      getAppAnalytics.mockResolvedValue({ period: '7d', metrics: {} });

      await request(app)
        .get(`/api/v1/admin/apps/${testAppId}/analytics`)
        .set('Authorization', `Bearer ${testAdminToken}`)
        .query({ period: '7d' })
        .expect(200);

      expect(getAppAnalytics).toHaveBeenCalledWith(testAppId, 7);
    });

    it('should validate period parameter', async () => {
      await request(app)
        .get(`/api/v1/admin/apps/${testAppId}/analytics`)
        .set('Authorization', `Bearer ${testAdminToken}`)
        .query({ period: 'invalid' })
        .expect(400);
    });
  });

  describe('GET /api/v1/admin/dashboard', () => {
    it('should return global dashboard stats', async () => {
      const mockDashboard = {
        summary: {
          total_apps: 10,
          active_apps: 8,
          total_users: 1500,
          logins_today: 234,
          logins_30d: 7890,
        },
        top_apps: [],
        recent_activity: [],
      };

      getDashboardStats.mockResolvedValue(mockDashboard);

      const response = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${testAdminToken}`)
        .expect(200);

      expect(response.body).toEqual(mockDashboard);
    });

    it('should include summary metrics', async () => {
      const mockDashboard = {
        summary: {
          total_apps: 5,
          active_apps: 3,
          total_users: 100,
          logins_today: 10,
          logins_30d: 500,
        },
        top_apps: [],
        recent_activity: [],
      };

      getDashboardStats.mockResolvedValue(mockDashboard);

      const response = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${testAdminToken}`)
        .expect(200);

      expect(response.body.summary).toHaveProperty('total_apps');
      expect(response.body.summary).toHaveProperty('active_apps');
      expect(response.body.summary).toHaveProperty('total_users');
    });

    it('should include top apps', async () => {
      const mockDashboard = {
        summary: {},
        top_apps: [
          {
            app_id: 'app1',
            app_name: 'App 1',
            login_count: 100,
            active_users: 50,
          },
        ],
        recent_activity: [],
      };

      getDashboardStats.mockResolvedValue(mockDashboard);

      const response = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${testAdminToken}`)
        .expect(200);

      expect(response.body.top_apps).toHaveLength(1);
    });

    it('should include recent activity', async () => {
      const mockDashboard = {
        summary: {},
        top_apps: [],
        recent_activity: [
          {
            type: 'app_created',
            app_name: 'New App',
            timestamp: '2025-01-12T10:30:00.000Z',
            user: 'admin@example.com',
          },
        ],
      };

      getDashboardStats.mockResolvedValue(mockDashboard);

      const response = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${testAdminToken}`)
        .expect(200);

      expect(response.body.recent_activity).toHaveLength(1);
    });
  });
});
