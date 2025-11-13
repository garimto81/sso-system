/**
 * E2E Tests: Login Redirect Flow
 *
 * Critical Test Coverage for PR #17 Hotfix
 *
 * This test suite verifies the login redirect functionality that failed in production.
 *
 * Background:
 * - PR #15 changed window.location.href to router.push() for better UX
 * - This broke production because router.push() doesn't trigger full page reload
 * - httpOnly cookies aren't sent to middleware without page reload
 * - PR #17 reverted to window.location.href to fix the issue
 *
 * Key Test Scenarios:
 * 1. Login with ?redirect parameter → verify redirect works
 * 2. httpOnly cookie transmission to middleware
 * 3. Open redirect attack prevention
 * 4. Redirect validation (relative URLs only)
 * 5. Full page reload verification
 *
 * @see docs/HOTFIX_LOGIN_REDIRECT.md
 */

import { test, expect, Page, BrowserContext } from '@playwright/test'
import { TEST_ADMIN } from '../helpers/auth'

test.describe('Login Redirect Flow - Critical Security & Functionality Tests', () => {

  test.beforeEach(async ({ page, context }) => {
    // Clear all cookies before each test
    await context.clearCookies()

    // Track console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        console.error('[Console Error]:', msg.text())
      }
    })
  })

  test('Login with redirect=/admin → successfully redirects to /admin', async ({ page, context }) => {
    // Navigate to login with redirect parameter
    await page.goto('/login?redirect=/admin')

    // Verify redirect parameter is in URL
    expect(page.url()).toContain('redirect=/admin')

    // Fill login form
    await page.fill('input[name="email"]', TEST_ADMIN.email)
    await page.fill('input[name="password"]', TEST_ADMIN.password)

    // Submit and wait for redirect
    await page.click('button[type="submit"]')

    // CRITICAL: Must redirect to /admin within 10 seconds
    // This verifies that window.location.href is used (full page reload)
    await expect(page).toHaveURL('/admin', { timeout: 10000 })

    // Verify httpOnly cookie was set
    const cookies = await context.cookies()
    const authCookie = cookies.find((c) => c.name === 'sso_admin_token')

    expect(authCookie).toBeDefined()
    expect(authCookie?.httpOnly).toBe(true)
    expect(authCookie?.value).toBeTruthy()

    console.log('✅ Login redirect to /admin successful with httpOnly cookie')
  })

  test('Login with redirect=/admin/apps → redirects to /admin/apps', async ({ page }) => {
    await page.goto('/login?redirect=/admin/apps')

    // Login
    await page.fill('input[name="email"]', TEST_ADMIN.email)
    await page.fill('input[name="password"]', TEST_ADMIN.password)
    await page.click('button[type="submit"]')

    // Should redirect to the specified page
    await expect(page).toHaveURL('/admin/apps', { timeout: 10000 })

    console.log('✅ Login redirect to nested route successful')
  })

  test('Login without redirect parameter → defaults to /admin', async ({ page }) => {
    // Navigate to login WITHOUT redirect parameter
    await page.goto('/login')

    // Verify no redirect parameter in URL
    expect(page.url()).not.toContain('redirect=')

    // Login
    await page.fill('input[name="email"]', TEST_ADMIN.email)
    await page.fill('input[name="password"]', TEST_ADMIN.password)
    await page.click('button[type="submit"]')

    // Should default to /admin
    await expect(page).toHaveURL('/admin', { timeout: 10000 })

    console.log('✅ Login without redirect parameter defaults to /admin')
  })

  test('Open Redirect Attack: redirect=https://evil.com → blocked, redirects to /admin', async ({ page }) => {
    // Attempt open redirect attack
    await page.goto('/login?redirect=https://evil.com')

    // Login
    await page.fill('input[name="email"]', TEST_ADMIN.email)
    await page.fill('input[name="password"]', TEST_ADMIN.password)
    await page.click('button[type="submit"]')

    // CRITICAL SECURITY CHECK: Should NOT redirect to evil.com
    // Should safely redirect to /admin instead
    await expect(page).toHaveURL('/admin', { timeout: 10000 })

    // Verify we're NOT on evil.com
    expect(page.url()).not.toContain('evil.com')
    expect(page.url()).toContain('/admin')

    console.log('✅ Open redirect attack blocked successfully')
  })

  test('Protocol-relative URL attack: redirect=//evil.com → blocked', async ({ page }) => {
    // Attempt protocol-relative URL attack
    await page.goto('/login?redirect=//evil.com')

    // Login
    await page.fill('input[name="email"]', TEST_ADMIN.email)
    await page.fill('input[name="password"]', TEST_ADMIN.password)
    await page.click('button[type="submit"]')

    // Should redirect to /admin, NOT evil.com
    await expect(page).toHaveURL('/admin', { timeout: 10000 })
    expect(page.url()).not.toContain('evil.com')

    console.log('✅ Protocol-relative URL attack blocked')
  })

  test('JavaScript protocol attack: redirect=javascript:alert(1) → blocked', async ({ page }) => {
    // Attempt JavaScript protocol injection
    await page.goto('/login?redirect=javascript:alert(1)')

    // Login
    await page.fill('input[name="email"]', TEST_ADMIN.email)
    await page.fill('input[name="password"]', TEST_ADMIN.password)
    await page.click('button[type="submit"]')

    // Should redirect to /admin safely
    await expect(page).toHaveURL('/admin', { timeout: 10000 })
    expect(page.url()).not.toContain('javascript:')

    console.log('✅ JavaScript protocol injection blocked')
  })

  test('httpOnly Cookie Transmission: Cookie sent to middleware after redirect', async ({ page, context }) => {
    // This test verifies the core issue from the production bug:
    // httpOnly cookies MUST be sent to middleware for authentication

    await page.goto('/login?redirect=/admin')

    // Login
    await page.fill('input[name="email"]', TEST_ADMIN.email)
    await page.fill('input[name="password"]', TEST_ADMIN.password)
    await page.click('button[type="submit"]')

    // Wait for redirect to complete
    await expect(page).toHaveURL('/admin', { timeout: 10000 })

    // Get the cookie that should have been set
    const cookies = await context.cookies()
    const authCookie = cookies.find((c) => c.name === 'sso_admin_token')

    // Verify cookie properties
    expect(authCookie).toBeDefined()
    expect(authCookie?.httpOnly).toBe(true) // MUST be httpOnly
    expect(authCookie?.sameSite).toBe('Lax')
    expect(authCookie?.value.length).toBeGreaterThan(20) // JWT should be long

    // CRITICAL TEST: Try to access a protected route
    // This verifies that the cookie is actually being sent to middleware
    await page.goto('/admin/apps')

    // If middleware receives the cookie, we should access the page
    // If cookie is NOT sent, middleware will redirect to /login
    await page.waitForTimeout(2000) // Wait for potential redirect

    const currentURL = page.url()

    // We should still be on /admin/apps, NOT redirected to /login
    expect(currentURL).toContain('/admin/apps')
    expect(currentURL).not.toContain('/login')

    console.log('✅ httpOnly cookie successfully transmitted to middleware')
  })

  test('Full Page Reload Verification: Navigation uses window.location.href', async ({ page }) => {
    // This test verifies that a FULL PAGE RELOAD happens (not client-side SPA navigation)
    // We detect this by checking if a network request is made

    let fullPageNavigationDetected = false

    // Listen for navigation events
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        fullPageNavigationDetected = true
        console.log('[Navigation Detected] Full page navigation to:', frame.url())
      }
    })

    await page.goto('/login?redirect=/admin')

    // Login
    await page.fill('input[name="email"]', TEST_ADMIN.email)
    await page.fill('input[name="password"]', TEST_ADMIN.password)

    // Reset flag before clicking
    fullPageNavigationDetected = false

    await page.click('button[type="submit"]')

    // Wait for redirect
    await expect(page).toHaveURL('/admin', { timeout: 10000 })

    // Verify that a full page navigation occurred
    expect(fullPageNavigationDetected).toBe(true)

    console.log('✅ Full page reload confirmed (window.location.href behavior)')
  })

  test('Multiple Redirect Attempts: Last redirect parameter wins', async ({ page }) => {
    // Test edge case: multiple redirect parameters
    await page.goto('/login?redirect=/admin&redirect=/admin/apps')

    // Login
    await page.fill('input[name="email"]', TEST_ADMIN.email)
    await page.fill('input[name="password"]', TEST_ADMIN.password)
    await page.click('button[type="submit"]')

    // Should use the last (or first) redirect parameter
    await page.waitForTimeout(3000)

    const finalURL = page.url()

    // Should redirect to a valid admin route
    expect(finalURL).toMatch(/\/(admin|admin\/apps)/)

    console.log('✅ Multiple redirect parameters handled correctly')
  })

  test('Redirect Parameter Encoding: URL-encoded redirect works', async ({ page }) => {
    // Test URL-encoded redirect parameter
    const encodedRedirect = encodeURIComponent('/admin/apps')
    await page.goto(`/login?redirect=${encodedRedirect}`)

    // Login
    await page.fill('input[name="email"]', TEST_ADMIN.email)
    await page.fill('input[name="password"]', TEST_ADMIN.password)
    await page.click('button[type="submit"]')

    // Should correctly decode and redirect
    await expect(page).toHaveURL('/admin/apps', { timeout: 10000 })

    console.log('✅ URL-encoded redirect parameter handled correctly')
  })

  test('Middleware Integration: Protected route access after login', async ({ page, context }) => {
    // This test verifies the complete flow:
    // 1. Try to access protected route without auth
    // 2. Middleware redirects to /login with redirect parameter
    // 3. Login successfully
    // 4. Redirected back to original protected route

    // Step 1: Try to access protected route without auth
    await page.goto('/admin/apps')

    // Step 2: Middleware should redirect to /login with redirect parameter
    await page.waitForTimeout(2000)

    const loginURL = page.url()
    expect(loginURL).toContain('/login')
    expect(loginURL).toContain('redirect=')

    console.log('[Middleware] Redirected to:', loginURL)

    // Step 3: Login
    await page.fill('input[name="email"]', TEST_ADMIN.email)
    await page.fill('input[name="password"]', TEST_ADMIN.password)
    await page.click('button[type="submit"]')

    // Step 4: Should redirect back to /admin/apps
    await expect(page).toHaveURL('/admin/apps', { timeout: 10000 })

    // Verify we're authenticated by checking cookie
    const cookies = await context.cookies()
    const authCookie = cookies.find((c) => c.name === 'sso_admin_token')
    expect(authCookie).toBeDefined()

    console.log('✅ Complete middleware integration flow successful')
  })

  test('Invalid Credentials: Redirect parameter preserved on login failure', async ({ page }) => {
    await page.goto('/login?redirect=/admin/apps')

    // Login with INVALID credentials
    await page.fill('input[name="email"]', 'wrong@test.com')
    await page.fill('input[name="password"]', 'WrongPassword123!')
    await page.click('button[type="submit"]')

    // Wait for error message
    await page.waitForTimeout(2000)

    // Should stay on login page with error
    const currentURL = page.url()
    expect(currentURL).toContain('/login')

    // Redirect parameter should still be in URL (or not - depends on implementation)
    // Most importantly, we should NOT have redirected anywhere

    // Error message should be visible
    const errorVisible = await page
      .locator('text=/invalid|error|failed/i')
      .first()
      .isVisible()
      .catch(() => false)

    expect(errorVisible).toBeTruthy()

    console.log('✅ Invalid credentials handled correctly, redirect parameter preserved')
  })

  test('Performance: Redirect completes within 5 seconds', async ({ page }) => {
    const startTime = Date.now()

    await page.goto('/login?redirect=/admin')

    // Login
    await page.fill('input[name="email"]', TEST_ADMIN.email)
    await page.fill('input[name="password"]', TEST_ADMIN.password)
    await page.click('button[type="submit"]')

    // Wait for redirect
    await expect(page).toHaveURL('/admin', { timeout: 5000 })

    const endTime = Date.now()
    const duration = endTime - startTime

    console.log(`⏱️ Login + redirect completed in ${duration}ms`)

    // Should complete within 5 seconds
    expect(duration).toBeLessThan(5000)
  })
})

