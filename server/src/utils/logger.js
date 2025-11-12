/**
 * Structured Logging with Winston
 *
 * Usage:
 *   import { logger } from './utils/logger.js';
 *
 *   logger.info('User logged in', { userId: '123', email: 'user@example.com' });
 *   logger.error('Database error', { error: err.message, stack: err.stack });
 */

import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let metaStr = '';
    if (Object.keys(meta).length > 0) {
      metaStr = '\n' + JSON.stringify(meta, null, 2);
    }
    return `${timestamp} [${level}]: ${message}${metaStr}`;
  })
);

// Create logs directory if it doesn't exist
const logsDir = path.resolve(__dirname, '../../logs');

// Configure transports
const transports = [];

// Always log to console
transports.push(
  new winston.transports.Console({
    format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat,
  })
);

// Log to files only when not in Vercel (serverless) environment
// Vercel has read-only filesystem except /tmp
if (process.env.VERCEL !== '1' && (process.env.NODE_ENV === 'production' || process.env.LOG_TO_FILE === 'true')) {
  transports.push(
    new winston.transports.File({
      filename: process.env.LOG_ERROR_FILE || path.join(logsDir, 'error.log'),
      level: 'error',
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: process.env.LOG_COMBINED_FILE || path.join(logsDir, 'combined.log'),
      format: logFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );
}

// Create logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports,
  // Don't exit on uncaught errors
  exitOnError: false,
});

// Create request logger middleware
export const requestLogger = (req, res, next) => {
  const start = Date.now();

  // Log request
  logger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Log response
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
    });
  });

  next();
};

// Log admin actions
export const logAdminAction = (action, userId, metadata = {}) => {
  logger.info('Admin action', {
    action,
    userId,
    timestamp: new Date().toISOString(),
    ...metadata,
  });
};

// Export for testing
export default logger;
