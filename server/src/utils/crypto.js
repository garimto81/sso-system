/**
 * Crypto utilities for API key/secret generation and validation
 *
 * Functions:
 * - generateApiKey(): Generate UUID v4 for public API key
 * - generateApiSecret(): Generate 64-char hex string for secret
 * - hashSecret(): Hash API secret using bcrypt
 * - verifySecret(): Verify plain secret against bcrypt hash
 *
 * Security:
 * - API keys are UUIDs (publicly visible, identify the app)
 * - API secrets are 256-bit random values (must be kept secret)
 * - Secrets are hashed with bcrypt (10 rounds) before storage
 * - Never store or return plain secrets except on creation/regeneration
 */

import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const BCRYPT_ROUNDS = 10;

/**
 * Generate secure API key (UUID format)
 *
 * @returns {string} UUID v4 (e.g., "a3f2b8c1-1234-5678-90ab-cdef12345678")
 *
 * @example
 * const apiKey = generateApiKey();
 * console.log(apiKey); // "a3f2b8c1-1234-5678-90ab-cdef12345678"
 */
export function generateApiKey() {
  return crypto.randomUUID();
}

/**
 * Generate secure API secret (64-char hex)
 *
 * @returns {string} 64-character hex string (256 bits of entropy)
 *
 * @example
 * const apiSecret = generateApiSecret();
 * console.log(apiSecret); // "a1b2c3d4e5f6... (64 chars)"
 */
export function generateApiSecret() {
  return crypto.randomBytes(32).toString('hex'); // 32 bytes = 64 hex chars
}

/**
 * Hash API secret using bcrypt
 *
 * @param {string} secret - Plain text secret
 * @returns {Promise<string>} Bcrypt hash
 *
 * @example
 * const secret = generateApiSecret();
 * const hash = await hashSecret(secret);
 * console.log(hash); // "$2a$10$..."
 */
export async function hashSecret(secret) {
  return await bcrypt.hash(secret, BCRYPT_ROUNDS);
}

/**
 * Verify API secret against hash
 *
 * @param {string} secret - Plain text secret to verify
 * @param {string} hash - Bcrypt hash to compare against
 * @returns {Promise<boolean>} True if secret matches hash
 *
 * @example
 * const isValid = await verifySecret(plainSecret, storedHash);
 * if (isValid) {
 *   console.log('Secret is valid');
 * }
 */
export async function verifySecret(secret, hash) {
  return await bcrypt.compare(secret, hash);
}

export default {
  generateApiKey,
  generateApiSecret,
  hashSecret,
  verifySecret,
};
