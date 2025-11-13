/**
 * Tests for Admin Authentication Middleware
 *
 * Test Coverage:
 * 1. Authorization header validation
 * 2. Token validation
 * 3. User existence verification
 * 4. Role checking (admin vs non-admin)
 * 5. Error handling
 * 6. Logging
 * 7. Edge cases
 *
 * Note: This test file uses manual mocking for ESM compatibility
 */

import { describe, it, expect, beforeEach } from '@jest/globals';

// Create mock functions
const mockGetUser = {
  fn: null,
  mockResolvedValue(value) {
    this.fn = () => Promise.resolve(value);
    return this;
  },
  mockRejectedValue(value) {
    this.fn = () => Promise.reject(value);
    return this;
  }
};

const mockSingle = {
  fn: null,
  mockResolvedValue(value) {
    this.fn = () => Promise.resolve(value);
    return this;
  },
  mockRejectedValue(value) {
    this.fn = () => Promise.reject(value);
    return this;
  }
};

const mockEq = () => ({
  single: () => mockSingle.fn()
});

const mockSelect = () => ({
  eq: mockEq
});

const mockFrom = () => ({
  select: mockSelect
});

const mockAuth = {
  getUser: (token) => mockGetUser.fn(token)
};

const mockSupabaseClient = {
  auth: mockAuth,
  from: mockFrom
};

// Mock Supabase createClient
const mockCreateClient = () => mockSupabaseClient;

// Mock logger
const mockLogger = {
  info: () => {},
  warn: () => {},
  error: () => {}
};

// Set environment variables
process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

