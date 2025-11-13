/**
 * Diagnostic API: Environment Variable Check
 * Use this to verify SUPABASE_JWT_SECRET is accessible in production
 *
 * SECURITY: Remove this endpoint after debugging!
 */

import { NextResponse } from 'next/server'

export async function GET() {
  // Only allow in non-production or with debug flag
  const isDev = process.env.NODE_ENV === 'development'
  const debugEnabled = process.env.ENABLE_DEBUG === 'true'

  if (!isDev && !debugEnabled) {
    return NextResponse.json({ error: 'Debug endpoint disabled' }, { status: 403 })
  }

  const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET
  const jwtSecret = process.env.JWT_SECRET

  // Don't expose actual secrets, just check if they exist
  const diagnostics = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    vercel: {
      url: process.env.VERCEL_URL,
      env: process.env.VERCEL_ENV,
      region: process.env.VERCEL_REGION,
    },
    secrets: {
      SUPABASE_JWT_SECRET: {
        exists: !!supabaseJwtSecret,
        length: supabaseJwtSecret?.length || 0,
        firstChars: supabaseJwtSecret?.substring(0, 10) || 'N/A',
        lastChars: supabaseJwtSecret?.substring(supabaseJwtSecret.length - 10) || 'N/A',
      },
      JWT_SECRET: {
        exists: !!jwtSecret,
        length: jwtSecret?.length || 0,
      },
    },
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'N/A',
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    },
  }

  return NextResponse.json(diagnostics, { status: 200 })
}
