/**
 * Rate Limiting Middleware
 * Protects against brute-force and DoS attacks
 */

import rateLimit from 'express-rate-limit';

// Authentication endpoints (login, signup)
// Stricter limits to prevent brute-force attacks
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 5 : 100, // Relaxed limits in development/test
  message: {
    error: 'too_many_requests',
    message: 'Too many authentication attempts. Please try again in 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip successful requests from count
  skipSuccessfulRequests: false,
  // Skip failed requests from count (commented - we want to count all)
  // skipFailedRequests: true,
});

// Token exchange and authorization endpoints
// Moderate limits to prevent abuse
export const tokenLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  message: {
    error: 'too_many_requests',
    message: 'Too many token requests. Please try again in a moment.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API endpoints
// Relaxed limits for normal usage
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: {
    error: 'too_many_requests',
    message: 'Too many API requests. Please slow down.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Health check endpoint (no limit)
// But we can add a very high limit to prevent abuse
export const healthLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000, // Very high limit
  message: {
    error: 'too_many_requests',
    message: 'Too many health check requests.'
  },
  standardHeaders: false,
  legacyHeaders: false,
});
