/**
 * ✅ P1-3: JWT Verification in Middleware
 * ✅ P0-1: httpOnly Cookie-Based Auth
 *
 * Next.js Middleware runs on Edge Runtime
 * Validates JWT tokens before allowing access to protected routes
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import * as jose from 'jose' // Use jose for Edge Runtime compatibility

const TOKEN_NAME = 'sso_admin_token'
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'development-secret-change-in-production'
)

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/forgot-password']

// API routes that need authentication
const PROTECTED_API_ROUTES = ['/api/admin']

/**
 * Verify JWT token signature and expiration
 * ✅ P1-3: Proper JWT verification
 */
async function verifyToken(token: string): Promise<jose.JWTPayload | null> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET, {
      algorithms: ['HS256'],
    })

    // Additional validation
    if (!payload.sub || !payload.exp) {
      console.warn('[Middleware] Invalid token payload')
      return null
    }

    // Check if token is expired (jose already does this, but double-check)
    if (payload.exp && payload.exp < Date.now() / 1000) {
      console.warn('[Middleware] Token expired')
      return null
    }

    return payload
  } catch (error) {
    console.error('[Middleware] JWT verification failed:', error)
    return null
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes
  if (PUBLIC_ROUTES.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Get token from httpOnly cookie
  const token = request.cookies.get(TOKEN_NAME)?.value

  // No token → Redirect to login
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // ✅ P1-3: Verify JWT signature (not just trust the cookie value!)
  const payload = await verifyToken(token)

  if (!payload) {
    // Invalid or expired token → Clear cookie and redirect
    const response = pathname.startsWith('/api/')
      ? NextResponse.json({ error: 'Invalid token' }, { status: 401 })
      : NextResponse.redirect(new URL('/login', request.url))

    // Clear invalid token
    response.cookies.delete(TOKEN_NAME)
    return response
  }

  // Check admin role for /admin routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const role = payload.role as string | undefined

    if (role !== 'admin') {
      return pathname.startsWith('/api/')
        ? NextResponse.json({ error: 'Admin access required' }, { status: 403 })
        : NextResponse.redirect(new URL('/unauthorized', request.url))
    }
  }

  // Add user info to request headers for downstream use
  const response = NextResponse.next()
  response.headers.set('X-User-ID', payload.sub as string)
  if (payload.role) {
    response.headers.set('X-User-Role', payload.role as string)
  }

  return response
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon file)
     * - public files (public directory)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

/**
 * Security Notes:
 *
 * ✅ DO:
 * - Verify JWT signature in middleware
 * - Use httpOnly cookies
 * - Check token expiration
 * - Validate role for protected routes
 *
 * ❌ DON'T:
 * - Trust cookie values without verification
 * - Use localStorage for tokens
 * - Skip signature verification
 * - Allow expired tokens
 */
