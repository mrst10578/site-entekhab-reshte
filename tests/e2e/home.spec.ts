import { expect, test } from "@playwright/test";

async function completeSetup(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "تجربی", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "نوع سهمیه‌ت رو انتخاب کن" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "منطقه ۱", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeHidden({ timeout: 90_000 });
}

for (const viewport of [
  { width: 1280, height: 720 },
  { width: 390, height: 844 },
]) {
  test(`first paint is Dark Premium without JavaScript at ${viewport.width}px`, async ({
    browser,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false, viewport });
    const page = await context.newPage();

    await page.goto("/");

    await expect(page.locator("html")).toHaveCSS("background-color", "rgb(3, 8, 6)");
    await expect(page.locator("body")).toHaveCSS("background-color", "rgb(3, 8, 6)");
    await expect(page.locator("body")).toHaveCSS("color", "rgb(238, 250, 241)");
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute("content", "#030806");
    await expect(page.locator("html")).toHaveCSS("color-scheme", "dark");
    await expect(page.locator("#app-boot-curtain")).toHaveCount(0);
    await expect(page.locator("body")).not.toHaveClass(/site-booting|site-hydrated|matrix-active/);
    await expect(page.locator(".onboarding-overlay")).toBeAttached();
    await expect(page.locator(".onboarding-overlay")).toHaveAttribute("aria-modal", "true");
    await expect(page.locator(".onboarding-overlay")).toHaveCSS("background-color", "rgb(5, 8, 7)");
    await expect(page.getByTestId("matrix-rain-background")).toHaveCount(0);

    // The shell covers streamed Suspense content; inspect its real dark surfaces too.
    for (const selector of [
      ".site-header",
      ".hero-icon",
      ".database-shell",
      ".selection-item",
      ".year-column",
      ".content-section",
      ".support-card",
      ".hero-secondary-action",
    ]) {
      const surface = page.locator(selector).first();
      await expect(surface).toBeAttached();
      const rgb = await surface.evaluate((node) => {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 1;
        const context = canvas.getContext("2d")!;
        context.fillStyle = getComputedStyle(node).backgroundColor;
        context.fillRect(0, 0, 1, 1);
        return Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3);
      });
      expect(Math.max(...rgb), selector).toBeLessThan(65);
    }
    await expect(page.locator(".site-header")).toBeVisible();
    await expect(page.locator(".hero-section")).toBeVisible();
    await expect(page.locator(".hero-section")).toHaveCSS("visibility", "visible");
    await expect(page.locator(".site-footer")).toHaveCSS("visibility", "visible");
    await expect(page.locator("body")).toHaveCSS("overflow-y", "hidden");
    await page.screenshot({ path: `test-results/ssr-dark-${viewport.width}.png` });
    await context.close();
  });
}

test("entry theme and layout stay stable while hydration is delayed", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  let releaseScripts!: () => void;
  const scriptsReady = new Promise<void>((resolve) => {
    releaseScripts = resolve;
  });
  await page.route("**/*.js*", async (route) => {
    await scriptsReady;
    await route.continue();
  });
  await page.goto("/", { waitUntil: "commit" });
  try {
    await expect(page.locator("#app-boot-curtain")).toHaveCount(0);
    await expect(page.getByRole("dialog")).toBeVisible();
    await expect(page.locator("body")).toHaveCSS("background-color", "rgb(3, 8, 6)");
    const before = await page.locator(".onboarding-card").boundingBox();
    const theme = await page.locator("body").evaluate((node) => ({
      color: getComputedStyle(node).color,
      background: getComputedStyle(node).backgroundColor,
    }));
    releaseScripts();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("#app-boot-curtain")).toHaveCount(0);
    expect(await page.locator(".onboarding-card").boundingBox()).toEqual(before);
    expect(await page.locator("body").evaluate((node) => ({
      color: getComputedStyle(node).color,
      background: getComputedStyle(node).backgroundColor,
    }))).toEqual(theme);
    await page.getByRole("button", { name: "تجربی", exact: true }).click();
    await expect(page.getByRole("heading", { name: "نوع سهمیه‌ت رو انتخاب کن" })).toBeVisible();
    expect(errors).toEqual([]);
  } finally {
    releaseScripts();
  }
});

test("home page is Persian RTL and starts with guided selection", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.locator("html")).toHaveAttribute("lang", "fa");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  await expect(page.locator("#app-boot-curtain")).toHaveCount(0);
  await expect(page.locator("body")).not.toHaveClass(/site-booting/);

  await expect(
    page.getByRole("heading", { name: "گروه آزمایشی‌ت رو انتخاب کن" }),
  ).toBeVisible();
  await expect(page.getByTestId("matrix-rain-background")).toHaveCount(0);
  await expect(page.locator("body")).not.toHaveClass(/matrix-active/);

  for (const option of ["تجربی", "ریاضی", "انسانی", "هنر", "زبان", "مشاهده همه"]) {
    await expect(
      page.getByRole("button", { name: option, exact: true }),
    ).toBeVisible();
  }

  await page.getByRole("button", { name: "تجربی", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "نوع سهمیه‌ت رو انتخاب کن" }),
  ).toBeVisible();

  for (const option of [
    "منطقه ۱",
    "منطقه ۲",
    "منطقه ۳",
    "۵ درصد",
    "۲۵ درصد",
    "مشاهده همه",
  ]) {
    await expect(
      page.getByRole("button", { name: option, exact: true }),
    ).toBeVisible();
  }
});

