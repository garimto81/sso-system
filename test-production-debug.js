/**
 * Production Debug Script
 * Tests actual production deployment to diagnose the issue
 */

const PROD_URL = 'https://sso-frontend-dvfbqjetd-garimto81s-projects.vercel.app'
const BACKEND_URL = 'https://sso-backend-eight.vercel.app'

async function checkProduction() {
  console.log('🔍 Checking Production Deployment...\n')

  // Test 1: Frontend loads
  console.log('Test 1: Frontend Page Load')
  try {
    const response = await fetch(`${PROD_URL}/login`)
    const html = await response.text()

    console.log(`  Status: ${response.status}`)
    console.log(`  Has "Loading..." text: ${html.includes('Loading...')}`)
    console.log(`  Has LoginForm: ${html.includes('LoginForm') || html.includes('login-form')}`)
    console.log(`  Has window.location: ${html.includes('window.location')}`)
    console.log(`  Has router.push: ${html.includes('router.push')}`)

    // Check if stuck on fallback
    if (html.includes('Loading...') && html.includes('BAILOUT_TO_CLIENT_SIDE_RENDERING')) {
      console.log('  ❌ STUCK ON SUSPENSE FALLBACK!')
    }
  } catch (err) {
    console.log(`  ❌ Error: ${err.message}`)
  }

  console.log()

  // Test 2: Backend API
  console.log('Test 2: Backend SSO Server')
  try {
    const response = await fetch(`${BACKEND_URL}/health`)
    const data = await response.json()

    console.log(`  Status: ${response.status}`)
    console.log(`  Service: ${data.service || 'Unknown'}`)
    console.log(`  Version: ${data.version || 'Unknown'}`)
    console.log(`  ${response.status === 200 ? '✅' : '❌'} Backend is ${response.status === 200 ? 'HEALTHY' : 'DOWN'}`)
  } catch (err) {
    console.log(`  ❌ Error: ${err.message}`)
  }

  console.log()

  // Test 3: Login API (Frontend Proxy)
  console.log('Test 3: Frontend Login API')
  try {
    const response = await fetch(`${PROD_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@sso.local',
        password: 'Test1234!'
      })
    })

    const text = await response.text()
    console.log(`  Status: ${response.status}`)
    console.log(`  Response: ${text}`)

    if (response.status === 500) {
      console.log('  ❌ LOGIN API FAILING!')
    } else if (response.status === 200) {
      console.log('  ✅ Login API works')
    }
  } catch (err) {
    console.log(`  ❌ Error: ${err.message}`)
  }

  console.log()

  // Test 4: Check JavaScript chunks
  console.log('Test 4: JavaScript Chunks Loading')
  try {
    const response = await fetch(`${PROD_URL}/login`)
    const html = await response.text()

    const scriptMatches = html.match(/<script src="([^"]+)"/g) || []
    console.log(`  Found ${scriptMatches.length} script tags`)

    if (scriptMatches.length === 0) {
      console.log('  ❌ NO JAVASCRIPT CHUNKS FOUND!')
    } else {
      console.log('  ✅ JavaScript chunks present')

      // Test one chunk
      const firstScript = scriptMatches[0].match(/src="([^"]+)"/)[1]
      const chunkUrl = `${PROD_URL}${firstScript}`
      const chunkResponse = await fetch(chunkUrl)
      console.log(`  First chunk status: ${chunkResponse.status}`)

      if (chunkResponse.status === 404) {
        console.log('  ❌ JavaScript chunks return 404!')
      }
    }
  } catch (err) {
    console.log(`  ❌ Error: ${err.message}`)
  }

  console.log('\n' + '='.repeat(60))
  console.log('DIAGNOSIS:')
  console.log('='.repeat(60))
  console.log('\nBased on the tests above:')
  console.log('- If "STUCK ON SUSPENSE FALLBACK" → Frontend deployment broken')
  console.log('- If "LOGIN API FAILING" → Backend connection issue')
  console.log('- If "JavaScript chunks 404" → Build/deployment issue')
  console.log('\nRun this script to see actual production status.')
}

checkProduction().catch(console.error)
