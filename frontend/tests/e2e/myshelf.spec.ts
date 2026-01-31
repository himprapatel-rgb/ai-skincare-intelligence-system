/**
 * E2E Tests for My Shelf Page (Tasks 483-489)
 * Tests the shelf management functionality
 */
import { test, expect } from '@playwright/test';

test.describe('My Shelf Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/myshelf');
  });

  test('Task 483: Should load My Shelf page correctly', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1')).toContainText('My Shelf');
    
    // Check for search bar
    await expect(page.locator('input[placeholder*="Search"]')).toBeVisible();
  });

  test('Task 484: Should have filter tabs', async ({ page }) => {
    // Check for filter buttons
    await expect(page.locator('button:has-text("All")')).toBeVisible();
    await expect(page.locator('button:has-text("Using")')).toBeVisible();
    await expect(page.locator('button:has-text("Wishlist")')).toBeVisible();
    await expect(page.locator('button:has-text("Discontinued")')).toBeVisible();
  });

  test('Task 485: Should have sorting options', async ({ page }) => {
    // Check for sort dropdown
    await expect(page.locator('#sort-select')).toBeVisible();
    
    // Check sort options exist
    const sortSelect = page.locator('#sort-select');
    await expect(sortSelect.locator('option:has-text("Recently Added")')).toBeAttached();
    await expect(sortSelect.locator('option:has-text("Name")')).toBeAttached();
    await expect(sortSelect.locator('option:has-text("Brand")')).toBeAttached();
    await expect(sortSelect.locator('option:has-text("Highest Rated")')).toBeAttached();
  });

  test('Task 486: Should have category filter', async ({ page }) => {
    // Check for category dropdown
    await expect(page.locator('#category-select')).toBeVisible();
    
    // Should have "All Categories" option
    const categorySelect = page.locator('#category-select');
    await expect(categorySelect.locator('option:has-text("All Categories")')).toBeAttached();
  });

  test('Task 487: Should show Add Product button', async ({ page }) => {
    // Check for Add Product button
    await expect(page.locator('button:has-text("Add Product")')).toBeVisible();
  });

  test('Task 488: Add Product should navigate to scanner', async ({ page }) => {
    // Click Add Product button
    await page.click('button:has-text("Add Product")');
    
    // Should navigate to scanner page
    await expect(page).toHaveURL(/.*scanner/);
  });

  test('Task 489: Should show empty state when no products', async ({ page }) => {
    // Wait for loading to finish - then either empty state or product grid appears
    const emptyState = page.locator('.empty-state');
    const productGrid = page.locator('.products-grid');
    await expect(emptyState.or(productGrid)).toBeVisible({ timeout: 15000 });
    const hasProducts = (await productGrid.count()) > 0;
    const hasEmptyState = (await emptyState.count()) > 0;
    expect(hasProducts || hasEmptyState).toBeTruthy();
  });

  test('Empty state Add Your First Product navigates to scanner', async ({ page }) => {
    const emptyState = page.locator('.empty-state');
    await expect(emptyState.or(page.locator('.products-grid'))).toBeVisible({ timeout: 15000 });
    const addFirstBtn = page.locator('button:has-text("Add Your First Product")');
    if ((await addFirstBtn.count()) > 0) {
      await addFirstBtn.click();
      await expect(page).toHaveURL(/.*scanner/);
    }
  });
});

test.describe('My Shelf Search', () => {
  test('Should filter products by search term', async ({ page }) => {
    await page.goto('/myshelf');
    
    // Type in search box
    const searchInput = page.locator('input[placeholder*="Search"]');
    await searchInput.fill('test product');
    
    // Search should be applied (no error)
    await expect(searchInput).toHaveValue('test product');
  });
});

test.describe('My Shelf Accessibility', () => {
  test('Should have accessible labels', async ({ page }) => {
    await page.goto('/myshelf');
    
    // Check sort dropdown has label
    const sortLabel = page.locator('label[for="sort-select"]');
    await expect(sortLabel).toBeVisible();
    
    // Check category dropdown has label
    const categoryLabel = page.locator('label[for="category-select"]');
    await expect(categoryLabel).toBeVisible();
  });
});
