"use client";

import {
  getFastingKind,
  type BulletinEvent,
  type ConfessionReservationWithSchedule,
  type OrthodoxCalendarData,
  type ParishEvent,
} from "@parohia/shared";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Icon } from "../Icon";
import { eventKindStyle, fastingStyle, type EventKind } from "../phone/tokens";
import { Card, EmptyState, Skeleton, cx } from "../app/ui";
import { eventStartDate, formatClockTime, formatConfessionRange, formatEventRange } from "../../lib/format";

export interface ScheduleItem {
  id: string;
  kind: EventKind;
  title: string;
  time: string;
  /** Minutes since midnight; all-day items sort first. */
  sortKey: number;
  detail?: string;
  chant?: boolean;
  onOpen?: () => void;
}

const minutesOf = (date: Date) => date.getHours() * 60 + date.getMinutes();
const minutesOfClock = (value?: string | null) => {
  if (!value) return -1;
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
};

export const parishEventItem = (event: ParishEvent, onOpen: () => void, chant = false): ScheduleItem => ({
  id: `parish-${event.id}`,
  kind: "parish",
  title: event.title || "Untitled event",
  time: formatEventRange(event.startTime, event.endTime),
  sortKey: event.startTime.includes("T") ? minutesOf(eventStartDate(event.startTime)) : -1,
  detail: event.location,
  chant,
  onOpen,
});

export const confessionItem = (
  reservation: ConfessionReservationWithSchedule,
  title: string,
  onOpen?: () => void
): ScheduleItem => ({
  id: `confession-${reservation.id}`,
  kind: "confession",
  title,
  time: formatConfessionRange(reservation.confession_schedules?.time_slot),
  sortKey: minutesOfClock(reservation.confession_schedules?.time_slot),
  detail: reservation.notes || undefined,
  onOpen,
});

export const bulletinItem = (event: BulletinEvent, onOpen?: () => void): ScheduleItem => ({
  id: `bulletin-${event.id}`,
  kind: event.event_type,
  title: event.title,
  time: event.event_time ? formatClockTime(event.event_time) : "All day",
  sortKey: minutesOfClock(event.event_time),
  detail:
    event.user_response?.response_type === "volunteer"
      ? "You're volunteering"
      : event.user_response?.response_type === "attending"
        ? "You're attending"
        : event.location,
  onOpen,
});

export function ScheduleList({
  items,
  loading,
  emptyTitle = "Nothing scheduled",
  emptyMessage,
}: {
  items: ScheduleItem[];
  loading?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
}) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[60px]" />
        ))}
      </div>
    );
  }
  if (items.length === 0) {
    return <EmptyState compact icon="calendar-outline" title={emptyTitle} message={emptyMessage} />;
  }
  return (
    <ul className="space-y-1.5">
      {[...items]
        .sort((a, b) => a.sortKey - b.sortKey)
        .map((item) => (
          <li key={item.id}>
            <ScheduleRow item={item} />
          </li>
        ))}
    </ul>
  );
}

function ScheduleRow({ item }: { item: ScheduleItem }) {
  const style = eventKindStyle[item.kind];
  const content = (
    <>
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
        style={{ backgroundColor: style.tint, color: style.color }}
      >
        <Icon name={style.icon} size={17} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate font-sans-semibold text-[14px] text-zinc-900 dark:text-white">{item.title}</span>
          {item.chant && <Icon name="musical-notes" size={13} className="shrink-0 text-purple-500" />}
        </span>
        <span className="mt-0.5 block truncate text-[12px] text-zinc-500 dark:text-zinc-400">
          {item.time}
          {item.detail ? ` · ${item.detail}` : ""}
        </span>
      </span>
      {item.onOpen && <Icon name="chevron-forward" size={14} className="shrink-0 text-zinc-300 dark:text-zinc-600" />}
    </>
  );
  const className = "flex w-full items-center gap-3 rounded-2xl p-2.5 text-left";
  return item.onOpen ? (
    <button
      type="button"
      onClick={item.onOpen}
      className={cx(
        className,
        "outline-none transition-colors hover:bg-zinc-900/[0.04] focus-visible:ring-2 focus-visible:ring-brand-red/50 dark:hover:bg-white/[0.05]"
      )}
    >
      {content}
    </button>
  ) : (
    <div className={className}>{content}</div>
  );
}

