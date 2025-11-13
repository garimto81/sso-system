/**
 * Admin Dashboard API Routes
 *
 * All routes require admin authentication (via authenticateAdmin middleware)
 * and are rate limited (100 requests/min per admin user)
 *
 * Endpoints:
 * - GET    /apps              - List all apps (paginated, searchable)
 * - POST   /apps              - Create new app
 * - GET    /apps/:id          - Get app details
 * - PUT    /apps/:id          - Update app
 * - DELETE /apps/:id          - Delete/deactivate app
 * - POST   /apps/:id/regenerate-secret - Regenerate API secret
 * - GET    /apps/:id/analytics - Get app analytics
 * - GET    /dashboard          - Global dashboard stats
 */

import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { sanitizeBody, sanitizeQuery } from '../utils/sanitize.js';
import { logger, logAdminAction } from '../utils/logger.js';
import {
  recordAnalyticsEvent,
  getAppAnalytics,
  getDashboardStats,
} from '../utils/analytics.js';
import {
  generateApiKey,
  generateApiSecret,
  hashSecret,
} from '../utils/crypto.js';
import {
  validateUrls,
  validateAppName,
  validateAuthMethod,
  isValidUuid,
  validateEmail,
  validateDescription,
} from '../utils/validators.js';

const router = express.Router();

// Create Supabase Admin client
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// ============================================================================
// Endpoint 1: GET /apps - List all apps
// ============================================================================

