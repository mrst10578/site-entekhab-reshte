# Site Entekhab Reshte

وب‌اپ فارسی و RTL برای مرور و جست‌وجوی قبولی‌های تاریخی انتخاب رشته.

## هدف نسخه v1

صفحه اصلی حول یک Database Explorer ساخته شده است:

- سال‌های ۱۳۸۸ تا ۱۴۰۴ در معماری UI
- پنج ستون سهمیه: منطقه ۱، منطقه ۲، منطقه ۳، ۵٪ و ۲۵٪
- فقط سه حالت جست‌وجو: رشته، دانشگاه، رشته + دانشگاه
- Autocomplete از واژگان واقعی دیتاست
- Search state قابل اشتراک در URL
- Horizontal Year Rail با Scroll Snap
- Virtualized rendering برای لیست‌های بزرگ
- بخش ارسال کارنامه ۱۴۰۵
- بخش حمایت از پروژه و مسیر مستقیم محک

دو قابلیت عمداً خارج از scope هستند:

- نمودار مقایسه سالیانه
- نمایش count یا کامل/ناقص بودن دیتاست کنار سال‌ها و سهمیه‌ها

## منبع داده

Source of truth:

`mrst10578/Entekhab-Reshte`

در زمان ساخت این نسخه، فایل‌های سال‌محور موجود در Source فعلی برای سال‌های ۱۴۰۱ تا ۱۴۰۴ هستند. UI از ۱۳۸۸ تا ۱۴۰۴ را پشتیبانی می‌کند و با اضافه‌شدن سال‌های قدیمی‌تر به Source نیازی به بازطراحی ساختار اصلی ندارد.

هیچ رکورد ساختگی نباید برای پرکردن سال یا سهمیه خالی ایجاد شود.

## Web Toolkit

این پروژه از `mrst10578/starter-web` مشتق شده و قواعد پایه Professional Web Toolkit را حفظ می‌کند:

`mrst10578/pro-web-toolkit`

برای تجربه فارسی، قواعد feature pack مربوط به `rtl-persian` اعمال شده‌اند.

## اجرا

```bash
npm ci
npm run dev
```

## همگام‌سازی داده

اگر checkout مخزن داده در کنار پروژه در دسترس باشد:

```bash
SOURCE_DATA_ROOT=../Entekhab-Reshte/data/raw npm run data:sync
```

این فرمان:

1. JSONLهای Kanoon و CSVهای ساختاریافته Sajad/Sibtorsh را می‌خواند.
2. متن فارسی را برای matching نرمال می‌کند.
3. سهمیه را به کلیدهای داخلی ثابت تبدیل می‌کند.
4. رکوردهای نامعتبر را رد می‌کند.
5. داده را dedupe می‌کند.
6. shardهای سال/سهمیه را در `public/data` می‌سازد.
7. یک `public/data/index.json` سبک برای Autocomplete و Lazy Loading تولید می‌کند.

تا وقتی shardهای کامل ساخته نشده‌اند، پروژه فقط از bootstrap recordهای واقعی و قابل‌ردیابی در `src/data/admissions.ts` استفاده می‌کند. این رکوردها همگی از Source اصلی آمده‌اند و برای تست UI هستند، نه داده مصنوعی.

## Environment variables

```bash
NEXT_PUBLIC_SITE_URL=
NEXT_PUBLIC_MAHAK_DONATION_URL=
NEXT_PUBLIC_PROJECT_DONATION_URL=
SOURCE_DATA_ROOT=
```

لینک محک و حمایت پروژه تا قبل از تعیین مقصد واقعی خالی می‌مانند. سایت checkout یا پرداخت جعلی نمی‌سازد.

## بررسی کیفیت

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

CI همین زنجیره را روی Pull Request اجرا می‌کند.

## مستندات

معماری پروژه در `docs/ARCHITECTURE.md` توضیح داده شده است.
