/**
 * Admin API Rate Limiter
 *
 * Rate limit: 100 requests per minute per admin user
 *
 * Why rate limit admins?
 * - Prevent accidental DOS from buggy scripts
 * - Mitigate compromised admin account abuse
 * - Protect database from excessive queries
 *
 * @module middleware/adminRateLimiter
 */

import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger.js';

/**
 * Admin API Rate Limiter
 *
 * Configuration:
 * - Window: 1 minute (60,000ms)
 * - Max requests: 100 per window
 * - Key generator: User ID (or IP if no user)
 *
 * @type {import('express-rate-limit').RateLimitRequestHandler}
 */
export const adminRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per window
  message: {
    error: 'Too many requests from this admin, please try again later',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,

  // Use user ID for rate limiting (not IP)
  keyGenerator: (req) => {
    return req.user?.id || req.ip;
  },

  // Custom handler for rate limit exceeded
  handler: (req, res) => {
    logger.warn('Admin rate limit exceeded', {
      userId: req.user?.id,
      email: req.user?.email,
      ip: req.ip,
      path: req.path,
      method: req.method
    });

    res.status(429).json({
      error: 'Too many requests, please try again later',
      code: 'RATE_LIMIT_EXCEEDED',
      retry_after: Math.ceil(req.rateLimit.resetTime / 1000)
    });
  },

  // Skip successful requests (only count failed ones)
  skipSuccessfulRequests: false,

  // Skip failed requests
  skipFailedRequests: false
});

export default adminRateLimiter;
