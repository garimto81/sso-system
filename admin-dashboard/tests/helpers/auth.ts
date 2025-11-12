/**
 * Authentication Helper
 * Login utilities for E2E tests
 */

import { Page, expect } from '@playwright/test'

export const TEST_ADMIN = {
  email: 'admin@test.com',
  password: 'Test1234!',
}

/**
 * Login as admin user
 * @param page - Playwright page object
 */
export async function loginAsAdmin(page: Page) {
  await page.goto('/login')

  // Fill login form
  await page.fill('input[name="email"]', TEST_ADMIN.email)
  await page.fill('input[name="password"]', TEST_ADMIN.password)

  // Submit
  await page.click('button[type="submit"]')

  // Wait for redirect to dashboard
  await expect(page).toHaveURL('/admin', { timeout: 10000 })
}

/**
 * Check if user is authenticated
 * @param page - Playwright page object
 * @returns True if authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    await page.goto('/admin')
    await page.waitForURL('/admin', { timeout: 2000 })
    return true
  } catch {
    return false
  }
}

/**
 * Logout user
 * @param page - Playwright page object
 */
export async function logout(page: Page) {
  await page.click('button:has-text("Logout")')
  await expect(page).toHaveURL('/login')
}

/**
 * Get auth cookie
 * @param page - Playwright page object
 * @returns Auth cookie value or null
 */
export async function getAuthCookie(page: Page): Promise<string | null> {
  const cookies = await page.context().cookies()
  const authCookie = cookies.find((c) => c.name === 'sso_admin_token')
  return authCookie?.value || null
}
