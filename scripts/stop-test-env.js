#!/usr/bin/env node
/**
 * Stop Test Environment
 * Stops all running test services
 *
 * Usage:
 *   node scripts/stop-test-env.js
 *   npm run test:cleanup
 */

const { execSync } = require('child_process')
const { killPort } = require('./test-utils')

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
}

const log = {
  info: (msg) => console.log(`${COLORS.blue}ℹ${COLORS.reset} ${msg}`),
  success: (msg) => console.log(`${COLORS.green}✅${COLORS.reset} ${msg}`),
  warn: (msg) => console.log(`${COLORS.yellow}⚠️${COLORS.reset} ${msg}`),
}

const PORTS = {
  backend: 3000,
  frontend: 3001,
}

async function stopBackend() {
  log.info('Stopping Backend Server...')

  try {
    killPort(PORTS.backend)
    log.success('Backend server stopped')
  } catch (error) {
    log.warn('Backend server might not be running')
  }
}

async function stopFrontend() {
  log.info('Stopping Frontend Server...')

  try {
    killPort(PORTS.frontend)
    log.success('Frontend server stopped')
  } catch (error) {
    log.warn('Frontend server might not be running')
  }
}

async function stopSupabase() {
  const shouldStopSupabase = process.argv.includes('--supabase')

  if (shouldStopSupabase) {
    log.info('Stopping Supabase...')

    try {
      execSync('npx supabase stop', { stdio: 'inherit' })
      log.success('Supabase stopped')
    } catch (error) {
      log.warn('Supabase might not be running')
    }
  } else {
    log.info('Keeping Supabase running (use --supabase flag to stop)')
  }
}

async function main() {
  console.log('\n' + '='.repeat(60))
  console.log('🛑 Stopping Test Environment')
  console.log('='.repeat(60) + '\n')

  await stopBackend()
  await stopFrontend()
  await stopSupabase()

  console.log('\n' + '='.repeat(60))
  log.success('Test environment stopped')
  console.log('='.repeat(60) + '\n')
}

main()
