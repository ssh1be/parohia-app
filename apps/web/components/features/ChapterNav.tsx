"use client";

import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { Icon } from "../Icon";
import { CHAPTERS } from "./chapters";

const EASE = [0.16, 1, 0.3, 1] as const;

/** Jumps to a chapter's pinned track at the point where its phone has fully eased in. */
function scrollToChapter(id: string) {
  const track = document.querySelector<HTMLElement>(`[data-track="${id}"]`);
  if (!track) return;
  const top = track.getBoundingClientRect().top + window.scrollY;
  const focus = Number(track.dataset.focus ?? 0);
  window.scrollTo({ top: top + (track.offsetHeight - window.innerHeight) * focus, behavior: "smooth" });
}

/** The chapter index beside the page intro. */
export function ChapterIndex() {
  const reduce = useReducedMotion();
  return (
    <nav aria-label="Feature sections">
      <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
        {CHAPTERS.map((chapter, i) => (
          <motion.li
            key={chapter.id}
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: EASE, delay: 0.15 + i * 0.06 }}
          >
            <a
              href={`#${chapter.id}`}
              onClick={(e) => {
                if (!document.querySelector(`[data-track="${chapter.id}"][data-focus]`)) return;
                e.preventDefault();
                scrollToChapter(chapter.id);
              }}
              className="group flex h-full items-center gap-3.5 rounded-[24px] border border-zinc-200/80 bg-white/60 p-3 pr-4 text-left outline-none transition-[transform,border-color,background-color] duration-300 hover:-translate-y-0.5 hover:border-zinc-300 hover:bg-white focus-visible:ring-2 focus-visible:ring-brand-red/60 active:scale-[0.98] dark:border-white/[0.08] dark:bg-white/[0.03] dark:hover:border-white/[0.16] dark:hover:bg-white/[0.06]"
            >
              <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[16px] bg-zinc-100 text-zinc-600 dark:bg-white/[0.06] dark:text-zinc-300">
                <span className="absolute inset-0 bg-brand-gradient opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <span className="relative flex items-center justify-center transition-colors duration-300 group-hover:text-white">
                  <Icon name={chapter.icon} size={19} />
                </span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-semibold leading-tight text-zinc-900 dark:text-white">{chapter.label}</span>
                <span className="mt-1 block text-[13px] leading-snug text-zinc-500 dark:text-zinc-400">{chapter.summary}</span>
              </span>
              <span className="hidden text-zinc-300 transition-[transform,color] duration-300 group-hover:translate-x-0.5 group-hover:text-brand-red sm:block dark:text-zinc-600">
                <Icon name="arrow-forward" size={16} />
              </span>
            </a>
          </motion.li>
        ))}
      </ul>
    </nav>
  );
}

/** Floats beside the pinned tours, tracking the current chapter and hiding the site header while it's shown. */
export function FloatingChapterNav() {
  const [current, setCurrent] = useState<string | null>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const tracks = CHAPTERS.map((c) => document.querySelector<HTMLElement>(`[data-track="${c.id}"]`)).filter((t): t is HTMLElement => !!t);
      if (!tracks.length) return;
      const vh = window.innerHeight;
      const inside = tracks[0].getBoundingClientRect().top < vh * 0.4 && tracks[tracks.length - 1].getBoundingClientRect().bottom > vh * 0.6;
      const reached = tracks.filter((t) => t.getBoundingClientRect().top < vh * 0.4);
      setCurrent(inside ? (reached[reached.length - 1]?.dataset.track ?? null) : null);
      document.documentElement.dataset.immersive = inside ? "true" : "false";
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      delete document.documentElement.dataset.immersive;
    };
  }, []);

  const visible = current !== null;

  return (
    <motion.nav
      aria-label="Feature sections"
      initial={false}
      animate={{ opacity: visible ? 1 : 0, x: visible ? 0 : -28 }}
      transition={{ duration: 0.55, ease: EASE }}
      style={{ y: "-50%", pointerEvents: visible ? "auto" : "none" }}
      className="fixed left-6 top-1/2 z-40"
      {...((visible ? {} : { inert: true }) as object)}
    >
      <ul className="glass flex w-[224px] flex-col gap-1 rounded-[28px] border border-white/70 p-2 shadow-[0_18px_40px_-20px_rgba(9,9,11,0.28)] dark:border-white/[0.12] dark:shadow-[0_18px_40px_-20px_rgba(0,0,0,0.7)]">
        {CHAPTERS.map((chapter) => {
          const active = chapter.id === current;
          return (
            <li key={chapter.id}>
              <button
                type="button"
                onClick={() => scrollToChapter(chapter.id)}
                aria-current={active ? "true" : undefined}
                className="relative flex w-full items-center gap-3 rounded-[20px] p-1.5 pr-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-brand-red/60"
              >
                {active && (
                  <motion.span
                    layoutId="chapter-nav-active"
                    transition={{ type: "spring", damping: 28, stiffness: 300 }}
                    className="absolute inset-0 rounded-[20px] bg-white shadow-[0_6px_16px_-10px_rgba(9,9,11,0.3)] dark:bg-white/[0.1] dark:shadow-none"
                  />
                )}
                <span
                  className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-[14px] transition-colors duration-300 ${
                    active ? "bg-brand-gradient text-white" : "bg-zinc-100/80 text-zinc-500 dark:bg-white/[0.06] dark:text-zinc-400"
                  }`}
                >
                  <Icon name={chapter.icon} size={17} />
                </span>
                <span
                  className={`relative text-[14px] font-medium leading-tight transition-colors duration-300 ${
                    active ? "text-zinc-900 dark:text-white" : "text-zinc-500 dark:text-zinc-400"
                  }`}
                >
                  {chapter.label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </motion.nav>
  );
}
