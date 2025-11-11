/**
 * SSO API Routes
 * Handles authorization and token exchange for registered apps
 */

import express from 'express';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
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

    // Step 1: Check if user is logged in (via Authorization header)
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'login_required',
        message: 'User must be logged in',
        login_url: `/auth/login?redirect=${encodeURIComponent(req.originalUrl)}`
      });
    }

    // Verify user session
    const token = authHeader.substring(7);
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return res.status(401).json({
        error: 'invalid_token',
        message: 'Invalid or expired token'
      });
    }

    // Step 2: Verify app exists and is active
    const { data: app, error: appError } = await supabaseAdmin
      .from('apps')
      .select('id, name, api_key, redirect_urls, is_active')
      .eq('api_key', app_id)
      .eq('is_active', true)
      .single();

    if (appError || !app) {
      return res.status(400).json({
        error: 'invalid_client',
        message: 'Invalid app_id or app is not active'
      });
    }

    // Step 3: Verify redirect_uri is whitelisted
    if (!app.redirect_urls.includes(redirect_uri)) {
      return res.status(400).json({
        error: 'invalid_redirect_uri',
        message: 'redirect_uri is not whitelisted for this app',
        allowed_uris: app.redirect_urls
      });
    }

    // Step 4: Generate authorization code (random 32-byte hex string)
    const code = crypto.randomBytes(32).toString('hex');

    // Step 5: Store code in auth_codes table (expires in 5 minutes)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes from now

    const { error: insertError } = await supabaseAdmin
      .from('auth_codes')
      .insert({
        code,
        user_id: user.id,
        app_id: app.id,
        expires_at: expiresAt.toISOString()
      });

    if (insertError) {
      console.error('Failed to store auth code:', insertError);
      return res.status(500).json({
        error: 'server_error',
        message: 'Failed to generate authorization code'
      });
    }

    console.log(`✅ Authorization code generated for user ${user.email} → app ${app.name}`);

    // Step 6: Redirect to app's redirect_uri with code and state
    const redirectUrl = new URL(redirect_uri);
    redirectUrl.searchParams.set('code', code);
    if (state) {
      redirectUrl.searchParams.set('state', state);
    }

    res.redirect(redirectUrl.toString());

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

    // Step 1: Verify app credentials
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

    // Step 2: Verify app_secret against hashed api_secret (bcrypt)
    const secretMatch = await bcrypt.compare(app_secret, app.api_secret);
    if (!secretMatch) {
      return res.status(401).json({
        error: 'invalid_client',
        message: 'Invalid app_secret'
      });
    }

    // Step 3: Verify authorization code exists and not expired
    const { data: authCode, error: codeError } = await supabaseAdmin
      .from('auth_codes')
      .select('code, user_id, app_id, expires_at')
      .eq('code', code)
      .eq('app_id', app.id)
      .single();

    if (codeError || !authCode) {
      return res.status(400).json({
        error: 'invalid_grant',
        message: 'Invalid or expired authorization code'
      });
    }

    // Check if code is expired
    if (new Date(authCode.expires_at) < new Date()) {
      // Delete expired code
      await supabaseAdmin.from('auth_codes').delete().eq('code', code);

      return res.status(400).json({
        error: 'invalid_grant',
        message: 'Authorization code has expired'
      });
    }

    // Step 4: Delete code (one-time use!)
    const { error: deleteError } = await supabaseAdmin
      .from('auth_codes')
      .delete()
      .eq('code', code);

    if (deleteError) {
      console.error('Failed to delete auth code:', deleteError);
    }

    // Step 5: Generate JWT access token for the user
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.createSession({
      user_id: authCode.user_id
    });

    if (sessionError || !sessionData) {
      console.error('Failed to create session:', sessionError);
      return res.status(500).json({
        error: 'server_error',
        message: 'Failed to generate access token'
      });
    }

    // Step 6: Get user profile information
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, display_name, role')
      .eq('id', authCode.user_id)
      .single();

    console.log(`✅ Token exchanged for user ${profile?.email || authCode.user_id} → app ${app.name}`);

    // Step 7: Return access token and user info
    res.json({
      access_token: sessionData.access_token,
      refresh_token: sessionData.refresh_token,
      expires_in: sessionData.expires_in || 3600,
      token_type: 'Bearer',
      user: {
        id: authCode.user_id,
        email: profile?.email,
        display_name: profile?.display_name,
        role: profile?.role
      }
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
      .select('id, name, description, api_key, auth_method')
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
