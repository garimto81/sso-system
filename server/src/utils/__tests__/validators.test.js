/**
 * Tests for Validation Utilities
 *
 * Test Coverage:
 * - URL validation
 * - URL array validation
 * - App name validation
 * - Auth method validation
 * - UUID validation
 * - Email validation (if implemented)
 */

import { describe, it, expect } from '@jest/globals';
import {
  isValidUrl,
  validateUrls,
  validateAppName,
  validateAuthMethod,
  isValidUuid,
} from '../validators.js';

describe('Validators', () => {
  describe('isValidUrl', () => {
    it('should accept valid HTTP URLs', () => {
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('http://localhost:3000')).toBe(true);
      expect(isValidUrl('http://192.168.1.1:8080')).toBe(true);
    });

    it('should accept valid HTTPS URLs', () => {
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('https://www.example.com')).toBe(true);
      expect(isValidUrl('https://sub.domain.example.com')).toBe(true);
    });

    it('should accept URLs with paths', () => {
      expect(isValidUrl('https://example.com/path')).toBe(true);
      expect(isValidUrl('https://example.com/path/to/resource')).toBe(true);
      expect(isValidUrl('https://example.com/callback?code=123')).toBe(true);
    });

    it('should accept URLs with ports', () => {
      expect(isValidUrl('http://localhost:3000')).toBe(true);
      expect(isValidUrl('https://example.com:8443')).toBe(true);
      expect(isValidUrl('http://192.168.1.1:8080/api')).toBe(true);
    });

    it('should reject invalid URLs', () => {
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('ftp://example.com')).toBe(false);
      expect(isValidUrl('javascript:alert(1)')).toBe(false);
      expect(isValidUrl('file:///etc/passwd')).toBe(false);
    });

    it('should reject empty strings', () => {
      expect(isValidUrl('')).toBe(false);
    });

    it('should reject null and undefined', () => {
      expect(isValidUrl(null)).toBe(false);
      expect(isValidUrl(undefined)).toBe(false);
    });

    it('should reject URLs without protocol', () => {
      expect(isValidUrl('example.com')).toBe(false);
      expect(isValidUrl('www.example.com')).toBe(false);
    });

    it('should handle URLs with fragments', () => {
      expect(isValidUrl('https://example.com/page#section')).toBe(true);
    });

    it('should handle URLs with query parameters', () => {
      expect(isValidUrl('https://example.com?param=value')).toBe(true);
      expect(isValidUrl('https://example.com?a=1&b=2')).toBe(true);
    });

    it('should reject malformed URLs', () => {
      expect(isValidUrl('http://')).toBe(false);
      expect(isValidUrl('https://')).toBe(false);
      expect(isValidUrl('http://.')).toBe(false);
    });
  });

  describe('validateUrls', () => {
    it('should validate array of valid URLs', () => {
      const urls = [
        'http://localhost:3000',
        'https://example.com',
        'https://app.example.com/callback',
      ];

      expect(validateUrls(urls)).toBe(true);
    });

    it('should reject array with invalid URLs', () => {
      const urls = [
        'http://localhost:3000',
        'not-a-url',
        'https://example.com',
      ];

      expect(validateUrls(urls)).toBe(false);
    });

    it('should reject empty arrays', () => {
      expect(validateUrls([])).toBe(false);
    });

    it('should reject non-arrays', () => {
      expect(validateUrls('http://example.com')).toBe(false);
      expect(validateUrls(null)).toBe(false);
      expect(validateUrls(undefined)).toBe(false);
      expect(validateUrls({})).toBe(false);
    });

    it('should handle array with single URL', () => {
      expect(validateUrls(['https://example.com'])).toBe(true);
    });

    it('should reject array with null/undefined elements', () => {
      expect(validateUrls([null])).toBe(false);
      expect(validateUrls([undefined])).toBe(false);
      expect(validateUrls(['https://example.com', null])).toBe(false);
    });

    it('should reject array with non-string elements', () => {
      expect(validateUrls([123])).toBe(false);
      expect(validateUrls([{ url: 'https://example.com' }])).toBe(false);
    });

    it('should handle large arrays', () => {
      const urls = Array(100).fill('https://example.com');
      expect(validateUrls(urls)).toBe(true);
    });
  });

  describe('validateAppName', () => {
    it('should accept valid names', () => {
      expect(validateAppName('My App')).toBe(true);
      expect(validateAppName('OJT Platform')).toBe(true);
      expect(validateAppName('HR-System')).toBe(true);
      expect(validateAppName('App123')).toBe(true);
    });

    it('should reject short names (<3 chars)', () => {
      expect(validateAppName('AB')).toBe(false);
      expect(validateAppName('A')).toBe(false);
      expect(validateAppName('')).toBe(false);
    });

    it('should reject long names (>100 chars)', () => {
      const longName = 'A'.repeat(101);
      expect(validateAppName(longName)).toBe(false);
    });

    it('should accept name with exactly 3 chars', () => {
      expect(validateAppName('App')).toBe(true);
    });

    it('should accept name with exactly 100 chars', () => {
      const maxName = 'A'.repeat(100);
      expect(validateAppName(maxName)).toBe(true);
    });

    it('should accept alphanumeric names', () => {
      expect(validateAppName('App123')).toBe(true);
      expect(validateAppName('123App')).toBe(true);
    });

    it('should accept names with spaces', () => {
      expect(validateAppName('My App Name')).toBe(true);
      expect(validateAppName('App With Spaces')).toBe(true);
    });

    it('should accept names with hyphens', () => {
      expect(validateAppName('My-App')).toBe(true);
      expect(validateAppName('App-Name-123')).toBe(true);
    });

    it('should reject names with special characters', () => {
      expect(validateAppName('App@Name')).toBe(false);
      expect(validateAppName('App$Name')).toBe(false);
      expect(validateAppName('App<script>')).toBe(false);
    });

    it('should reject null and undefined', () => {
      expect(validateAppName(null)).toBe(false);
      expect(validateAppName(undefined)).toBe(false);
    });

    it('should reject non-string inputs', () => {
      expect(validateAppName(123)).toBe(false);
      expect(validateAppName({})).toBe(false);
      expect(validateAppName([])).toBe(false);
    });

    it('should trim whitespace before validation', () => {
      expect(validateAppName('  App  ')).toBe(true);
      expect(validateAppName('  AB  ')).toBe(false); // Too short after trim
    });
  });

  describe('validateAuthMethod', () => {
    it('should accept valid methods', () => {
      expect(validateAuthMethod('token_exchange')).toBe(true);
      expect(validateAuthMethod('shared_cookie')).toBe(true);
      expect(validateAuthMethod('hybrid')).toBe(true);
    });

    it('should reject invalid methods', () => {
      expect(validateAuthMethod('oauth')).toBe(false);
      expect(validateAuthMethod('saml')).toBe(false);
      expect(validateAuthMethod('basic')).toBe(false);
      expect(validateAuthMethod('invalid')).toBe(false);
    });

    it('should be case-sensitive', () => {
      expect(validateAuthMethod('TOKEN_EXCHANGE')).toBe(false);
      expect(validateAuthMethod('Token_Exchange')).toBe(false);
      expect(validateAuthMethod('HYBRID')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(validateAuthMethod('')).toBe(false);
    });

    it('should reject null and undefined', () => {
      expect(validateAuthMethod(null)).toBe(false);
      expect(validateAuthMethod(undefined)).toBe(false);
    });

    it('should reject non-string inputs', () => {
      expect(validateAuthMethod(123)).toBe(false);
      expect(validateAuthMethod({})).toBe(false);
      expect(validateAuthMethod(['token_exchange'])).toBe(false);
    });
  });

  describe('isValidUuid', () => {
    it('should accept valid UUIDs', () => {
      expect(isValidUuid('a3f2b8c1-1234-5678-90ab-cdef12345678')).toBe(true);
      expect(isValidUuid('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(isValidUuid('6ba7b810-9dad-11d1-80b4-00c04fd430c8')).toBe(true);
    });

    it('should accept UUID v4', () => {
      // UUID v4 has '4' in the third group
      expect(isValidUuid('a3f2b8c1-1234-4678-90ab-cdef12345678')).toBe(true);
    });

    it('should reject invalid UUIDs', () => {
      expect(isValidUuid('not-a-uuid')).toBe(false);
      expect(isValidUuid('12345678')).toBe(false);
      expect(isValidUuid('a3f2b8c1-1234-5678-90ab')).toBe(false); // Too short
    });

    it('should reject UUIDs without hyphens', () => {
      expect(isValidUuid('a3f2b8c112345678a90abcdef12345678')).toBe(false);
    });

    it('should reject UUIDs with wrong format', () => {
      expect(isValidUuid('a3f2b8c1-12-34-56-78-90ab-cdef12345678')).toBe(
        false
      );
      expect(isValidUuid('a3f2b8c1123456789012345678901234')).toBe(false);
    });

    it('should handle uppercase UUIDs', () => {
      expect(isValidUuid('A3F2B8C1-1234-5678-90AB-CDEF12345678')).toBe(true);
    });

    it('should handle mixed case UUIDs', () => {
      expect(isValidUuid('a3F2b8C1-1234-5678-90Ab-CdEf12345678')).toBe(true);
    });

    it('should reject empty string', () => {
      expect(isValidUuid('')).toBe(false);
    });

    it('should reject null and undefined', () => {
      expect(isValidUuid(null)).toBe(false);
      expect(isValidUuid(undefined)).toBe(false);
    });

    it('should reject non-string inputs', () => {
      expect(isValidUuid(123)).toBe(false);
      expect(isValidUuid({})).toBe(false);
      expect(isValidUuid([])).toBe(false);
    });

    it('should reject UUIDs with invalid characters', () => {
      expect(isValidUuid('a3f2b8c1-1234-5678-90ab-cdef1234567g')).toBe(false); // 'g' not hex
      expect(isValidUuid('a3f2b8c1-1234-5678-90ab-cdef1234567@')).toBe(false);
    });
  });

  describe('Edge cases', () => {
    it('should handle extremely long strings', () => {
      const longString = 'a'.repeat(10000);
      expect(validateAppName(longString)).toBe(false);
      expect(isValidUrl(longString)).toBe(false);
    });

    it('should handle special unicode characters', () => {
      expect(validateAppName('App™')).toBe(false);
      expect(validateAppName('App®')).toBe(false);
      expect(validateAppName('App你好')).toBe(false);
    });

    it('should handle URLs with encoded characters', () => {
      expect(isValidUrl('https://example.com/path%20with%20spaces')).toBe(
        true
      );
      expect(isValidUrl('https://example.com/?param=%E4%BD%A0%E5%A5%BD')).toBe(
        true
      );
    });

    it('should handle IP addresses in URLs', () => {
      expect(isValidUrl('http://127.0.0.1:3000')).toBe(true);
      expect(isValidUrl('https://192.168.1.1')).toBe(true);
      expect(isValidUrl('http://10.0.0.1:8080/api')).toBe(true);
    });
  });

  describe('Security validation', () => {
    it('should reject javascript: protocol URLs', () => {
      expect(isValidUrl('javascript:alert(1)')).toBe(false);
      expect(isValidUrl('javascript:void(0)')).toBe(false);
    });

    it('should reject data: protocol URLs', () => {
      expect(isValidUrl('data:text/html,<script>alert(1)</script>')).toBe(
        false
      );
    });

    it('should reject file: protocol URLs', () => {
      expect(isValidUrl('file:///etc/passwd')).toBe(false);
      expect(isValidUrl('file://C:/Windows/System32')).toBe(false);
    });

    it('should sanitize app names for XSS', () => {
      expect(validateAppName('<script>alert(1)</script>')).toBe(false);
      expect(validateAppName('App<img src=x onerror=alert(1)>')).toBe(false);
    });

    it('should reject SQL injection attempts in names', () => {
      expect(validateAppName("App'; DROP TABLE apps;--")).toBe(false);
      expect(validateAppName('App" OR 1=1--')).toBe(false);
    });
  });
});
