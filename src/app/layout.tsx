import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { BootHealth } from "@/components/boot-health";
import { siteConfig } from "@/lib/site";

import "./globals.css";
// Community surfaces load their styles with the static dark shell.
import "@/components/community.module.css";

export const viewport: Viewport = {
  themeColor: "#030806",
  colorScheme: "dark",
};

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
        <script dangerouslySetInnerHTML={{ __html: "(() => {\n  const HYDRATED_EVENT = \"app:hydrated\";\n  const ATTEMPT_KEY = \"konkour_boot_recovery_v3\";\n  const PRIMARY_HOST = \"konkour-database.loprax.workers.dev\";\n  const BACKUP_HOST = \"konkour-database-backup.loprax.workers.dev\";\n  const MAX_RELOADS = 2;\n  let finished = false;\n  let recoveryTimer;\n\n  const clearRecovery = () => {\n    if (finished) return;\n    finished = true;\n    window.clearTimeout(recoveryTimer);\n    try {\n      sessionStorage.removeItem(ATTEMPT_KEY);\n    } catch {}\n  };\n\n  const recover = () => {\n    if (finished || document.documentElement.dataset.appHydrated === \"1\") {\n      clearRecovery();\n      return;\n    }\n\n    if (!navigator.onLine) {\n      window.addEventListener(\"online\", recover, { once: true });\n      return;\n    }\n\n    let attempts = 0;\n    try {\n      attempts = Number(sessionStorage.getItem(ATTEMPT_KEY) || \"0\");\n    } catch {}\n\n    if (attempts < MAX_RELOADS) {\n      try {\n        sessionStorage.setItem(ATTEMPT_KEY, String(attempts + 1));\n      } catch {}\n      window.setTimeout(() => location.reload(), 450 + attempts * 650);\n      return;\n    }\n\n    if (location.hostname === PRIMARY_HOST) {\n      const target =\n        \"https://\" +\n        BACKUP_HOST +\n        location.pathname +\n        location.search +\n        location.hash;\n      location.replace(target);\n    }\n  };\n\n  window.addEventListener(HYDRATED_EVENT, clearRecovery, { once: true });\n\n  window.addEventListener(\n    \"error\",\n    (event) => {\n      const target = event.target;\n      if (\n        target instanceof HTMLScriptElement ||\n        target instanceof HTMLLinkElement\n      ) {\n        window.setTimeout(recover, 250);\n      }\n    },\n    true,\n  );\n\n  window.addEventListener(\"unhandledrejection\", (event) => {\n    const message = String(event.reason?.message || event.reason || \"\");\n    if (\n      /ChunkLoadError|Loading chunk|dynamically imported module|Failed to fetch/i.test(\n        message,\n      )\n    ) {\n      window.setTimeout(recover, 250);\n    }\n  });\n\n  recoveryTimer = window.setTimeout(recover, 15000);\n\n  if (\"serviceWorker\" in navigator) {\n    window.addEventListener(\n      \"load\",\n      () => {\n        navigator.serviceWorker.register(\"/sw.js\", { scope: \"/\" }).catch(() => {});\n      },\n      { once: true },\n    );\n  }\n})();" }} />
      </head>
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <BootHealth />
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
