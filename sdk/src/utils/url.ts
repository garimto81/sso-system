/**
 * URL parsing and manipulation utilities
 */

/**
 * Parse query parameters from URL
 *
 * @param url - Full URL or query string
 * @returns Object with query parameters
 */
export function parseQueryParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};

  // Extract query string
  const queryString = url.includes('?') ? url.split('?')[1] : url;

  if (!queryString) {
    return params;
  }

  // Parse parameters
  queryString.split('&').forEach((pair) => {
    const [key, value] = pair.split('=');
    if (key) {
      params[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
    }
  });

  return params;
}

/**
 * Build query string from object
 *
 * @param params - Object with query parameters
 * @returns Query string (without leading '?')
 */
export function buildQueryString(params: Record<string, string | undefined>): string {
  return Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value as string)}`)
    .join('&');
}

/**
 * Build full URL with query parameters
 *
 * @param baseUrl - Base URL
 * @param params - Query parameters
 * @returns Full URL with query string
 */
export function buildUrl(baseUrl: string, params: Record<string, string | undefined>): string {
  const queryString = buildQueryString(params);
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Get current URL (browser only)
 *
 * @returns Current window location href
 */
export function getCurrentUrl(): string {
  if (typeof window === 'undefined') {
    throw new Error('getCurrentUrl() is only available in browser environment');
  }
  return window.location.href;
}

/**
 * Get callback parameters from current URL
 *
 * @returns Object with code, state, and error parameters
 */
export function getCallbackParams(): { code?: string; state?: string; error?: string } {
  const params = parseQueryParams(getCurrentUrl());
  return {
    code: params.code,
    state: params.state,
    error: params.error,
  };
}

/**
 * Validate URL format
 *
 * @param url - URL to validate
 * @returns True if valid URL
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
