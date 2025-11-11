/**
 * Utility functions unit tests
 */

import { parseQueryParams, buildQueryString, buildUrl, isValidUrl } from '../src/utils/url';
import { isTokenExpired, validateAuthCode, validateState } from '../src/utils/validation';
import { generateState } from '../src/utils/crypto';

describe('URL Utils', () => {
  describe('parseQueryParams', () => {
    it('should parse query parameters from URL', () => {
      const url = 'http://example.com?code=123&state=abc';
      const params = parseQueryParams(url);

      expect(params).toEqual({
        code: '123',
        state: 'abc',
      });
    });

    it('should parse query string without URL', () => {
      const queryString = 'code=123&state=abc';
      const params = parseQueryParams(queryString);

      expect(params).toEqual({
        code: '123',
        state: 'abc',
      });
    });

    it('should decode URL-encoded values', () => {
      const url = 'http://example.com?message=hello%20world';
      const params = parseQueryParams(url);

      expect(params.message).toBe('hello world');
    });

    it('should return empty object for empty query string', () => {
      const params = parseQueryParams('');
      expect(params).toEqual({});
    });
  });

  describe('buildQueryString', () => {
    it('should build query string from object', () => {
      const params = {
        code: '123',
        state: 'abc',
      };

      const queryString = buildQueryString(params);
      expect(queryString).toBe('code=123&state=abc');
    });

    it('should URL-encode values', () => {
      const params = {
        message: 'hello world',
      };

      const queryString = buildQueryString(params);
      expect(queryString).toBe('message=hello%20world');
    });

    it('should skip undefined values', () => {
      const params = {
        code: '123',
        state: undefined,
      };

      const queryString = buildQueryString(params);
      expect(queryString).toBe('code=123');
    });
  });

  describe('buildUrl', () => {
    it('should build full URL with query params', () => {
      const baseUrl = 'http://example.com/authorize';
      const params = {
        code: '123',
        state: 'abc',
      };

      const url = buildUrl(baseUrl, params);
      expect(url).toBe('http://example.com/authorize?code=123&state=abc');
    });

    it('should return base URL when no params', () => {
      const baseUrl = 'http://example.com/authorize';
      const url = buildUrl(baseUrl, {});

      expect(url).toBe(baseUrl);
    });
  });

  describe('isValidUrl', () => {
    it('should return true for valid URLs', () => {
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl('example.com')).toBe(false);
    });
  });
});

describe('Validation Utils', () => {
  describe('validateAuthCode', () => {
    it('should not throw for valid code', () => {
      expect(() => validateAuthCode('valid-code-123')).not.toThrow();
    });

    it('should throw for undefined code', () => {
      expect(() => validateAuthCode(undefined)).toThrow();
    });

    it('should throw for empty code', () => {
      expect(() => validateAuthCode('')).toThrow();
    });
  });

  describe('validateState', () => {
    it('should not throw when states match', () => {
      expect(() => validateState('abc123', 'abc123')).not.toThrow();
    });

    it('should throw when states do not match', () => {
      expect(() => validateState('abc123', 'def456')).toThrow();
    });

    it('should throw when received state is undefined', () => {
      expect(() => validateState(undefined, 'abc123')).toThrow();
    });

    it('should throw when stored state is undefined', () => {
      expect(() => validateState('abc123', undefined)).toThrow();
    });
  });

  describe('isTokenExpired', () => {
    it('should return false for valid token', () => {
      const expiresAt = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
      expect(isTokenExpired(expiresAt)).toBe(false);
    });

    it('should return true for expired token', () => {
      const expiresAt = Math.floor(Date.now() / 1000) - 100; // 100 seconds ago
      expect(isTokenExpired(expiresAt)).toBe(true);
    });

    it('should return true for token expiring soon (within buffer)', () => {
      const expiresAt = Math.floor(Date.now() / 1000) + 30; // 30 seconds from now
      expect(isTokenExpired(expiresAt, 60)).toBe(true); // 60 second buffer
    });
  });
});

describe('Crypto Utils', () => {
  describe('generateState', () => {
    it('should generate random state', () => {
      const state = generateState();
      expect(state).toHaveLength(32);
      expect(state).toMatch(/^[0-9a-f]+$/);
    });

    it('should generate different states', () => {
      const state1 = generateState();
      const state2 = generateState();
      expect(state1).not.toBe(state2);
    });

    it('should generate state with custom length', () => {
      const state = generateState(64);
      expect(state).toHaveLength(64);
    });
  });
});
