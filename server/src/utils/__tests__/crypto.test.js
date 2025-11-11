/**
 * Tests for Crypto Utilities
 *
 * Test Coverage:
 * - API key generation (UUID format)
 * - API secret generation (64-char hex)
 * - Secret hashing (bcrypt)
 * - Secret verification (bcrypt compare)
 * - Uniqueness and security
 */

import { describe, it, expect } from '@jest/globals';
import {
  generateApiKey,
  generateApiSecret,
  hashSecret,
  verifySecret,
} from '../crypto.js';

describe('Crypto Utilities', () => {
  describe('generateApiKey', () => {
    it('should generate valid UUID v4', () => {
      const apiKey = generateApiKey();

      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      expect(apiKey).toMatch(uuidRegex);
    });

    it('should generate unique keys', () => {
      const keys = new Set();
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        keys.add(generateApiKey());
      }

      // All keys should be unique
      expect(keys.size).toBe(iterations);
    });

    it('should generate keys with correct length', () => {
      const apiKey = generateApiKey();

      // UUID format with hyphens: 36 characters
      expect(apiKey).toHaveLength(36);
    });

    it('should generate lowercase UUID', () => {
      const apiKey = generateApiKey();

      expect(apiKey).toBe(apiKey.toLowerCase());
    });

    it('should not contain invalid characters', () => {
      const apiKey = generateApiKey();

      // UUID should only contain hex digits and hyphens
      const validChars = /^[0-9a-f-]+$/i;
      expect(apiKey).toMatch(validChars);
    });
  });

  describe('generateApiSecret', () => {
    it('should generate 64-char hex string', () => {
      const secret = generateApiSecret();

      expect(secret).toHaveLength(64);
      expect(secret).toMatch(/^[0-9a-f]{64}$/);
    });

    it('should generate unique secrets', () => {
      const secrets = new Set();
      const iterations = 100;

      for (let i = 0; i < iterations; i++) {
        secrets.add(generateApiSecret());
      }

      // All secrets should be unique
      expect(secrets.size).toBe(iterations);
    });

    it('should only contain hexadecimal characters', () => {
      const secret = generateApiSecret();

      const hexRegex = /^[0-9a-f]+$/;
      expect(secret).toMatch(hexRegex);
    });

    it('should not contain uppercase letters', () => {
      const secret = generateApiSecret();

      expect(secret).toBe(secret.toLowerCase());
    });

    it('should generate cryptographically random secrets', () => {
      const secret1 = generateApiSecret();
      const secret2 = generateApiSecret();

      // Different secrets should not have the same prefix
      expect(secret1.substring(0, 10)).not.toBe(secret2.substring(0, 10));
    });

    it('should generate secrets with high entropy', () => {
      const secret = generateApiSecret();

      // Count unique characters (should be diverse)
      const uniqueChars = new Set(secret.split('')).size;

      // Expect at least 10 unique hex characters (out of 16 possible)
      expect(uniqueChars).toBeGreaterThanOrEqual(10);
    });
  });

  describe('hashSecret', () => {
    it('should hash secret with bcrypt', async () => {
      const plainSecret = 'my-secret-key-123';
      const hash = await hashSecret(plainSecret);

      // Bcrypt hash format: $2a$10$...
      expect(hash).toMatch(/^\$2[aby]\$\d+\$/);
    });

    it('should generate different hashes for same input', async () => {
      const plainSecret = 'same-secret';

      const hash1 = await hashSecret(plainSecret);
      const hash2 = await hashSecret(plainSecret);

      // Hashes should be different due to random salt
      expect(hash1).not.toBe(hash2);
    });

    it('should use bcrypt cost factor 10', async () => {
      const plainSecret = 'test-secret';
      const hash = await hashSecret(plainSecret);

      // Check if hash uses cost factor 10 ($2a$10$)
      expect(hash.startsWith('$2a$10$') || hash.startsWith('$2b$10$')).toBe(
        true
      );
    });

    it('should handle empty string', async () => {
      const hash = await hashSecret('');

      expect(hash).toMatch(/^\$2[aby]\$\d+\$/);
    });

    it('should handle long secrets', async () => {
      const longSecret = 'a'.repeat(1000);
      const hash = await hashSecret(longSecret);

      expect(hash).toMatch(/^\$2[aby]\$\d+\$/);
    });

    it('should handle special characters', async () => {
      const specialSecret = '!@#$%^&*()_+-=[]{}|;:\'",.<>?/~`';
      const hash = await hashSecret(specialSecret);

      expect(hash).toMatch(/^\$2[aby]\$\d+\$/);
    });

    it('should hash consistently produce verifiable hashes', async () => {
      const plainSecret = 'verify-me';
      const hash = await hashSecret(plainSecret);

      // Verify the hash works with bcrypt.compare
      const bcrypt = await import('bcryptjs');
      const isValid = await bcrypt.compare(plainSecret, hash);

      expect(isValid).toBe(true);
    });
  });

  describe('verifySecret', () => {
    it('should verify correct secret', async () => {
      const plainSecret = 'correct-secret';
      const hash = await hashSecret(plainSecret);

      const isValid = await verifySecret(plainSecret, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect secret', async () => {
      const plainSecret = 'correct-secret';
      const hash = await hashSecret(plainSecret);

      const isValid = await verifySecret('wrong-secret', hash);

      expect(isValid).toBe(false);
    });

    it('should handle case-sensitive comparison', async () => {
      const plainSecret = 'CaseSensitive';
      const hash = await hashSecret(plainSecret);

      const isValid = await verifySecret('casesensitive', hash);

      expect(isValid).toBe(false);
    });

    it('should reject empty secret against valid hash', async () => {
      const plainSecret = 'non-empty';
      const hash = await hashSecret(plainSecret);

      const isValid = await verifySecret('', hash);

      expect(isValid).toBe(false);
    });

    it('should reject secret against invalid hash', async () => {
      const plainSecret = 'test-secret';
      const invalidHash = 'not-a-valid-bcrypt-hash';

      await expect(verifySecret(plainSecret, invalidHash)).rejects.toThrow();
    });

    it('should handle whitespace differences', async () => {
      const plainSecret = 'secret';
      const hash = await hashSecret(plainSecret);

      const isValid = await verifySecret('secret ', hash);

      expect(isValid).toBe(false);
    });

    it('should verify generated API secret', async () => {
      const apiSecret = generateApiSecret();
      const hash = await hashSecret(apiSecret);

      const isValid = await verifySecret(apiSecret, hash);

      expect(isValid).toBe(true);
    });

    it('should handle unicode characters', async () => {
      const unicodeSecret = '你好世界🚀';
      const hash = await hashSecret(unicodeSecret);

      const isValid = await verifySecret(unicodeSecret, hash);

      expect(isValid).toBe(true);
    });
  });

  describe('Security best practices', () => {
    it('should generate secrets with sufficient entropy', () => {
      const secret = generateApiSecret();

      // 64 hex chars = 32 bytes = 256 bits of entropy
      expect(secret).toHaveLength(64);
    });

    it('should use secure random number generator', () => {
      // Generate multiple secrets and check distribution
      const secrets = Array.from({ length: 10 }, () => generateApiSecret());

      // All should be unique
      const uniqueSecrets = new Set(secrets);
      expect(uniqueSecrets.size).toBe(10);

      // No obvious patterns (no all zeros, all ones, etc.)
      expect(secrets.every((s) => s !== '0'.repeat(64))).toBe(true);
      expect(secrets.every((s) => s !== 'f'.repeat(64))).toBe(true);
    });

    it('should produce hashes resistant to timing attacks', async () => {
      const secret = 'timing-test-secret';
      const hash = await hashSecret(secret);

      // bcrypt is designed to be slow and constant-time
      // Just verify it works as expected
      const start1 = Date.now();
      await verifySecret('wrong', hash);
      const time1 = Date.now() - start1;

      const start2 = Date.now();
      await verifySecret(secret, hash);
      const time2 = Date.now() - start2;

      // Both should take similar time (bcrypt constant time)
      // Allow 100ms variance
      expect(Math.abs(time1 - time2)).toBeLessThan(100);
    });
  });

  describe('Edge cases', () => {
    it('should handle null inputs gracefully', async () => {
      await expect(hashSecret(null)).rejects.toThrow();
      await expect(verifySecret(null, 'hash')).rejects.toThrow();
    });

    it('should handle undefined inputs gracefully', async () => {
      await expect(hashSecret(undefined)).rejects.toThrow();
    });

    it('should reject non-string inputs', async () => {
      await expect(hashSecret(123)).rejects.toThrow();
      await expect(hashSecret({ key: 'value' })).rejects.toThrow();
    });
  });
});
