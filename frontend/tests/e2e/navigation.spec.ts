import { Buffer } from "buffer";
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
  test("header and footer links navigate", async ({ page }) => {
    if (!email || !password) {
      test.skip(true, "E2E_EMAIL and E2E_PASSWORD must be set");
    }
    await login(page);

    const headerLinks = [
      { name: "Home", path: "/" },
      { name: "Analysis", path: "/scan" },
      { name: "Dashboard", path: "/dashboard" },
      { name: "About", path: "/about" },
      { name: "Start Free Scan", path: "/scan" },
    ];

    for (const link of headerLinks) {
      await page.getByRole("link", { name: link.name }).first().click();
      await expect(page).toHaveURL(new RegExp(`${link.path.replace("/", "\\/")}$`));
    }

    const footerLinks = [
      { name: "Skin Analysis", path: "/scan" },
      { name: "Dashboard", path: "/dashboard" },
      { name: "History", path: "/history" },
      { name: "My Account", path: "/profile" },
      { name: "About Us", path: "/about" },
      { name: "Contact", path: "/contact" },
      { name: "Privacy Policy", path: "/privacy" },
      { name: "Terms of Service", path: "/terms" },
      { name: "Delete My Data", path: "/privacy#delete" },
    ];

    for (const link of footerLinks) {
      await page.getByRole("link", { name: link.name }).first().click();
      if (link.path.includes("#")) {
        await expect(page).toHaveURL(new RegExp(`${link.path.replace("/", "\\/")}$`));
      } else {
        await expect(page).toHaveURL(new RegExp(`${link.path.replace("/", "\\/")}$`));
      }
    }
  });

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

  test("profile actions and upload flow", async ({ page }) => {
    if (!email || !password) {
      test.skip(true, "E2E_EMAIL and E2E_PASSWORD must be set");
    }
    await login(page);

    await page.goto("/profile");
    await page.waitForLoadState("domcontentloaded");

    await page.setInputFiles('input[type="file"]', {
      name: "avatar.png",
      mimeType: "image/png",
      buffer: Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y3TvjQAAAAASUVORK5CYII=",
        "base64"
      ),
    });
    await expect(page.locator(".photo-preview img")).toBeVisible();

    await page.getByRole("button", { name: "Privacy" }).click();
    await page.getByRole("button", { name: "Change Password" }).click();
    await expect(page).toHaveURL(/\/password-reset$/);

    await page.goto("/profile");
    await page.getByRole("button", { name: "Privacy" }).click();
    await page.getByRole("button", { name: "Connected Accounts" }).click();
    await expect(page.locator(".toast")).toContainText("Connected accounts");

    await page.getByRole("button", { name: "Export My Data" }).click();
    await expect(page).toHaveURL(/\/export$/);

    await page.goto("/profile");
    await page.getByRole("button", { name: "Privacy" }).click();
    page.once("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "Delete Account" }).click();
    await expect(page).toHaveURL(/\/privacy#delete$/);

    await page.goto("/profile");
    await page.getByRole("button", { name: "Statistics" }).click();
    await page.getByRole("button", { name: "View Comparison" }).click();
    await expect(page).toHaveURL(/\/comparison$/);
  });
});
