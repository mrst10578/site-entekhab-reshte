import { expect, test } from "@playwright/test";

test("home page is Persian RTL and exposes the database explorer", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.locator("html")).toHaveAttribute("lang", "fa");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

  await expect(
    page.getByRole("heading", { level: 1, name: "دیتابیس انتخاب رشته" }),
  ).toBeVisible();

  await expect(page.getByRole("button", { name: "رشته", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "دانشگاه", exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "رشته + دانشگاه", exact: true }),
  ).toBeVisible();

  await expect(page.getByRole("heading", { level: 3, name: "۱۴۰۴" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 3, name: "۱۳۸۸" })).toBeAttached();
});

test("search mode is shareable through the URL", async ({ page }) => {
  await page.goto("/?mode=both&major=پزشکی&university=دانشگاه%20علوم%20پزشکی%20تهران");

  await expect(page.locator("#major-search")).toHaveValue("پزشکی");
  await expect(page.locator("#university-search")).toHaveValue(
    "دانشگاه علوم پزشکی تهران",
  );
  await expect(
    page.getByText("دانشگاه علوم پزشکی تهران", { exact: true }).first(),
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

test("mobile quota controls expose their selected state", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const firstYear = page.locator(".year-block").first();
  const regionTwo = firstYear.getByRole("button", {
    name: "منطقه ۲",
    exact: true,
  });

  await expect(regionTwo).toBeVisible();
  await regionTwo.click();
  await expect(regionTwo).toHaveAttribute("aria-pressed", "true");
});
