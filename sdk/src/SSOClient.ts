/**
 * Main SSO Client class
 */

import { SSOConfig, AuthorizeOptions, AuthResult, User, TokenSet, StoredTokenData } from './types';
import { SSOError, SSOErrors } from './errors';
import { StorageAdapter } from './storage/StorageAdapter';
import { LocalStorageAdapter } from './storage/LocalStorage';
import { SessionStorageAdapter } from './storage/SessionStorage';
import { CookieStorageAdapter } from './storage/CookieStorage';
import { MemoryStorageAdapter } from './storage/MemoryStorage';
import { validateConfig, validateState, validateAuthCode, isTokenExpired } from './utils/validation';
import { generateState } from './utils/crypto';
import { buildUrl, getCallbackParams } from './utils/url';

/**
 * SSO Client for OAuth 2.0 Authorization Code Flow
 *
 * @example
 * ```typescript
 * const sso = new SSOClient({
 *   ssoUrl: 'http://localhost:3000',
 *   appId: 'your-app-id',
 *   appSecret: 'your-app-secret',
 *   redirectUri: 'http://localhost:3001/auth/callback'
 * });
 *
 * // Start login
 * await sso.authorize();
 *
 * // Handle callback
 * const { user, token } = await sso.handleCallback();
 * ```
 */
export class SSOClient {
  private readonly config: SSOConfig;
  private readonly storage: StorageAdapter;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(config: SSOConfig) {
    // Validate configuration
    validateConfig(config);

    // Set defaults
    this.config = {
      storage: 'localStorage',
      autoRefresh: true,
      ...config,
    };

    // Initialize storage adapter
    this.storage = this.createStorageAdapter(this.config.storage!);

    // Setup auto-refresh if enabled
    if (this.config.autoRefresh) {
      this.setupAutoRefresh();
    }
  }

  /**
   * Create storage adapter based on type
   */
  private createStorageAdapter(type: NonNullable<SSOConfig['storage']>): StorageAdapter {
    switch (type) {
      case 'localStorage':
        return new LocalStorageAdapter();
      case 'sessionStorage':
        return new SessionStorageAdapter();
      case 'cookie':
        return new CookieStorageAdapter();
      case 'memory':
        return new MemoryStorageAdapter();
      default:
        throw SSOErrors.invalidConfig(`Unsupported storage type: ${type}`);
    }
  }

  /**
   * Start authorization flow (redirect user to SSO server)
   *
   * @param options - Authorization options
   */
  async authorize(options?: AuthorizeOptions): Promise<void> {
    const state = options?.state || generateState();

    // Store state for CSRF verification
    await Promise.resolve(this.storage.setState(state));

    // Build authorization URL
    const authUrl = buildUrl(`${this.config.ssoUrl}/api/v1/authorize`, {
      app_id: this.config.appId,
      redirect_uri: this.config.redirectUri,
      state,
      ...options?.params,
    });

    // Redirect to SSO server
    if (typeof window !== 'undefined') {
      window.location.href = authUrl;
    } else {
      throw new Error('authorize() can only be called in browser environment');
    }
  }

  /**
   * Handle OAuth callback (exchange code for token)
   *
   * @returns User and token information
   */
  async handleCallback(): Promise<AuthResult> {
    const { code, state, error } = getCallbackParams();

    // Check for error
    if (error) {
      throw new SSOError('invalid_code', `Authorization failed: ${error}`);
    }

    // Validate code
    validateAuthCode(code);

    // Validate state (CSRF protection)
    const storedState = await Promise.resolve(this.storage.getState());
    validateState(state, storedState);

    // Clear state after validation
    await Promise.resolve(this.storage.removeState());

    // Exchange code for token
    const tokenData = await this.exchangeCode(code!);

    // Store token
    const storedData: StoredTokenData = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: Math.floor(Date.now() / 1000) + tokenData.expires_in,
    };
    await Promise.resolve(this.storage.setToken(storedData));

    // Fetch user info
    const user = await this.fetchUser(tokenData.access_token);
    storedData.user = user;
    await Promise.resolve(this.storage.setToken(storedData));

    // Setup auto-refresh
    if (this.config.autoRefresh) {
      this.setupAutoRefresh();
    }

