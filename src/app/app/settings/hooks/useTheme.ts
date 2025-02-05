"use client";

import * as React from "react";
import { useLocalStorageString } from "@/hooks";

export function useTheme() {
  const [theme, setTheme] = useLocalStorageString("theme", "system");

  const applyTheme = React.useCallback((newTheme: string) => {
    const root = document.documentElement;
    if (newTheme === "dark") {
      root.classList.add("dark");
    } else if (newTheme === "light") {
      root.classList.remove("dark");
    } else {
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  }, []);

  // Apply theme on mount and when theme changes
  React.useEffect(() => {
    applyTheme(theme);
  }, [theme, applyTheme]);

  const handleThemeChange = React.useCallback((newTheme: string) => {
    setTheme(newTheme);
  }, [setTheme]);

  return { theme, handleThemeChange };
}
