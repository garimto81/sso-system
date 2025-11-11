/**
 * SSO System SDK - JavaScript/TypeScript Client Library
 *
 * @packageDocumentation
 */

// Main client
export { SSOClient } from './SSOClient';

// Types
export type {
  User,
  TokenSet,
  AuthResult,
  SSOConfig,
  AuthorizeOptions,
  StorageType,
  StoredTokenData,
} from './types';

// Errors
export { SSOError, SSOErrors } from './errors';
export type { SSOErrorCode } from './errors';

// Storage adapters (for advanced use cases)
export { StorageAdapter, STORAGE_KEYS } from './storage/StorageAdapter';
export { LocalStorageAdapter } from './storage/LocalStorage';
export { SessionStorageAdapter } from './storage/SessionStorage';
export { CookieStorageAdapter } from './storage/CookieStorage';
export { MemoryStorageAdapter } from './storage/MemoryStorage';

// Utilities (for advanced use cases)
export { generateState } from './utils/crypto';
export { parseQueryParams, buildQueryString, buildUrl } from './utils/url';
export { validateConfig, isTokenExpired } from './utils/validation';
