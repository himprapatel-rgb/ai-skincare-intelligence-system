import { defineConfig } from "@playwright/test";
import { config as loadEnv } from "dotenv";

// Load E2E credentials from .env.e2e (copy from .env.e2e.example)
loadEnv({ path: ".env.e2e" });

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ??
  "https://frontend-production-0415.up.railway.app/";

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
});
