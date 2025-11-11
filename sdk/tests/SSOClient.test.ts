/**
 * SSOClient unit tests
 */

import { SSOClient } from '../src/SSOClient';
import { SSOErrors } from '../src/errors';
import { MemoryStorageAdapter } from '../src/storage/MemoryStorage';

// Mock fetch
global.fetch = jest.fn();

describe('SSOClient', () => {
  let client: SSOClient;
  const mockConfig = {
    ssoUrl: 'http://localhost:3000',
    appId: 'test-app-id',
    appSecret: 'test-app-secret',
    redirectUri: 'http://localhost:3001/callback',
    storage: 'memory' as const,
    autoRefresh: false, // Disable for testing
  };

  beforeEach(() => {
    client = new SSOClient(mockConfig);
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create client with valid config', () => {
      expect(client).toBeInstanceOf(SSOClient);
    });

    it('should throw error for missing ssoUrl', () => {
      expect(() => {
        new SSOClient({ ...mockConfig, ssoUrl: '' });
      }).toThrow();
    });

    it('should throw error for missing appId', () => {
      expect(() => {
        new SSOClient({ ...mockConfig, appId: '' });
      }).toThrow();
    });

    it('should throw error for missing appSecret', () => {
      expect(() => {
        new SSOClient({ ...mockConfig, appSecret: '' });
      }).toThrow();
    });

    it('should throw error for invalid ssoUrl', () => {
      expect(() => {
        new SSOClient({ ...mockConfig, ssoUrl: 'not-a-url' });
      }).toThrow();
    });
  });

  describe('handleCallback', () => {
    const mockCode = 'test-code-123';
    const mockState = 'test-state-456';
    const mockTokenResponse = {
      access_token: 'access-token-123',
      refresh_token: 'refresh-token-456',
      expires_in: 3600,
    };
    const mockUserResponse = {
      user: {
        id: 'user-123',
        email: 'test@example.com',
        role: 'user',
      },
    };

    beforeEach(() => {
      // Mock window.location
      delete (global as any).window;
      (global as any).window = {
        location: {
          href: `http://localhost:3001/callback?code=${mockCode}&state=${mockState}`,
        },
      };

      // Store state for validation
      (client as any).storage.setState(mockState);
    });

    it('should exchange code for token successfully', async () => {
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockTokenResponse,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockUserResponse,
        });

      const result = await client.handleCallback();

      expect(result.user).toEqual(mockUserResponse.user);
      expect(result.token.access_token).toBe(mockTokenResponse.access_token);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should throw error for invalid state', async () => {
      (client as any).storage.setState('different-state');

      await expect(client.handleCallback()).rejects.toThrow();
    });

    it('should throw error when code is missing', async () => {
      (global as any).window.location.href = 'http://localhost:3001/callback?state=' + mockState;

      await expect(client.handleCallback()).rejects.toThrow();
    });

    it('should throw error when callback has error parameter', async () => {
      (global as any).window.location.href =
        'http://localhost:3001/callback?error=access_denied&state=' + mockState;

      await expect(client.handleCallback()).rejects.toThrow('access_denied');
    });
  });

  describe('getAccessToken', () => {
    it('should return null when not authenticated', async () => {
      const token = await client.getAccessToken();
      expect(token).toBeNull();
    });

    it('should return access token when authenticated', async () => {
      const mockTokenData = {
        access_token: 'test-token',
        refresh_token: 'refresh-token',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      };

      (client as any).storage.setToken(mockTokenData);

      const token = await client.getAccessToken();
      expect(token).toBe('test-token');
    });

    it('should refresh token when expired', async () => {
      const expiredTokenData = {
        access_token: 'old-token',
        refresh_token: 'refresh-token',
        expires_at: Math.floor(Date.now() / 1000) - 100, // Expired
      };

      (client as any).storage.setToken(expiredTokenData);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'new-token',
          refresh_token: 'new-refresh-token',
          expires_in: 3600,
        }),
      });

      const token = await client.getAccessToken();
      expect(token).toBe('new-token');
    });
  });

  describe('getUser', () => {
    it('should return null when not authenticated', async () => {
      const user = await client.getUser();
      expect(user).toBeNull();
    });

    it('should return cached user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'user' as const,
      };

      const mockTokenData = {
        access_token: 'test-token',
        refresh_token: 'refresh-token',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: mockUser,
      };

      (client as any).storage.setToken(mockTokenData);

      const user = await client.getUser();
      expect(user).toEqual(mockUser);
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should fetch user when not cached', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'user',
      };

      const mockTokenData = {
        access_token: 'test-token',
        refresh_token: 'refresh-token',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      };

      (client as any).storage.setToken(mockTokenData);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ user: mockUser }),
      });

      const user = await client.getUser();
      expect(user).toEqual(mockUser);
      expect(global.fetch).toHaveBeenCalledWith(
        `${mockConfig.ssoUrl}/api/v1/user`,
        expect.objectContaining({
          headers: {
            Authorization: 'Bearer test-token',
          },
        })
      );
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when not authenticated', async () => {
      const result = await client.isAuthenticated();
      expect(result).toBe(false);
    });

    it('should return true when authenticated with valid token', async () => {
      const mockTokenData = {
        access_token: 'test-token',
        refresh_token: 'refresh-token',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      };

      (client as any).storage.setToken(mockTokenData);

      const result = await client.isAuthenticated();
      expect(result).toBe(true);
    });

    it('should refresh token and return true when token expired', async () => {
      const expiredTokenData = {
        access_token: 'old-token',
        refresh_token: 'refresh-token',
        expires_at: Math.floor(Date.now() / 1000) - 100,
      };

      (client as any).storage.setToken(expiredTokenData);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'new-token',
          refresh_token: 'new-refresh-token',
          expires_in: 3600,
        }),
      });

      const result = await client.isAuthenticated();
      expect(result).toBe(true);
    });

    it('should return false when token refresh fails', async () => {
      const expiredTokenData = {
        access_token: 'old-token',
        refresh_token: 'refresh-token',
        expires_at: Math.floor(Date.now() / 1000) - 100,
      };

      (client as any).storage.setToken(expiredTokenData);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      const result = await client.isAuthenticated();
      expect(result).toBe(false);
    });
  });

  describe('logout', () => {
    it('should clear storage', async () => {
      const mockTokenData = {
        access_token: 'test-token',
        refresh_token: 'refresh-token',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      };

      (client as any).storage.setToken(mockTokenData);
      await client.logout();

      const token = (client as any).storage.getToken();
      expect(token).toBeNull();
    });

    it('should revoke token on server when requested', async () => {
      const mockTokenData = {
        access_token: 'test-token',
        refresh_token: 'refresh-token',
        expires_at: Math.floor(Date.now() / 1000) + 3600,
      };

      (client as any).storage.setToken(mockTokenData);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
      });

      await client.logout(true);

      expect(global.fetch).toHaveBeenCalledWith(
        `${mockConfig.ssoUrl}/api/v1/token/revoke`,
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });
  });

  describe('refreshToken', () => {
    it('should throw error when no token exists', async () => {
      await expect(client.refreshToken()).rejects.toThrow();
    });

    it('should refresh token successfully', async () => {
      const mockTokenData = {
        access_token: 'old-token',
        refresh_token: 'refresh-token',
        expires_at: Math.floor(Date.now() / 1000) - 100,
      };

      (client as any).storage.setToken(mockTokenData);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          access_token: 'new-token',
          refresh_token: 'new-refresh-token',
          expires_in: 3600,
        }),
      });

      await client.refreshToken();

      const newTokenData = (client as any).storage.getToken();
      expect(newTokenData.access_token).toBe('new-token');
    });

    it('should clear storage when refresh fails', async () => {
      const mockTokenData = {
        access_token: 'old-token',
        refresh_token: 'refresh-token',
        expires_at: Math.floor(Date.now() / 1000) - 100,
      };

      (client as any).storage.setToken(mockTokenData);

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 401,
      });

      await expect(client.refreshToken()).rejects.toThrow();

      const tokenData = (client as any).storage.getToken();
      expect(tokenData).toBeNull();
    });
  });
});
