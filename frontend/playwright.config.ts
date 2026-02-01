import { defineConfig } from "@playwright/test";
import { config as loadEnv } from "dotenv";

// Load E2E credentials from .env.e2e (copy from .env.e2e.example)
loadEnv({ path: ".env.e2e" });

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ?? "https://pellicura.com/";

const useLocal = baseURL.includes("localhost");

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 90_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    headless: true,
    viewport: { width: 1280, height: 800 },
    // Playwright uses its own Chromium (npx playwright install). NOT Google Chrome – no profile/permission issues.
  },
  // Task 10000: auto-start dev server when testing locally
  webServer: useLocal
    ? {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 60_000,
      }
    : undefined,
});
