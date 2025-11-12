/**
 * Login API Route
 * ✅ Sets httpOnly cookie with JWT
 * ✅ P1-4: SameSite cookie attribute
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      )
    }

    // Call backend SSO server
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(
        { error: error.error || 'Login failed' },
        { status: response.status }
      )
    }

    const data = await response.json()
    const { access_token, user } = data

    // Verify admin role
    if (user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // ✅ Set httpOnly cookie
    const cookieStore = await cookies()
    cookieStore.set('sso_admin_token', access_token, {
      httpOnly: true, // ✅ Prevents JavaScript access
      secure: process.env.NODE_ENV === 'production', // ✅ HTTPS only in prod
      sameSite: 'lax', // ✅ P1-4: CSRF protection
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
