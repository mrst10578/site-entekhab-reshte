import { Suspense, type ReactNode } from "react";
import {
  ArrowDown,
  Database,
  HeartHandshake,
  ShieldCheck,
  Upload,
} from "lucide-react";

import { DatabaseExplorer } from "@/components/database-explorer";
import { siteConfig } from "@/lib/site";

function ActionLink({
  href,
  children,
}: {
  href?: string;
  children: ReactNode;
}) {
  if (!href) {
    return (
      <span
        aria-disabled="true"
        className="inline-flex cursor-not-allowed items-center justify-center rounded-xl border bg-muted px-4 py-2.5 text-sm font-semibold text-muted-foreground"
      >
        {children}
      </span>
    );
  }

  return (
    <a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noreferrer" : undefined}
      className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
    >
      {children}
    </a>
  );
}

export default function Home() {
  return (
    <main id="main-content">
      <header className="site-header">
        <a href="#" className="font-black tracking-tight">
          انتخاب رشته
        </a>
        <nav aria-label="ناوبری اصلی" className="flex items-center gap-4 text-sm">
          <a href="#database" className="header-link">
            دیتابیس
          </a>
          <a href="#contribute" className="header-link">
            کارنامه ۱۴۰۵
          </a>
          <a href="#support" className="header-link">
            حمایت
          </a>
        </nav>
      </header>

      <section className="hero-section">
        <div className="hero-icon" aria-hidden="true">
          <Database className="size-5" />
        </div>
        <div>
          <p className="eyebrow">داده واقعی، جست‌وجوی مستقیم</p>
          <h1 className="mt-2 text-balance text-3xl font-black tracking-tight sm:text-5xl">
            دیتابیس انتخاب رشته
          </h1>
          <p className="mt-4 max-w-2xl text-pretty text-sm leading-7 text-muted-foreground sm:text-base">
            قبولی‌های ثبت‌شده را از سال ۱۳۸۸ تا ۱۴۰۴ بر اساس رشته یا دانشگاه
            بررسی کن.
          </p>
        </div>
        <a
          href="#database"
          className="hero-cta"
          aria-label="رفتن به دیتابیس انتخاب رشته"
        >
          شروع جست‌وجو
          <ArrowDown className="size-4" aria-hidden="true" />
        </a>
      </section>

      <Suspense
        fallback={
          <section className="database-shell" aria-label="در حال آماده‌سازی دیتابیس">
            <div className="h-48 animate-pulse rounded-3xl bg-muted" />
          </section>
        }
      >
        <DatabaseExplorer />
      </Suspense>

      <section id="contribute" className="content-section">
        <div className="section-heading">
          <div className="section-icon" aria-hidden="true">
            <Upload className="size-5" />
          </div>
          <div>
            <p className="eyebrow">کمک با داده</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">
              کارنامه ۱۴۰۵ داری؟
            </h2>
          </div>
        </div>

        <p className="mt-5 max-w-2xl text-sm leading-7 text-muted-foreground">
          با ارسال کارنامه‌ات کمک می‌کنی دیتابیس انتخاب رشته ۱۴۰۵ برای سال‌های
          آینده قوی‌تر شود. اطلاعات هویتی نباید در دیتابیس عمومی منتشر شوند.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <span
            aria-disabled="true"
            className="inline-flex cursor-not-allowed items-center justify-center rounded-xl bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary"
          >
            ارسال کارنامه ۱۴۰۵ - به‌زودی
          </span>
          <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="size-4" aria-hidden="true" />
            مسیر بررسی و حذف اطلاعات شخصی قبل از انتشار طراحی شده است.
          </span>
        </div>
      </section>

      <section id="support" className="content-section">
        <div className="section-heading">
          <div className="section-icon" aria-hidden="true">
            <HeartHandshake className="size-5" />
          </div>
          <div>
            <p className="eyebrow">همراه پروژه باش</p>
            <h2 className="mt-1 text-2xl font-black tracking-tight">
              سه راه برای کمک
            </h2>
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <article className="support-card">
            <h3 className="font-bold">کمک به توسعه پروژه</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              برای نگهداری، زیرساخت و توسعه قابلیت‌های بعدی.
            </p>
            <div className="mt-5">
              <ActionLink href={siteConfig.projectDonationUrl}>
                حمایت از پروژه
              </ActionLink>
            </div>
          </article>

          <article className="support-card">
            <h3 className="font-bold">کمک مستقیم به محک</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              حمایت باید مستقیماً از مسیر رسمی محک انجام شود و از این پروژه عبور
              نمی‌کند.
            </p>
            <div className="mt-5">
              <ActionLink href={siteConfig.mahakDonationUrl}>
                رفتن به مسیر رسمی محک
              </ActionLink>
            </div>
          </article>

          <article className="support-card">
            <h3 className="font-bold">کمک با داده</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              یک کارنامه واقعی می‌تواند دیتابیس سال بعد را دقیق‌تر کند.
            </p>
            <div className="mt-5">
              <ActionLink href="#contribute">ارسال کارنامه ۱۴۰۵</ActionLink>
            </div>
          </article>
        </div>
      </section>

      <footer className="site-footer">
        <p>{siteConfig.name}</p>
        <p>داده ساختگی در نتایج نمایش داده نمی‌شود.</p>
      </footer>
    </main>
  );
}
