/**
 * Abstract storage adapter interface
 */

import { StoredTokenData } from '../types';

/**
 * Storage keys used by the SDK
 */
export const STORAGE_KEYS = {
  TOKEN: 'sso_token_data',
  STATE: 'sso_auth_state',
} as const;

/**
 * Abstract base class for storage adapters
 */
export abstract class StorageAdapter {
  /**
   * Store token data
   */
  abstract setToken(data: StoredTokenData): Promise<void> | void;

  /**
   * Retrieve token data
   */
  abstract getToken(): Promise<StoredTokenData | null> | StoredTokenData | null;

  /**
   * Remove token data
   */
  abstract removeToken(): Promise<void> | void;

  /**
   * Store state parameter
   */
  abstract setState(state: string): Promise<void> | void;

  /**
   * Retrieve state parameter
   */
  abstract getState(): Promise<string | null> | string | null;

  /**
   * Remove state parameter
   */
  abstract removeState(): Promise<void> | void;

  /**
   * Clear all stored data
   */
  abstract clear(): Promise<void> | void;
}
