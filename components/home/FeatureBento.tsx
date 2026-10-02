"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useId, useState, type ReactNode } from "react";
import { Icon } from "../Icon";
import { AUGUST_30, SEPTEMBER_10, type LiturgicalDay } from "../phone/data";
import { PostCard, POSTS } from "../phone/screens/EventsScreen";
import { palette, snappySpring } from "../phone/tokens";
import { FastingBadge, Pressable, Switch } from "../phone/ui";
import { Reveal } from "../Reveal";

const SEPTEMBER_14: LiturgicalDay = {
  ...SEPTEMBER_10,
  day: 14,
  weekday: "Sunday",
  title: "The Elevation of the Precious and Life-Giving Cross",
  saints: ["Repose of St. John Chrysostom, Archbishop of Constantinople"],
  fasting: "Fast Day",
  fastingKind: "strict",
};

const DAYS = [
  { label: "Sat 30", day: AUGUST_30 },
  { label: "Wed 10", day: SEPTEMBER_10 },
  { label: "Sun 14", day: SEPTEMBER_14 },
];

const EASE = [0.16, 1, 0.3, 1] as const;

/** Raised card surface so app cards read clearly against the tile background. */
const SURFACE =
  "border-zinc-200/80 bg-white shadow-[0_1px_2px_rgba(9,9,11,0.04),0_12px_28px_-16px_rgba(9,9,11,0.18)] dark:border-white/10 dark:bg-white/[0.06] dark:shadow-none";

function Tile({ title, body, children, className = "", delay = 0 }: { title: string; body: string; children: ReactNode; className?: string; delay?: number }) {
  return (
    <Reveal delay={delay} className={className}>
      <div className="flex h-full flex-col overflow-hidden rounded-[28px] border border-zinc-200 bg-zinc-100/60 dark:border-white/[0.07] dark:bg-white/[0.025]">
        <div className="app-screen relative flex-1 p-5 sm:p-6">{children}</div>
        <div className="px-6 pb-7 pt-1 sm:px-7">
          <h3 className="font-display text-[28px] leading-[1.12] text-zinc-900 dark:text-white">{title}</h3>
          <p className="mt-2 max-w-[48ch] text-[15px] leading-relaxed text-zinc-600 dark:text-zinc-400">{body}</p>
        </div>
      </div>
    </Reveal>
  );
}

function TodayTile() {
  const [index, setIndex] = useState(0);
  const id = useId();
  const day = DAYS[index].day;

  return (
    <div>
      <div className="flex gap-1.5" role="tablist" aria-label="Sample days">
        {DAYS.map((d, i) => (
          <button
            key={d.label}
            type="button"
            role="tab"
            aria-selected={i === index}
            onClick={() => setIndex(i)}
            className="relative rounded-full px-3.5 py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-red-500/60"
          >
            {i === index && <motion.span layoutId={`day-${id}`} transition={snappySpring} className="absolute inset-0 rounded-full bg-red-600" />}
            <span className={`relative font-sans-semibold text-[13px] ${i === index ? "text-white" : "text-gray-500 dark:text-gray-400"}`}>{d.label}</span>
          </button>
        ))}
      </div>
      <div className="mt-4 overflow-hidden rounded-[28px] border border-red-100 shadow-[0_1px_2px_rgba(9,9,11,0.04),0_12px_28px_-16px_rgba(141,3,0,0.22)] dark:border-red-500/15 dark:shadow-none">
        <div className="relative min-h-[236px] bg-gradient-to-br from-white to-[#FEF2F2] p-[22px] dark:from-[#1C0A0B] dark:to-[#0A0A0D]">
          <p className="font-sans-bold text-[11px] uppercase tracking-[1.6px] text-red-600 dark:text-red-400">Today in the Church</p>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              <p className="mt-3 font-display text-[30px] leading-[34px] text-gray-900 dark:text-white">{day.title}</p>
              <p className="mt-3 font-display-italic text-[18px] leading-[24px] text-gray-600 dark:text-gray-300">{day.saints.join(". ")}</p>
              <FastingBadge text={day.fasting} kind={day.fastingKind} className="mt-5" />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

const PASSAGES = [
  {
    kind: "Epistle",
    display: "1 Corinthians 1:26-29",
    text: "For ye see your calling, brethren, how that not many wise men after the flesh, not many mighty, not many noble, are called.",
  },
  {
    kind: "Gospel",
    display: "Matthew 20:29-34",
    text: "And as they departed from Jericho, a great multitude followed him. And, behold, two blind men sitting by the way side...",
  },
];

function ReadingsTile() {
  const [open, setOpen] = useState<number | null>(1);
  return (
    <div className="flex flex-col gap-3">
      {PASSAGES.map((p, i) => {
        const gospel = p.kind === "Gospel";
        const expanded = open === i;
        return (
          <Pressable
            key={p.display}
            onClick={() => setOpen(expanded ? null : i)}
            aria-expanded={expanded}
            className={`rounded-3xl border p-5 ${gospel ? "border-red-600 bg-red-600" : `${SURFACE}`}`}
          >
            <span className="flex items-center justify-between">
              <span className={`font-sans-bold text-[11px] uppercase tracking-[1.4px] ${gospel ? "text-white/80" : "text-red-600 dark:text-red-400"}`}>{p.kind}</span>
              <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={snappySpring} className="flex">
                <Icon name="chevron-down" size={15} color={gospel ? "rgba(255,255,255,0.85)" : palette.gray400} />
              </motion.span>
            </span>
            <span className={`mt-2 block font-display text-[24px] leading-[27px] ${gospel ? "text-white" : "text-gray-900 dark:text-white"}`}>{p.display}</span>
            <AnimatePresence initial={false}>
              {expanded && (
                <motion.span
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.35, ease: EASE }}
                  className="block overflow-hidden"
                >
                  <span className={`block pt-3 font-serif text-[16px] leading-[24px] ${gospel ? "text-white/90" : "text-gray-600 dark:text-gray-300"}`}>{p.text}</span>
                </motion.span>
              )}
            </AnimatePresence>
          </Pressable>
        );
      })}
    </div>
  );
}

