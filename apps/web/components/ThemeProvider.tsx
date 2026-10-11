"use client";

import { MotionConfig } from "motion/react";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark";
export type ThemePreference = Theme | "system";

const ThemeContext = createContext<{
  theme: Theme;
  preference: ThemePreference;
  toggleTheme: () => void;
  setPreference: (preference: ThemePreference) => void;
  ready: boolean;
}>({
  theme: "light",
  preference: "system",
  toggleTheme: () => {},
  setPreference: () => {},
  ready: false,
});

export const useTheme = () => useContext(ThemeContext);

const darkQuery = () => window.matchMedia("(prefers-color-scheme: dark)");

const readPreference = (): ThemePreference => {
  try {
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
  } catch {
    // Storage unavailable
  }
  return "system";
};

const resolve = (preference: ThemePreference): Theme =>
  preference === "system" ? (darkQuery().matches ? "dark" : "light") : preference;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>("system");
  const [theme, setTheme] = useState<Theme>("light");
  const [ready, setReady] = useState(false);

  const apply = useCallback((next: ThemePreference) => {
    const resolved = resolve(next);
    document.documentElement.classList.toggle("dark", resolved === "dark");
    setPreferenceState(next);
    setTheme(resolved);
  }, []);

  useEffect(() => {
    apply(readPreference());
    setReady(true);
  }, [apply]);

  useEffect(() => {
    if (preference !== "system") return;
    const query = darkQuery();
    const onChange = () => apply("system");
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [preference, apply]);

  const setPreference = useCallback(
    (next: ThemePreference) => {
      try {
        localStorage.setItem("theme", next);
      } catch {
        // Storage unavailable
      }
      apply(next);
    },
    [apply]
  );

  const toggleTheme = useCallback(() => {
    setPreference(theme === "dark" ? "light" : "dark");
  }, [theme, setPreference]);

  return (
    <ThemeContext.Provider value={{ theme, preference, toggleTheme, setPreference, ready }}>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </ThemeContext.Provider>
  );
}