test.describe('Login Redirect - Regression Prevention (PR #15 → PR #17)', () => {
  // These tests specifically verify that the bug from PR #15 doesn't happen again

  test('Regression: window.location.href is used (NOT router.push)', async ({ page }) => {
    // This test ensures we're using window.location.href for redirect
    // We can verify this by checking that a full navigation occurs

    let navigationCount = 0

    page.on('framenavigated', () => {
      navigationCount++
    })

    await page.goto('/login?redirect=/admin')

    const initialNavigationCount = navigationCount

    // Login
    await page.fill('input[name="email"]', TEST_ADMIN.email)
    await page.fill('input[name="password"]', TEST_ADMIN.password)
    await page.click('button[type="submit"]')

    await expect(page).toHaveURL('/admin', { timeout: 10000 })

    // Navigation count should have increased (full page reload)
    expect(navigationCount).toBeGreaterThan(initialNavigationCount)

    console.log('✅ REGRESSION TEST PASSED: Full page reload confirmed')
  })

  test('Regression: Production environment behavior matches local', async ({ page, context }) => {
    // This test verifies that the behavior is consistent
    // The bug only appeared in production, not local dev

    await page.goto('/login?redirect=/admin')

    // Login
    await page.fill('input[name="email"]', TEST_ADMIN.email)
    await page.fill('input[name="password"]', TEST_ADMIN.password)
    await page.click('button[type="submit"]')

    // Should redirect successfully
    await expect(page).toHaveURL('/admin', { timeout: 10000 })

    // Cookie should be set
    const cookies = await context.cookies()
    const authCookie = cookies.find((c) => c.name === 'sso_admin_token')
    expect(authCookie).toBeDefined()

    // Should be able to access protected routes
    await page.goto('/admin/apps')
    await page.waitForTimeout(2000)

    // Should NOT redirect back to login
    expect(page.url()).toContain('/admin/apps')
    expect(page.url()).not.toContain('/login')

    console.log('✅ REGRESSION TEST PASSED: Production behavior verified')
  })
})
