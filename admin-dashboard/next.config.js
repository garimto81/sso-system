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
      "connect-src 'self' " + (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'),
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
            destination: 'https://sso-admin.example.com/:path*',
            permanent: true,
          },
        ]
      : []
  },

  // Environment variables validation
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
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
