import { expect, test, type Page } from "@playwright/test";

async function completeSetup(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "تجربی", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "نوع سهمیه‌ت رو انتخاب کن" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "منطقه ۱", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeHidden({ timeout: 90_000 });
}

async function expectCommunityFooter(page: Page) {
  const footer = page.locator(".site-footer");
  await footer.scrollIntoViewIfNeeded();
  await expect(footer).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "fa");
  await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

  for (const handle of ["LoPRax_KonKour", "Flow_KonKour", "SparX_KonKour"]) {
    const link = footer.getByRole("link", { name: `@${handle}`, exact: true });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", `https://t.me/${handle}`);
    await expect(link).toHaveAttribute("dir", "ltr");
  }

  const credits = footer.getByRole("list", { name: "همراهان پروژه" });
  await expect(credits.getByRole("listitem")).toHaveCount(5);
  for (const name of [
    "محدثه اسماعیلی",
    "نیما خوشرفتار",
    "آرشام رحمانی",
    "حسین وزیری",
  ]) {
    await expect(credits.getByText(name, { exact: true })).toBeVisible();
  }

  const signature = footer.getByText("ZH.", { exact: true });
  await expect(signature).toBeVisible();
  await expect(signature).toHaveAttribute("dir", "ltr");
  const footerBox = (await footer.boundingBox())!;
  const signatureBox = (await signature.boundingBox())!;
  // Persian RTL content must not move the Latin signature to the right edge.
  expect(signatureBox.x - footerBox.x).toBeLessThanOrEqual(footerBox.width * 0.1);
  expect(signatureBox.x).toBeGreaterThanOrEqual(footerBox.x);
}

test.beforeEach(() => {
  test.setTimeout(120_000);
});

test("Mahak is prominent and its direct donation link stays distinct from project support", async ({ page }) => {
  await completeSetup(page);

  const banner = page.locator("#mahak-banner");
  await expect(banner).toBeVisible();
  const order = await page.evaluate(() => {
    const header = document.querySelector(".site-header")!;
    const banner = document.querySelector("#mahak-banner")!;
    const hero = document.querySelector(".hero-section")!;
    return [
      Boolean(header.compareDocumentPosition(banner) & Node.DOCUMENT_POSITION_FOLLOWING),
      Boolean(banner.compareDocumentPosition(hero) & Node.DOCUMENT_POSITION_FOLLOWING),
    ];
  });
  expect(order).toEqual([true, true]);

  const directDonation = banner.getByRole("link", {
    name: "کمک مستقیم به محک",
    exact: true,
  });
  await expect(directDonation).toBeVisible();
  await expect(directDonation).toHaveAttribute("href", "https://mahak-charity.org/online-payment/");
  const destination = new URL((await directDonation.getAttribute("href"))!);
  expect(destination.protocol).toBe("https:");
  expect(destination.hostname).toMatch(/(^|\.)mahak-charity\.org$/);
  await expect(directDonation).toHaveAttribute("target", "_blank");
  await expect(directDonation).toHaveAttribute("rel", /noopener/);

  const projectSupport = banner.getByRole("link", {
    name: "کمک به توسعهٔ پروژه",
    exact: true,
  });
  await expect(projectSupport).toHaveAttribute("href", "#support");
  await projectSupport.click();
  await expect(page).toHaveURL(/#support$/);
  await expect(page.locator("#support")).toBeInViewport();
});

test("project support explains the surplus policy and financial documents work with a keyboard", async ({ page }) => {
  await completeSetup(page);
  const support = page.locator("#support");
  await support.scrollIntoViewIfNeeded();
  await expect(support).toContainText(/مازاد/);
  await expect(support).toContainText(/(?:۱۰۰|100)\s*(?:٪|درصد)/);
  await expect(support).toContainText(/محک/);
  await expect(support).toContainText(
    /(?:هیچ|صفر).*?(?:حق‌الزحمه|دستمزد)|(?:حق‌الزحمه|دستمزد).*?(?:نمی‌گیر|نخواهد|صفر|ندار|هیچ)/,
  );

  const donation = support.getByRole("button", {
    name: "حمایت مالی از پروژه",
    exact: true,
  });
  await expect(donation).toBeVisible();
  await expect(donation).toBeDisabled();
  await expect(support.getByRole("link", { name: "حمایت مالی از پروژه", exact: true })).toHaveCount(0);
  await expect(support.getByText("لینک حمایت مالی به‌زودی فعال می‌شود.", { exact: true })).toBeVisible();

  const documents = support.getByTestId("financial-documents");
  const disclosure = documents.locator("summary");
  const emptyState = documents.getByText("هنوز گزارشی منتشر نشده", { exact: false });
  await expect(disclosure).toHaveText("مستندات مالی");
  await expect(emptyState).toBeHidden();
  await disclosure.focus();
  await expect(disclosure).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(emptyState).toBeVisible();
  await expect(documents).toContainText(/ماهانه/);
  await expect(documents).toContainText(/رسید|فیش/);
  await page.keyboard.press("Space");
  await expect(emptyState).toBeHidden();
  await expect(disclosure).toBeFocused();
});

test("contribution remains honestly unavailable and community credits are readable on desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await completeSetup(page);
  const contribution = page.locator("#contribute");
  await contribution.scrollIntoViewIfNeeded();
  await expect(contribution).toContainText(/رتبه/);
  await expect(contribution).toContainText(/کارنامه(?:ٔ|‌ی)?\s+نهایی/);
  await expect(contribution).toContainText(/اطلاعات (?:شخصی|هویتی)/);
  await expect(contribution.getByRole("button", { name: "ارسال کارنامه", exact: true })).toBeDisabled();
  await expect(contribution.getByText("به‌زودی، بعد از اعلام نتایج نهایی کنکور", { exact: true })).toBeVisible();
  await expect(contribution.getByRole("link", { name: /ارسال کارنامه/ })).toHaveCount(0);

  expect(await page.evaluate(() => {
    const footer = document.querySelector(".site-footer")!;
    return ["#support", "#contribute"].every((selector) =>
      Boolean(document.querySelector(selector)!.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING),
    );
  })).toBe(true);
  await expectCommunityFooter(page);
  await page.locator(".site-footer").screenshot({ path: "test-results/community-footer-desktop.png" });
});

test("community sections fit mobile RTL without overflow and keep the signature on the left", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await completeSetup(page);

  for (const selector of ["#mahak-banner", "#support", "#contribute", ".site-footer"]) {
    const section = page.locator(selector);
    await section.scrollIntoViewIfNeeded();
    await expect(section).toBeVisible();
    const box = (await section.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(390);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  }

  await expectCommunityFooter(page);
  await page.screenshot({ path: "test-results/community-mobile.png", fullPage: true });
  await page.locator(".site-footer").screenshot({ path: "test-results/community-footer-mobile.png" });
});