const LEADS = ["15 min", "30 min", "1 hr", "2 hr"];
const LEAD_TEXT: Record<string, string> = { "15 min": "15 minutes", "30 min": "30 minutes", "1 hr": "1 hour", "2 hr": "2 hours" };

/** Trails `value` by `ms`, so notifications land a beat after the control that triggered them. */
function useDelayed<T>(value: T, ms: number) {
  const [delayed, setDelayed] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDelayed(value), ms);
    return () => window.clearTimeout(timer);
  }, [value, ms]);
  return delayed;
}

function Notification({ title, body }: { title: string; body: string }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -14, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.18 } }}
      transition={{ type: "spring", damping: 22, stiffness: 220 }}
      className="glass flex items-start gap-3 rounded-[20px] border border-gray-200/70 p-3 shadow-[0_12px_28px_-14px_rgba(9,9,11,0.3)] dark:border-white/10"
    >
      <img src="/App_store_1024_1x.png" alt="" className="h-9 w-9 shrink-0 rounded-[10px]" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate font-sans-semibold text-[13px] text-gray-900 dark:text-white">{title}</p>
          <p className="shrink-0 font-sans text-[11px] text-gray-400">now</p>
        </div>
        <p className="mt-0.5 font-sans text-[13px] text-gray-600 dark:text-gray-300">{body}</p>
      </div>
    </motion.div>
  );
}

