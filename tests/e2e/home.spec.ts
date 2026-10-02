import { expect, test } from "@playwright/test";

async function completeSetup(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "تجربی", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "نوع سهمیه‌ت رو انتخاب کن" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "منطقه ۱", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeHidden({ timeout: 90_000 });
}

test("home page is Persian RTL and starts with guided selection", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.locator("html")).toHaveAttribute("lang", "fa");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

  await expect(
    page.getByRole("heading", { name: "گروه آزمایشی‌ت رو انتخاب کن" }),
  ).toBeVisible();

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

test("guided setup preloads the database and exposes year columns", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.goto("/");
  await completeSetup(page);

  await expect(
    page.getByRole("status", { name: "جست‌وجو موقتاً غیرفعال است" }),
  ).toBeVisible();
  await expect(page.locator("#major-search")).toBeVisible();
  await expect(page.locator("#major-search")).toBeDisabled();
  await expect(page.locator("#university-search")).toHaveCount(0);

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

test("database search stays visible but disabled under the warning", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.goto("/");
  await completeSetup(page);

  const disabledSearch = page.getByRole("status", {
    name: "جست‌وجو موقتاً غیرفعال است",
  });

  await expect(disabledSearch).toBeVisible();
  await expect(
    disabledSearch.getByText("موقتاً به دلیل حجم بالای دیتا غیرفعال می‌باشد."),
  ).toBeVisible();
  await expect(disabledSearch.locator(".hazard-strip")).toHaveCount(2);

  const input = page.locator("#major-search");
  await expect(input).toBeVisible();
  await expect(input).toBeDisabled();
  await expect(input).toHaveAttribute(
    "placeholder",
    "اسم رشته را بنویس؛ مثلاً پزشکی",
  );

  const button = page.getByRole("button", { name: "جست‌وجو", exact: true });
  await expect(button).toBeVisible();
  await expect(button).toBeDisabled();
});

test("change selection restarts the guided flow", async ({ page }) => {
  test.setTimeout(120_000);
  await page.goto("/");
  await completeSetup(page);

  await page.getByRole("button", { name: "تغییر", exact: true }).first().click();

  await expect(
    page.getByRole("heading", { name: "گروه آزمایشی‌ت رو انتخاب کن" }),
  ).toBeVisible();
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
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(
    page.getByRole("heading", { name: "گروه آزمایشی‌ت رو انتخاب کن" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "تجربی", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "منطقه ۲", exact: true }),
  ).toBeVisible();
});
