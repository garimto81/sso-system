/**
 * ✅ P0-1: Secure Cookie-Based Authentication
 * ✅ P1-4: SameSite Cookie Attributes
 *
 * NEVER use localStorage for JWT tokens!
 * All auth tokens are stored in httpOnly cookies.
 */

import { cookies } from 'next/headers'

const TOKEN_NAME = 'sso_admin_token'

export interface CookieOptions {
  httpOnly?: boolean
  secure?: boolean
  sameSite?: 'strict' | 'lax' | 'none'
  maxAge?: number
  path?: string
}

/**
 * Get secure cookie options based on environment
 */
function getSecureCookieOptions(): CookieOptions {
  const isProduction = process.env.NODE_ENV === 'production'

  return {
    httpOnly: true, // ✅ Prevents JavaScript access (XSS protection)
    secure: isProduction, // ✅ HTTPS only in production
    sameSite: 'lax', // ✅ P1-4: CSRF protection
    path: '/',
    // maxAge will be set based on JWT expiration
  }
}

/**
 * Set authentication token in httpOnly cookie
 * ✅ Server-side only function
 */
export async function setAuthToken(token: string, expiresIn: number = 24 * 60 * 60): Promise<void> {
  const cookieStore = await cookies()

  cookieStore.set(TOKEN_NAME, token, {
    ...getSecureCookieOptions(),
    maxAge: expiresIn, // Token lifetime in seconds
  })
}

/**
 * Get authentication token from httpOnly cookie
 * ✅ Server-side only function
 */
export async function getAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies()
  return cookieStore.get(TOKEN_NAME)?.value
}

/**
 * Remove authentication token
 * ✅ Server-side only function
 */
export async function removeAuthToken(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete(TOKEN_NAME)
}

/**
 * Check if user is authenticated
 * ✅ Server-side only function
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAuthToken()
  return !!token
}

/**
 * ❌ NEVER DO THIS:
 *
 * export const tokenStorage = {
 *   get: () => localStorage.getItem('token'), // VULNERABLE TO XSS
 *   set: (token) => localStorage.setItem('token', token), // INSECURE
 * }
 *
 * Why? XSS attacks can steal tokens from localStorage!
 */