function RemindersTile({
  on,
  onToggle,
  lead,
  onLead,
  booked,
}: {
  on: boolean;
  onToggle: (on: boolean) => void;
  lead: string;
  onLead: (lead: string) => void;
  booked: string | null;
}) {
  const id = useId();
  const notify = useDelayed(on, on ? 450 : 150);
  const delayedSlot = useDelayed(booked, 650);
  // A stale slot's reminder clears the moment the booking changes; only the new one waits.
  const notifiedSlot = delayedSlot === booked ? delayedSlot : null;
  const notifiedLead = useDelayed(lead, 300);

  return (
    <div>
      <div className={`rounded-3xl border p-4 ${SURFACE}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-sans-semibold text-[15px] text-gray-900 dark:text-white">Parish events</p>
            <p className="mt-0.5 font-sans text-[12.5px] text-gray-500 dark:text-gray-400">Services, gatherings, and confession</p>
          </div>
          <Switch on={on} onChange={onToggle} label="Parish event reminders" />
        </div>
        <motion.div animate={{ opacity: on ? 1 : 0.4 }} className="mt-4 grid grid-cols-4 gap-1.5 rounded-2xl bg-gray-100 p-1 dark:bg-white/[0.06]">
          {LEADS.map((l) => (
            <button
              key={l}
              type="button"
              disabled={!on}
              onClick={() => onLead(l)}
              aria-pressed={lead === l}
              className="relative h-9 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-red-500/60"
            >
              {lead === l && <motion.span layoutId={`lead-${id}`} transition={snappySpring} className="absolute inset-0 rounded-xl bg-white shadow-sm dark:bg-gray-800" />}
              <span className={`relative font-sans-semibold text-[12.5px] ${lead === l ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}`}>{l}</span>
            </button>
          ))}
        </motion.div>
      </div>

      <div className="mt-3 flex min-h-[76px] flex-col gap-2" aria-live="polite">
        <AnimatePresence initial={false}>
          {notify && notifiedSlot && (
            <Notification
              key={`confession-${notifiedSlot}-${notifiedLead}`}
              title="Confession with Fr. Gabriel Agoston"
              body={`Starts in ${LEAD_TEXT[notifiedLead]}, at ${notifiedSlot} AM`}
            />
          )}
          {notify && (
            <Notification key={`paraklesis-${notifiedLead}`} title="Paraklesis to St. John the Baptist" body={`Starts in ${LEAD_TEXT[notifiedLead]}`} />
          )}
          {!notify && (
            <motion.p key="off" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-6 text-center font-sans text-[13px] text-gray-500">
              Reminders paused
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const SLOTS = ["9:00", "9:15", "9:30", "9:45", "10:00", "10:15", "10:30", "10:45", "11:00"];
const TAKEN = new Set(["9:15", "10:00", "10:45"]);

function ParishLifeTile({ slot, onSlot, remindersOn }: { slot: string | null; onSlot: (slot: string | null) => void; remindersOn: boolean }) {
  const volunteer = POSTS.find((p) => p.kind === "volunteer")!;

  return (
    <div className="grid gap-4 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <PostCard post={volunteer} className={SURFACE} />
      <div className={`rounded-3xl border p-4 ${SURFACE}`}>
        <div className="flex items-center justify-between">
          <p className="font-sans-semibold text-[15px] text-gray-900 dark:text-white">Confession</p>
          <p className="font-sans text-[12.5px] text-gray-500 dark:text-gray-400">Sat, Aug 30</p>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {SLOTS.map((s) => {
            const taken = TAKEN.has(s);
            const mine = slot === s;
            return (
              <Pressable
                key={s}
                disabled={taken}
                onClick={() => onSlot(mine ? null : s)}
                aria-pressed={mine}
                className={`flex h-11 items-center justify-center rounded-xl border font-sans-semibold text-[13px] transition-colors duration-200 ${
                  taken
                    ? "cursor-not-allowed border-transparent bg-gray-100 text-gray-400 line-through dark:bg-white/[0.04] dark:text-gray-600"
                    : mine
                      ? "border-red-600 bg-red-600 text-white"
                      : "border-gray-200 text-gray-800 dark:border-white/10 dark:text-gray-200"
                }`}
              >
                {s}
              </Pressable>
            );
          })}
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={slot ?? "none"}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className="mt-3 flex items-center font-sans text-[12.5px] text-gray-500 dark:text-gray-400"
          >
            {slot ? (
              <>
                <Icon name={remindersOn ? "notifications" : "checkmark-circle"} size={14} color={palette.green} />
                <span className="ml-1.5">
                  Booked {slot} AM{remindersOn ? ", reminder set" : " with Fr. Gabriel"}
                </span>
              </>
            ) : (
              "Tap an open time to book"
            )}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

export function FeatureBento() {
  const [remindersOn, setRemindersOn] = useState(true);
  const [lead, setLead] = useState("30 min");
  const [slot, setSlot] = useState<string | null>(null);

  return (
    <div className="grid gap-4 md:grid-cols-5">
      <Tile
        className="md:col-span-3"
        title="The Orthodox calendar, every day"
        body="Feasts, fasts, and the saints of the day, beautifully presented. Tap a day to see it change."
      >
        <TodayTile />
      </Tile>
      <Tile className="md:col-span-2" delay={0.08} title="Scripture, in the app" body="The day's Epistle and Gospel, one tap away.">
        <ReadingsTile />
      </Tile>
      <Tile className="md:col-span-2" title="Reminders that respect you" body="Pick how early you hear about services and events, or pause them entirely.">
        <RemindersTile on={remindersOn} onToggle={setRemindersOn} lead={lead} onLead={setLead} booked={slot} />
      </Tile>
      <Tile
        className="md:col-span-3"
        delay={0.08}
        title="Parish life, without the clipboard"
        body="Volunteer for events, RSVP, and book confession with your priest in a few taps."
      >
        <ParishLifeTile slot={slot} onSlot={setSlot} remindersOn={remindersOn} />
      </Tile>
    </div>
  );
}