router.get('/apps', sanitizeQuery, async (req, res) => {
  try {
    // Parse query parameters
    const search = req.query.search || '';
    const status = req.query.status || 'all'; // all, active, inactive
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const sortBy = req.query.sort || 'created_at';
    const order = req.query.order === 'asc' ? 'asc' : 'desc';

    // Calculate pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Build query
    let query = supabaseAdmin
      .from('apps')
      .select(
        `
        id,
        name,
        description,
        api_key,
        auth_method,
        is_active,
        created_at,
        updated_at,
        owner:profiles!apps_owner_id_fkey (
          id,
          email,
          display_name
        )
      `,
        { count: 'exact' }
      );

    // Apply search filter
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    // Apply status filter
    if (status === 'active') {
      query = query.eq('is_active', true);
    } else if (status === 'inactive') {
      query = query.eq('is_active', false);
    }

    // Apply sorting
    const validSortFields = ['name', 'created_at', 'updated_at'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at';
    query = query.order(sortField, { ascending: order === 'asc' });

    // Apply pagination
    query = query.range(from, to);

    // Execute query
    const { data: apps, error, count } = await query;

    if (error) {
      throw error;
    }

    // Get stats for each app (30-day metrics)
    const appsWithStats = await Promise.all(
      (apps || []).map(async (app) => {
        const { data: stats } = await supabaseAdmin
          .from('app_usage_stats')
          .select('active_users_30d, logins_30d')
          .eq('app_id', app.id)
          .single();

        return {
          ...app,
          stats: {
            total_logins_30d: stats?.logins_30d || 0,
            active_users_30d: stats?.active_users_30d || 0,
          },
        };
      })
    );

    // Record analytics
    await recordAnalyticsEvent(
      null,
      'app_created',
      req.user.id,
      {
        action: 'list_apps',
        search,
        status,
        page,
        limit,
        result_count: apps?.length || 0,
      },
      req
    );

    // Return response
    res.json({
      apps: appsWithStats,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error) {
    logger.error('Failed to list apps', {
      error: error.message,
      userId: req.user?.id,
      query: req.query,
    });

    res.status(500).json({
      error: 'Failed to list apps',
      message: error.message,
    });
  }
});

// ============================================================================
// Endpoint 2: POST /apps - Create new app
// ============================================================================

router.post('/apps', sanitizeBody, async (req, res) => {
  try {
    const {
      name,
      description,
      redirect_urls,
      allowed_origins,
      auth_method,
      owner_email,
    } = req.body;

    // Validate inputs
    const nameValidation = validateAppName(name);
    if (!nameValidation.valid) {
      return res.status(400).json({
        error: 'validation_error',
        message: nameValidation.error,
      });
    }

    const descValidation = validateDescription(description);
    if (!descValidation.valid) {
      return res.status(400).json({
        error: 'validation_error',
        message: descValidation.error,
      });
    }

    const urlsValidation = validateUrls(redirect_urls);
    if (!urlsValidation.valid) {
      return res.status(400).json({
        error: 'validation_error',
        message: urlsValidation.error,
        field: 'redirect_urls',
      });
    }

    if (allowed_origins && allowed_origins.length > 0) {
      const originsValidation = validateUrls(allowed_origins);
      if (!originsValidation.valid) {
        return res.status(400).json({
          error: 'validation_error',
          message: originsValidation.error,
          field: 'allowed_origins',
        });
      }
    }

    const authMethodValidation = validateAuthMethod(auth_method);
    if (!authMethodValidation.valid) {
      return res.status(400).json({
        error: 'validation_error',
        message: authMethodValidation.error,
      });
    }

    const emailValidation = validateEmail(owner_email);
    if (!emailValidation.valid) {
      return res.status(400).json({
        error: 'validation_error',
        message: emailValidation.error,
      });
    }

    // Check if owner exists
    const { data: owner, error: ownerError } = await supabaseAdmin
      .from('profiles')
      .select('id, email, display_name')
      .eq('email', owner_email)
      .single();

    if (ownerError || !owner) {
      return res.status(404).json({
        error: 'not_found',
        message: 'Owner email not found in system',
      });
    }

    // Check if app name already exists
    const { data: existingApp } = await supabaseAdmin
      .from('apps')
      .select('id')
      .eq('name', name.trim())
      .single();

    if (existingApp) {
      return res.status(409).json({
        error: 'conflict',
        message: 'App name already exists',
      });
    }

    // Generate API credentials
    const apiKey = generateApiKey();
    const apiSecret = generateApiSecret();
    const hashedSecret = await hashSecret(apiSecret);

    // Insert app
    const { data: newApp, error: insertError } = await supabaseAdmin
      .from('apps')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        api_key: apiKey,
        api_secret: hashedSecret,
        redirect_urls: redirect_urls,
        allowed_origins: allowed_origins || [],
        auth_method: auth_method,
        owner_id: owner.id,
        is_active: true,
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // Record analytics
    await recordAnalyticsEvent(
      newApp.id,
      'app_created',
      req.user.id,
      {
        app_name: newApp.name,
        owner_email: owner.email,
        admin_email: req.user.email,
      },
      req
    );

    // Log admin action
    logAdminAction('app_created', req.user.id, {
      app_id: newApp.id,
      app_name: newApp.name,
      owner_email: owner.email,
    });

    // Return response with plain secret (ONLY TIME IT'S SHOWN!)
    res.status(201).json({
      message: 'App registered successfully',
      app: {
        id: newApp.id,
        name: newApp.name,
        description: newApp.description,
        api_key: apiKey,
        api_secret: apiSecret, // PLAIN SECRET - shown only once!
        redirect_urls: newApp.redirect_urls,
        allowed_origins: newApp.allowed_origins,
        auth_method: newApp.auth_method,
        owner: {
          id: owner.id,
          email: owner.email,
          display_name: owner.display_name,
        },
        is_active: newApp.is_active,
        created_at: newApp.created_at,
        updated_at: newApp.updated_at,
      },
    });
  } catch (error) {
    logger.error('Failed to create app', {
      error: error.message,
      userId: req.user?.id,
      body: req.body,
    });

    res.status(500).json({
      error: 'Failed to create app',
      message: error.message,
    });
  }
});

// ============================================================================
// Endpoint 3: GET /apps/:id - Get app details
// ============================================================================

router.get('/apps/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate UUID
    if (!isValidUuid(id)) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'Invalid app ID format',
      });
    }

    // Fetch app with owner info
    const { data: app, error } = await supabaseAdmin
      .from('apps')
      .select(
        `
        *,
        owner:profiles!apps_owner_id_fkey (
          id,
          email,
          display_name
        )
      `
      )
      .eq('id', id)
      .single();

    if (error || !app) {
      return res.status(404).json({
        error: 'not_found',
        message: 'App not found',
      });
    }

    // Fetch usage stats
    const { data: stats } = await supabaseAdmin
      .from('app_usage_stats')
      .select('*')
      .eq('app_id', id)
      .single();

    // Return app details (api_secret is hashed)
    res.json({
      ...app,
      stats: stats
        ? {
            total_logins_30d: stats.logins_30d || 0,
            active_users_30d: stats.active_users_30d || 0,
            token_requests_30d: stats.token_requests_30d || 0,
            error_rate_30d: parseFloat(stats.error_rate_30d || 0),
          }
        : {
            total_logins_30d: 0,
            active_users_30d: 0,
            token_requests_30d: 0,
            error_rate_30d: 0,
          },
    });
  } catch (error) {
    logger.error('Failed to get app details', {
      error: error.message,
      userId: req.user?.id,
      appId: req.params.id,
    });

    res.status(500).json({
      error: 'Failed to get app details',
      message: error.message,
    });
  }
});

// ============================================================================
// Endpoint 4: PUT /apps/:id - Update app
// ============================================================================

