"use client";

import { useEffect } from "react";

/** Apply class names to document.body (Hugo uses body.is-home etc.) */
export function BodyClass({ className }: { className?: string }) {
  useEffect(() => {
    const prev = document.body.className;
    document.body.className = className?.trim() ?? "";
    return () => {
      document.body.className = prev;
    };
  }, [className]);
  return null;
}
