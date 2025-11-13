/**
 * Jest Configuration for SSO Admin API
 *
 * ESM Support: Node.js with native ES modules
 * Coverage Threshold: 80% (industry standard)
 */

export default {
  // Use Node.js environment for backend testing
  testEnvironment: 'node',

  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/?(*.)+(spec|test).js'
  ],

  // Transform: none needed for ESM (Node.js native)
  transform: {},

  // Module file extensions
  moduleFileExtensions: ['js', 'json'],

  // Collect coverage from these files
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/__tests__/**',
    '!src/index.js',
    '!**/node_modules/**'
  ],

  // Coverage thresholds (80% industry standard)
  coverageThreshold: {
    global: {
      statements: 80,
      branches: 80,
      functions: 80,
      lines: 80
    }
  },

  // Coverage directory
  coverageDirectory: 'coverage',

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks between tests
  restoreMocks: true,

  // Reset mocks between tests
  resetMocks: true,

  // Timeout for tests (5 seconds)
  testTimeout: 5000,

  // Module name mapper for path aliases (if needed)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};