    return {
      user,
      token: tokenData,
    };
  }

  /**
   * Exchange authorization code for access token
   */
  private async exchangeCode(code: string): Promise<TokenSet> {
    // Use backend proxy if configured (client-side mode)
    if (this.config.tokenExchangeUrl) {
      return this.exchangeCodeViaProxy(code);
    }

    // Direct exchange with SSO server (server-side mode)
    const response = await fetch(`${this.config.ssoUrl}/api/v1/token/exchange`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        app_id: this.config.appId,
        app_secret: this.config.appSecret,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw SSOErrors.networkError({
        status: response.status,
        error: error.error || 'token_exchange_failed',
      });
    }

    const data = await response.json();
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      token_type: 'Bearer',
    };
  }

  /**
   * Exchange code via backend proxy (client-side mode)
   */
  private async exchangeCodeViaProxy(code: string): Promise<TokenSet> {
    const response = await fetch(this.config.tokenExchangeUrl!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        redirect_uri: this.config.redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw SSOErrors.networkError({
        status: response.status,
        error: error.error || 'token_exchange_via_proxy_failed',
      });
    }

    const data = await response.json();
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      token_type: 'Bearer',
    };
  }

  /**
   * Fetch user information from SSO server
   */
  private async fetchUser(accessToken: string): Promise<User> {
    const response = await fetch(`${this.config.ssoUrl}/api/v1/user`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw SSOErrors.networkError({ status: response.status, error: 'user_fetch_failed' });
    }

    const data = await response.json();
    return data.user;
  }

  /**
   * Get current user information
   *
   * @returns User object or null if not authenticated
   */
  async getUser(): Promise<User | null> {
    const tokenData = await Promise.resolve(this.storage.getToken());

    if (!tokenData) {
      return null;
    }

    // Check if token is expired and refresh if needed
    if (isTokenExpired(tokenData.expires_at)) {
      await this.refreshToken();
      const newTokenData = await Promise.resolve(this.storage.getToken());
      return newTokenData?.user || null;
    }

    // Return cached user if available
    if (tokenData.user) {
      return tokenData.user;
    }

    // Fetch user if not cached
    const user = await this.fetchUser(tokenData.access_token);
    tokenData.user = user;
    await Promise.resolve(this.storage.setToken(tokenData));

    return user;
  }

  /**
   * Get access token (auto-refresh if expired)
   *
   * @returns Access token or null if not authenticated
   */
  async getAccessToken(): Promise<string | null> {
    const tokenData = await Promise.resolve(this.storage.getToken());

    if (!tokenData) {
      return null;
    }

    // Refresh if expired
    if (isTokenExpired(tokenData.expires_at)) {
      await this.refreshToken();
      const newTokenData = await Promise.resolve(this.storage.getToken());
      return newTokenData?.access_token || null;
    }

    return tokenData.access_token;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshToken(): Promise<void> {
    const tokenData = await Promise.resolve(this.storage.getToken());

    if (!tokenData || !tokenData.refresh_token) {
      throw SSOErrors.unauthorized();
    }

    try {
      const response = await fetch(`${this.config.ssoUrl}/api/v1/token/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: tokenData.refresh_token,
          app_id: this.config.appId,
        }),
      });

      if (!response.ok) {
        throw new Error('Refresh failed');
      }

      const data = await response.json();

      // Update stored token
      const newTokenData: StoredTokenData = {
        access_token: data.access_token,
        refresh_token: data.refresh_token || tokenData.refresh_token,
        expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
        user: tokenData.user,
      };

      await Promise.resolve(this.storage.setToken(newTokenData));

      // Setup auto-refresh
      if (this.config.autoRefresh) {
        this.setupAutoRefresh();
      }
    } catch (error) {
      await Promise.resolve(this.storage.removeToken());
      throw SSOErrors.tokenRefreshFailed(error);
    }
  }

  /**
   * Logout user (clear local tokens)
   *
   * @param revokeToken - Also revoke token on server (default: false)
   */
  async logout(revokeToken: boolean = false): Promise<void> {
    const tokenData = await Promise.resolve(this.storage.getToken());

    if (revokeToken && tokenData) {
      try {
        await fetch(`${this.config.ssoUrl}/api/v1/token/revoke`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        });
      } catch (error) {
        // Ignore revoke errors
        console.warn('Token revocation failed:', error);
      }
    }

    // Clear local storage
    await Promise.resolve(this.storage.clear());

    // Clear auto-refresh timer
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  /**
   * Check if user is authenticated
   *
   * @returns True if authenticated with valid token
   */
  async isAuthenticated(): Promise<boolean> {
    const tokenData = await Promise.resolve(this.storage.getToken());

    if (!tokenData) {
      return false;
    }

    // Auto-refresh if expired
    if (isTokenExpired(tokenData.expires_at)) {
      try {
        await this.refreshToken();
        return true;
      } catch {
        return false;
      }
    }

    return true;
  }

  /**
   * Setup auto-refresh timer
   */
  private setupAutoRefresh(): void {
    Promise.resolve(this.storage.getToken()).then((tokenData) => {
      if (!tokenData) {
        return;
      }

      // Clear existing timer
      if (this.refreshTimer) {
        clearTimeout(this.refreshTimer);
      }

      // Calculate refresh time (5 minutes before expiry)
      const expiresIn = tokenData.expires_at - Math.floor(Date.now() / 1000);
      const refreshIn = Math.max(0, (expiresIn - 300) * 1000); // 5 min buffer

      // Set refresh timer
      this.refreshTimer = setTimeout(async () => {
        try {
          await this.refreshToken();
        } catch (error) {
          console.error('Auto-refresh failed:', error);
        }
      }, refreshIn);
    });
  }
}
