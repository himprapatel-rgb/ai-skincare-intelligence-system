/**
 * API mock for E2E Agent - avoids hitting paid APIs (ML, Skinive, etc.).
 * Use with AGENT_MOCK_API=true to test GUI 24/7 without cost.
 */
import type { Page } from "@playwright/test";

const MOCK_TOKEN = "agent-mock-token";
const API_PATTERN = /\/api\/v1\//;

function mockBody(obj: object) {
  return JSON.stringify(obj);
}

export async function installAgentApiMock(page: Page) {
  await page.route(API_PATTERN, async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    try {
      // Auth
      if (url.includes("/auth/login") && method === "POST") {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: mockBody({ access_token: MOCK_TOKEN, token_type: "bearer" }),
        });
      }
      if (url.includes("/auth/me") || url.includes("/users/me")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: mockBody({
            id: 1,
            email: "agent@test.local",
            full_name: "Agent User",
            is_active: true,
            is_verified: true,
            is_admin: true,
          }),
        });
      }

      // Health
      if (url.includes("/health")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: mockBody({ status: "ok" }),
        });
      }

      // Catalog / Products
      if (
        url.includes("/identify-from-image") ||
        url.includes("/scan-barcode")
      ) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: mockBody({ product: null, message: "No match (mock)" }),
        });
      }
      if (
        url.includes("/catalog/") ||
        url.includes("/products") ||
        url.includes("/user-products") ||
        url.includes("/shelf")
      ) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: mockBody([]),
        });
      }

      // Scans / Analysis (expensive - always mock)
      if (url.includes("/scan/init") && method === "POST") {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: mockBody({ session_id: "mock-session-1" }),
        });
      }
      if (
        (url.includes("/scan/") && (url.includes("/upload") || url.includes("/status") || url.includes("/results"))) ||
        url.includes("/analysis") ||
        url.includes("/analyze")
      ) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: mockBody({
            id: 1,
            session_id: "mock-session-1",
            status: "completed",
            progress: 100,
            result: { overall_score: 75 },
          }),
        });
      }

      // Admin (summary, blogs, videos, news)
      if (url.includes("/admin/summary")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: mockBody({ user_count: 1, active_user_count: 1, scan_count: 0, product_count: 0, routine_count: 0, snapshot_count: 0 }),
        });
      }
      if (url.includes("/admin/blogs") || url.includes("/admin/videos") || url.includes("/admin/news")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: mockBody([]),
        });
      }

      // Profile, export, notifications, etc.
      if (url.includes("/profile") || url.includes("/export") || url.includes("/notifications")) {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: mockBody({}),
        });
      }

      // Default: success empty object
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: mockBody({}),
      });
    } catch {
      return route.fulfill({ status: 200, body: "{}" });
    }
  });
}
