/**
 * Authentication Routes
 * Handles user login, logout, callback
 */

import express from 'express';
import { supabase, supabaseAdmin } from '../utils/supabase.js';

const router = express.Router();

// ============================================================================
// POST /auth/login
// Email/Password login
// ============================================================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'Email and password are required'
      });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: error.message
      });
    }

    // Fetch user profile to get role (use admin client to bypass RLS)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return res.status(500).json({
        error: 'Failed to fetch user profile',
        message: profileError.message
      });
    }

    res.json({
      success: true,
      access_token: data.session.access_token,
      user: {
        id: data.user.id,
        email: data.user.email,
        role: profile.role
      },
      session: data.session
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: err.message
    });
  }
});

// ============================================================================
// POST /auth/signup
// Email/Password signup
// ============================================================================
router.post('/signup', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'Missing credentials',
        message: 'Email and password are required'
      });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName || email
        }
      }
    });

    if (error) {
      return res.status(400).json({
        error: 'Signup failed',
        message: error.message
      });
    }

    res.json({
      success: true,
      user: data.user,
      message: 'User created successfully'
    });

  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: err.message
    });
  }
});

// ============================================================================
// POST /auth/logout
// User logout
// ============================================================================
router.post('/logout', async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return res.status(400).json({
        error: 'Logout failed',
        message: error.message
      });
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: err.message
    });
  }
});

// ============================================================================
// GET /auth/callback
// OAuth callback (Google, etc.)
// ============================================================================
router.get('/callback', async (req, res) => {
  // TODO: Implement OAuth callback handling
  res.json({
    message: 'OAuth callback - Not implemented yet'
  });
});

export default router;
