import { expect, test } from "@playwright/test";

const email = process.env.E2E_EMAIL ?? "";
const password = process.env.E2E_PASSWORD ?? "";

const publicRoutes = [
  "/",
  "/auth",
  "/password-reset",
  "/analysis/demo",
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
  "/onboarding",
  "/profile",
  "/consent",
  "/skin-goals",
  "/progress",
  "/export",
  "/notifications",
];

async function login(page: import("@playwright/test").Page) {
  await page.goto("/auth");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

test.describe("manual UX navigation flow", () => {
  test("public routes load", async ({ page }) => {
    for (const route of publicRoutes) {
      await page.goto(route);
      await page.waitForLoadState("domcontentloaded");
      await expect(page.locator("body")).not.toContainText("Not Found");
    }
  });

  test("protected routes load after login", async ({ page }) => {
    if (!email || !password) {
      test.skip(true, "E2E_EMAIL and E2E_PASSWORD must be set");
    }
    await login(page);

    for (const route of protectedRoutes) {
      await page.goto(route);
      await page.waitForLoadState("domcontentloaded");
      await expect(page.locator("body")).not.toContainText("Not Found");
    }
  });
});
