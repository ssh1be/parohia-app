"use client";

import {
  getFastingKind,
  isLiturgicalServiceTitle,
  type BulletinEvent,
  type ConfessionReservationWithSchedule,
  type OrthodoxCalendarData,
  type ParishEvent,
} from "@parohia/shared";
import { useState } from "react";
import { Icon } from "../Icon";
import { eventKindStyle, fastingStyle, palette, type EventKind } from "../phone/tokens";
import { Card, Dialog, EmptyState, Skeleton, cx, useSeeMore } from "../app/ui";
import { eventStartDate, formatClockTime, formatConfessionRange, formatEventRange, isSameDay, parseLocalDate } from "../../lib/format";
import type { PersonalDetail } from "./EventDetailDialog";

export interface ScheduleItem {
  id: string;
  kind: EventKind;
  title: string;
  time: string;
  /** Minutes since midnight; all-day items sort first. */
  sortKey: number;
  detail?: string;
  /** Liturgical service (Liturgy, Vespers, …), highlighted in lists. */
  service?: boolean;
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
  service: isLiturgicalServiceTitle(event.title),
  chant,
  onOpen,
});

export const confessionItem = (reservation: ConfessionReservationWithSchedule, title: string, onOpen?: () => void): ScheduleItem => ({
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

const longDate = (value?: string) =>
  value ? parseLocalDate(value).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : undefined;

export const bulletinDetail = (event: BulletinEvent): PersonalDetail => ({
  kind: event.event_type,
  title: event.title,
  when: event.event_time ? formatClockTime(event.event_time) : "All day",
  whenDetail: longDate(event.event_date),
  location: event.location,
  description: event.description,
  notes: event.user_response?.notes,
  href: "/dashboard/bulletin",
  hrefLabel: "Open in Bulletin",
});

export const confessionDetail = (reservation: ConfessionReservationWithSchedule, title: string): PersonalDetail => ({
  kind: "confession",
  title,
  when: formatConfessionRange(reservation.confession_schedules?.time_slot),
  whenDetail: longDate(reservation.confession_schedules?.date),
  notes: reservation.notes || undefined,
  href: "/dashboard/confession",
  hrefLabel: "Open in Confession",
});

export function ScheduleList({
  items,
  loading,
  emptyTitle = "Nothing scheduled",
  emptyMessage,
  limit = 4,
}: {
  items: ScheduleItem[];
  loading?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  limit?: number;
}) {
  const { visible, toggle } = useSeeMore(
    [...items].sort((a, b) => a.sortKey - b.sortKey),
    limit
  );

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
    <>
      <ul className="space-y-1.5">
        {visible.map((item) => (
          <li key={item.id}>
            <ScheduleRow item={item} />
          </li>
        ))}
      </ul>
      {toggle}
    </>
  );
}

function ScheduleRow({ item }: { item: ScheduleItem }) {
  const style = eventKindStyle[item.kind];
  const content = (
    <>
      {item.service ? (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900">
          <Icon name={style.icon} size={17} />
        </span>
      ) : (
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
          style={{ backgroundColor: style.tint, color: style.color }}
        >
          <Icon name={style.icon} size={17} />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate font-sans-semibold text-[14px] text-zinc-900 dark:text-white">{item.title}</span>
          {item.chant && <Icon name="musical-notes" size={13} className="shrink-0 text-red-500" />}
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
  const [reader, setReader] = useState<{ eyebrow: string; title: string; body: string } | null>(null);
  const saints = useSeeMore(data?.saintsFull ?? [], 4);
  const readings = useSeeMore(data?.readingsFull ?? [], 3);

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
          {isSameDay(date, new Date())
            ? "Today in the Church"
            : date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </p>
        <h2 className="mt-2 font-display text-[32px] leading-[1.1] text-zinc-900 dark:text-white">{data.title || "Liturgical day"}</h2>

        {data.fasting && (
          <span
            title={data.fasting}
            className="mt-4 inline-flex max-w-full items-center gap-1.5 rounded-full bg-zinc-900/[0.05] py-1 pl-1 pr-3 dark:bg-white/[0.07]"
          >
            <span
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: `${fasting.color}22`, color: fasting.color }}
            >
              <Icon name={fasting.icon} size={12} />
            </span>
            <span className="shrink-0 font-sans-semibold text-[12px] text-zinc-800 dark:text-zinc-200">{fastLevel}</span>
            {fastNote && <span className="truncate text-[12px] text-zinc-500 dark:text-zinc-400">· {fastNote}</span>}
          </span>
        )}

        {data.saintsFull.length > 0 && (
          <section className="mt-6">
            <h3 className="mb-2 font-sans-semibold text-[12px] uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
              Commemorations
            </h3>
            <ul className="divide-y divide-zinc-100 dark:divide-white/[0.06]">
              {saints.visible.map((saint, index) => {
                const isFeast = saint.kind === "feast";
                return (
                  <li key={`${saint.title}-${index}`}>
                    <button
                      type="button"
                      disabled={!saint.story}
                      onClick={() =>
                        setReader({ eyebrow: "Synaxarion", title: saint.title, body: saint.story })
                      }
                      className="flex w-full items-center gap-3 rounded-xl py-2.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-brand-red/50 disabled:cursor-default"
                    >
                      <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                        style={
                          isFeast
                            ? { backgroundColor: palette.accentMuted, color: palette.accent }
                            : { backgroundColor: "rgba(245, 158, 11, 0.12)", color: palette.amber }
                        }
                      >
                        <Icon name={isFeast ? "star" : "sparkles"} size={15} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-display text-[17px] leading-[22px] text-zinc-900 dark:text-white">{saint.title}</span>
                        {saint.story && (
                          <span className="mt-0.5 block text-[12px] font-medium text-zinc-500 dark:text-zinc-400">
                            {isFeast ? "Read about the feast" : "Read the life"}
                          </span>
                        )}
                      </span>
                      {saint.story && <Icon name="chevron-forward" size={14} className="text-zinc-400" />}
                    </button>
                  </li>
                );
              })}
            </ul>
            {saints.toggle}
          </section>
        )}

        {data.readingsFull.length > 0 && (
          <section className="mt-6">
            <h3 className="mb-2 font-sans-semibold text-[12px] uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
              Scripture readings
            </h3>
            <ul className="space-y-1.5">
              {readings.visible.map((reading, index) => (
                <li key={`${reading.display}-${index}`}>
                  <button
                    type="button"
                    disabled={!reading.passage}
                    onClick={() =>
                      setReader({ eyebrow: "Scripture reading", title: reading.display, body: reading.passage })
                    }
                    className="flex w-full items-center gap-3 rounded-2xl border border-zinc-100 px-3.5 py-3 text-left outline-none transition-colors hover:bg-zinc-900/[0.03] focus-visible:ring-2 focus-visible:ring-brand-red/50 disabled:cursor-default disabled:hover:bg-transparent dark:border-white/[0.06] dark:hover:bg-white/[0.04]"
                  >
                    <Icon name="book-outline" size={15} className="text-red-500" />
                    <span className="flex-1 font-sans-semibold text-[14px] text-zinc-800 dark:text-zinc-200">{reading.display}</span>
                    {reading.passage && <Icon name="chevron-forward" size={14} className="text-zinc-400" />}
                  </button>
                </li>
              ))}
            </ul>
            {readings.toggle}
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

      <Dialog open={!!reader} onClose={() => setReader(null)} eyebrow={reader?.eyebrow} title={reader?.title ?? ""} width={680}>
        <p className="whitespace-pre-line pb-3 font-display text-[19px] leading-[1.75] text-zinc-800 dark:text-zinc-200">
          {reader?.body}
        </p>
      </Dialog>
    </Card>
  );
}
