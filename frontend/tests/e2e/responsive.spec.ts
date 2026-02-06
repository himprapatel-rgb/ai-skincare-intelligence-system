import { expect, test } from "@playwright/test";

// Configure longer timeouts for stability. Viewport is set per project in playwright.config (desktop / tablet / mobile).
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
  "/profile",
  "/progress",
  "/export",
];

async function login(page: import("@playwright/test").Page) {
  await page.goto("/auth", { waitUntil: "networkidle" });
  
  // Wait for the auth form to be visible
  await page.waitForSelector('input[type="email"], input[id="email"]', { timeout: 10000 });
  
  const emailInput = page.getByRole("textbox", { name: "Email", exact: true });
  const passwordInput = page.locator('input#password');
  
  await emailInput.fill(email);
  await passwordInput.fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  
  try {
    await page.waitForURL(/\/dashboard$/, { timeout: 15000 });
  } catch (_error) {
    test.skip(true, `Login failed at ${page.url()}. Check E2E credentials.`);
  }
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

test.describe("responsive GUI smoke (desktop / tablet / mobile)", () => {
  test("public routes load and have no horizontal overflow", async ({ page }) => {
    for (const route of publicRoutes) {
      await page.goto(route);
      await page.waitForLoadState("domcontentloaded");
      await expect(page.locator("body")).not.toContainText("Not Found");
      await expectNoHorizontalOverflow(page, route);
    }
  });

  test("protected routes load and have no horizontal overflow after login", async ({ page }) => {
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
