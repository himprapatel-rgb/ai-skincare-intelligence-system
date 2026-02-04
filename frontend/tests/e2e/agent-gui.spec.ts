/**
 * E2E Agent - GUI tests that run 24/7 without hitting paid APIs.
 * Uses API mocking. Run with: AGENT_MOCK_API=true npx playwright test agent-gui
 */
import { expect, test } from "@playwright/test";
import { installAgentApiMock } from "./agent-api-mock";

// Only run when agent mode is enabled (scheduled workflow sets this)
test.skip(() => !process.env.AGENT_MOCK_API, "Run with AGENT_MOCK_API=true");

test.beforeEach(async ({ page }) => {
  await installAgentApiMock(page);
});

const VIEWPORTS = [
  { name: "mobile", width: 375, height: 667 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 800 },
];

const PUBLIC_ROUTES = ["/", "/auth", "/about", "/contact", "/privacy", "/terms", "/device-context"];
const PROTECTED_ROUTES = [
  "/scan",
  "/dashboard",
  "/history",
  "/myshelf",
  "/scanner",
  "/profile",
  "/recommendations",
  "/routine-builder",
  "/favorites",
  "/skin-goals",
  "/export",
  "/notifications",
  "/admin",
  "/admin/content",
];

// Public pages - no auth
for (const vp of VIEWPORTS) {
  test.describe(`${vp.name} viewport - public pages`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    for (const route of PUBLIC_ROUTES) {
      test(`${route} loads without error`, async ({ page }) => {
        await page.goto(route, { waitUntil: "domcontentloaded" });
        await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
        await expect(page.locator("body")).not.toContainText("Not Found");
      });
    }
  });
}

// Protected pages - mock auth via cookie
test.describe("Protected pages with mock auth", () => {
  test.beforeEach(async ({ context }) => {
    const base = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:5173";
    const host = new URL(base.endsWith("/") ? base : base + "/").hostname;
    await context.addCookies([
      { name: "auth_token", value: "agent-mock-token", domain: host, path: "/" },
    ]);
  });

  for (const vp of VIEWPORTS) {
    test.describe(`${vp.name} viewport`, () => {
      test.use({ viewport: { width: vp.width, height: vp.height } });

      for (const route of PROTECTED_ROUTES) {
        test(`${route} loads without error`, async ({ page }) => {
          await page.goto(route, { waitUntil: "domcontentloaded" });
          await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
          await expect(page.locator("body")).not.toContainText("Not Found");
        });
      }
    });
  }
});

// Mobile-specific: nav, bottom nav, no horizontal scroll
test.describe("Mobile GUI checks (375px)", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("no horizontal overflow on Home", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
  });

  test("mobile nav toggle opens menu", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const toggle = page.getByRole("button", { name: /open menu|close menu/i });
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(page.locator(".app-nav-mobile.open")).toBeVisible();
  });

  test("bottom nav visible", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.locator(".bottom-nav")).toBeVisible();
  });
});

// Tablet & desktop layout checks
test.describe("Tablet/Desktop layout", () => {
  test("tablet: no horizontal overflow", async ({ page }) => {
    test.use({ viewport: { width: 768, height: 1024 } });
    await page.goto("/", { waitUntil: "networkidle" });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflow).toBe(false);
  });

  test("desktop: footer links visible", async ({ page }) => {
    test.use({ viewport: { width: 1280, height: 800 } });
    await page.goto("/", { waitUntil: "networkidle" });
    const footer = page.locator("footer");
    await expect(footer).toBeVisible();
  });
});