router.put('/apps/:id', sanitizeBody, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, redirect_urls, allowed_origins, is_active } =
      req.body;

    // Validate UUID
    if (!isValidUuid(id)) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'Invalid app ID format',
      });
    }

    // Check if app exists
    const { data: existingApp, error: fetchError } = await supabaseAdmin
      .from('apps')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingApp) {
      return res.status(404).json({
        error: 'not_found',
        message: 'App not found',
      });
    }

    // Build update object
    const updates = {};

    // Validate and add name if provided
    if (name !== undefined) {
      const nameValidation = validateAppName(name);
      if (!nameValidation.valid) {
        return res.status(400).json({
          error: 'validation_error',
          message: nameValidation.error,
        });
      }

      // Check if new name conflicts with another app
      if (name.trim() !== existingApp.name) {
        const { data: conflictApp } = await supabaseAdmin
          .from('apps')
          .select('id')
          .eq('name', name.trim())
          .neq('id', id)
          .single();

        if (conflictApp) {
          return res.status(409).json({
            error: 'conflict',
            message: 'App name already exists',
          });
        }
      }

      updates.name = name.trim();
    }

    // Validate and add description if provided
    if (description !== undefined) {
      const descValidation = validateDescription(description);
      if (!descValidation.valid) {
        return res.status(400).json({
          error: 'validation_error',
          message: descValidation.error,
        });
      }
      updates.description = description?.trim() || null;
    }

    // Validate and add redirect_urls if provided
    if (redirect_urls !== undefined) {
      const urlsValidation = validateUrls(redirect_urls);
      if (!urlsValidation.valid) {
        return res.status(400).json({
          error: 'validation_error',
          message: urlsValidation.error,
          field: 'redirect_urls',
        });
      }
      updates.redirect_urls = redirect_urls;
    }

    // Validate and add allowed_origins if provided
    if (allowed_origins !== undefined) {
      if (allowed_origins.length > 0) {
        const originsValidation = validateUrls(allowed_origins);
        if (!originsValidation.valid) {
          return res.status(400).json({
            error: 'validation_error',
            message: originsValidation.error,
            field: 'allowed_origins',
          });
        }
      }
      updates.allowed_origins = allowed_origins;
    }

    // Add is_active if provided
    if (is_active !== undefined) {
      updates.is_active = Boolean(is_active);
    }

    // Update timestamp
    updates.updated_at = new Date().toISOString();

    // Perform update
    const { data: updatedApp, error: updateError } = await supabaseAdmin
      .from('apps')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    // Record analytics
    await recordAnalyticsEvent(
      id,
      'app_updated',
      req.user.id,
      {
        app_name: updatedApp.name,
        updated_fields: Object.keys(updates),
        admin_email: req.user.email,
      },
      req
    );

    // Log admin action
    logAdminAction('app_updated', req.user.id, {
      app_id: id,
      app_name: updatedApp.name,
      updated_fields: Object.keys(updates),
    });

    res.json({
      message: 'App updated successfully',
      app: updatedApp,
    });
  } catch (error) {
    logger.error('Failed to update app', {
      error: error.message,
      userId: req.user?.id,
      appId: req.params.id,
    });

    res.status(500).json({
      error: 'Failed to update app',
      message: error.message,
    });
  }
});

// ============================================================================
// Endpoint 5: DELETE /apps/:id - Delete/deactivate app
// ============================================================================

router.delete('/apps/:id', sanitizeQuery, async (req, res) => {
  try {
    const { id } = req.params;
    const permanent = req.query.permanent === 'true';

    // Validate UUID
    if (!isValidUuid(id)) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'Invalid app ID format',
      });
    }

    // Check if app exists
    const { data: existingApp, error: fetchError } = await supabaseAdmin
      .from('apps')
      .select('name')
      .eq('id', id)
      .single();

    if (fetchError || !existingApp) {
      return res.status(404).json({
        error: 'not_found',
        message: 'App not found',
      });
    }

    if (permanent) {
      // Permanent delete
      const { error: deleteError } = await supabaseAdmin
        .from('apps')
        .delete()
        .eq('id', id);

      if (deleteError) {
        throw deleteError;
      }

      // Record analytics (before app is deleted)
      await recordAnalyticsEvent(
        id,
        'app_deleted',
        req.user.id,
        {
          app_name: existingApp.name,
          permanent: true,
          admin_email: req.user.email,
        },
        req
      );

      // Log admin action with WARNING level
      logger.warn('App permanently deleted', {
        userId: req.user.id,
        app_id: id,
        app_name: existingApp.name,
        admin_email: req.user.email,
      });

      res.json({
        message: 'App permanently deleted',
        app_id: id,
      });
    } else {
      // Soft delete (deactivate)
      const { error: updateError } = await supabaseAdmin
        .from('apps')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (updateError) {
        throw updateError;
      }

      // Record analytics
      await recordAnalyticsEvent(
        id,
        'app_deleted',
        req.user.id,
        {
          app_name: existingApp.name,
          permanent: false,
          admin_email: req.user.email,
        },
        req
      );

      // Log admin action
      logAdminAction('app_deactivated', req.user.id, {
        app_id: id,
        app_name: existingApp.name,
      });

      res.json({
        message: 'App deactivated successfully',
        app_id: id,
      });
    }
  } catch (error) {
    logger.error('Failed to delete app', {
      error: error.message,
      userId: req.user?.id,
      appId: req.params.id,
    });

    res.status(500).json({
      error: 'Failed to delete app',
      message: error.message,
    });
  }
});

