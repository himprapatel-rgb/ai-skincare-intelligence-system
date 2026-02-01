import { expect, test } from "@playwright/test";

/**
 * Mobile viewport tests – verify key pages render without horizontal overflow
 * and core navigation works at 375px width.
 */
test.describe("Mobile viewport (375x667)", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("Home loads without horizontal scroll", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
  });

  test("Auth loads and form is visible", async ({ page }) => {
    await page.goto("/auth", { waitUntil: "networkidle" });
    const emailInput = page.getByRole("textbox", { name: /email/i }).first();
    await expect(emailInput).toBeVisible();
  });

  test("Mobile nav toggle opens menu", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const toggle = page.getByRole("button", { name: /open menu|close menu/i });
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(page.locator(".app-nav-mobile.open")).toBeVisible();
  });

  test("Bottom nav visible on mobile", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const bottomNav = page.locator(".bottom-nav");
    await expect(bottomNav).toBeVisible();
  });

  test("Features expandable section in mobile nav", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /open menu|close menu/i }).click();
    const featuresBtn = page.getByRole("button", { name: /features/i });
    await expect(featuresBtn).toBeVisible({ timeout: 5000 });
    await featuresBtn.click();
    const myShelfLink = page.getByRole("link", { name: /my shelf/i });
    await expect(myShelfLink).toBeVisible({ timeout: 3000 });
  });
});

test.describe("Tablet viewport (768x1024)", () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test("Dashboard loads without horizontal scroll", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
  });
});
