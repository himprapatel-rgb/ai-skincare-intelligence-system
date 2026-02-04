/**
 * E2E smoke tests for Settings & Device context flows (300 settings tasks, device context page).
 * Run with: npx playwright test settings-device-flows
 * With mock auth: AGENT_MOCK_API=true npx playwright test settings-device-flows
 */
import { expect, test } from "@playwright/test";

test.describe("Settings & device context flows", () => {
  test("device-context page loads and shows main content", async ({ page }) => {
    await page.goto("/device-context", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: /device & context/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Copy JSON|Update sync info/i)).toBeVisible();
  });

  test("device-context back link goes to /me", async ({ page }) => {
    await page.goto("/device-context", { waitUntil: "domcontentloaded" });
    await page.getByRole("link", { name: /back to profile/i }).click();
    await expect(page).toHaveURL(/\/me/);
  });

  test("me page shows Device & context and Preferences links", async ({ page }) => {
    await page.goto("/me", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("link", { name: /device & context/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /preferences/i })).toBeVisible();
  });
});
