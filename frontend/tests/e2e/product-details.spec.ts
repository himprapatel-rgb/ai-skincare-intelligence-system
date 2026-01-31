/**
 * E2E Tests for Product Details Page
 * Tests product description display and shelf integration
 */
import { test, expect } from '@playwright/test';

test.describe('Product Details Page', () => {
  test('Product details page loads for valid product id', async ({ page }) => {
    // Navigate to a product URL (shelf product or catalog)
    // Using a placeholder ID - page should load without crash
    await page.goto('/product/test-product-123');
    await page.waitForLoadState('domcontentloaded');
    // Page should not show 404 or crash
    await expect(page.locator('body')).not.toContainText('Cannot GET');
  });

  test('Product details has back navigation', async ({ page }) => {
    await page.goto('/product/test-123');
    await page.waitForLoadState('domcontentloaded');
    // Should have a back button or link
    const backButton = page.locator('a:has-text("Back"), button:has-text("Back")');
    const backLink = page.locator('[aria-label*="back" i], .back-button');
    const hasBack = (await backButton.count()) > 0 || (await backLink.count()) > 0;
    expect(hasBack).toBeTruthy();
  });
});
