/**
 * Task 10000: Mobile App Look – E2E tests
 *
 * Verifies the app feels like a native mobile app when opened in a mobile browser:
 * - PWA meta tags (apple-mobile-web-app-*, viewport-fit)
 * - Manifest (display_override, categories)
 * - Mobile layout (no horizontal overflow, bottom nav)
 *
 * Run: npx playwright test task-10000-mobile-app
 * Against prod: PLAYWRIGHT_BASE_URL=https://pellicura.com npx playwright test task-10000-mobile-app
 * Against local: npm run dev (in another terminal), then PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test task-10000-mobile-app
 */
import { expect, test } from "@playwright/test";

const MOBILE_VIEWPORT = { width: 375, height: 667 };

test.describe("Task 10000 - Mobile app look", () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test("meta: apple-mobile-web-app-status-bar-style is black-translucent", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const content = await page
      .locator('meta[name="apple-mobile-web-app-status-bar-style"]')
      .getAttribute("content");
    expect(content).toBe("black-translucent");
  });

  test("meta: apple-mobile-web-app-title is SkinCareAI", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const content = await page
      .locator('meta[name="apple-mobile-web-app-title"]')
      .getAttribute("content");
    expect(content).toBe("SkinCareAI");
  });

  test("meta: viewport includes viewport-fit=cover", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const content = await page.locator('meta[name="viewport"]').getAttribute("content");
    expect(content).toContain("viewport-fit=cover");
  });

  test("manifest is linked and has display_override", async ({ page, request }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    const origin = new URL(page.url()).origin;
    const res = await request.get(`${origin}/manifest.json`);
    expect(res.ok()).toBe(true);
    const manifest = await res.json();
    expect(manifest.display).toBe("standalone");
    expect(manifest.display_override).toEqual(["standalone", "minimal-ui", "browser"]);
  });

  test("no horizontal overflow on Home", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(overflow).toBe(false);
  });

  test("no horizontal overflow on Product Scanner", async ({ page }) => {
    await page.goto("/scanner", { waitUntil: "networkidle" });
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(overflow).toBe(false);
  });

  test("bottom nav visible on mobile", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const bottomNav = page.locator("nav[name='Bottom navigation'], .bottom-nav");
    await expect(bottomNav).toBeVisible();
    await expect(bottomNav.getByRole("link", { name: /home/i })).toBeVisible();
    await expect(bottomNav.getByRole("link", { name: /scan/i })).toBeVisible();
  });
});
