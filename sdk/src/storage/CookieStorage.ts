/**
 * Cookie storage adapter for browser environments
 */

import { StoredTokenData } from '../types';
import { SSOErrors } from '../errors';
import { StorageAdapter, STORAGE_KEYS } from './StorageAdapter';

/**
 * Storage adapter using browser cookies
 * Can be configured as httpOnly for security (server-side only)
 */
export class CookieStorageAdapter extends StorageAdapter {
  private readonly cookieOptions: {
    path: string;
    secure: boolean;
    sameSite: 'strict' | 'lax' | 'none';
    maxAge: number; // in seconds
  };

  constructor(options?: Partial<CookieStorageAdapter['cookieOptions']>) {
    super();

    if (typeof document === 'undefined') {
      throw SSOErrors.storageError('Cookies are not available in this environment');
    }

    this.cookieOptions = {
      path: '/',
      secure: typeof window !== 'undefined' && window.location.protocol === 'https:',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      ...options,
    };
  }

  setToken(data: StoredTokenData): void {
    try {
      this.setCookie(STORAGE_KEYS.TOKEN, JSON.stringify(data));
    } catch (error) {
      throw SSOErrors.storageError(error);
    }
  }

  getToken(): StoredTokenData | null {
    try {
      const data = this.getCookie(STORAGE_KEYS.TOKEN);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      throw SSOErrors.storageError(error);
    }
  }

  removeToken(): void {
    try {
      this.deleteCookie(STORAGE_KEYS.TOKEN);
    } catch (error) {
      throw SSOErrors.storageError(error);
    }
  }

  setState(state: string): void {
    try {
      this.setCookie(STORAGE_KEYS.STATE, state);
    } catch (error) {
      throw SSOErrors.storageError(error);
    }
  }

  getState(): string | null {
    try {
      return this.getCookie(STORAGE_KEYS.STATE);
    } catch (error) {
      throw SSOErrors.storageError(error);
    }
  }

  removeState(): void {
    try {
      this.deleteCookie(STORAGE_KEYS.STATE);
    } catch (error) {
      throw SSOErrors.storageError(error);
    }
  }

  clear(): void {
    try {
      this.removeToken();
      this.removeState();
    } catch (error) {
      throw SSOErrors.storageError(error);
    }
  }

  /**
   * Set a cookie
   */
  private setCookie(name: string, value: string): void {
    const { path, secure, sameSite, maxAge } = this.cookieOptions;

    let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;
    cookie += `; path=${path}`;
    cookie += `; max-age=${maxAge}`;
    cookie += `; samesite=${sameSite}`;

    if (secure) {
      cookie += '; secure';
    }

    document.cookie = cookie;
  }

  /**
   * Get a cookie value
   */
  private getCookie(name: string): string | null {
    const cookies = document.cookie.split(';');

    for (const cookie of cookies) {
      const [key, value] = cookie.trim().split('=');
      if (decodeURIComponent(key) === name) {
        return value ? decodeURIComponent(value) : null;
      }
    }

    return null;
  }

  /**
   * Delete a cookie
   */
  private deleteCookie(name: string): void {
    const { path } = this.cookieOptions;
    document.cookie = `${encodeURIComponent(name)}=; path=${path}; max-age=0`;
  }
}
