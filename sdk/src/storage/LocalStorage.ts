/**
 * LocalStorage adapter for browser environments
 */

import { StoredTokenData } from '../types';
import { SSOErrors } from '../errors';
import { StorageAdapter, STORAGE_KEYS } from './StorageAdapter';

/**
 * Storage adapter using browser localStorage
 * Persists across browser sessions
 */
export class LocalStorageAdapter extends StorageAdapter {
  private storage: Storage;

  constructor() {
    super();

    if (typeof window === 'undefined' || !window.localStorage) {
      throw SSOErrors.storageError('localStorage is not available in this environment');
    }

    this.storage = window.localStorage;
  }

  setToken(data: StoredTokenData): void {
    try {
      this.storage.setItem(STORAGE_KEYS.TOKEN, JSON.stringify(data));
    } catch (error) {
      throw SSOErrors.storageError(error);
    }
  }

  getToken(): StoredTokenData | null {
    try {
      const data = this.storage.getItem(STORAGE_KEYS.TOKEN);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      throw SSOErrors.storageError(error);
    }
  }

  removeToken(): void {
    try {
      this.storage.removeItem(STORAGE_KEYS.TOKEN);
    } catch (error) {
      throw SSOErrors.storageError(error);
    }
  }

  setState(state: string): void {
    try {
      this.storage.setItem(STORAGE_KEYS.STATE, state);
    } catch (error) {
      throw SSOErrors.storageError(error);
    }
  }

  getState(): string | null {
    try {
      return this.storage.getItem(STORAGE_KEYS.STATE);
    } catch (error) {
      throw SSOErrors.storageError(error);
    }
  }

  removeState(): void {
    try {
      this.storage.removeItem(STORAGE_KEYS.STATE);
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
}
