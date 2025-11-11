/**
 * Input Sanitization Utilities
 *
 * Prevents XSS attacks by sanitizing user input
 *
 * Usage:
 *   import { sanitizeInput, sanitizeObject } from './utils/sanitize.js';
 *
 *   const cleanName = sanitizeInput(req.body.name);
 *   const cleanData = sanitizeObject(req.body);
 */

import sanitizeHtml from 'sanitize-html';

/**
 * Sanitize options - very restrictive (no HTML allowed)
 */
const strictOptions = {
  allowedTags: [],
  allowedAttributes: {},
  disallowedTagsMode: 'recursiveEscape',
};

/**
 * Sanitize a single string input
 *
 * @param {string} input - The input to sanitize
 * @returns {string} - Sanitized string
 */
export const sanitizeInput = (input) => {
  if (typeof input !== 'string') {
    return input;
  }

  // Trim whitespace
  input = input.trim();

  // Remove any HTML/script tags
  input = sanitizeHtml(input, strictOptions);

  return input;
};

/**
 * Sanitize all string values in an object
 *
 * @param {Object} obj - Object with potentially unsafe strings
 * @returns {Object} - Object with sanitized strings
 */
export const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const sanitized = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === 'string' ? sanitizeInput(item) : item
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
};

/**
 * Express middleware to sanitize request body
 *
 * Usage:
 *   app.post('/api/endpoint', sanitizeBody, handler);
 */
export const sanitizeBody = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  next();
};

/**
 * Express middleware to sanitize query parameters
 *
 * Usage:
 *   app.get('/api/endpoint', sanitizeQuery, handler);
 */
export const sanitizeQuery = (req, res, next) => {
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  next();
};

/**
 * Express middleware to sanitize params
 *
 * Usage:
 *   app.get('/api/endpoint/:id', sanitizeParams, handler);
 */
export const sanitizeParams = (req, res, next) => {
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  next();
};

/**
 * Sanitize all request inputs (body, query, params)
 *
 * Usage:
 *   app.use('/api', sanitizeAll);
 */
export const sanitizeAll = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  next();
};

export default {
  sanitizeInput,
  sanitizeObject,
  sanitizeBody,
  sanitizeQuery,
  sanitizeParams,
  sanitizeAll,
};
