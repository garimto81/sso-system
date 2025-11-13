/**
 * Test Data Fixtures
 * Sample data for E2E tests
 */

export const testApps = {
  minimal: {
    name: 'Test App Minimal',
    description: 'Minimal test application',
    redirect_urls: ['http://localhost:4000/callback'],
    allowed_origins: ['http://localhost:4000'],
  },

  full: {
    name: 'Test App Full',
    description: 'Full featured test application with multiple URLs',
    redirect_urls: [
      'http://localhost:4000/callback',
      'http://localhost:4001/auth/callback',
      'https://test.example.com/oauth/callback',
    ],
    allowed_origins: [
      'http://localhost:4000',
      'http://localhost:4001',
      'https://test.example.com',
    ],
  },

  invalid: {
    name: 'AB', // Too short (min 3)
    description: 'A'.repeat(501), // Too long (max 500)
    redirect_urls: ['not-a-url'], // Invalid URL
    allowed_origins: ['also-not-a-url'], // Invalid URL
  },
}

export const testUsers = {
  admin: {
    email: 'admin@test.com',
    password: 'Test1234!',
    role: 'admin',
  },

  user: {
    email: 'user@test.com',
    password: 'Test1234!',
    role: 'user',
  },
}

export const testCredentials = {
  invalid: {
    email: 'wrong@test.com',
    password: 'WrongPassword123!',
  },

  malformed: {
    email: 'not-an-email',
    password: '123',
  },
}
