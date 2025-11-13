#!/usr/bin/env node

/**
 * Test API Endpoints
 *
 * SSO Server의 모든 주요 엔드포인트를 테스트하는 헬스 체크 스크립트
 *
 * 사용법:
 *   node scripts/test-api-endpoints.js
 *   node scripts/test-api-endpoints.js --url=https://sso-system.vercel.app
 *   node scripts/test-api-endpoints.js --verbose
 */

import dotenv from 'dotenv';

dotenv.config();

const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.split('=');
  acc[key.replace('--', '')] = value || true;
  return acc;
}, {});

const BASE_URL = args.url || process.env.FRONTEND_URL || 'http://localhost:3000';
const VERBOSE = args.verbose === true;

class APITester {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
    this.results = [];
  }

  async test(name, method, path, options = {}) {
    const startTime = Date.now();

    try {
      const url = `${this.baseUrl}${path}`;
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        body: options.body ? JSON.stringify(options.body) : undefined
      });

      const elapsed = Date.now() - startTime;
      const success = options.expectedStatus
        ? response.status === options.expectedStatus
        : response.status >= 200 && response.status < 300;

      const result = {
        name,
        success,
        status: response.status,
        elapsed,
        error: null
      };

      if (VERBOSE && !success) {
        const body = await response.text();
        result.responseBody = body;
      }

      this.results.push(result);
      return result;

    } catch (error) {
      const elapsed = Date.now() - startTime;
      const result = {
        name,
        success: false,
        status: 0,
        elapsed,
        error: error.message
      };

      this.results.push(result);
      return result;
    }
  }

  printResult(result) {
    const icon = result.success ? '✅' : '❌';
    const status = result.status || 'ERR';
    const time = `${result.elapsed}ms`;

    console.log(`   ${icon} ${result.name.padEnd(30)} ${status.toString().padStart(4)} ${time.padStart(8)}`);

    if (VERBOSE && !result.success) {
      if (result.error) {
        console.log(`      Error: ${result.error}`);
      }
      if (result.responseBody) {
        console.log(`      Response: ${result.responseBody.substring(0, 100)}...`);
      }
    }
  }

  getSummary() {
    const total = this.results.length;
    const passed = this.results.filter(r => r.success).length;
    const failed = total - passed;
    const avgTime = this.results.reduce((sum, r) => sum + r.elapsed, 0) / total;

    return { total, passed, failed, avgTime };
  }
}

async function main() {
  console.log('\n🔍 SSO API Endpoint Tests\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Target: ${BASE_URL}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const tester = new APITester(BASE_URL);

  console.log('📡 Public Endpoints:\n');

  // Health check
  let result = await tester.test('Health Check', 'GET', '/health');
  tester.printResult(result);

  // Auth endpoints (expect errors without credentials)
  result = await tester.test('Login (no credentials)', 'POST', '/auth/login', {
    expectedStatus: 400
  });
  tester.printResult(result);

  result = await tester.test('Signup (no data)', 'POST', '/auth/signup', {
    expectedStatus: 400
  });
  tester.printResult(result);

  // OAuth endpoints
  result = await tester.test('Authorize (missing params)', 'GET', '/api/v1/authorize', {
    expectedStatus: 400
  });
  tester.printResult(result);

  result = await tester.test('Token Exchange (no auth)', 'POST', '/api/v1/token/exchange', {
    expectedStatus: 401
  });
  tester.printResult(result);

  console.log('\n🔐 Admin Endpoints (expect 401):\n');

  // Admin endpoints (should require auth)
  result = await tester.test('List Apps (no auth)', 'GET', '/api/v1/admin/apps', {
    expectedStatus: 401
  });
  tester.printResult(result);

  result = await tester.test('Create App (no auth)', 'POST', '/api/v1/admin/apps', {
    expectedStatus: 401
  });
  tester.printResult(result);

  result = await tester.test('Dashboard Stats (no auth)', 'GET', '/api/v1/admin/dashboard', {
    expectedStatus: 401
  });
  tester.printResult(result);

  console.log('\n⚡ Performance Tests:\n');

  // Multiple concurrent requests
  const concurrentTests = [];
  for (let i = 0; i < 10; i++) {
    concurrentTests.push(
      tester.test(`Concurrent Health Check ${i + 1}`, 'GET', '/health')
    );
  }

  const concurrentResults = await Promise.all(concurrentTests);
  const avgConcurrent = concurrentResults.reduce((sum, r) => sum + r.elapsed, 0) / 10;
  console.log(`   ℹ️  Avg concurrent response time: ${avgConcurrent.toFixed(0)}ms`);

  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  const summary = tester.getSummary();
  console.log('📊 Test Summary:\n');
  console.log(`   Total Tests:     ${summary.total}`);
  console.log(`   Passed:          ${summary.passed} ✅`);
  console.log(`   Failed:          ${summary.failed} ${summary.failed > 0 ? '❌' : ''}`);
  console.log(`   Avg Response:    ${summary.avgTime.toFixed(0)}ms`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (summary.failed > 0) {
    console.log('⚠️  Some tests failed. Check server logs for details.\n');
    process.exit(1);
  } else {
    console.log('✅ All endpoint tests passed!\n');
  }
}

main().catch(error => {
  console.error('\n❌ Test suite error:', error.message);
  process.exit(1);
});
