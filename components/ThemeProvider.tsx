"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";

function isFeaturesPath(pathname: string | null) {
  return pathname === "/features" || pathname?.startsWith("/features/") === true;
}

type Theme = "light" | "dark";

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
  ready: boolean;
}>({
  theme: "light",
  toggleTheme: () => {},
  ready: false,
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const forceDark = isFeaturesPath(pathname);
  const [theme, setTheme] = useState<Theme>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") {
      setTheme(stored);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;

    const root = document.documentElement;
    if (forceDark || theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    if (!forceDark) {
      localStorage.setItem("theme", theme);
    }
  }, [theme, forceDark, ready]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  return (
    <ThemeContext.Provider
      value={{ theme: forceDark ? "dark" : theme, toggleTheme, ready }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
