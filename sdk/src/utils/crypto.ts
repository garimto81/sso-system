/**
 * Cryptographic utilities for state generation
 */

/**
 * Generate a random state parameter for CSRF protection
 * Uses crypto.getRandomValues() in browsers or crypto.randomBytes() in Node.js
 *
 * @param length - Length of the state string (default: 32)
 * @returns Random hex string
 */
export function generateState(length: number = 32): string {
  // Browser environment
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(length / 2);
    window.crypto.getRandomValues(array);
    return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
  }

  // Node.js environment
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    const crypto = require('crypto');
    return crypto.randomBytes(length / 2).toString('hex');
  }

  // Fallback (not cryptographically secure, use only for testing)
  console.warn('SSO SDK: Using insecure random state generation. This should only happen in tests.');
  return Array.from({ length }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

/**
 * Generate a random code verifier for PKCE (future use)
 *
 * @param length - Length of the verifier (43-128 characters)
 * @returns Random base64url-encoded string
 */
export function generateCodeVerifier(length: number = 128): string {
  const array = new Uint8Array(length);

  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(array);
  } else if (typeof process !== 'undefined') {
    const crypto = require('crypto');
    crypto.randomFillSync(array);
  }

  return base64UrlEncode(array);
}

/**
 * Generate code challenge from verifier (PKCE)
 *
 * @param verifier - Code verifier
 * @returns SHA-256 hash of verifier, base64url-encoded
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);

  // Browser environment
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const hash = await window.crypto.subtle.digest('SHA-256', data);
    return base64UrlEncode(new Uint8Array(hash));
  }

  // Node.js environment
  if (typeof process !== 'undefined') {
    const crypto = require('crypto');
    const hash = crypto.createHash('sha256').update(verifier).digest();
    return base64UrlEncode(hash);
  }

  throw new Error('No crypto implementation available');
}

/**
 * Base64url encode (RFC 4648)
 */
function base64UrlEncode(buffer: Uint8Array | Buffer): string {
  const base64 =
    typeof window !== 'undefined'
      ? btoa(String.fromCharCode(...Array.from(buffer)))
      : Buffer.from(buffer).toString('base64');

  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
