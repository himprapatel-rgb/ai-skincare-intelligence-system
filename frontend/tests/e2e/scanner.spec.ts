/**
 * E2E Tests for Product Scanner (Tasks 476-480)
 * Tests the complete scanning flow for barcodes and photos
 */
import { test, expect } from '@playwright/test';

test.describe('Product Scanner Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/scanner');
  });

  test('Task 476: Should load scanner page correctly', async ({ page }) => {
    // Check page title and header
    await expect(page.locator('h1')).toContainText('Product Scanner');
    
    // Check mode buttons are present
    await expect(page.locator('button:has-text("Scan Barcode")')).toBeVisible();
    await expect(page.locator('button:has-text("Take Photo")')).toBeVisible();
  });

  test('Task 477: Should switch between barcode and photo modes', async ({ page }) => {
    // Click on Take Photo mode
    await page.click('button:has-text("Take Photo")');
    
    // Should show photo upload options
    await expect(page.locator('text=Take Product Photo')).toBeVisible();
    
    // Switch back to barcode mode
    await page.click('button:has-text("Scan Barcode")');
    
    // Should show barcode scanning options
    await expect(page.locator('text=Scan Product Barcode')).toBeVisible();
  });

  test('Task 478: Photo mode should have upload options', async ({ page }) => {
    // Switch to photo mode
    await page.click('button:has-text("Take Photo")');
    
    // Check for upload options
    await expect(page.locator('button:has-text("Take Photo")').nth(1)).toBeVisible();
    await expect(page.locator('button:has-text("Upload Photo")')).toBeVisible();
    
    // Check for drag and drop zone
    await expect(page.locator('.photo-drop-zone')).toBeVisible();
  });

  test('Task 479: Should show photo tips', async ({ page }) => {
    // Switch to photo mode
    await page.click('button:has-text("Take Photo")');
    
    // Check for tips section
    await expect(page.locator('text=Tips for best results')).toBeVisible();
    await expect(page.locator('text=Ensure good lighting')).toBeVisible();
  });

  test('Task 480: Should handle empty state gracefully', async ({ page }) => {
    // Check that page loads without errors
    await expect(page).toHaveURL(/.*scanner/);
    
    // No error messages should be visible initially
    await expect(page.locator('.error-card')).not.toBeVisible();
  });

  test('Scanner page has expected structure and guide', async ({ page }) => {
    await expect(page.locator('button:has-text("Scan Barcode")')).toBeVisible();
    await expect(page.locator('text=How Product Scanner Works')).toBeVisible();
    await expect(page.locator('text=Barcode Scanning')).toBeVisible();
  });
});

test.describe('Scanner Authentication', () => {
  test('Task 481: Should work for logged in users', async ({ page, context }) => {
    // Set authentication token (mock)
    await context.addCookies([{
      name: 'auth_token',
      value: 'test_token',
      domain: 'localhost',
      path: '/',
    }]);
    
    await page.goto('/scanner');
    
    // Page should load without auth errors
    await expect(page.locator('h1')).toContainText('Product Scanner');
  });

  test('Task 482: Scanner should handle unauthenticated users', async ({ page }) => {
    await page.goto('/scanner');
    
    // Scanner should still be accessible but may have limited features
    await expect(page.locator('h1')).toContainText('Product Scanner');
  });
});

test.describe('Scanner Accessibility', () => {
  test('Task 490: Scanner page should be accessible', async ({ page }) => {
    await page.goto('/scanner');
    
    // Check for proper heading structure
    const h1 = await page.locator('h1');
    await expect(h1).toBeVisible();
    
    // Check for proper button labeling
    const buttons = await page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const text = await button.textContent();
      const ariaLabel = await button.getAttribute('aria-label');
      
      // Each button should have text or aria-label
      expect(text || ariaLabel).toBeTruthy();
    }
  });

  test('Task 491: Scanner should be keyboard navigable', async ({ page }) => {
    await page.goto('/scanner');
    
    // Tab to first interactive element
    await page.keyboard.press('Tab');
    
    // Should be able to focus on elements
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(['BUTTON', 'A', 'INPUT']).toContain(focusedElement);
  });
});
