/**
 * SSO API Routes
 * Handles authorization and token exchange for registered apps
 */

import express from 'express';
import crypto from 'crypto';
import { supabaseAdmin } from '../utils/supabase.js';

const router = express.Router();

// ============================================================================
// GET /api/v1/authorize
// Authorization Endpoint (OAuth 2.0 Authorization Code Flow)
// ============================================================================
router.get('/authorize', async (req, res) => {
  try {
    const { app_id, redirect_uri, state } = req.query;

    // Validate parameters
    if (!app_id || !redirect_uri) {
      return res.status(400).json({
        error: 'invalid_request',
        message: 'Missing required parameters: app_id, redirect_uri'
      });
    }

    // TODO: Check if user is logged in (session/cookie)
    // For now, return error asking user to login
    return res.status(401).json({
      error: 'login_required',
      message: 'User must be logged in',
      login_url: `/auth/login?redirect=${encodeURIComponent(req.originalUrl)}`
    });

    // TODO: Verify app exists and redirect_uri is whitelisted
    // TODO: Generate authorization code
    // TODO: Store code in auth_codes table
    // TODO: Redirect to app's redirect_uri with code

  } catch (err) {
    console.error('Authorize error:', err);
    res.status(500).json({
      error: 'server_error',
      message: err.message
    });
  }
});

// ============================================================================
// POST /api/v1/token/exchange
// Token Exchange Endpoint
// Exchanges authorization code for access token (JWT)
// ============================================================================
router.post('/token/exchange', async (req, res) => {
  try {
    const { code, app_id, app_secret } = req.body;

    // Validate parameters
    if (!code || !app_id || !app_secret) {
      return res.status(400).json({
        error: 'invalid_request',
        message: 'Missing required parameters: code, app_id, app_secret'
      });
    }

    // Verify app credentials
    const { data: app, error: appError } = await supabaseAdmin
      .from('apps')
      .select('id, name, api_key, api_secret, is_active')
      .eq('api_key', app_id)
      .eq('is_active', true)
      .single();

    if (appError || !app) {
      return res.status(401).json({
        error: 'invalid_client',
        message: 'Invalid app credentials'
      });
    }

    // TODO: Verify app_secret against hashed api_secret (bcrypt)

    // TODO: Verify authorization code
    // TODO: Get user_id from code
    // TODO: Delete code (one-time use!)
    // TODO: Generate JWT for user
    // TODO: Return access token

    res.json({
      message: 'Token exchange - Not fully implemented yet',
      app_name: app.name
    });

  } catch (err) {
    console.error('Token exchange error:', err);
    res.status(500).json({
      error: 'server_error',
      message: err.message
    });
  }
});

// ============================================================================
// GET /api/v1/apps
// List all active apps (public endpoint)
// ============================================================================
router.get('/apps', async (req, res) => {
  try {
    const { data: apps, error } = await supabaseAdmin
      .from('apps')
      .select('id, name, description, auth_method')
      .eq('is_active', true)
      .order('name');

    if (error) {
      throw error;
    }

    res.json({
      apps,
      count: apps.length
    });

  } catch (err) {
    console.error('List apps error:', err);
    res.status(500).json({
      error: 'server_error',
      message: err.message
    });
  }
});

export default router;