test("Matrix waits for the last real shard while loading stays dark", async ({ page }) => {
  test.setTimeout(120_000);
  let held = false;
  let releaseShard!: () => void;
  const lastShardReady = new Promise<void>((resolve) => {
    releaseShard = resolve;
  });
  await page.route("**/data/**", async (route) => {
    if (!route.request().url().endsWith("/index.json") && !held) {
      held = true;
      await lastShardReady;
    }
    await route.continue();
  });
  await page.goto("/");
  try {
    await page.getByRole("button", { name: "تجربی", exact: true }).click();
    await page.getByRole("button", { name: "منطقه ۱", exact: true }).click();
    await expect(page.getByRole("heading", { name: "دارم دیتابیس رو آماده می‌کنم" })).toBeVisible();
    expect(await page.locator(".loading-track > span").evaluate(
      (node: HTMLElement) => parseFloat(node.style.width),
    )).toBe(0);
    await expect(page.locator(".onboarding-overlay")).toHaveCSS("background-color", "rgb(5, 8, 7)");
    await expect(page.locator("body")).toHaveCSS("overflow-y", "hidden");
    await expect(page.getByTestId("matrix-rain-background")).toHaveCount(0);
    await expect(page.locator("body")).not.toHaveClass(/matrix-active/);
    releaseShard();
    await expect(page.getByRole("dialog")).toBeHidden({ timeout: 90_000 });
    await expect(page.getByTestId("matrix-rain-background")).toBeVisible();
    await expect(page.locator("body")).toHaveClass(/matrix-active/);
  } finally {
    releaseShard();
  }
});

test("guided setup preloads the database and exposes year columns", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.goto("/");
  await completeSetup(page);

  await expect(page.getByTestId("matrix-rain-background")).toBeVisible();
  await expect(page.locator("body")).toHaveClass(/matrix-active/);
  await expect(page.locator(".control-panel")).toHaveCount(0);
  await expect(page.locator("#toggle-btn")).toHaveCount(0);

  const scrollGuide = page.getByRole("note", {
    name: "راهنمای پیمایش جدول رتبه‌ها",
  });
  await expect(scrollGuide).toBeVisible();
  await expect(scrollGuide).toContainText("داخل هر ستون بصورت عمودی اسکرول کن");
  await expect(scrollGuide).toContainText("جدول رو بصورت افقی اسکرول کنی");
  await expect(page.locator("#major-search, #university-search")).toHaveCount(0);

  await expect(
    page.getByRole("heading", { level: 3, name: "۱۴۰۴" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 3, name: "۱۴۰۱" }),
  ).toBeAttached();
  await expect(
    page.getByRole("heading", { level: 3, name: "۱۳۸۸" }),
  ).toBeAttached();

  await expect(page.getByText("گروه آزمایشی", { exact: true })).toBeVisible();
  await expect(page.getByText("سهمیه", { exact: true })).toBeVisible();
});

test("each year column scrolls independently inside a fixed database viewport", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.goto("/");
  await completeSetup(page);

  const rail = page.locator(".year-columns-rail");
  const resultColumns = page.locator(".year-results");

  await expect(rail).toBeVisible();
  await expect(resultColumns.first()).toBeVisible();

  const railHeight = await rail.evaluate((node) => node.clientHeight);
  expect(railHeight).toBeGreaterThan(400);
  expect(railHeight).toBeLessThanOrEqual(760);

  const firstMetrics = await resultColumns.first().evaluate((node) => ({
    clientHeight: node.clientHeight,
    scrollHeight: node.scrollHeight,
  }));
  expect(firstMetrics.scrollHeight).toBeGreaterThan(firstMetrics.clientHeight);

  const secondInitialScroll = await resultColumns.nth(1).evaluate(
    (node) => node.scrollTop,
  );

  await resultColumns.first().evaluate((node) => {
    node.scrollTop = Math.min(500, node.scrollHeight - node.clientHeight);
    node.dispatchEvent(new Event("scroll"));
  });

  await expect
    .poll(() => resultColumns.first().evaluate((node) => node.scrollTop))
    .toBeGreaterThan(0);

  expect(
    await resultColumns.nth(1).evaluate((node) => node.scrollTop),
  ).toBe(secondInitialScroll);
});

test("scroll guide replaces the removed database search controls", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.goto("/");
  await completeSetup(page);

  const scrollGuide = page.getByRole("note", {
    name: "راهنمای پیمایش جدول رتبه‌ها",
  });
  await expect(scrollGuide).toBeVisible();
  await expect(scrollGuide).toContainText("داخل هر ستون بصورت عمودی اسکرول کن");
  await expect(scrollGuide).toContainText("جدول رو بصورت افقی اسکرول کنی");
  await expect(page.locator("#major-search, #university-search")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "جست‌وجو", exact: true })).toHaveCount(0);
});

