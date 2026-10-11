"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Icon } from "./Icon";

const LINKS = [
  { href: "/features", label: "Features" },
  { href: "/#screenshots", label: "Preview" },
  { href: "/about", label: "About" },
  { href: "mailto:support@parohia.app", label: "Contact" },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const sheet = (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] md:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <motion.div
            className="absolute inset-0 bg-zinc-950/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
            className="absolute inset-x-0 bottom-0 rounded-t-[28px] bg-white px-6 pb-10 pt-3 dark:bg-zinc-950"
          >
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-zinc-300 dark:bg-white/20" />
            <div className="flex items-center justify-between">
              <span className="font-display text-[30px]">Menu</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 dark:bg-white/10 dark:text-zinc-200"
              >
                <Icon name="close" size={18} />
              </button>
            </div>
            <nav className="mt-4 flex flex-col">
              {LINKS.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", damping: 26, stiffness: 170, delay: 0.08 + i * 0.04 }}
                  className="flex items-center justify-between border-b border-zinc-100 py-4 text-lg font-medium text-zinc-800 dark:border-white/[0.06] dark:text-zinc-200"
                >
                  {link.label}
                  <Icon name="chevron-forward" size={16} className="text-zinc-400" />
                </motion.a>
              ))}
            </nav>
            <a
              href="/notify"
              onClick={() => setOpen(false)}
              className="mt-8 flex h-12 items-center justify-center rounded-full bg-brand-gradient text-sm font-semibold text-white"
            >
              Join the waitlist
            </a>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center rounded-full text-zinc-700 transition-colors hover:bg-zinc-900/[0.05] md:hidden dark:text-zinc-200 dark:hover:bg-white/[0.06]"
      >
        <Icon name="menu" size={20} />
      </button>
      {mounted && createPortal(sheet, document.body)}
    </>
  );
}
