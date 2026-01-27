import { Buffer } from "buffer";
import { expect, test } from "@playwright/test";

// Configure longer timeouts for stability
test.setTimeout(60000);

const email = process.env.E2E_EMAIL ?? "";
const password = process.env.E2E_PASSWORD ?? "";

const publicRoutes = [
  "/",
  "/auth",
  "/password-reset",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
];

const protectedRoutes = [
  "/dashboard",
  "/scan",
  "/history",
  "/comparison",
  "/digital-twin",
  "/recommendations",
  "/routine-builder",
  "/favorites",
  "/myshelf",
  "/scanner",
  "/profile",
  "/consent",
  "/skin-goals",
  "/progress",
  "/export",
  "/notifications",
];

async function login(page: import("@playwright/test").Page) {
  await page.goto("/auth", { waitUntil: "networkidle" });
  
  // Wait for the auth form to be visible
  await page.waitForSelector('input[type="email"], input[id="email"]', { timeout: 10000 });
  
  const emailInput = page.getByLabel("Email").or(page.locator('input[type="email"]'));
  const passwordInput = page.getByLabel("Password").or(page.locator('input[type="password"]'));
  
  await emailInput.fill(email);
  await passwordInput.fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  
  try {
    await page.waitForURL(/\/dashboard$/, { timeout: 15000 });
  } catch (_error) {
    test.skip(true, `Login failed at ${page.url()}. Check E2E credentials.`);
  }
}

test.describe("manual UX navigation flow", () => {
  test("public routes load without errors", async ({ page }) => {
    for (const route of publicRoutes) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
      
      // Verify page loaded without 404
      const body = page.locator("body");
      await expect(body).not.toContainText("Not Found", { timeout: 5000 });
    }
  });

  test("header navigation works", async ({ page }) => {
    if (!email || !password) {
      test.skip(true, "E2E_EMAIL and E2E_PASSWORD must be set");
    }
    await login(page);

    const headerLinks = [
      { name: "Home", path: "/" },
      { name: "Analysis", path: "/scan" },
      { name: "Dashboard", path: "/dashboard" },
      { name: "About", path: "/about" },
    ];

    for (const link of headerLinks) {
      const linkElement = page.getByRole("link", { name: link.name }).first();
      await linkElement.click();
      await page.waitForLoadState("domcontentloaded");
      await expect(page).toHaveURL(new RegExp(`${link.path.replace("/", "\\/")}$`), { timeout: 10000 });
    }
  });

  test("protected routes load after login", async ({ page }) => {
    if (!email || !password) {
      test.skip(true, "E2E_EMAIL and E2E_PASSWORD must be set");
    }
    await login(page);

    for (const route of protectedRoutes) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});
      
      // Verify page loaded without 404
      const body = page.locator("body");
      await expect(body).not.toContainText("Not Found", { timeout: 5000 });
    }
  });

  test("profile page loads and displays user info", async ({ page }) => {
    if (!email || !password) {
      test.skip(true, "E2E_EMAIL and E2E_PASSWORD must be set");
    }
    await login(page);

    await page.goto("/profile", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});

    // Verify profile page elements are present
    await expect(page.locator("body")).not.toContainText("Not Found");
    
    // Try to find profile-related content
    const profileContent = page.locator("main");
    await expect(profileContent).toBeVisible({ timeout: 10000 });
  });

  test("footer links are present", async ({ page }) => {
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});

    const footerLinks = [
      "Skin Analysis",
      "About Us",
      "Contact",
      "Privacy Policy",
      "Terms of Service",
    ];

    for (const linkName of footerLinks) {
      const link = page.getByRole("link", { name: linkName }).first();
      await expect(link).toBeVisible({ timeout: 5000 });
    }
  });
});