export function LiturgicalDayCard({
  data,
  loading,
  date,
  className,
}: {
  data: OrthodoxCalendarData | null;
  loading: boolean;
  date: Date;
  className?: string;
}) {
  const [openStory, setOpenStory] = useState<number | null>(null);
  const [openReading, setOpenReading] = useState<number | null>(null);

  if (loading || !data) {
    return (
      <Card className={className}>
        <Skeleton className="h-4 w-32" />
        <Skeleton className="mt-3 h-9 w-3/4" />
        <Skeleton className="mt-6 h-8 w-40 rounded-full" />
        <Skeleton className="mt-6 h-24" />
        <Skeleton className="mt-4 h-24" />
      </Card>
    );
  }

  const fasting = fastingStyle[getFastingKind(data.fasting)];
  const [fastLevel, fastNote] = data.fasting ? data.fasting.split(" — ") : ["", ""];

  return (
    <Card className={cx("relative overflow-hidden", className)} padded={false}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-red-500/[0.07] to-transparent dark:from-red-500/[0.1]"
      />
      <div className="relative p-7">
        <p className="font-sans-semibold text-[12px] uppercase tracking-[0.16em] text-red-600 dark:text-red-400">
          {date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <h2 className="mt-2 font-display text-[32px] leading-[1.1] text-zinc-900 dark:text-white">
          {data.title || "Liturgical day"}
        </h2>

        <div className="mt-5 flex items-start gap-3 rounded-2xl bg-zinc-900/[0.03] p-3.5 dark:bg-white/[0.04]">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${fasting.color}1f`, color: fasting.color }}
          >
            <Icon name={fasting.icon} size={17} />
          </span>
          <div className="min-w-0">
            <p className="font-sans-semibold text-[14px] text-zinc-900 dark:text-white">{fastLevel || fasting.label}</p>
            {fastNote && <p className="text-[13px] text-zinc-500 dark:text-zinc-400">{fastNote}</p>}
          </div>
        </div>

        {data.saintsFull.length > 0 && (
          <section className="mt-7">
            <h3 className="mb-2 font-sans-semibold text-[12px] uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
              Commemorations
            </h3>
            <ul className="divide-y divide-zinc-100 dark:divide-white/[0.06]">
              {data.saintsFull.map((saint, index) => {
                const open = openStory === index;
                return (
                  <li key={`${saint.title}-${index}`}>
                    <button
                      type="button"
                      disabled={!saint.story}
                      onClick={() => setOpenStory(open ? null : index)}
                      className="flex w-full items-center gap-3 py-2.5 text-left disabled:cursor-default"
                    >
                      <Icon
                        name={saint.kind === "feast" ? "sparkles" : "person-outline"}
                        size={15}
                        className={saint.kind === "feast" ? "text-amber-500" : "text-zinc-400"}
                      />
                      <span className="flex-1 text-[14px] text-zinc-800 dark:text-zinc-200">{saint.title}</span>
                      {saint.story && (
                        <Icon name={open ? "chevron-up" : "chevron-down"} size={14} className="text-zinc-400" />
                      )}
                    </button>
                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.p
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden pb-3 pl-7 text-[13px] leading-relaxed text-zinc-600 dark:text-zinc-400"
                        >
                          {saint.story}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {data.readingsFull.length > 0 && (
          <section className="mt-6">
            <h3 className="mb-2 font-sans-semibold text-[12px] uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
              Scripture readings
            </h3>
            <ul className="space-y-1.5">
              {data.readingsFull.map((reading, index) => {
                const open = openReading === index;
                return (
                  <li key={`${reading.display}-${index}`} className="rounded-2xl border border-zinc-100 dark:border-white/[0.06]">
                    <button
                      type="button"
                      onClick={() => setOpenReading(open ? null : index)}
                      className="flex w-full items-center gap-3 px-3.5 py-3 text-left"
                    >
                      <Icon name="book-outline" size={15} className="text-red-500" />
                      <span className="flex-1 font-sans-semibold text-[14px] text-zinc-800 dark:text-zinc-200">
                        {reading.display}
                      </span>
                      <Icon name={open ? "chevron-up" : "chevron-down"} size={14} className="text-zinc-400" />
                    </button>
                    <AnimatePresence initial={false}>
                      {open && reading.passage && (
                        <motion.p
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden px-3.5 pb-4 font-display text-[16px] leading-[1.7] text-zinc-700 dark:text-zinc-300"
                        >
                          {reading.passage}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {!data.title && data.saintsFull.length === 0 && data.readingsFull.length === 0 && (
          <EmptyState
            compact
            icon="warning-outline"
            title="Calendar unavailable"
            message="We couldn't reach the Orthodox calendar service. Try again in a moment."
          />
        )}
      </div>
    </Card>
  );
}
