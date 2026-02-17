"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";

export default function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const overlay = (
    <div
      className={`fixed inset-0 z-[100] md:hidden transition-opacity duration-300 ${
        isOpen
          ? "opacity-100 pointer-events-auto"
          : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70"
        onClick={() => setIsOpen(false)}
      />

      {/* Slide-in panel */}
      <div
        className={`absolute right-0 top-0 h-full w-[280px] bg-zinc-950 border-l border-white/10 p-6 shadow-2xl shadow-black transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between mb-8">
          <span className="text-lg font-semibold">Menu</span>
          <button
            onClick={() => setIsOpen(false)}
            className="inline-flex items-center justify-center h-10 w-10 rounded-lg border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-colors"
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex flex-col gap-1">
          {[
              { href: "/#features", label: "Features" },
              { href: "/#screenshots", label: "Screenshots" },
              { href: "/about", label: "About" },
              { href: "mailto:support@parohia.app", label: "Contact" },
          ].map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="flex items-center rounded-lg px-4 py-3 text-zinc-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="mt-8 flex flex-col gap-3">
          <a
            href="/features"
            onClick={() => setIsOpen(false)}
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors"
          >
            Learn more
          </a>
          <a
            href="/notify"
            onClick={() => setIsOpen(false)}
            className="inline-flex items-center justify-center rounded-xl bg-brand-gradient px-4 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          >
            Join newsletter
          </a>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex md:hidden items-center justify-center h-10 w-10 rounded-lg border border-white/10 bg-white/5 text-white hover:bg-white/10 transition-colors"
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {mounted && createPortal(overlay, document.body)}
    </>
  );
}
