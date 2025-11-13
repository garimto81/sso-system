/**
 * Production E2E Test: Admin Login
 * Verifies SSO Admin Dashboard production deployment
 *
 * Production URLs:
 * - Frontend: https://sso-frontend-iktoi87px-garimto81s-projects.vercel.app
 * - Backend: https://sso-backend-eight.vercel.app
 *
 * Test Scenario:
 * 1. Navigate to production login page
 * 2. Fill in admin credentials (admin@sso.local / Test1234!)
 * 3. Submit login form
 * 4. Verify successful redirect to /admin dashboard
 * 5. Verify no console errors
 * 6. Verify backend API is responding (HTTP 200)
 */

import { test, expect } from '@playwright/test'

// Production credentials
const PROD_ADMIN = {
  email: 'admin@sso.local',
  password: 'Test1234!',
}

// Production URLs
const PROD_FRONTEND_URL =
  'https://sso-frontend-dvfbqjetd-garimto81s-projects.vercel.app'
const PROD_BACKEND_URL = 'https://sso-backend-eight.vercel.app'

// Configure test for production environment (must be at top level)
test.use({
  baseURL: PROD_FRONTEND_URL,
})

test.describe('Production Deployment Verification', () => {

  test.beforeEach(async ({ page }) => {
    // Capture console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error('Console Error:', msg.text())
      }
    })

    // Capture page errors
    page.on('pageerror', (error) => {
      console.error('Page Error:', error.message)
    })
  })

  test('Backend health check - API is responding', async ({ request }) => {
    console.log(`Testing backend health: ${PROD_BACKEND_URL}/health`)

    const response = await request.get(`${PROD_BACKEND_URL}/health`)

    expect(response.ok()).toBeTruthy()
    expect(response.status()).toBe(200)

    const data = await response.json()
    console.log('Backend health:', data)

    expect(data).toHaveProperty('status')
    expect(data.status).toBe('ok')
  })

  test('Frontend loads without errors', async ({ page }) => {
    const errors: string[] = []

    // Track console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    // Track page errors
    page.on('pageerror', (error) => {
      errors.push(error.message)
    })

    await page.goto('/login', { waitUntil: 'networkidle', timeout: 30000 })

    // Verify page title
    await expect(page).toHaveTitle(/Admin Dashboard|Login|SSO/i)

    // Verify login form exists
    await expect(page.locator('input[name="email"]')).toBeVisible({
      timeout: 10000,
    })
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()

    // Report any errors
    if (errors.length > 0) {
      console.warn('Page loaded with errors:', errors)
    }

    expect(errors.length).toBe(0)
  })

  test('Admin login flow - Complete E2E verification', async ({
    page,
    context,
  }) => {
    const consoleErrors: string[] = []
    const networkErrors: string[] = []

    // Track console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
        console.error('Console Error:', msg.text())
      }
    })

    // Track failed network requests
    page.on('response', (response) => {
      if (!response.ok() && response.url().includes(PROD_BACKEND_URL)) {
        networkErrors.push(
          `${response.status()} ${response.statusText()} - ${response.url()}`
        )
        console.error('Network Error:', response.status(), response.url())
      }
    })

    console.log('Step 1: Navigate to login page')
    await page.goto('/login', { waitUntil: 'networkidle', timeout: 30000 })

    // Verify login form is visible
    await expect(page.locator('input[name="email"]')).toBeVisible({
      timeout: 10000,
    })

    console.log('Step 2: Fill in admin credentials')
    await page.fill('input[name="email"]', PROD_ADMIN.email)
    await page.fill('input[type="password"]', PROD_ADMIN.password)

    // Optional: Take screenshot before submission
    await page.screenshot({
      path: 'playwright-report/prod-login-before-submit.png',
    })

    console.log('Step 3: Submit login form')
    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).toBeVisible()

    // Click and wait for navigation
    await Promise.all([
      page.waitForURL(/\/(admin|dashboard)/i, { timeout: 30000 }),
      submitButton.click(),
    ])

    console.log('Step 4: Verify successful redirect')
    const currentURL = page.url()
    console.log('Redirected to:', currentURL)

    // Should redirect to /admin or /admin/dashboard
    expect(currentURL).toMatch(/\/(admin|dashboard)/i)

    console.log('Step 5: Verify dashboard page loads')
    // Wait for dashboard content to load
    await page.waitForLoadState('networkidle', { timeout: 30000 })

    // Verify dashboard elements exist (adjust selectors based on actual UI)
    const dashboardIndicators = [
      page.locator('text=Dashboard').first(),
      page.locator('text=Applications').first(),
      page.locator('text=Analytics').first(),
      page.locator('[role="navigation"]').first(),
    ]

    // At least one dashboard indicator should be visible
    const visibleCount = await Promise.all(
      dashboardIndicators.map(async (locator) => {
        try {
          await locator.waitFor({ state: 'visible', timeout: 5000 })
          return true
        } catch {
          return false
        }
      })
    )

    const hasAnyDashboardElement = visibleCount.some((v) => v === true)
    expect(hasAnyDashboardElement).toBeTruthy()

    console.log('Step 6: Verify authentication cookie')
    const cookies = await context.cookies()
    console.log('Cookies:', cookies.map((c) => c.name))

    const authCookie = cookies.find(
      (c) =>
        c.name === 'sso_admin_token' ||
        c.name === 'sb-access-token' ||
        c.name.includes('auth')
    )

    if (authCookie) {
      console.log('Auth cookie found:', authCookie.name)
      expect(authCookie.value).toBeTruthy()
      expect(authCookie.httpOnly).toBe(true)
    } else {
      console.warn('No auth cookie found, may use different auth mechanism')
    }

    // Take final screenshot
    await page.screenshot({
      path: 'playwright-report/prod-login-success.png',
    })

    console.log('Step 7: Verify no critical errors')
    if (consoleErrors.length > 0) {
      console.warn('Console errors detected:', consoleErrors)
    }
    if (networkErrors.length > 0) {
      console.warn('Network errors detected:', networkErrors)
    }

    // Fail test if there are critical errors
    expect(consoleErrors.filter((e) => !e.includes('Warning')).length).toBe(0)
    expect(networkErrors.filter((e) => e.includes('500')).length).toBe(0) // No 500 errors

    console.log('✅ Production login test completed successfully!')
  })

  test('Admin login - Invalid credentials handling', async ({ page }) => {
    console.log('Testing invalid credentials handling')

    await page.goto('/login', { waitUntil: 'networkidle', timeout: 30000 })

    // Fill with invalid credentials
    await page.fill('input[name="email"]', 'invalid@example.com')
    await page.fill('input[type="password"]', 'WrongPassword123!')

    // Submit
    await page.click('button[type="submit"]')

    // Wait a moment for error message to appear
    await page.waitForTimeout(3000)

    // Should stay on login page or show error
    const currentURL = page.url()
    const isOnLoginPage = currentURL.includes('/login')

    // Either stays on login OR shows error message
    const errorVisible = await page
      .locator('text=/invalid|error|failed|incorrect/i')
      .first()
      .isVisible()
      .catch(() => false)

    // At least one should be true
    expect(isOnLoginPage || errorVisible).toBeTruthy()

    console.log('Invalid credentials handled correctly')
  })

  test('API CORS configuration - Backend accepts frontend origin', async ({
    page,
  }) => {
    console.log('Testing CORS configuration')

    // Navigate to login page first to establish origin
    await page.goto('/login', { waitUntil: 'networkidle', timeout: 30000 })

    // Try to make a request to backend from frontend origin
    const response = await page.evaluate(
      async (backendUrl) => {
        try {
          const res = await fetch(`${backendUrl}/health`, {
            method: 'GET',
            headers: {
              Origin: window.location.origin,
            },
          })
          return {
            ok: res.ok,
            status: res.status,
            corsAllowed: true,
          }
        } catch (error) {
          return {
            ok: false,
            status: 0,
            corsAllowed: false,
            error: error instanceof Error ? error.message : String(error),
          }
        }
      },
      PROD_BACKEND_URL
    )

    console.log('CORS test result:', response)

    // Backend should allow requests from frontend origin
    expect(response.ok).toBeTruthy()
    expect(response.corsAllowed).toBeTruthy()
  })
})
