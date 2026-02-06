import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";

// Load E2E credentials from .env.e2e (copy from .env.e2e.example)
loadEnv({ path: ".env.e2e" });

const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ?? "https://pellicura.com/";

const useLocal = baseURL.includes("localhost");

// Match frontend constants/viewport.ts: mobile ≤768, tablet 769–1024, desktop ≥1025
const viewports = {
  mobile: { width: 375, height: 812 },
  tablet: { width: 800, height: 1024 },
  desktop: { width: 1280, height: 800 },
} as const;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 90_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL,
    headless: true,
    viewport: viewports.desktop,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: viewports.desktop } },
    { name: "tablet", use: { ...devices["Desktop Chrome"], viewport: viewports.tablet } },
    { name: "mobile", use: { ...devices["Pixel 5"], viewport: viewports.mobile } },
  ],
  webServer: useLocal
    ? {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 60_000,
      }
    : undefined,
});
