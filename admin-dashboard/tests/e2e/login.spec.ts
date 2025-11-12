/**
 * E2E Tests: Login Flow
 * SSO Admin Dashboard authentication tests
 */

import { test, expect } from '@playwright/test'
import { TEST_ADMIN, loginAsAdmin } from '../helpers/auth'
import { testUsers, testCredentials } from '../fixtures/test-data'

test.describe('Admin Login', () => {
  test('Valid admin login → redirects to /admin', async ({ page, context }) => {
    await page.goto('/login')

    // Fill login form
    await page.fill('input[name="email"]', TEST_ADMIN.email)
    await page.fill('input[name="password"]', TEST_ADMIN.password)

    // Submit
    await page.click('button[type="submit"]')

    // Wait for redirect
    await expect(page).toHaveURL('/admin', { timeout: 10000 })

    // Verify cookie exists
    const cookies = await context.cookies()
    const authCookie = cookies.find((c) => c.name === 'sso_admin_token')
    expect(authCookie).toBeDefined()
    expect(authCookie?.httpOnly).toBe(true)
    expect(authCookie?.sameSite).toBe('Lax')
  })

  test('Invalid credentials → shows error', async ({ page }) => {
    await page.goto('/login')

    // Fill with invalid credentials
    await page.fill('input[name="email"]', testCredentials.invalid.email)
    await page.fill('input[name="password"]', testCredentials.invalid.password)

    // Submit
    await page.click('button[type="submit"]')

    // Wait for error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible({
      timeout: 5000,
    })

    // Should stay on login page
    await expect(page).toHaveURL('/login')
  })

  test('Non-admin user → rejected (403)', async ({ page }) => {
    await page.goto('/login')

    // Fill with regular user credentials
    await page.fill('input[name="email"]', testUsers.user.email)
    await page.fill('input[name="password"]', testUsers.user.password)

    // Submit
    await page.click('button[type="submit"]')

    // Wait for error message
    await expect(
      page.locator('text=Admin access required')
    ).toBeVisible({
      timeout: 5000,
    })

    // Should stay on login page or show 403
    await expect(page).toHaveURL(/\/(login|403)/)
  })

  test('httpOnly cookie verification', async ({ page, context }) => {
    await loginAsAdmin(page)

    // Get all cookies
    const cookies = await context.cookies()
    const authCookie = cookies.find((c) => c.name === 'sso_admin_token')

    // Verify cookie properties
    expect(authCookie).toBeDefined()
    expect(authCookie?.httpOnly).toBe(true)
    expect(authCookie?.sameSite).toBe('Lax')
    expect(authCookie?.secure).toBe(false) // localhost uses HTTP
    expect(authCookie?.value).toBeTruthy()
    expect(authCookie?.value.length).toBeGreaterThan(20) // JWT should be long
  })
})
