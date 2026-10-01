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
