"use client";

import { useLayoutEffect, type ReactNode } from "react";

export default function SupportLayout({ children }: { children: ReactNode }) {
  useLayoutEffect(() => {
    document.getElementById("app-boot-curtain")?.remove();
  }, []);

  return children;
}
