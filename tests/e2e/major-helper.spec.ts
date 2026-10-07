import { expect, test } from "@playwright/test";

test("major helper loads only a selected major shard and persists favorites", async ({ page }) => {
  const shards: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/major-helper/data/")) shards.push(request.url());
  });

  await page.goto("/major-helper/");
  await expect(page.getByRole("heading", { name: /دستیار کدرشته‌محل‌های/ })).toBeVisible();
  const major = page.getByLabel("رشته دانشگاهی");
  await expect(major).toBeEnabled();
  expect(shards).toHaveLength(0);

  await major.selectOption("دکتری عمومی پزشکی");
  await expect(page.locator("article").first()).toBeVisible();
  expect(shards).toHaveLength(1);
  await expect(page.getByText("کدرشته‌محل‌ها")).toBeVisible();

  await page.getByRole("button", { name: "افزودن به انتخاب‌ها" }).first().click();
  await page.getByRole("button", { name: /لیست انتخاب‌ها/ }).click();
  await expect(page.getByRole("heading", { name: "لیست انتخاب‌های من" })).toBeVisible();
  await expect(page.locator("ol li")).toHaveCount(1);

  await page.reload();
  await page.getByRole("button", { name: /لیست انتخاب‌ها/ }).click();
  await expect(page.locator("ol li")).toHaveCount(1);
});

test("major helper remains usable at mobile width", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/major-helper/");
  await expect(page.getByLabel("رشته دانشگاهی")).toBeEnabled();
  await page.getByLabel("رشته دانشگاهی").selectOption("پرستاری");
  await expect(page.locator("article").first()).toBeVisible();
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(width).toBeLessThanOrEqual(390);
});
