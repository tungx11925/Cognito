"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  setTheme: () => {},
  isDark: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [isDark, setIsDark] = useState(false);

  const applyTheme = (currentTheme: Theme) => {
    if (typeof window === "undefined") return;
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldBeDark = currentTheme === "dark" || (currentTheme === "system" && systemDark);
    setIsDark(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  useEffect(() => {
    const saved = (localStorage.getItem("app-theme") as Theme) || "light";
    setThemeState(saved);
    applyTheme(saved);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = () => {
      const cur = (localStorage.getItem("app-theme") as Theme) || "light";
      if (cur === "system") {
        applyTheme("system");
      }
    };
    mediaQuery.addEventListener("change", onSystemChange);

    const onStorage = (e: StorageEvent) => {
      if (e.key === "app-theme" && e.newValue) {
        const newTheme = e.newValue as Theme;
        setThemeState(newTheme);
        applyTheme(newTheme);
      }
    };
    window.addEventListener("storage", onStorage);

    const onCustomThemeChange = (e: any) => {
      if (e.detail?.theme) {
        setThemeState(e.detail.theme);
        applyTheme(e.detail.theme);
      }
    };
    window.addEventListener("cognito:theme_change", onCustomThemeChange);

    return () => {
      mediaQuery.removeEventListener("change", onSystemChange);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("cognito:theme_change", onCustomThemeChange);
    };
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem("app-theme", newTheme);
    applyTheme(newTheme);
    window.dispatchEvent(new CustomEvent("cognito:theme_change", { detail: { theme: newTheme } }));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