test("height-only viewport changes do not rebuild Matrix planes", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 760 });
  await page.goto("/");
  await completeSetup(page);

  const fastPlane = page.locator(".matrix-rain-plane-fast");
  await expect(fastPlane).toBeVisible();

  const before = await fastPlane.evaluate((node: HTMLCanvasElement) => ({
    width: node.width,
    height: node.height,
    bitmap: node.toDataURL(),
    animationStart: node.getAnimations()[0].startTime,
  }));

  await page.evaluate(() => window.scrollTo(0, 500));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
  await page.setViewportSize({ width: 390, height: 840 });
  await page.waitForTimeout(250);

  const after = await fastPlane.evaluate((node: HTMLCanvasElement) => ({
    width: node.width,
    height: node.height,
    bitmap: node.toDataURL(),
    animationStart: node.getAnimations()[0].startTime,
  }));

  expect(after).toEqual(before);
  await expect(
    page.getByRole("note", { name: "راهنمای پیمایش جدول رتبه‌ها" }),
  ).toBeVisible();
  const columns = page.locator(".year-results");
  const secondScroll = await columns.nth(1).evaluate((node) => node.scrollTop);
  await columns.first().evaluate((node) => {
    node.scrollTop = 200;
  });
  await expect.poll(() => columns.first().evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
  expect(await columns.nth(1).evaluate((node) => node.scrollTop)).toBe(secondScroll);
});

test("Matrix respects reduced motion without dropping the background", async ({ page }) => {
  test.setTimeout(120_000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await completeSetup(page);

  const fastPlane = page.locator(".matrix-rain-plane-fast");
  const slowPlane = page.locator(".matrix-rain-plane-slow");

  await expect(fastPlane).toBeVisible();
  await expect(slowPlane).toBeHidden();
  await expect(fastPlane).toHaveCSS("animation-name", "none");
  await expect(fastPlane).toHaveCSS("opacity", "0.5");
});

test("change selection restarts the guided flow without changing the base theme", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/");
  const themeTokens = () => page.locator("body").evaluate((node) => {
    const style = getComputedStyle(node);
    return [
      "background", "foreground", "card", "card-foreground",
      "primary", "primary-foreground", "secondary", "secondary-foreground",
      "muted", "muted-foreground", "border", "ring",
    ].map((token) => style.getPropertyValue(`--${token}`).trim());
  });
  const entryTheme = await themeTokens();
  await completeSetup(page);
  expect(await themeTokens()).toEqual(entryTheme);

  await page.getByRole("button", { name: "تغییر", exact: true }).first().click();

  await expect(
    page.getByRole("heading", { name: "گروه آزمایشی‌ت رو انتخاب کن" }),
  ).toBeVisible();
  await expect(page.getByTestId("matrix-rain-background")).toHaveCount(0);
  await expect(page.locator("body")).not.toHaveClass(/matrix-active/);
  await expect(page.locator("body")).toHaveCSS("background-color", "rgb(3, 8, 6)");
  expect(await themeTokens()).toEqual(entryTheme);
});

test("static admission snapshot is deployable and privacy-minimized", async ({
  request,
}) => {
  const indexResponse = await request.get("/data/index.json");
  expect(indexResponse.ok()).toBe(true);

  const index = await indexResponse.json();
  expect(index.version).toBe(2);
  expect(index.shards.length).toBeGreaterThan(0);
  expect(index.majorShards).toBeTruthy();
  expect(index.universityShards).toBeTruthy();

  const shardResponse = await request.get(index.shards[0].path);
  expect(shardResponse.ok()).toBe(true);

  const records = await shardResponse.json();
  expect(Array.isArray(records)).toBe(true);
  expect(records.length).toBeGreaterThan(0);

  const sample = records[0];
  expect(sample).toHaveProperty("rank");
  expect(sample).toHaveProperty("major");
  expect(sample).not.toHaveProperty("gender");
  expect(sample).not.toHaveProperty("city");
  expect(sample).not.toHaveProperty("national_rank");
});

test("guided setup remains usable on mobile", async ({ page }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  for (const stage of ["group", "quota"]) {
    await expect(page.getByRole("dialog")).toBeVisible();
    for (const button of await page.locator(".onboarding-option").all()) {
      const box = (await button.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.y).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(390);
      expect(box.y + box.height).toBeLessThanOrEqual(844);
    }
    if (stage === "group") {
      await page.getByRole("button", { name: "تجربی", exact: true }).click();
      await expect(page.getByRole("heading", { name: "نوع سهمیه‌ت رو انتخاب کن" })).toBeVisible();
    }
  }
  await page.getByRole("button", { name: "منطقه ۲", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeHidden({ timeout: 90_000 });
  await expect(page.locator(".site-header")).toBeVisible();
  await expect(page.locator(".hero-section")).toBeVisible();
  await expect(page.getByTestId("matrix-rain-background")).toBeVisible();
  await expect(
    page.getByRole("note", { name: "راهنمای پیمایش جدول رتبه‌ها" }),
  ).toBeVisible();
  await page.screenshot({ path: "test-results/mobile-ready.png", fullPage: true });
});
