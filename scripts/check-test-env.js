#!/usr/bin/env node
/**
 * Check Test Environment
 * Verifies all prerequisites for testing
 *
 * Usage:
 *   node scripts/check-test-env.js
 *   npm run test:check
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const { checkDockerRunning, isPortInUse } = require('./test-utils')

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
}

const log = {
  success: (msg) => console.log(`${COLORS.green}✅${COLORS.reset} ${msg}`),
  error: (msg) => console.log(`${COLORS.red}❌${COLORS.reset} ${msg}`),
  warn: (msg) => console.log(`${COLORS.yellow}⚠️${COLORS.reset} ${msg}`),
  info: (msg) => console.log(`${COLORS.blue}ℹ${COLORS.reset} ${msg}`),
}

let allChecksPassed = true

function checkDocker() {
  console.log('\n📦 Docker')
  console.log('─'.repeat(60))

  if (checkDockerRunning()) {
    log.success('Docker is running')
  } else {
    log.error('Docker is not running')
    log.info('Please start Docker Desktop')
    allChecksPassed = false
  }
}

function checkSupabase() {
  console.log('\n🗄️  Supabase')
  console.log('─'.repeat(60))

  try {
    execSync('npx supabase status', { stdio: 'pipe' })
    log.success('Supabase is running')

    const status = execSync('npx supabase status', { encoding: 'utf-8' })
    console.log(status)
  } catch (error) {
    log.warn('Supabase is not running')
    log.info('Run: npx supabase start')
  }
}

function checkPorts() {
  console.log('\n🔌 Ports')
  console.log('─'.repeat(60))

  const ports = {
    3000: 'Backend Server',
    3001: 'Frontend Server',
    54321: 'Supabase API',
    54323: 'Supabase Studio',
  }

  Object.entries(ports).forEach(([port, name]) => {
    if (isPortInUse(parseInt(port))) {
      log.success(`Port ${port} (${name}) - In use`)
    } else {
      log.warn(`Port ${port} (${name}) - Available`)
    }
  })
}

function checkNodeModules() {
  console.log('\n📦 Dependencies')
  console.log('─'.repeat(60))

  // Check server dependencies
  const serverNodeModules = path.join(__dirname, '..', 'server', 'node_modules')
  if (fs.existsSync(serverNodeModules)) {
    log.success('Server dependencies installed')
  } else {
    log.error('Server dependencies not installed')
    log.info('Run: cd server && npm install')
    allChecksPassed = false
  }

  // Check admin-dashboard dependencies
  const frontendNodeModules = path.join(__dirname, '..', 'admin-dashboard', 'node_modules')
  if (fs.existsSync(frontendNodeModules)) {
    log.success('Frontend dependencies installed')
  } else {
    log.error('Frontend dependencies not installed')
    log.info('Run: cd admin-dashboard && npm install')
    allChecksPassed = false
  }

  // Check Playwright
  try {
    execSync('npx playwright --version', { stdio: 'pipe' })
    log.success('Playwright installed')
  } catch (error) {
    log.warn('Playwright not installed')
    log.info('Run: cd admin-dashboard && npx playwright install')
  }
}

function checkEnvFiles() {
  console.log('\n⚙️  Environment Variables')
  console.log('─'.repeat(60))

  // Check server .env
  const serverEnv = path.join(__dirname, '..', 'server', '.env')
  if (fs.existsSync(serverEnv)) {
    log.success('Server .env exists')

    // Check required variables
    const envContent = fs.readFileSync(serverEnv, 'utf-8')
    const requiredVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'JWT_SECRET']

    requiredVars.forEach((varName) => {
      if (envContent.includes(varName)) {
        log.success(`  ${varName} defined`)
      } else {
        log.error(`  ${varName} missing`)
        allChecksPassed = false
      }
    })
  } else {
    log.error('Server .env not found')
    log.info('Copy .env.example to .env and fill in values')
    allChecksPassed = false
  }

  // Check admin-dashboard .env.local
  const frontendEnv = path.join(__dirname, '..', 'admin-dashboard', '.env.local')
  if (fs.existsSync(frontendEnv)) {
    log.success('Frontend .env.local exists')
  } else {
    log.warn('Frontend .env.local not found')
    log.info('Copy .env.example to .env.local')
  }
}

function checkDatabase() {
  console.log('\n🗃️  Database')
  console.log('─'.repeat(60))

  try {
    // Try to query Supabase
    const { createClient } = require('@supabase/supabase-js')
    const supabaseUrl = process.env.SUPABASE_URL || 'http://127.0.0.1:54321'
    const supabaseKey =
      process.env.SUPABASE_ANON_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'

    const supabase = createClient(supabaseUrl, supabaseKey)

    log.success('Database connection configured')
  } catch (error) {
    log.warn('Database connection check skipped')
  }
}

function displaySummary() {
  console.log('\n' + '='.repeat(60))

  if (allChecksPassed) {
    log.success('All checks passed! Ready for testing 🎉')
    console.log('\nNext steps:')
    console.log('  npm run test:setup  - Start test environment')
    console.log('  npm run test:e2e    - Run E2E tests')
  } else {
    log.error('Some checks failed. Please fix the issues above.')
    console.log('\nCommon fixes:')
    console.log('  1. Start Docker Desktop')
    console.log('  2. Run: npx supabase start')
    console.log('  3. Run: npm install (in server and admin-dashboard)')
    console.log('  4. Copy .env.example to .env and configure')
  }

  console.log('='.repeat(60) + '\n')
}

function main() {
  console.log('\n' + '='.repeat(60))
  console.log('🔍 Checking Test Environment')
  console.log('='.repeat(60))

  checkDocker()
  checkSupabase()
  checkPorts()
  checkNodeModules()
  checkEnvFiles()
  checkDatabase()
  displaySummary()

  process.exit(allChecksPassed ? 0 : 1)
}

main()
