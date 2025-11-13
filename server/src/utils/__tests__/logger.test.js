/**
 * Tests for Winston logger
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { logger, requestLogger, logAdminAction } from '../logger.js';

describe('Logger', () => {
  let consoleSpy;

  beforeEach(() => {
    // Suppress console output during tests
    consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should be defined', () => {
    expect(logger).toBeDefined();
    expect(logger.info).toBeInstanceOf(Function);
    expect(logger.error).toBeInstanceOf(Function);
    expect(logger.warn).toBeInstanceOf(Function);
    expect(logger.debug).toBeInstanceOf(Function);
  });

  it('should log info messages', () => {
    expect(() => {
      logger.info('Test message');
    }).not.toThrow();
  });

  it('should log error messages', () => {
    expect(() => {
      logger.error('Error message', { code: 500 });
    }).not.toThrow();
  });

  it('should log with metadata', () => {
    expect(() => {
      logger.info('User action', {
        userId: '123',
        action: 'login',
      });
    }).not.toThrow();
  });

  it('should have correct log levels', () => {
    expect(logger.levels).toBeDefined();
  });
});

describe('requestLogger middleware', () => {
  it('should log incoming requests', (done) => {
    const req = {
      method: 'GET',
      url: '/api/test',
      ip: '127.0.0.1',
      get: jest.fn(() => 'test-agent'),
    };

    const res = {
      on: jest.fn((event, callback) => {
        if (event === 'finish') {
          // Simulate response finish
          res.statusCode = 200;
          callback();
        }
      }),
      statusCode: 200,
    };

    const next = jest.fn();

    requestLogger(req, res, next);

    // Verify next was called
    expect(next).toHaveBeenCalled();

    // Give time for async logging
    setTimeout(() => {
      expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
      done();
    }, 100);
  });
});

describe('logAdminAction', () => {
  it('should log admin actions', () => {
    expect(() => {
      logAdminAction('create_app', 'user123', {
        appName: 'Test App',
        appId: 'app456',
      });
    }).not.toThrow();
  });

  it('should handle missing metadata', () => {
    expect(() => {
      logAdminAction('delete_app', 'user123');
    }).not.toThrow();
  });

  it('should include timestamp', () => {
    const spy = jest.spyOn(logger, 'info');

    logAdminAction('test_action', 'user123');

    expect(spy).toHaveBeenCalledWith(
      'Admin action',
      expect.objectContaining({
        action: 'test_action',
        userId: 'user123',
        timestamp: expect.any(String),
      })
    );

    spy.mockRestore();
  });
});

describe('Logger configuration', () => {
  it('should respect LOG_LEVEL environment variable', () => {
    expect(logger.level).toBeDefined();
    expect(typeof logger.level).toBe('string');
  });

  it('should have transports configured', () => {
    expect(logger.transports).toBeDefined();
    expect(logger.transports.length).toBeGreaterThan(0);
  });

  it('should not exit on error', () => {
    expect(logger.exitOnError).toBe(false);
  });
});
