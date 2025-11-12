#!/usr/bin/env node
/**
 * Start Test Environment
 * Automatically starts all services needed for E2E testing
 *
 * Usage:
 *   node scripts/start-test-env.js
 *   npm run test:setup
 */

const { spawn, execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const { waitForPort, checkDockerRunning, sleep } = require('./test-utils')

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

const log = {
  info: (msg) => console.log(`${COLORS.blue}ℹ${COLORS.reset} ${msg}`),
  success: (msg) => console.log(`${COLORS.green}✅${COLORS.reset} ${msg}`),
  error: (msg) => console.log(`${COLORS.red}❌${COLORS.reset} ${msg}`),
  warn: (msg) => console.log(`${COLORS.yellow}⚠️${COLORS.reset} ${msg}`),
  step: (msg) => console.log(`\n${COLORS.cyan}▶${COLORS.reset} ${msg}`),
}

const PORTS = {
  supabase: 54321,
  backend: 3000,
  frontend: 3001,
}

let backendProcess = null
let frontendProcess = null

// Cleanup on exit
process.on('SIGINT', cleanup)
process.on('SIGTERM', cleanup)

async function cleanup() {
  log.info('Cleaning up...')

  if (backendProcess) {
    backendProcess.kill()
  }
  if (frontendProcess) {
    frontendProcess.kill()
  }

  process.exit(0)
}

async function checkSupabase() {
  log.step('Checking Supabase...')

  try {
    // Check if Docker is running
    if (!checkDockerRunning()) {
      log.error('Docker is not running. Please start Docker Desktop.')
      process.exit(1)
    }

    // Check if Supabase is running
    const isRunning = await waitForPort('localhost', PORTS.supabase, 1000)

    if (!isRunning) {
      log.info('Starting Supabase...')
      execSync('npx supabase start', { stdio: 'inherit' })
      await sleep(5000)
    }

    log.success('Supabase is running (http://localhost:54321)')
  } catch (error) {
    log.error(`Supabase check failed: ${error.message}`)
    process.exit(1)
  }
}

async function startBackend() {
  log.step('Starting Backend Server...')

  try {
    // Check if already running
    const isRunning = await waitForPort('localhost', PORTS.backend, 1000)

    if (isRunning) {
      log.warn('Backend already running on port 3000')
      return
    }

    // Check if server directory exists
    const serverPath = path.join(__dirname, '..', 'server')
    if (!fs.existsSync(serverPath)) {
      log.error('Server directory not found')
      process.exit(1)
    }

    // Start backend in background
    backendProcess = spawn('npm', ['run', 'dev'], {
      cwd: serverPath,
      stdio: 'pipe',
      shell: true,
    })

    backendProcess.stdout.on('data', (data) => {
      if (data.toString().includes('Server running')) {
        log.success('Backend started at http://localhost:3000')
      }
    })

    backendProcess.stderr.on('data', (data) => {
      // Suppress minor warnings
      if (!data.toString().includes('ExperimentalWarning')) {
        console.error(data.toString())
      }
    })

    // Wait for backend to be ready
    await waitForPort('localhost', PORTS.backend, 30000)
    await sleep(2000) // Extra time for initialization

    log.success('Backend server ready')
  } catch (error) {
    log.error(`Backend startup failed: ${error.message}`)
    process.exit(1)
  }
}

async function startFrontend() {
  log.step('Starting Frontend Server...')

  try {
    // Check if already running
    const isRunning = await waitForPort('localhost', PORTS.frontend, 1000)

    if (isRunning) {
      log.warn('Frontend already running on port 3001')
      return
    }

    // Check if admin-dashboard directory exists
    const frontendPath = path.join(__dirname, '..', 'admin-dashboard')
    if (!fs.existsSync(frontendPath)) {
      log.error('admin-dashboard directory not found')
      process.exit(1)
    }

    // Check if node_modules exists
    const nodeModulesPath = path.join(frontendPath, 'node_modules')
    if (!fs.existsSync(nodeModulesPath)) {
      log.info('Installing frontend dependencies...')
      execSync('npm install', { cwd: frontendPath, stdio: 'inherit' })
    }

    // Start frontend in background
    frontendProcess = spawn('npm', ['run', 'dev'], {
      cwd: frontendPath,
      stdio: 'pipe',
      shell: true,
      env: { ...process.env, PORT: '3001' },
    })

    frontendProcess.stdout.on('data', (data) => {
      const output = data.toString()
      if (output.includes('Ready') || output.includes('localhost:3001')) {
        log.success('Frontend started at http://localhost:3001')
      }
    })

    frontendProcess.stderr.on('data', (data) => {
      // Next.js outputs to stderr, check for success messages
      const output = data.toString()
      if (output.includes('Ready') || output.includes('localhost:3001')) {
        log.success('Frontend started at http://localhost:3001')
      }
    })

    // Wait for frontend to be ready
    await waitForPort('localhost', PORTS.frontend, 60000)
    await sleep(3000) // Extra time for Next.js

    log.success('Frontend server ready')
  } catch (error) {
    log.error(`Frontend startup failed: ${error.message}`)
    process.exit(1)
  }
}

async function createAdminUser() {
  log.step('Creating Admin Account...')

  try {
    const serverPath = path.join(__dirname, '..', 'server')
    const setupAdminPath = path.join(serverPath, 'scripts', 'setup-admin.js')
    const serverNodeModules = path.join(serverPath, 'node_modules')

    if (!fs.existsSync(setupAdminPath)) {
      log.warn('setup-admin.js not found, skipping admin creation')
      return
    }

    if (!fs.existsSync(serverNodeModules)) {
      log.warn('server/node_modules not found, skipping admin creation')
      log.info('Run: cd server && npm install')
      return
    }

    // Run setup-admin script from server directory
    execSync(`node scripts/setup-admin.js --email=admin@test.com --password=Test1234!`, {
      cwd: serverPath,
      stdio: 'inherit',
    })

    log.success('Admin created: admin@test.com / Test1234!')
  } catch (error) {
    // Admin might already exist, that's okay
    const errorMsg = error.message || error.toString()
    if (
      errorMsg.includes('already exists') ||
      errorMsg.includes('already registered')
    ) {
      log.success('Admin account already exists')
    } else {
      log.warn(`Admin creation warning: ${errorMsg}`)
      log.info('You can create admin manually later:')
      log.info('  npm run admin:setup')
    }
  }
}

async function seedTestData() {
  log.step('Seeding Test Data (optional)...')

  try {
    const seedDataPath = path.join(__dirname, 'seed-test-data.js')

    if (!fs.existsSync(seedDataPath)) {
      log.info('seed-test-data.js not found, skipping data seeding')
      return
    }

    // Check if user wants to seed data
    const shouldSeed = process.argv.includes('--seed')

    if (shouldSeed) {
      execSync(`node ${seedDataPath}`, { stdio: 'inherit' })
      log.success('Test data seeded')
    } else {
      log.info('Skip test data seeding (use --seed flag to enable)')
    }
  } catch (error) {
    log.warn(`Test data seeding warning: ${error.message}`)
  }
}

async function displaySummary() {
  console.log('\n' + '='.repeat(60))
  log.success('Test Environment Ready! 🎉')
  console.log('='.repeat(60))

  console.log('\n📍 Service URLs:')
  console.log(`   Backend:  ${COLORS.cyan}http://localhost:3000${COLORS.reset}`)
  console.log(`   Frontend: ${COLORS.cyan}http://localhost:3001${COLORS.reset}`)
  console.log(`   Supabase: ${COLORS.cyan}http://localhost:54323${COLORS.reset}`)

  console.log('\n🔑 Admin Credentials:')
  console.log(`   Email:    ${COLORS.green}admin@test.com${COLORS.reset}`)
  console.log(`   Password: ${COLORS.green}Test1234!${COLORS.reset}`)

  console.log('\n🧪 Run Tests:')
  console.log(`   ${COLORS.yellow}npm run test:e2e${COLORS.reset}           - Run Playwright tests`)
  console.log(`   ${COLORS.yellow}npx playwright test --ui${COLORS.reset}  - Open Playwright UI`)

  console.log('\n🛑 Stop Environment:')
  console.log(`   ${COLORS.yellow}npm run test:cleanup${COLORS.reset}      - Stop all services`)
  console.log(`   ${COLORS.yellow}Ctrl+C${COLORS.reset}                    - Stop this script`)

  console.log('\n' + '='.repeat(60) + '\n')

  // Keep process alive
  log.info('Press Ctrl+C to stop the environment')
  await new Promise(() => {}) // Keep running
}

async function main() {
  console.log('\n' + '='.repeat(60))
  console.log('🚀 Starting Test Environment')
  console.log('='.repeat(60) + '\n')

  try {
    await checkSupabase()
    await startBackend()
    await startFrontend()
    await createAdminUser()
    await seedTestData()
    await displaySummary()
  } catch (error) {
    log.error(`Setup failed: ${error.message}`)
    cleanup()
    process.exit(1)
  }
}

main()
