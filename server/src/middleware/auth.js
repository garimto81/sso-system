/**
 * Authentication Middleware
 * Verifies JWT tokens and user sessions
 */

import { supabase } from '../utils/supabase.js';

/**
 * Middleware: Require Authentication
 * Validates session token from request headers
 */
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Missing or invalid authorization header'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'Invalid or expired token'
      });
    }

    // Attach user to request object
    req.user = user;
    next();

  } catch (err) {
    console.error('Auth middleware error:', err);
    res.status(500).json({
      error: 'server_error',
      message: err.message
    });
  }
};

/**
 * Middleware: Require Admin Role
 * Checks if user has admin role in profiles table
 */
export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        error: 'unauthorized',
        message: 'User not authenticated'
      });
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', req.user.id)
      .single();

    if (error || !profile || profile.role !== 'admin') {
      return res.status(403).json({
        error: 'forbidden',
        message: 'Admin access required'
      });
    }

    next();

  } catch (err) {
    console.error('Admin middleware error:', err);
    res.status(500).json({
      error: 'server_error',
      message: err.message
    });
  }
};

export default { requireAuth, requireAdmin };
