/** @type {import('next').NextConfig} */

// ✅ P0-2: Content Security Policy (CSP) Headers
// ✅ P1-1: HTTPS Enforcement & Security Headers
const securityHeaders = [
  // Content Security Policy - Prevents XSS attacks
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'", // Next.js requires unsafe-eval for dev
      "style-src 'self' 'unsafe-inline'", // Tailwind requires unsafe-inline
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self' " + ((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').trim()),
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
  // HSTS - Force HTTPS (Production only)
  ...(process.env.NODE_ENV === 'production'
    ? [
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload',
        },
      ]
    : []),
  // X-Frame-Options - Prevent clickjacking
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  // X-Content-Type-Options - Prevent MIME sniffing
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // Referrer-Policy - Control referrer information
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // Permissions-Policy - Restrict browser features
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
]

const nextConfig = {
  reactStrictMode: true,

  // Security headers applied to all routes
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },

  // ✅ P1-1: Redirect HTTP to HTTPS in production
  async redirects() {
    return process.env.NODE_ENV === 'production'
      ? [
          {
            source: '/:path*',
            has: [
              {
                type: 'header',
                key: 'x-forwarded-proto',
                value: 'http',
              },
            ],
            // Use VERCEL_URL environment variable (automatically set by Vercel)
            // Falls back to NEXT_PUBLIC_FRONTEND_URL if not on Vercel
            destination: process.env.VERCEL_URL
              ? `https://${process.env.VERCEL_URL}/:path*`
              : (process.env.NEXT_PUBLIC_FRONTEND_URL || 'https://localhost:3001/:path*'),
            permanent: true,
          },
        ]
      : []
  },

  // Environment variables validation
  // ⚠️ IMPORTANT: Edge Runtime (middleware) requires explicit env exposure
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    SUPABASE_JWT_SECRET: process.env.SUPABASE_JWT_SECRET, // Required for JWT verification in middleware
  },

  // Production optimizations
  poweredByHeader: false, // Remove X-Powered-By header
  compress: true,

  // Experimental features
  experimental: {
    // Enable React Server Components
    serverActions: true,
  },
}

module.exports = nextConfig
