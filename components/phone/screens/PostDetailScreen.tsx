"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Icon } from "../../Icon";
import { palette } from "../tokens";
import { Pressable } from "../ui";
import { EventsScreen, POSTS } from "./EventsScreen";

const SHEET_EASE = [0.32, 0.72, 0, 1] as const;

/** The volunteer post opened as a sheet over the bulletin board, with a working sign-up. */
export function PostDetailScreen() {
  const post = POSTS.find((p) => p.kind === "volunteer")!;
  const needed = post.volunteers!.needed;
  const [checked, setChecked] = useState(false);
  const [sent, setSent] = useState(false);
  const count = post.volunteers!.count + (sent ? 1 : 0);

  return (
    <>
      <div className="absolute inset-0" aria-hidden {...({ inert: true } as object)}>
        <EventsScreen />
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }} className="absolute inset-0 z-30 bg-[rgba(3,7,18,0.55)]" />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: SHEET_EASE }}
        className="absolute inset-x-0 bottom-0 z-30 flex max-h-[761px] flex-col overflow-hidden rounded-t-[28px] bg-white dark:bg-[#0B0F17]"
      >
        <div className="px-6 pb-3 pt-3">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-300 dark:bg-white/20" />
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <p className="mb-1 font-sans-semibold text-[11px] uppercase tracking-[1.6px] text-red-600 dark:text-red-400">Volunteer</p>
              <h3 className="font-display text-[28px] leading-[32px] text-gray-900 dark:text-white">{post.title}</h3>
            </div>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200">
              <Icon name="close" size={18} />
            </span>
          </div>
        </div>

        <div data-scroll className="no-scrollbar overflow-y-auto px-6 pb-[50px] pt-1">
          <p className="font-sans text-[16px] leading-[25px] text-gray-700 dark:text-gray-200">{post.description}</p>
          <div className="mt-5 overflow-hidden rounded-2xl bg-gray-50 dark:bg-white/[0.04]">
            {[
              { icon: "calendar-outline" as const, text: "Sunday, August 30, 2026" },
              { icon: "time-outline" as const, text: post.time! },
              { icon: "location-outline" as const, text: post.location! },
            ].map((row, i) => (
              <div key={row.icon} className={`flex items-center px-4 py-3.5 ${i > 0 ? "border-t border-gray-100 dark:border-white/[0.06]" : ""}`}>
                <Icon name={row.icon} size={17} className="text-gray-500 dark:text-gray-400" />
                <span className="ml-3 font-sans-medium text-[14px] text-gray-800 dark:text-gray-200">{row.text}</span>
              </div>
            ))}
          </div>
          <p className="mb-2 mt-4 font-sans text-xs text-gray-400 dark:text-gray-500">Posted August 27, 2026 at 4:13 PM</p>

          <div className="mt-2 border-t border-gray-100 pt-4 dark:border-white/[0.06]">
            <div
              data-spot={sent ? "volunteer-toggle" : "volunteer-progress"}
              className="mb-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.08] p-4"
            >
              <div className="flex items-end justify-between">
                <div>
                  <p className="font-sans-semibold text-xs text-emerald-700 dark:text-emerald-400">Volunteers</p>
                  <p className="font-display text-[30px] leading-[34px] text-gray-900 dark:text-white">
                    <motion.span key={count} initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="inline-block">
                      {count}
                    </motion.span>
                    <span className="text-[20px] text-gray-400"> of {needed}</span>
                  </p>
                </div>
                <p className="font-sans-bold text-sm text-emerald-700 dark:text-emerald-400">{Math.round((count / needed) * 100)}%</p>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-500/15">
                <motion.div
                  className="h-2 origin-left rounded-full bg-emerald-500"
                  initial={false}
                  animate={{ scaleX: count / needed }}
                  transition={{ type: "spring", damping: 26, stiffness: 170 }}
                />
              </div>
              <p className="mt-2.5 font-sans text-xs text-gray-600 dark:text-gray-300">{needed - count} more volunteers needed</p>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              {sent ? (
                <motion.div
                  key="sent"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", damping: 26, stiffness: 170 }}
                  className="flex items-center rounded-2xl bg-emerald-500/[0.08] p-4"
                >
                  <Icon name="checkmark-circle" size={20} color={palette.green} />
                  <p className="ml-2.5 flex-1 font-sans-semibold text-sm text-emerald-700 dark:text-emerald-400">You volunteered for this event</p>
                  <button type="button" onClick={() => { setSent(false); setChecked(false); }} className="font-sans-semibold text-xs text-gray-500 underline-offset-2 hover:underline dark:text-gray-400">
                    Undo
                  </button>
                </motion.div>
              ) : (
                <motion.div key="form" exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
                  <Pressable
                    data-spot="volunteer-toggle"
                    scaleTo={0.98}
                    onClick={() => setChecked((c) => !c)}
                    role="checkbox"
                    aria-checked={checked}
                    className={`mb-4 flex w-full items-center rounded-2xl border-2 p-4 transition-colors duration-200 ${
                      checked ? "border-emerald-500 bg-emerald-500/10" : "border-transparent bg-gray-100 dark:bg-white/5"
                    }`}
                  >
                    <motion.span key={checked ? "on" : "off"} initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 12, stiffness: 320 }}>
                      <Icon name={checked ? "checkmark-circle" : "hand-left-outline"} size={24} color={checked ? palette.green : palette.gray400} />
                    </motion.span>
                    <span className="ml-3 flex-1">
                      <span className="block font-sans-bold text-[15px] text-gray-900 dark:text-white">I&apos;ll volunteer</span>
                      <span className="mt-0.5 block font-sans text-xs text-gray-500 dark:text-gray-400">Let the parish know they can count on you</span>
                    </span>
                  </Pressable>
                  <p className="mb-2 font-sans-semibold text-[13px] text-gray-700 dark:text-gray-300">Notes (optional)</p>
                  <div className="mb-4 h-[72px] rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 font-sans text-[15px] text-gray-400 dark:border-white/10 dark:bg-white/[0.04] dark:text-gray-500">
                    Any additional notes...
                  </div>
                  <Pressable
                    scaleTo={0.97}
                    disabled={!checked}
                    onClick={() => setSent(true)}
                    className={`flex h-[52px] w-full items-center justify-center rounded-full font-sans-bold text-[15px] text-white transition-opacity duration-200 ${
                      checked ? "bg-red-600" : "bg-red-600 opacity-40"
                    }`}
                  >
                    <Icon name="send" size={16} />
                    <span className="ml-2">Send response</span>
                  </Pressable>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </>
  );
}
