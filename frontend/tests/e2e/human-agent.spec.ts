/**
 * Human Agent – Acts like a real user: login, upload images, navigate.
 * Uses Playwright's built-in Chromium (NOT Google Chrome – no profile/permission issues).
 * Runs with HUMAN_AGENT=true. Mocks scan/analysis API to avoid paid ML calls.
 */
import { expect, test } from "@playwright/test";
import { installAgentApiMock } from "./agent-api-mock";
import * as path from "path";

test.skip(() => !process.env.HUMAN_AGENT, "Run with HUMAN_AGENT=true");

const SAMPLE_IMAGE = path.join(__dirname, "../fixtures/sample.png");

// Human-like delay (ms) between actions
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function humanDelay() {
  await delay(300 + Math.random() * 400);
}

test.beforeEach(async ({ page }) => {
  await installAgentApiMock(page);
});

test.describe("Human Agent – Login", () => {
  test("logs in with email/password like a user", async ({ page }) => {
    const email = process.env.E2E_EMAIL ?? "";
    const password = process.env.E2E_PASSWORD ?? "";
    if (!email || !password) {
      test.skip(true, "E2E_EMAIL and E2E_PASSWORD required for Human Agent");
    }

    await page.goto("/auth");
    await humanDelay();

    const emailInput = page.getByRole("textbox", { name: /email/i }).first();
    await emailInput.fill(email);
    await humanDelay();
    const passInput = page.locator('input[type="password"], input#password').first();
    await passInput.fill(password);
    await humanDelay();

    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    await humanDelay();

    await expect(page).toHaveURL(/dashboard/);
  });
});

test.describe("Human Agent – Skin Scan Upload", () => {
  test.beforeEach(async ({ page }) => {
    const email = process.env.E2E_EMAIL;
    const password = process.env.E2E_PASSWORD;
    if (!email || !password) test.skip(true, "Credentials required");
    await page.goto("/auth");
    await page.getByRole("textbox", { name: /email/i }).first().fill(email);
    await page.locator('input[type="password"], input#password').first().fill(password);
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  });

  test("navigates to scan and uploads skin photo", async ({ page }) => {
    await page.goto("/scan");
    await humanDelay();

    const fileInput = page.locator('#file-upload, input.scan-file-input');
    await expect(fileInput).toBeAttached();
    await fileInput.setInputFiles(SAMPLE_IMAGE);
    await humanDelay();

    // Either preview shows (valid face) or validation error (test image) – both ok
    const preview = page.locator('.scan-preview, img[alt="Upload preview"]');
    const errorMsg = page.locator('.error-card, [role="alert"], .scan-error, .validation-message, text=/no face|face found|clear selfie/i');
    await expect(preview.or(errorMsg).first()).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Human Agent – Product Scanner Upload", () => {
  test.beforeEach(async ({ page }) => {
    const email = process.env.E2E_EMAIL;
    const password = process.env.E2E_PASSWORD;
    if (!email || !password) test.skip(true, "Credentials required");
    await page.goto("/auth");
    await page.getByRole("textbox", { name: /email/i }).first().fill(email);
    await page.locator('input[type="password"], input#password').first().fill(password);
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  });

  test("navigates to scanner and uploads product photo", async ({ page }) => {
    await page.goto("/scanner");
    await humanDelay();

    await page.click('button:has-text("Take Photo")');
    await humanDelay();

    const uploadInput = page.locator('#product-gallery-input, input[type="file"][accept*="image"]').first();
    await expect(uploadInput).toBeAttached();
    await uploadInput.setInputFiles(SAMPLE_IMAGE);
    await humanDelay();

    // UI should show loading or result (mocked) – no error
    await expect(page.locator("body")).not.toContainText("Network Error");
  });
});

test.describe("Human Agent – Full flow (mobile)", () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test("mobile: login → shelf → profile", async ({ page }) => {
    const email = process.env.E2E_EMAIL;
    const password = process.env.E2E_PASSWORD;
    if (!email || !password) test.skip(true, "Credentials required");

    await page.goto("/auth");
    await page.getByRole("textbox", { name: /email/i }).first().fill(email);
    await page.locator('input[type="password"], input#password').first().fill(password);
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    await humanDelay();

    await page.goto("/myshelf");
    await humanDelay();
    await expect(page.locator("main")).toBeVisible();

    await page.goto("/profile");
    await humanDelay();
    await expect(page.locator("main")).toBeVisible();
  });
});
