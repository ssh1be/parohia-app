"use client";

import { motion, useReducedMotion } from "motion/react";
import { Icon } from "../Icon";
import { PhoneFrame } from "../phone/PhoneFrame";
import { HomeScreen } from "../phone/screens/HomeScreen";

const EASE = [0.16, 1, 0.3, 1] as const;

export function HeroPhone() {
  const reduce = useReducedMotion();

  return (
    <div className="relative flex justify-center lg:justify-end">
      {/* Glow blobs stay desktop-only — large blurs go blank mid-scroll on Safari mobile. */}
      <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden>
        <motion.div
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, ease: EASE, delay: 0.2 }}
          className="absolute left-1/2 top-[46%] h-[460px] w-[460px] -translate-x-1/2 -translate-y-1/2"
        >
          <div className="hero-red-pulse h-full w-full rounded-full bg-brand-red/[0.14] blur-[100px] dark:bg-brand-red/25" />
        </motion.div>
        <motion.div
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.4, ease: EASE, delay: 0.45 }}
          className="absolute left-[42%] top-[58%] h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2"
        >
          <div className="hero-amber-pulse h-full w-full rounded-full bg-amber-200/30 blur-[80px] dark:bg-amber-500/10" />
        </motion.div>
      </div>

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 36 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE, delay: reduce ? 0 : 0.05 }}
        className="pointer-events-none relative"
      >
        <PhoneFrame label="Parohia home screen preview" className="relative [--s:0.72] sm:[--s:0.78] lg:[--s:0.82]">
          <HomeScreen scrollable={false} />
        </PhoneFrame>

        {/* Mount `animate` (not whileInView): Safari on tall phones defers intersection until scroll settles. */}
        <motion.div
          aria-hidden
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE, delay: reduce ? 0 : 0.2 }}
          className="app-screen glass absolute -left-6 top-[22%] w-[280px] transform-gpu rounded-[22px] border border-white/80 p-3.5 shadow-[0_28px_56px_-18px_rgba(9,9,11,0.4)] sm:-left-24 dark:border-white/[0.14] dark:shadow-[0_28px_56px_-18px_rgba(0,0,0,0.65)]"
        >
          <div className="flex items-start gap-3">
            <img src="/App_store_1024_1x.png" alt="" className="h-9 w-9 shrink-0 rounded-[10px] shadow-sm shadow-brand-red/20" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-3">
                <p className="font-sans-semibold text-[13px] text-zinc-900 dark:text-white">Great Vespers</p>
                <p className="font-sans text-[11px] text-zinc-500 dark:text-zinc-400">now</p>
              </div>
              <p className="mt-0.5 font-sans text-[13px] leading-[17px] text-zinc-600 dark:text-zinc-300">Starts in 30 minutes at St. John&apos;s.</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          aria-hidden
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: EASE, delay: reduce ? 0 : 0.32 }}
          className="app-screen glass absolute bottom-[18%] -right-8 flex w-max transform-gpu items-center gap-2.5 whitespace-nowrap rounded-full border border-white/80 py-2 pl-2 pr-4 shadow-[0_28px_56px_-18px_rgba(9,9,11,0.4)] sm:-right-16 dark:border-white/[0.14] dark:shadow-[0_28px_56px_-18px_rgba(0,0,0,0.65)]"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15">
            <Icon name="checkmark-circle" size={17} color="#10B981" />
          </span>
          <span className="font-sans-semibold text-[13px] text-zinc-900 dark:text-white">You&apos;re volunteering Sunday</span>
        </motion.div>
      </motion.div>
    </div>
  );
}
