/**
 * Input validation utilities
 *
 * Provides validation functions for app data:
 * - URL validation (redirect URLs, origins)
 * - App name validation
 * - Auth method validation
 * - UUID validation
 *
 * All validators return { valid: boolean, error?: string }
 */

/**
 * Validate URL format
 *
 * @param {string} url - URL to validate
 * @returns {{ valid: boolean, error?: string }}
 *
 * @example
 * const result = isValidUrl('https://example.com/callback');
 * if (!result.valid) {
 *   console.error(result.error);
 * }
 */
export function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: `URL must be HTTP or HTTPS: ${url}` };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: `Invalid URL format: ${url}` };
  }
}

/**
 * Validate array of URLs
 *
 * @param {string[]} urls - Array of URLs to validate
 * @returns {{ valid: boolean, error?: string }}
 *
 * @example
 * const result = validateUrls(['https://example.com', 'https://app.com']);
 * if (!result.valid) {
 *   console.error(result.error);
 * }
 */
export function validateUrls(urls) {
  if (!Array.isArray(urls) || urls.length === 0) {
    return { valid: false, error: 'At least one URL is required' };
  }

  for (const url of urls) {
    const result = isValidUrl(url);
    if (!result.valid) {
      return result;
    }
  }

  return { valid: true };
}

/**
 * Validate app name
 *
 * Rules:
 * - Must be a non-empty string
 * - Length: 3-100 characters
 * - Allowed: letters, numbers, spaces, hyphens
 *
 * @param {string} name - App name to validate
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateAppName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'App name is required' };
  }

  const trimmed = name.trim();

  if (trimmed.length < 3 || trimmed.length > 100) {
    return { valid: false, error: 'App name must be 3-100 characters' };
  }

  // Allow letters, numbers, spaces, hyphens, underscores, dots
  if (!/^[a-zA-Z0-9\s\-_.]+$/.test(trimmed)) {
    return {
      valid: false,
      error: 'App name can only contain letters, numbers, spaces, hyphens, underscores, and dots',
    };
  }

  return { valid: true };
}

/**
 * Validate auth method
 *
 * @param {string} method - Auth method to validate
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateAuthMethod(method) {
  const validMethods = ['token_exchange', 'shared_cookie', 'hybrid'];

  if (!method || !validMethods.includes(method)) {
    return {
      valid: false,
      error: `Invalid auth method. Must be one of: ${validMethods.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Validate UUID format
 *
 * @param {string} uuid - UUID to validate
 * @returns {boolean} True if valid UUID
 *
 * @example
 * if (!isValidUuid(appId)) {
 *   return res.status(400).json({ error: 'Invalid app ID' });
 * }
 */
export function isValidUuid(uuid) {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return typeof uuid === 'string' && uuidRegex.test(uuid);
}

/**
 * Validate email format
 *
 * @param {string} email - Email to validate
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Invalid email format' };
  }

  return { valid: true };
}

/**
 * Validate description
 *
 * @param {string} description - Description to validate
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateDescription(description) {
  if (!description) {
    return { valid: true }; // Description is optional
  }

  if (typeof description !== 'string') {
    return { valid: false, error: 'Description must be a string' };
  }

  if (description.length > 500) {
    return { valid: false, error: 'Description must be 500 characters or less' };
  }

  return { valid: true };
}

export default {
  isValidUrl,
  validateUrls,
  validateAppName,
  validateAuthMethod,
  isValidUuid,
  validateEmail,
  validateDescription,
};
