import { Suspense } from "react";
import {
  ArrowDown,
  Database,
} from "lucide-react";

import { DatabaseExplorer } from "@/components/database-explorer";
import { DataContribution, MahakBanner, ProjectSupport, SelectionEntryLinks } from "@/components/community-sections";
import { SiteFooter } from "@/components/site-footer";

export default function Home() {
  return (
    <main id="main-content">
      <header className="site-header">
        <div className="header-shell">
          <a href="#" className="header-brand" aria-label="دیتابیس انتخاب رشته">
            <span className="header-brand-mark" aria-hidden="true">
              <Database className="size-4" />
            </span>
            <span className="header-brand-copy">
              <strong>دیتابیس انتخاب رشته</strong>
              <span>قبولی‌های واقعی سال‌های گذشته</span>
            </span>
          </a>

          <nav aria-label="ناوبری اصلی" className="header-nav">
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
        </div>
      </header>

      <MahakBanner />
      <SelectionEntryLinks />

      <section className="hero-section">
        <div className="hero-icon" aria-hidden="true">
          <Database className="size-5" />
        </div>
        <div>
          <p className="eyebrow">داده واقعی، مرور مستقیم</p>
          <h1 className="mt-2 text-balance text-3xl font-black tracking-tight sm:text-5xl">
            دیتابیس انتخاب رشته
          </h1>
          <p className="mt-4 max-w-2xl text-pretty text-sm leading-7 text-muted-foreground sm:text-base">
            گروه آزمایشی و سهمیه‌ات را مشخص کن، بعد قبولی‌های ثبت‌شده سال‌های مختلف
            را ستون‌به‌ستون مرور کن و با اسکرول عمودی و افقی به رتبه و سال مدنظرت برس.
          </p>
        </div>
        <div className="hero-actions">
          <a
            href="#database"
            className="hero-cta"
            aria-label="رفتن به دیتابیس انتخاب رشته"
          >
            رفتن به دیتابیس
            <ArrowDown className="size-4" aria-hidden="true" />
          </a>
          <a href="#support" className="hero-secondary-action">
            کمک به پروژه
          </a>
          <a href="#contribute" className="hero-secondary-action">
            ارسال کارنامه ۱۴۰۵
          </a>
        </div>
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

      <ProjectSupport />
      <DataContribution />
      <SiteFooter />
    </main>
  );
}
