"use client";

import { AnimatePresence, motion } from "motion/react";
import { Icon } from "./Icon";
import { useTheme } from "./ThemeProvider";

export default function ThemeToggle() {
  const { theme, toggleTheme, ready } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={ready ? `Switch to ${theme === "dark" ? "light" : "dark"} mode` : "Toggle color theme"}
      className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full text-zinc-600 transition-colors hover:bg-zinc-900/[0.05] hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.06] dark:hover:text-white"
    >
      {ready && (
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={theme}
            initial={{ y: 14, rotate: -40, opacity: 0 }}
            animate={{ y: 0, rotate: 0, opacity: 1 }}
            exit={{ y: -14, rotate: 40, opacity: 0 }}
            transition={{ type: "spring", damping: 18, stiffness: 260 }}
            className="flex"
          >
            <Icon name={theme === "dark" ? "sunny" : "moon"} size={17} />
          </motion.span>
        </AnimatePresence>
      )}
    </button>
  );
}
