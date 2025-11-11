/**
 * Validation utilities for SDK configuration and parameters
 */

import { SSOConfig } from '../types';
import { SSOErrors } from '../errors';
import { isValidUrl } from './url';

/**
 * Validate SSO configuration
 *
 * @param config - SSO configuration object
 * @throws {SSOError} If configuration is invalid
 */
export function validateConfig(config: Partial<SSOConfig>): void {
  const errors: string[] = [];

  // Required fields
  if (!config.ssoUrl) {
    errors.push('ssoUrl is required');
  } else if (!isValidUrl(config.ssoUrl)) {
    errors.push('ssoUrl must be a valid URL');
  }

  if (!config.appId) {
    errors.push('appId is required');
  }

  if (!config.appSecret) {
    errors.push('appSecret is required');
  }

  if (!config.redirectUri) {
    errors.push('redirectUri is required');
  } else if (!isValidUrl(config.redirectUri)) {
    errors.push('redirectUri must be a valid URL');
  }

  // Storage type validation
  if (config.storage) {
    const validStorage = ['localStorage', 'sessionStorage', 'cookie', 'memory'];
    if (!validStorage.includes(config.storage)) {
      errors.push(`storage must be one of: ${validStorage.join(', ')}`);
    }
  }

  if (errors.length > 0) {
    throw SSOErrors.invalidConfig(`Invalid configuration:\n  - ${errors.join('\n  - ')}`);
  }
}

/**
 * Validate state parameter (CSRF protection)
 *
 * @param receivedState - State from callback URL
 * @param storedState - State stored before authorization
 * @throws {SSOError} If states don't match
 */
export function validateState(receivedState: string | undefined, storedState: string | undefined | null): void {
  if (!receivedState || !storedState) {
    throw SSOErrors.invalidState();
  }

  if (receivedState !== storedState) {
    throw SSOErrors.invalidState();
  }
}

/**
 * Validate authorization code
 *
 * @param code - Authorization code from callback
 * @throws {SSOError} If code is invalid
 */
export function validateAuthCode(code: string | undefined): void {
  if (!code || typeof code !== 'string' || code.length === 0) {
    throw SSOErrors.invalidCode();
  }
}

/**
 * Check if token is expired
 *
 * @param expiresAt - Unix timestamp of token expiration
 * @param bufferSeconds - Buffer time before expiry (default: 60 seconds)
 * @returns True if token is expired or will expire soon
 */
export function isTokenExpired(expiresAt: number, bufferSeconds: number = 60): boolean {
  const now = Math.floor(Date.now() / 1000);
  return now >= expiresAt - bufferSeconds;
}

/**
 * Validate user object
 *
 * @param user - User object to validate
 * @returns True if user object is valid
 */
export function isValidUser(user: unknown): boolean {
  if (!user || typeof user !== 'object') {
    return false;
  }

  const u = user as Record<string, unknown>;
  return (
    typeof u.id === 'string' &&
    typeof u.email === 'string' &&
    ['user', 'app_owner', 'admin'].includes(u.role as string)
  );
}
