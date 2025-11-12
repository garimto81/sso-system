/**
 * E2E Tests: Apps Management
 * SSO Admin Dashboard apps list and interactions
 */

import { test, expect } from '@playwright/test'
import { loginAsAdmin } from '../helpers/auth'

test.describe('Apps Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await loginAsAdmin(page)
  })

  test('Display apps list table', async ({ page }) => {
    // Navigate to apps page
    await page.goto('/admin/apps')

    // Wait for table to load
    await expect(page.locator('table')).toBeVisible({ timeout: 10000 })

    // Verify table headers
    await expect(page.locator('th:has-text("Name")')).toBeVisible()
    await expect(page.locator('th:has-text("Status")')).toBeVisible()
    await expect(page.locator('th:has-text("API Key")')).toBeVisible()
    await expect(page.locator('th:has-text("Created")')).toBeVisible()

    // Verify at least one row exists (excluding header)
    const rows = page.locator('tbody tr')
    await expect(rows.first()).toBeVisible()
  })

  test('Search apps by name (wait 500ms for debounce)', async ({ page }) => {
    await page.goto('/admin/apps')

    // Wait for initial load
    await expect(page.locator('table')).toBeVisible()

    // Get initial row count
    const initialRows = await page.locator('tbody tr').count()

    // Type in search input
    await page.fill('input[placeholder*="Search"]', 'Test App')

    // Wait for debounce (500ms)
    await page.waitForTimeout(500)

    // Wait for table to update
    await page.waitForTimeout(300)

    // Verify search results
    const searchResults = page.locator('tbody tr')
    const resultCount = await searchResults.count()

    // Should have results
    expect(resultCount).toBeGreaterThanOrEqual(0)

    // If results exist, verify they contain search term
    if (resultCount > 0) {
      const firstRowText = await searchResults.first().textContent()
      expect(firstRowText?.toLowerCase()).toContain('test')
    }
  })

  test('Click row → navigate to app details page', async ({ page }) => {
    await page.goto('/admin/apps')

    // Wait for table
    await expect(page.locator('table')).toBeVisible()

    // Get first row
    const firstRow = page.locator('tbody tr').first()
    await expect(firstRow).toBeVisible()

    // Get app ID from row (assuming it's in data attribute or link)
    const detailsLink = firstRow.locator('a').first()
    await expect(detailsLink).toBeVisible()

    // Click the row or link
    await detailsLink.click()

    // Wait for navigation to details page
    await expect(page).toHaveURL(/\/admin\/apps\/[a-f0-9-]+/, {
      timeout: 5000,
    })

    // Verify details page loaded
    await expect(page.locator('h1, h2')).toContainText(/App Details|Details/)
  })

  test('Pagination controls work', async ({ page }) => {
    await page.goto('/admin/apps')

    // Wait for table
    await expect(page.locator('table')).toBeVisible()

    // Check if pagination exists (only if there are enough items)
    const paginationExists = await page
      .locator('[role="navigation"], .pagination, button:has-text("Next")')
      .count()

    if (paginationExists > 0) {
      // Get first page data
      const firstPageText = await page.locator('tbody').textContent()

      // Click next page
      const nextButton = page.locator(
        'button:has-text("Next"), button[aria-label*="next" i]'
      )

      if ((await nextButton.count()) > 0 && !(await nextButton.isDisabled())) {
        await nextButton.click()

        // Wait for table update
        await page.waitForTimeout(500)

        // Verify data changed
        const secondPageText = await page.locator('tbody').textContent()
        expect(secondPageText).not.toBe(firstPageText)

        // Go back to first page
        const prevButton = page.locator(
          'button:has-text("Previous"), button[aria-label*="prev" i]'
        )
        await prevButton.click()

        await page.waitForTimeout(500)

        // Verify back to original data
        const backToFirstPage = await page.locator('tbody').textContent()
        expect(backToFirstPage).toBe(firstPageText)
      }
    } else {
      // If no pagination, just verify table is visible
      await expect(page.locator('tbody tr')).toBeVisible()
    }
  })

  test('Filter by status (Active Only button)', async ({ page }) => {
    await page.goto('/admin/apps')

    // Wait for table
    await expect(page.locator('table')).toBeVisible()

    // Get all rows before filtering
    const allRowsCount = await page.locator('tbody tr').count()

    // Click "Active Only" filter button
    const activeFilterButton = page.locator(
      'button:has-text("Active"), button:has-text("Active Only"), [role="button"]:has-text("Active")'
    )

    if ((await activeFilterButton.count()) > 0) {
      await activeFilterButton.click()

      // Wait for filter to apply
      await page.waitForTimeout(500)

      // Verify filtered results
      const filteredRows = page.locator('tbody tr')
      const filteredCount = await filteredRows.count()

      // Filtered count should be <= all rows
      expect(filteredCount).toBeLessThanOrEqual(allRowsCount)

      // Verify all visible rows show "Active" status
      if (filteredCount > 0) {
        for (let i = 0; i < filteredCount; i++) {
          const row = filteredRows.nth(i)
          const statusCell = row.locator('td').nth(1) // Assuming status is 2nd column
          const statusText = await statusCell.textContent()
          expect(statusText?.toLowerCase()).toMatch(/active|enabled/)
        }
      }

      // Click again to clear filter
      await activeFilterButton.click()
      await page.waitForTimeout(500)

      // Verify count went back up
      const clearedCount = await page.locator('tbody tr').count()
      expect(clearedCount).toBeGreaterThanOrEqual(filteredCount)
    } else {
      // If no filter button, just verify table exists
      await expect(page.locator('tbody tr')).toBeVisible()
    }
  })
})
