import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { siteConfig } from "@/lib/site";

import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#050807",
  colorScheme: "dark",
};

const criticalEntryCss = `
  html,
  body {
    background: #050807;
  }

  body.site-booting {
    margin: 0;
    color: #f4f7f5;
    background: #050807;
  }

  body.site-booting #main-content > .site-header,
  body.site-booting #main-content > .hero-section,
  body.site-booting #main-content > .database-shell,
  body.site-booting #main-content > .content-section,
  body.site-booting #main-content > .site-footer {
    visibility: hidden !important;
  }

  #app-boot-curtain {
    position: fixed;
    inset: 0;
    z-index: 10000;
    display: grid;
    place-items: center;
    min-height: 100dvh;
    padding: 1rem;
    color: #f4f7f5;
    background:
      radial-gradient(circle at 50% -15%, rgba(58, 124, 91, 0.2), transparent 34rem),
      radial-gradient(circle at 110% 100%, rgba(37, 70, 94, 0.14), transparent 28rem),
      #050807;
  }

  #app-boot-curtain .boot-card {
    width: min(88vw, 420px);
    border: 1px solid rgba(255, 255, 255, 0.09);
    border-radius: 1.5rem;
    padding: 1.4rem 1.5rem;
    background: linear-gradient(
      145deg,
      rgba(20, 27, 23, 0.97),
      rgba(7, 11, 9, 0.98)
    );
    box-shadow:
      0 32px 100px rgba(0, 0, 0, 0.62),
      inset 0 1px 0 rgba(255, 255, 255, 0.055);
    text-align: center;
  }

  #app-boot-curtain .boot-kicker {
    margin: 0;
    color: #68ef9b;
    font-size: 0.78rem;
    font-weight: 800;
  }

  #app-boot-curtain .boot-title {
    margin: 0.45rem 0 0;
    font-size: clamp(1.35rem, 5vw, 1.8rem);
    line-height: 1.5;
    font-weight: 900;
  }

  #app-boot-curtain .boot-copy {
    margin: 0.55rem 0 0;
    color: #98a79e;
    font-size: 0.88rem;
    line-height: 1.9;
  }

  #app-boot-curtain .boot-line {
    width: 42%;
    height: 3px;
    margin: 1rem auto 0;
    border-radius: 999px;
    background: linear-gradient(90deg, #28cc68, #67f39b);
    box-shadow: 0 0 18px rgba(75, 243, 137, 0.24);
  }

  body.site-booting .onboarding-overlay {
    position: fixed !important;
    inset: 0 !important;
    z-index: 9999 !important;
    display: grid !important;
    place-items: center !important;
    min-height: 100dvh;
    padding: 1rem;
    color: #f4f7f5;
    background:
      radial-gradient(circle at 50% -15%, rgba(58, 124, 91, 0.2), transparent 34rem),
      radial-gradient(circle at 110% 100%, rgba(37, 70, 94, 0.14), transparent 28rem),
      #050807;
  }

  body.site-booting .onboarding-card {
    width: min(92vw, 520px);
    border: 1px solid rgba(255, 255, 255, 0.09);
    border-radius: 1.5rem;
    padding: clamp(1.25rem, 4vw, 2rem);
    color: #f4f7f5;
    background: linear-gradient(
      145deg,
      rgba(20, 27, 23, 0.97),
      rgba(7, 11, 9, 0.98)
    );
    box-shadow: 0 32px 100px rgba(0, 0, 0, 0.62);
  }

  body.site-booting .onboarding-title {
    margin-top: 0.45rem;
    font-size: clamp(1.45rem, 5vw, 2rem);
    line-height: 1.5;
    font-weight: 900;
  }

  body.site-booting .onboarding-copy {
    margin-top: 0.65rem;
    color: #98a79e;
    line-height: 1.9;
  }

  body.site-booting .onboarding-options {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.65rem;
    margin-top: 1.25rem;
  }

  body.site-booting .onboarding-option {
    min-height: 48px;
    border: 1px solid rgba(255, 255, 255, 0.09);
    border-radius: 0.9rem;
    color: #f0f5f2;
    background: rgba(255, 255, 255, 0.035);
    font: inherit;
  }
`;

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  openGraph: {
    type: "website",
    locale: "fa_IR",
    title: siteConfig.name,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.name,
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <style
          id="critical-entry-theme"
          dangerouslySetInnerHTML={{ __html: criticalEntryCss }}
        />
      </head>
      <body className="site-booting min-h-dvh bg-background text-foreground antialiased">
        <div id="app-boot-curtain" role="status" aria-live="polite">
          <div className="boot-card">
            <p className="boot-kicker">دیتابیس انتخاب رشته</p>
            <p className="boot-title">در حال آماده‌سازی محیط</p>
            <p className="boot-copy">
              چند لحظه صبر کن تا رابط اصلی و دیتابیس آماده شوند.
            </p>
            <div className="boot-line" aria-hidden="true" />
          </div>
        </div>
        <a
          href="#main-content"
          className="sr-only fixed start-4 top-4 z-50 rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only"
        >
          رفتن به محتوای اصلی
        </a>
        {children}
      </body>
    </html>
  );
}
