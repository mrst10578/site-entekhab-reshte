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
