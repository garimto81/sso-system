/**
 * SSO Central Authentication Server
 * Entry Point
 */

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// IMPORTANT: Load environment variables FIRST, before any other imports
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try to load .env file (for local development)
// In production (Vercel), environment variables are already set
const envPath = join(__dirname, '../../.env');
const result = dotenv.config({ path: envPath });

if (result.error && process.env.NODE_ENV !== 'production') {
  console.error('❌ Failed to load .env file:', result.error);
  console.log('Tried to load from:', envPath);
  console.log('💡 Tip: Copy .env.example to .env');
}

console.log('✅ Environment variables loaded');
console.log('   SUPABASE_URL:', process.env.SUPABASE_URL?.substring(0, 30) + '...');
console.log('   SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing');

// Import routes (after env is loaded)
import authRoutes from './routes/auth.js';
import apiRoutes from './routes/api.js';
import adminRoutes from './routes/admin.js';
import { healthLimiter, authLimiter, tokenLimiter } from './middleware/rateLimiter.js';
import { httpsRedirect } from './middleware/httpsRedirect.js';
import authenticateAdmin from './middleware/authenticateAdmin.js';
import { adminRateLimiter } from './middleware/adminRateLimiter.js';

const app = express();
const PORT = process.env.PORT || 3000;

// ============================================================================
// Middleware
// ============================================================================

// HTTPS redirect (production only)
app.use(httpsRedirect);

// Security headers (helmet)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
}));

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============================================================================
// Routes
// ============================================================================

// Health check (with light rate limiting)
app.get('/health', healthLimiter, (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'SSO Auth Server',
    version: '1.0.0'
  });
});

// Auth routes (login, callback, etc.) - with strict rate limiting
app.use('/auth', authLimiter, authRoutes);

// API routes (authorize, token exchange) - with moderate rate limiting
app.use('/api/v1', tokenLimiter, apiRoutes);

// Admin routes (dashboard API) - with admin authentication and rate limiting
app.use('/api/v1/admin', authenticateAdmin, adminRateLimiter, adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Cannot ${req.method} ${req.path}`
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ============================================================================
// Start Server
// ============================================================================

// Only start server if not in Vercel serverless environment
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log('🚀 SSO Central Authentication Server');
    console.log('='.repeat(60));
    console.log(`✅ Server running on: http://localhost:${PORT}`);
    console.log(`✅ Health check: http://localhost:${PORT}/health`);
    console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`✅ Supabase URL: ${process.env.SUPABASE_URL}`);
    console.log('='.repeat(60));
  });
} else {
  console.log('✅ Running in Vercel serverless environment');
}

export default app;
