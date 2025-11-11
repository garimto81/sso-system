/**
 * Admin Authentication Middleware
 *
 * Validates JWT token and checks admin role
 *
 * Flow:
 * 1. Extract token from Authorization header
 * 2. Validate token with Supabase
 * 3. Check user exists and role is 'admin'
 * 4. Attach user to req.user
 * 5. Call next() or return error
 *
 * Security considerations:
 * - Always validate token signature
 * - Check token expiration (automatic in Supabase)
 * - Verify user still exists (not deleted)
 * - Verify admin role in profiles table
 * - Log failed authentication attempts
 * - Return specific error codes (401 vs 403)
 *
 * @module middleware/authenticateAdmin
 */

import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger.js';

// Create Supabase Admin client (uses service role key)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

/**
 * Admin Authentication Middleware
 *
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 * @returns {Promise<void>}
 *
 * @example
 * router.get('/admin/apps', authenticateAdmin, async (req, res) => {
 *   // req.user is now available with admin user data
 *   const apps = await getApps();
 *   res.json({ apps });
 * });
 */
export async function authenticateAdmin(req, res, next) {
  try {
    // 1. Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Admin auth failed: Missing or invalid authorization header', {
        ip: req.ip,
        path: req.path,
        method: req.method
      });

      return res.status(401).json({
        error: 'Missing or invalid authorization header',
        code: 'UNAUTHORIZED'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // 2. Validate JWT token with Supabase
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      logger.warn('Admin auth failed: Invalid or expired token', {
        error: authError?.message,
        ip: req.ip,
        path: req.path,
        method: req.method
      });

      return res.status(401).json({
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }

    // 3. Check admin role in profiles table
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role, email, display_name')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      logger.error('Admin auth failed: Profile not found', {
        userId: user.id,
        error: profileError?.message,
        ip: req.ip,
        path: req.path
      });

      return res.status(403).json({
        error: 'User profile not found',
        code: 'PROFILE_NOT_FOUND'
      });
    }

    if (profile.role !== 'admin') {
      logger.warn('Admin auth failed: Insufficient permissions', {
        userId: user.id,
        email: profile.email,
        role: profile.role,
        ip: req.ip,
        path: req.path,
        method: req.method
      });

      return res.status(403).json({
        error: 'Admin access required',
        code: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    // 4. Attach user data to request
    req.user = {
      id: user.id,
      email: profile.email,
      display_name: profile.display_name,
      role: profile.role
    };

    // 5. Log successful authentication
    logger.info('Admin authenticated', {
      userId: user.id,
      email: profile.email,
      path: req.path,
      method: req.method
    });

    next();
  } catch (error) {
    logger.error('Admin auth error: Unexpected exception', {
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method
    });

    return res.status(500).json({
      error: 'Internal server error',
      code: 'INTERNAL_ERROR'
    });
  }
}

export default authenticateAdmin;
