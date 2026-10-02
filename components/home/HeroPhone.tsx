"use client";

import { motion, useReducedMotion } from "motion/react";
import { Icon } from "../Icon";
import { PhoneFrame } from "../phone/PhoneFrame";
import { HomeScreen } from "../phone/screens/HomeScreen";

const EASE = [0.16, 1, 0.3, 1] as const;

export function HeroPhone() {
  const reduce = useReducedMotion();

  return (
    <div className="relative flex justify-center">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-red/10 blur-[110px] dark:bg-brand-red/20" aria-hidden />

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 60 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.1, ease: EASE, delay: 0.15 }}
        className="relative"
      >
        <PhoneFrame interactive label="Parohia home screen preview" className="[--s:0.72] sm:[--s:0.78] lg:[--s:0.8]">
          <HomeScreen />
        </PhoneFrame>

        <motion.div
          aria-hidden
          initial={reduce ? false : { opacity: 0, y: 24, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", damping: 22, stiffness: 160, delay: 1.1 }}
          className="app-screen glass absolute -left-6 top-[22%] w-[280px] rounded-[22px] border border-white/70 p-3.5 shadow-[0_24px_48px_-16px_rgba(9,9,11,0.35)] sm:-left-24 dark:border-white/[0.12]"
        >
          <div className="flex items-start gap-3">
            <img src="/App_store_1024_1x.png" alt="" className="h-9 w-9 shrink-0 rounded-[10px]" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <p className="font-sans-semibold text-[13px] text-zinc-900 dark:text-white">Great Vespers</p>
                <p className="font-sans text-[11px] text-zinc-500 dark:text-zinc-400">now</p>
              </div>
              <p className="mt-0.5 font-sans text-[13px] leading-[17px] text-zinc-600 dark:text-zinc-300">Starts in 30 minutes at St. John&apos;s.</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          aria-hidden
          initial={reduce ? false : { opacity: 0, y: 24, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", damping: 22, stiffness: 160, delay: 1.45 }}
          className="app-screen glass absolute bottom-[22%] left-0 right-0 mx-auto flex w-max items-center gap-2.5 rounded-full border border-white/70 py-2 pl-2 pr-4 shadow-[0_24px_48px_-16px_rgba(9,9,11,0.35)] sm:left-auto sm:right-[-4rem] sm:bottom-[18%] dark:border-white/[0.12]"
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
