"use client";

import { useEffect } from "react";

export function BootHealth() {
  useEffect(() => {
    document.documentElement.dataset.appHydrated = "1";
    window.dispatchEvent(new Event("app:hydrated"));
  }, []);

  return null;
}