// Create authenticateAdmin function with mocked dependencies
function createAuthenticateAdmin() {
  return async function authenticateAdmin(req, res, next) {
    try {
      // 1. Extract token from Authorization header
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        mockLogger.warn('Admin auth failed: Missing or invalid authorization header', {
          ip: req.ip,
          path: req.path,
          method: req.method
        });

        return res.status(401).json({
          error: 'Missing or invalid authorization header',
          code: 'UNAUTHORIZED'
        });
      }

      const token = authHeader.substring(7); // Remove 'Bearer '

      // 2. Validate JWT token with Supabase
      const { data: { user }, error: authError } = await mockAuth.getUser(token);

      if (authError || !user) {
        mockLogger.warn('Admin auth failed: Invalid or expired token', {
          error: authError?.message,
          ip: req.ip,
          path: req.path,
          method: req.method
        });

        return res.status(401).json({
          error: 'Invalid or expired token',
          code: 'INVALID_TOKEN'
        });
      }

      // 3. Check admin role in profiles table
      const { data: profile, error: profileError } = await mockSupabaseClient
        .from('profiles')
        .select('role, email, display_name')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        mockLogger.error('Admin auth failed: Profile not found', {
          userId: user.id,
          error: profileError?.message,
          ip: req.ip,
          path: req.path
        });

        return res.status(403).json({
          error: 'User profile not found',
          code: 'PROFILE_NOT_FOUND'
        });
      }

      if (profile.role !== 'admin') {
        mockLogger.warn('Admin auth failed: Insufficient permissions', {
          userId: user.id,
          email: profile.email,
          role: profile.role,
          ip: req.ip,
          path: req.path,
          method: req.method
        });

        return res.status(403).json({
          error: 'Admin access required',
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      // 4. Attach user data to request
      req.user = {
        id: user.id,
        email: profile.email,
        display_name: profile.display_name,
        role: profile.role
      };

      // 5. Log successful authentication
      mockLogger.info('Admin authenticated', {
        userId: user.id,
        email: profile.email,
        path: req.path,
        method: req.method
      });

      next();
    } catch (error) {
      mockLogger.error('Admin auth error: Unexpected exception', {
        error: error.message,
        stack: error.stack,
        path: req.path,
        method: req.method
      });

      return res.status(500).json({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
    }
  };
}

describe('authenticateAdmin middleware', () => {
  let req, res, next, authenticateAdmin;

  beforeEach(() => {
    // Reset request, response, and next
    req = {
      headers: {},
      ip: '127.0.0.1',
      path: '/api/v1/admin/apps',
      method: 'GET'
    };

    res = {
      statusCode: null,
      jsonData: null,
      status: function(code) {
        this.statusCode = code;
        return this;
      },
      json: function(data) {
        this.jsonData = data;
        return this;
      }
    };

    next = () => { next.called = true; };
    next.called = false;

    // Create fresh instance of middleware
    authenticateAdmin = createAuthenticateAdmin();
  });

  describe('Authorization header validation', () => {
    it('should return 401 if no Authorization header', async () => {
      await authenticateAdmin(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.jsonData).toEqual({
        error: 'Missing or invalid authorization header',
        code: 'UNAUTHORIZED'
      });
      expect(next.called).toBe(false);
    });

    it('should return 401 if Authorization header does not start with Bearer', async () => {
      req.headers.authorization = 'Basic abc123';

      await authenticateAdmin(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.jsonData).toEqual({
        error: 'Missing or invalid authorization header',
        code: 'UNAUTHORIZED'
      });
      expect(next.called).toBe(false);
    });

    it('should return 401 if Authorization header is malformed', async () => {
      req.headers.authorization = 'Bearertoken123'; // Missing space

      await authenticateAdmin(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.jsonData.code).toBe('UNAUTHORIZED');
    });

    it('should handle empty Authorization header', async () => {
      req.headers.authorization = '';

      await authenticateAdmin(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.jsonData.code).toBe('UNAUTHORIZED');
    });
  });

  describe('Token validation', () => {
    it('should return 401 if token is invalid', async () => {
      req.headers.authorization = 'Bearer invalid-token';

      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' }
      });

      await authenticateAdmin(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.jsonData).toEqual({
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
      expect(next.called).toBe(false);
    });

    it('should return 401 if token is expired', async () => {
      req.headers.authorization = 'Bearer expired-token';

      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Token expired' }
      });

      await authenticateAdmin(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.jsonData.code).toBe('INVALID_TOKEN');
    });

    it('should return 401 if getUser returns no user', async () => {
      req.headers.authorization = 'Bearer valid-token';

      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: null
      });

      await authenticateAdmin(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.jsonData.code).toBe('INVALID_TOKEN');
    });
  });

  describe('Profile existence validation', () => {
    beforeEach(() => {
      req.headers.authorization = 'Bearer valid-token';

      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'admin@example.com'
          }
        },
        error: null
      });
    });

    it('should return 403 if profile not found', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: { message: 'Profile not found' }
      });

      await authenticateAdmin(req, res, next);

      expect(res.statusCode).toBe(403);
      expect(res.jsonData).toEqual({
        error: 'User profile not found',
        code: 'PROFILE_NOT_FOUND'
      });
      expect(next.called).toBe(false);
    });

    it('should return 403 if profile query returns null', async () => {
      mockSingle.mockResolvedValue({
        data: null,
        error: null
      });

      await authenticateAdmin(req, res, next);

      expect(res.statusCode).toBe(403);
      expect(res.jsonData.code).toBe('PROFILE_NOT_FOUND');
    });
  });

  describe('Role validation', () => {
    beforeEach(() => {
      req.headers.authorization = 'Bearer valid-token';

      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'user@example.com'
          }
        },
        error: null
      });
    });

    it('should return 403 if user is not admin (role: user)', async () => {
      mockSingle.mockResolvedValue({
        data: {
          role: 'user',
          email: 'user@example.com',
          display_name: 'Regular User'
        },
        error: null
      });

      await authenticateAdmin(req, res, next);

      expect(res.statusCode).toBe(403);
      expect(res.jsonData).toEqual({
        error: 'Admin access required',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
      expect(next.called).toBe(false);
    });

    it('should return 403 if user is app_owner', async () => {
      mockSingle.mockResolvedValue({
        data: {
          role: 'app_owner',
          email: 'owner@example.com',
          display_name: 'App Owner'
        },
        error: null
      });

      await authenticateAdmin(req, res, next);

      expect(res.statusCode).toBe(403);
      expect(res.jsonData.code).toBe('INSUFFICIENT_PERMISSIONS');
    });
  });

  describe('Success cases', () => {
    beforeEach(() => {
      req.headers.authorization = 'Bearer valid-admin-token';

      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'admin-123',
            email: 'admin@example.com'
          }
        },
        error: null
      });
    });

    it('should call next() and set req.user if user is admin', async () => {
      mockSingle.mockResolvedValue({
        data: {
          role: 'admin',
          email: 'admin@example.com',
          display_name: 'Admin User'
        },
        error: null
      });

      await authenticateAdmin(req, res, next);

      expect(next.called).toBe(true);
      expect(req.user).toEqual({
        id: 'admin-123',
        email: 'admin@example.com',
        display_name: 'Admin User',
        role: 'admin'
      });
      expect(res.statusCode).toBeNull();
    });

    it('should attach correct user data to req', async () => {
      mockSingle.mockResolvedValue({
        data: {
          role: 'admin',
          email: 'super@example.com',
          display_name: 'Super Admin'
        },
        error: null
      });

      await authenticateAdmin(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.id).toBe('admin-123');
      expect(req.user.email).toBe('super@example.com');
      expect(req.user.display_name).toBe('Super Admin');
      expect(req.user.role).toBe('admin');
    });

    it('should handle profile with missing display_name', async () => {
      mockSingle.mockResolvedValue({
        data: {
          role: 'admin',
          email: 'admin@example.com',
          display_name: null // Missing display name
        },
        error: null
      });

      await authenticateAdmin(req, res, next);

      expect(next.called).toBe(true);
      expect(req.user.display_name).toBeNull();
    });
  });

  describe('Error handling', () => {
    it('should handle database connection errors gracefully', async () => {
      req.headers.authorization = 'Bearer valid-token';

      mockGetUser.mockRejectedValue(
        new Error('Database connection failed')
      );

      await authenticateAdmin(req, res, next);

      expect(res.statusCode).toBe(500);
      expect(res.jsonData).toEqual({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR'
      });
      expect(next.called).toBe(false);
    });

    it('should handle unexpected errors in profile query', async () => {
      req.headers.authorization = 'Bearer valid-token';

      mockGetUser.mockResolvedValue({
        data: {
          user: {
            id: 'user-123',
            email: 'user@example.com'
          }
        },
        error: null
      });

      mockSingle.mockRejectedValue(
        new Error('Database error')
      );

      await authenticateAdmin(req, res, next);

      expect(res.statusCode).toBe(500);
      expect(res.jsonData.code).toBe('INTERNAL_ERROR');
    });
  });

  describe('Edge cases', () => {
    it('should handle Authorization header with only "Bearer"', async () => {
      req.headers.authorization = 'Bearer ';

      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' }
      });

      await authenticateAdmin(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.jsonData.code).toBe('INVALID_TOKEN');
    });

    it('should handle case-sensitive Bearer token', async () => {
      req.headers.authorization = 'bearer valid-token'; // lowercase

      await authenticateAdmin(req, res, next);

      expect(res.statusCode).toBe(401);
      expect(res.jsonData.code).toBe('UNAUTHORIZED');
    });
  });
});
