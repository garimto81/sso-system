/**
 * Memory storage adapter (for server-side or testing)
 */

import { StoredTokenData } from '../types';
import { StorageAdapter } from './StorageAdapter';

/**
 * Storage adapter using in-memory storage
 * Data is lost when process restarts
 * Useful for server-side rendering or testing
 */
export class MemoryStorageAdapter extends StorageAdapter {
  private tokenData: StoredTokenData | null = null;
  private stateData: string | null = null;

  setToken(data: StoredTokenData): void {
    this.tokenData = data;
  }

  getToken(): StoredTokenData | null {
    return this.tokenData;
  }

  removeToken(): void {
    this.tokenData = null;
  }

  setState(state: string): void {
    this.stateData = state;
  }

  getState(): string | null {
    return this.stateData;
  }

  removeState(): void {
    this.stateData = null;
  }

  clear(): void {
    this.tokenData = null;
    this.stateData = null;
  }
}
