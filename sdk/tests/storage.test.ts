/**
 * Storage adapters unit tests
 */

import { MemoryStorageAdapter } from '../src/storage/MemoryStorage';
import { StoredTokenData } from '../src/types';
import { STORAGE_KEYS } from '../src/storage/StorageAdapter';

describe('Storage Adapters', () => {
  describe('MemoryStorageAdapter', () => {
    let storage: MemoryStorageAdapter;

    beforeEach(() => {
      storage = new MemoryStorageAdapter();
    });

    it('should store and retrieve token data', () => {
      const tokenData: StoredTokenData = {
        access_token: 'test-token',
        refresh_token: 'refresh-token',
        expires_at: Date.now() + 3600000,
      };

      storage.setToken(tokenData);
      const retrieved = storage.getToken();

      expect(retrieved).toEqual(tokenData);
    });

    it('should return null when no token exists', () => {
      const token = storage.getToken();
      expect(token).toBeNull();
    });

    it('should remove token data', () => {
      const tokenData: StoredTokenData = {
        access_token: 'test-token',
        refresh_token: 'refresh-token',
        expires_at: Date.now() + 3600000,
      };

      storage.setToken(tokenData);
      storage.removeToken();

      const retrieved = storage.getToken();
      expect(retrieved).toBeNull();
    });

    it('should store and retrieve state', () => {
      const state = 'test-state-123';

      storage.setState(state);
      const retrieved = storage.getState();

      expect(retrieved).toBe(state);
    });

    it('should return null when no state exists', () => {
      const state = storage.getState();
      expect(state).toBeNull();
    });

    it('should remove state', () => {
      storage.setState('test-state');
      storage.removeState();

      const retrieved = storage.getState();
      expect(retrieved).toBeNull();
    });

    it('should clear all data', () => {
      const tokenData: StoredTokenData = {
        access_token: 'test-token',
        refresh_token: 'refresh-token',
        expires_at: Date.now() + 3600000,
      };

      storage.setToken(tokenData);
      storage.setState('test-state');
      storage.clear();

      expect(storage.getToken()).toBeNull();
      expect(storage.getState()).toBeNull();
    });
  });
});
