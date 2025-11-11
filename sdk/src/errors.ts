/**
 * SSO SDK Error Types
 */

export type SSOErrorCode =
  | 'invalid_config'
  | 'invalid_state'
  | 'invalid_code'
  | 'token_expired'
  | 'token_refresh_failed'
  | 'network_error'
  | 'storage_error'
  | 'unauthorized'
  | 'unknown_error';

/**
 * Custom error class for SSO operations
 */
export class SSOError extends Error {
  public readonly code: SSOErrorCode;
  public readonly details?: unknown;

  constructor(code: SSOErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = 'SSOError';
    this.code = code;
    this.details = details;

    // Maintain proper stack trace (only in V8 engines like Node.js and Chrome)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SSOError);
    }
  }

  /**
   * Convert error to JSON format
   */
  toJSON() {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      details: this.details,
    };
  }

  /**
   * Create error from unknown source
   */
  static fromUnknown(error: unknown): SSOError {
    if (error instanceof SSOError) {
      return error;
    }

    if (error instanceof Error) {
      return new SSOError('unknown_error', error.message, { originalError: error });
    }

    return new SSOError('unknown_error', String(error));
  }
}

/**
 * Helper functions for common error scenarios
 */
export const SSOErrors = {
  invalidConfig: (message: string) => new SSOError('invalid_config', message),
  invalidState: () => new SSOError('invalid_state', 'State parameter mismatch (CSRF protection)'),
  invalidCode: () => new SSOError('invalid_code', 'Invalid or expired authorization code'),
  tokenExpired: () => new SSOError('token_expired', 'Access token has expired'),
  tokenRefreshFailed: (details?: unknown) =>
    new SSOError('token_refresh_failed', 'Failed to refresh access token', details),
  networkError: (details?: unknown) => new SSOError('network_error', 'Network request failed', details),
  storageError: (details?: unknown) => new SSOError('storage_error', 'Storage operation failed', details),
  unauthorized: () => new SSOError('unauthorized', 'User is not authenticated'),
};