// ============================================================================
// Endpoint 6: POST /apps/:id/regenerate-secret - Regenerate API secret
// ============================================================================

router.post('/apps/:id/regenerate-secret', sanitizeBody, async (req, res) => {
  try {
    const { id } = req.params;
    const { confirmation } = req.body;

    // Validate UUID
    if (!isValidUuid(id)) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'Invalid app ID format',
      });
    }

    // Fetch app
    const { data: app, error: fetchError } = await supabaseAdmin
      .from('apps')
      .select('name')
      .eq('id', id)
      .single();

    if (fetchError || !app) {
      return res.status(404).json({
        error: 'not_found',
        message: 'App not found',
      });
    }

    // Validate confirmation matches app name
    if (!confirmation || confirmation !== app.name) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'Confirmation does not match app name',
      });
    }

    // Generate new secret
    const newSecret = generateApiSecret();
    const hashedSecret = await hashSecret(newSecret);

    // Update database
    const { error: updateError } = await supabaseAdmin
      .from('apps')
      .update({
        api_secret: hashedSecret,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    // Record analytics
    await recordAnalyticsEvent(
      id,
      'secret_regenerated',
      req.user.id,
      {
        app_name: app.name,
        admin_email: req.user.email,
      },
      req
    );

    // Log admin action with WARNING level
    logger.warn('API secret regenerated', {
      userId: req.user.id,
      app_id: id,
      app_name: app.name,
      admin_email: req.user.email,
    });

    // Return new secret (ONLY TIME IT'S SHOWN!)
    res.json({
      message: 'API secret regenerated successfully',
      api_secret: newSecret, // PLAIN SECRET - shown only once!
      warning:
        'Update your application configuration immediately. Old secret is now invalid.',
    });
  } catch (error) {
    logger.error('Failed to regenerate secret', {
      error: error.message,
      userId: req.user?.id,
      appId: req.params.id,
    });

    res.status(500).json({
      error: 'Failed to regenerate secret',
      message: error.message,
    });
  }
});

// ============================================================================
// Endpoint 7: GET /apps/:id/analytics - Get app analytics
// ============================================================================

router.get('/apps/:id/analytics', sanitizeQuery, async (req, res) => {
  try {
    const { id } = req.params;
    const period = req.query.period || '30d';

    // Validate UUID
    if (!isValidUuid(id)) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'Invalid app ID format',
      });
    }

    // Validate period
    const validPeriods = { '7d': 7, '30d': 30, '90d': 90 };
    if (!validPeriods[period]) {
      return res.status(400).json({
        error: 'validation_error',
        message: 'Period must be one of: 7d, 30d, 90d',
      });
    }

    // Check if app exists
    const { data: app, error: appError } = await supabaseAdmin
      .from('apps')
      .select('id')
      .eq('id', id)
      .single();

    if (appError || !app) {
      return res.status(404).json({
        error: 'not_found',
        message: 'App not found',
      });
    }

    // Get analytics data
    const analytics = await getAppAnalytics(id, validPeriods[period]);

    res.json(analytics);
  } catch (error) {
    logger.error('Failed to get app analytics', {
      error: error.message,
      userId: req.user?.id,
      appId: req.params.id,
    });

    res.status(500).json({
      error: 'Failed to get app analytics',
      message: error.message,
    });
  }
});

// ============================================================================
// Endpoint 8: GET /dashboard - Global dashboard stats
// ============================================================================

router.get('/dashboard', async (req, res) => {
  try {
    // Get dashboard statistics
    const stats = await getDashboardStats();

    res.json(stats);
  } catch (error) {
    logger.error('Failed to get dashboard stats', {
      error: error.message,
      userId: req.user?.id,
    });

    res.status(500).json({
      error: 'Failed to get dashboard stats',
      message: error.message,
    });
  }
});

export default router;
