export const siteConfig = {
  name: "دیتابیس انتخاب رشته",
  description:
    "مرور و جست‌وجوی قبولی‌های ثبت‌شده انتخاب رشته از سال ۱۳۸۸ تا ۱۴۰۴.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  mahakDonationUrl: process.env.NEXT_PUBLIC_MAHAK_DONATION_URL || undefined,
  projectDonationUrl:
    process.env.NEXT_PUBLIC_PROJECT_DONATION_URL || undefined,
} as const;
