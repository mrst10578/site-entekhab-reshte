import { expect, test, type Page } from "@playwright/test";

const LOCK_KEY = "protocol25-session-locked";

async function triggerProtocol(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "تجربی", exact: true }).click();
  await page.getByRole("button", { name: "۲۵ درصد", exact: true }).click();
}

test("quota-25 takes over, completes the scan and locks only this tab", async ({ page, context }) => {
  const shards: string[] = [];
  const errors: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/data/") && !request.url().endsWith("/index.json")) shards.push(request.url());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await triggerProtocol(page);
  await expect(page.getByTestId("protocol25-screen")).toBeVisible();
  await expect(page.locator("#main-content")).toHaveAttribute("inert", "");
  await expect(page.locator(".loading-state, .database-shell, .selection-summary")).toHaveCount(0);
  await expect(page.getByTestId("matrix-rain-background")).toHaveCount(0);
  // Scope to the product surface; Next's development toolbar lives outside it.
  await expect(page.getByTestId("protocol25-screen").getByRole("button")).toHaveCount(0);
  await expect(page.locator("#main-content")).toBeHidden();
  await expect(page.getByText("VERIFYING ACCESS...", { exact: true })).toBeVisible();
  await expect(page.getByText("CHECKING SESSION...", { exact: true })).toBeVisible();
  await expect(page.getByText("CLEARANCE MISMATCH", { exact: true })).toBeVisible();
  await expect(page.getByTestId("protocol25-progress")).toHaveText("100%");
  await expect(page.getByRole("heading", { name: "ACCESS FLAGGED", exact: true })).toBeVisible();
  for (const line of ["Database access: DENIED", "Session privileges: REVOKED", "Connection route: CLOSED"]) {
    await expect(page.getByText(line, { exact: true })).toBeVisible();
  }
  await page.screenshot({ path: "test-results/protocol25-lockdown-desktop.png" });
  await expect(page.getByRole("heading", { name: "SESSION TERMINATED", exact: true })).toBeVisible();
  for (const count of ["03", "02", "01"]) await expect(page.getByTestId("protocol25-countdown")).toHaveText(count);
  await expect(page.getByRole("heading", { name: "CONNECTION CLOSED", exact: true })).toBeVisible();
  expect(await page.evaluate((key) => sessionStorage.getItem(key), LOCK_KEY)).toBe("1");
  expect(shards).toEqual([]);
  expect(errors).toEqual([]);
  await expect(page.locator(".protocol25-streams")).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("heading", { name: "CONNECTION CLOSED", exact: true })).toBeVisible();
  await expect(page.locator(".onboarding-overlay, .database-shell")).toHaveCount(0);
  await expect(page.locator("body")).toHaveCSS("overflow-y", "hidden");
  expect(shards).toEqual([]);
  const freshTab = await context.newPage();
  await freshTab.goto("/");
  await expect(freshTab.getByRole("heading", { name: "گروه آزمایشی‌ت رو انتخاب کن" })).toBeVisible();
  expect(await freshTab.evaluate((key) => sessionStorage.getItem(key), LOCK_KEY)).toBeNull();
});

test("locked hydration never reveals onboarding and skips even the data index", async ({ page }) => {
  const dataRequests: string[] = [];
  await page.addInitScript((key) => sessionStorage.setItem(key, "1"), LOCK_KEY);
  page.on("request", (request) => {
    if (request.url().includes("/data/")) dataRequests.push(request.url());
  });
  let release!: () => void;
  const scripts = new Promise<void>((resolve) => { release = resolve; });
  await page.route("**/*.js*", async (route) => { await scripts; await route.continue(); });
  await page.goto("/", { waitUntil: "commit" });
  try {
    await expect(page.locator("#app-boot-curtain")).toBeVisible();
    await expect(page.locator("body")).toHaveCSS("background-color", "rgb(3, 8, 6)");
    await page.evaluate(() => {
      const samples: string[] = [];
      (window as typeof window & { bootSamples: string[] }).bootSamples = samples;
      function sample() {
        const curtain = document.getElementById("app-boot-curtain");
        const protocol = document.querySelector(".protocol25-overlay");
        if (!curtain && !protocol) samples.push("uncovered");
        if (!protocol) requestAnimationFrame(sample);
      }
      requestAnimationFrame(sample);
    });
    release();
    await expect(page.getByRole("heading", { name: "CONNECTION CLOSED", exact: true })).toBeVisible();
    expect(await page.evaluate(() => (window as typeof window & { bootSamples: string[] }).bootSamples)).toEqual([]);
    expect(dataRequests).toEqual([]);
  } finally { release(); }
});

for (const reducedMotion of ["no-preference", "reduce"] as const) {
  test(`mobile protocol fits and completes with motion ${reducedMotion}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ reducedMotion });
    await triggerProtocol(page);
    await expect(page.getByRole("heading", { name: "ACCESS FLAGGED", exact: true })).toBeVisible();
    const card = await page.locator(".protocol25-card").boundingBox();
    expect(card!.x).toBeGreaterThanOrEqual(0);
    expect(card!.x + card!.width).toBeLessThanOrEqual(390);
    expect(card!.y + card!.height).toBeLessThanOrEqual(844);
    await page.screenshot({ path: `test-results/protocol25-mobile-${reducedMotion}.png` });
    if (reducedMotion === "reduce") {
      await expect(page.locator(".protocol25-stream").first()).toHaveCSS("animation-name", "none");
    }
    await expect(page.getByTestId("protocol25-countdown")).toHaveText("03");
    await expect(page.getByRole("heading", { name: "CONNECTION CLOSED", exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    await page.screenshot({ path: `test-results/protocol25-final-${reducedMotion}.png` });
  });
}

for (const quota of ["منطقه ۱", "منطقه ۲", "منطقه ۳", "۵ درصد", "مشاهده همه"]) {
  test(`${quota} retains normal loading, Matrix and disabled search`, async ({ page }) => {
    test.setTimeout(120_000);
    await page.goto("/");
    await page.getByRole("button", { name: "تجربی", exact: true }).click();
    await page.getByRole("button", { name: quota, exact: true }).click();
    await expect(page.getByRole("dialog")).toBeHidden({ timeout: 90_000 });
    await expect(page.getByTestId("protocol25-screen")).toHaveCount(0);
    await expect(page.getByTestId("matrix-rain-background")).toBeVisible();
    await expect(page.locator(".year-column").first()).toBeVisible();
    await expect(page.getByRole("textbox", { name: "جست‌وجو بر اساس رشته" })).toBeDisabled();
    await expect(page.getByRole("button", { name: "جست‌وجو", exact: true })).toBeDisabled();
  });
}
