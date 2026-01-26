import { expect, test } from "@playwright/test";

const email = process.env.E2E_EMAIL ?? "";
const password = process.env.E2E_PASSWORD ?? "";

const viewports = [
  { name: "mobile", width: 375, height: 812 },
  { name: "tablet", width: 768, height: 1024 },
  { name: "desktop", width: 1280, height: 800 },
];

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
  "/routine-builder",
  "/progress",
  "/export",
  "/profile",
];

async function login(page: import("@playwright/test").Page) {
  await page.goto("/auth");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);
}

async function expectNoHorizontalOverflow(
  page: import("@playwright/test").Page,
  route: string
) {
  const overflowInfo = await page.evaluate(() => {
    const doc = document.documentElement;
    const hasOverflow = doc.scrollWidth > doc.clientWidth + 1;
    if (!hasOverflow) {
      return { hasOverflow, clientWidth: doc.clientWidth, scrollWidth: doc.scrollWidth, offenders: [] };
    }

    const offenders = Array.from(document.querySelectorAll<HTMLElement>("*"))
      .filter((el) => {
        const rect = el.getBoundingClientRect();
        return rect.width > doc.clientWidth + 1 || rect.right > doc.clientWidth + 1;
      })
      .slice(0, 5)
      .map((el) => {
        const rect = el.getBoundingClientRect();
        return {
          tag: el.tagName.toLowerCase(),
          id: el.id,
          className: el.className,
          width: Math.round(rect.width),
          right: Math.round(rect.right),
        };
      });

    return {
      hasOverflow,
      clientWidth: doc.clientWidth,
      scrollWidth: doc.scrollWidth,
      offenders,
    };
  });

  if (overflowInfo.hasOverflow) {
    throw new Error(
      `Horizontal overflow detected on ${route}. ` +
        `clientWidth=${overflowInfo.clientWidth}, scrollWidth=${overflowInfo.scrollWidth}, ` +
        `offenders=${JSON.stringify(overflowInfo.offenders)}`
    );
  }
}

test.describe("responsive GUI smoke", () => {
  for (const viewport of viewports) {
    test.describe(`${viewport.name} viewport`, () => {
      test.use({ viewport: { width: viewport.width, height: viewport.height } });

      test("public routes are responsive", async ({ page }) => {
        for (const route of publicRoutes) {
          await page.goto(route);
          await page.waitForLoadState("domcontentloaded");
          await expect(page.locator("body")).not.toContainText("Not Found");
          await expectNoHorizontalOverflow(page, route);
        }
      });

      test("protected routes are responsive after login", async ({ page }) => {
        if (!email || !password) {
          test.skip(true, "E2E_EMAIL and E2E_PASSWORD must be set");
        }
        await login(page);

        for (const route of protectedRoutes) {
          await page.goto(route);
          await page.waitForLoadState("domcontentloaded");
          await expect(page.locator("body")).not.toContainText("Not Found");
          await expectNoHorizontalOverflow(page, route);
        }
      });
    });
  }
});
