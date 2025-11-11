/**
 * SSO SDK Type Definitions
 * @packageDocumentation
 */

/**
 * User profile information
 */
export interface User {
  id: string;
  email: string;
  display_name?: string;
  role: 'user' | 'app_owner' | 'admin';
}

/**
 * OAuth 2.0 token set
 */
export interface TokenSet {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: 'Bearer';
}

/**
 * Authentication result containing user and tokens
 */
export interface AuthResult {
  user: User;
  token: TokenSet;
}

/**
 * Storage types supported by the SDK
 */
export type StorageType = 'localStorage' | 'sessionStorage' | 'cookie' | 'memory';

/**
 * SSO Client configuration options
 */
export interface SSOConfig {
  /** SSO server URL (e.g., http://localhost:3000) */
  ssoUrl: string;

  /** Application API key */
  appId: string;

  /** Application secret (server-side only) */
  appSecret: string;

  /** OAuth 2.0 redirect URI */
  redirectUri: string;

  /** Token storage type (default: localStorage) */
  storage?: StorageType;

  /** Auto-refresh tokens before expiry (default: true) */
  autoRefresh?: boolean;
}

/**
 * Authorization options
 */
export interface AuthorizeOptions {
  /** Custom state parameter for CSRF protection */
  state?: string;

  /** Additional query parameters */
  params?: Record<string, string>;
}

/**
 * Stored token data
 */
export interface StoredTokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number; // Unix timestamp
  user?: User;
}
