/**
 * Tests for sanitization utilities
 */

import { describe, it, expect } from '@jest/globals';
import {
  sanitizeInput,
  sanitizeObject,
  sanitizeBody,
  sanitizeQuery,
} from '../sanitize.js';

describe('sanitizeInput', () => {
  it('should remove HTML tags', () => {
    const input = '<script>alert("xss")</script>Hello';
    const result = sanitizeInput(input);
    expect(result).not.toContain('<script>');
    expect(result).toContain('Hello');
  });

  it('should remove event handlers', () => {
    const input = '<img src=x onerror="alert(1)">';
    const result = sanitizeInput(input);
    expect(result).not.toContain('onerror');
  });

  it('should trim whitespace', () => {
    const input = '  Hello World  ';
    const result = sanitizeInput(input);
    expect(result).toBe('Hello World');
  });

  it('should handle non-string input', () => {
    expect(sanitizeInput(123)).toBe(123);
    expect(sanitizeInput(null)).toBe(null);
    expect(sanitizeInput(undefined)).toBe(undefined);
  });

  it('should handle empty strings', () => {
    expect(sanitizeInput('')).toBe('');
    expect(sanitizeInput('   ')).toBe('');
  });
});

describe('sanitizeObject', () => {
  it('should sanitize all string properties', () => {
    const obj = {
      name: '<script>alert("xss")</script>John',
      email: 'test@example.com',
    };
    const result = sanitizeObject(obj);
    expect(result.name).not.toContain('<script>');
    expect(result.name).toContain('John');
    expect(result.email).toBe('test@example.com');
  });

  it('should sanitize nested objects', () => {
    const obj = {
      user: {
        name: '<b>Bold Name</b>',
        age: 30,
      },
    };
    const result = sanitizeObject(obj);
    expect(result.user.name).not.toContain('<b>');
    expect(result.user.age).toBe(30);
  });

  it('should sanitize arrays of strings', () => {
    const obj = {
      tags: ['<script>alert(1)</script>', 'valid-tag', '<b>bold</b>'],
    };
    const result = sanitizeObject(obj);
    expect(result.tags[0]).not.toContain('<script>');
    expect(result.tags[1]).toBe('valid-tag');
    expect(result.tags[2]).not.toContain('<b>');
  });

  it('should preserve non-string values', () => {
    const obj = {
      count: 42,
      active: true,
      data: null,
      list: [1, 2, 3],
    };
    const result = sanitizeObject(obj);
    expect(result.count).toBe(42);
    expect(result.active).toBe(true);
    expect(result.data).toBe(null);
    expect(result.list).toEqual([1, 2, 3]);
  });

  it('should handle null and undefined', () => {
    expect(sanitizeObject(null)).toBe(null);
    expect(sanitizeObject(undefined)).toBe(undefined);
  });

  it('should handle empty objects', () => {
    const result = sanitizeObject({});
    expect(result).toEqual({});
  });
});

describe('sanitizeBody middleware', () => {
  it('should sanitize request body', () => {
    const req = {
      body: {
        name: '<script>xss</script>John',
        email: 'test@example.com',
      },
    };
    const res = {};
    const next = jest.fn();

    sanitizeBody(req, res, next);

    expect(req.body.name).not.toContain('<script>');
    expect(req.body.name).toContain('John');
    expect(req.body.email).toBe('test@example.com');
    expect(next).toHaveBeenCalled();
  });

  it('should handle missing body', () => {
    const req = {};
    const res = {};
    const next = jest.fn();

    sanitizeBody(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});

describe('sanitizeQuery middleware', () => {
  it('should sanitize query parameters', () => {
    const req = {
      query: {
        search: '<script>xss</script>test',
        page: '1',
      },
    };
    const res = {};
    const next = jest.fn();

    sanitizeQuery(req, res, next);

    expect(req.query.search).not.toContain('<script>');
    expect(req.query.search).toContain('test');
    expect(req.query.page).toBe('1');
    expect(next).toHaveBeenCalled();
  });
});

describe('XSS attack vectors', () => {
  const attackVectors = [
    '<script>alert("XSS")</script>',
    '<img src=x onerror="alert(1)">',
    '<iframe src="javascript:alert(1)"></iframe>',
    '<svg onload="alert(1)">',
    '<body onload="alert(1)">',
    'javascript:alert(1)',
    '<a href="javascript:alert(1)">Click</a>',
    '<input onfocus="alert(1)" autofocus>',
  ];

  attackVectors.forEach((vector) => {
    it(`should neutralize: ${vector.substring(0, 30)}...`, () => {
      const result = sanitizeInput(vector);
      expect(result).not.toContain('<script');
      expect(result).not.toContain('javascript:');
      expect(result).not.toContain('onerror');
      expect(result).not.toContain('onload');
      expect(result).not.toContain('onfocus');
    });
  });
});
