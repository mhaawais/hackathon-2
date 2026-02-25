"use client";

import { useEffect } from "react";
import { initTheme } from "@/lib/theme";

/**
 * Runs theme initialization on the client before first paint.
 * Placed in the root layout to prevent flash of unstyled content.
 */
export function ThemeInitializer() {
  useEffect(() => {
    initTheme();
  }, []);

  return null;
}
