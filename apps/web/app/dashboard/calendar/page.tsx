"use client";

import {
  BulletinService,
  ConfessionService,
  fetchOrthodoxCalendarData,
  fetchParishEventsForMultipleDays,
  isChantServiceEvent,
  type BulletinEvent,
  type ConfessionReservationWithSchedule,
  type OrthodoxCalendarData,
  type ParishEvent,
} from "@parohia/shared";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "../../../components/Icon";
import { Button, Card, CardHeader, IconButton, Segmented, Spinner, cx } from "../../../components/app/ui";
import { CalendarSetupCallout, CalendarSetupDialog } from "../../../components/dashboard/CalendarSetupDialog";
import { ParishEventDialog } from "../../../components/dashboard/ParishEventDialog";
import {
  LiturgicalDayCard,
  ScheduleList,
  bulletinItem,
  confessionItem,
  parishEventItem,
  type ScheduleItem,
} from "../../../components/dashboard/Schedule";
import { eventKindStyle } from "../../../components/phone/tokens";
import { addDays, eventStartDate, isSameDay, localDateKey, startOfDay } from "../../../lib/format";
import { useDashboard } from "../DashboardContext";
import { PageHeader } from "../DashboardShell";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type ReservationRow = { id: string; date: string; time_slot?: string; schedule_id: string; notes?: string };

export default function CalendarPage() {
  const { userId, parish, isAdmin, tradition, setTradition, chantSubscribed, setParish } = useDashboard();
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selected, setSelected] = useState(() => startOfDay(new Date()));
  const [parishEvents, setParishEvents] = useState<ParishEvent[]>([]);
  const [bulletin, setBulletin] = useState<BulletinEvent[]>([]);
  const [reservations, setReservations] = useState<ReservationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [orthodox, setOrthodox] = useState<OrthodoxCalendarData | null>(null);
  const [orthodoxLoading, setOrthodoxLoading] = useState(true);
  const [dayConfessions, setDayConfessions] = useState<(ConfessionReservationWithSchedule & { personName?: string })[]>([]);
  const [dayConfessionsLoading, setDayConfessionsLoading] = useState(false);
  const [activeEvent, setActiveEvent] = useState<ParishEvent | null>(null);
  const [setupOpen, setSetupOpen] = useState(false);

  const gridStart = useMemo(() => addDays(month, -month.getDay()), [month]);
  const days = useMemo(() => Array.from({ length: 42 }, (_, i) => addDays(gridStart, i)), [gridStart]);
  const chantEnabled = isAdmin || chantSubscribed;

  const loadMonth = useCallback(async () => {
    setLoading(true);
    const gridEnd = addDays(gridStart, 41);
    try {
      const [events, bulletinEvents, confessionRows] = await Promise.all([
        parish?.parish_calendar_id ? fetchParishEventsForMultipleDays(gridStart, 42, userId) : Promise.resolve([]),
        isAdmin && parish
          ? BulletinService.getParishEvents(parish.id, userId, { isParishAdmin: true }).catch(() => [])
          : BulletinService.getUserPersonalEvents(userId).catch(() => []),
        !parish
          ? Promise.resolve([] as ReservationRow[])
          : isAdmin
            ? ConfessionService.getReservations(parish.id, gridStart, gridEnd)
                .then((rows) =>
                  rows.map((r) => ({
                    id: r.id,
                    schedule_id: r.schedule_id,
                    notes: r.notes,
                    date: (r as unknown as { confession_schedules: { date: string } }).confession_schedules.date,
                  }))
                )
                .catch(() => [])
            : ConfessionService.getUserReservations(userId)
                .then((rows) =>
                  rows.map((r) => ({
                    id: r.id,
                    schedule_id: r.schedule_id,
                    notes: r.notes,
                    date: r.confession_schedules.date,
                    time_slot: r.confession_schedules.time_slot,
                  }))
                )
                .catch(() => []),
      ]);
      setParishEvents(events);
      setBulletin(bulletinEvents.filter((e) => e.event_type !== "announcement" && !!e.event_date));
      setReservations(confessionRows);
    } finally {
      setLoading(false);
    }
  }, [gridStart, isAdmin, parish, userId]);

  useEffect(() => {
    void loadMonth();
  }, [loadMonth]);

  useEffect(() => {
    setOrthodoxLoading(true);
    fetchOrthodoxCalendarData(selected, tradition)
      .then(setOrthodox)
      .finally(() => setOrthodoxLoading(false));
  }, [selected, tradition]);

  // Admins need names + times for the selected day's confessions
  useEffect(() => {
    if (!isAdmin || !parish) return;
    setDayConfessionsLoading(true);
    ConfessionService.getParishReservations(parish.id, selected)
      .then((rows) =>
        Promise.all(
          rows.map(async (r) => {
            const details = await ConfessionService.getReservationDetails(r.schedule_id).catch(() => null);
            return { ...r, personName: details?.user_profiles?.full_name as string | undefined };
          })
        )
      )
      .then(setDayConfessions)
      .catch(() => setDayConfessions([]))
      .finally(() => setDayConfessionsLoading(false));
  }, [isAdmin, parish, selected]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, { kind: keyof typeof eventKindStyle; title: string }[]>();
    const push = (key: string, entry: { kind: keyof typeof eventKindStyle; title: string }) => {
      map.set(key, [...(map.get(key) ?? []), entry]);
    };
    parishEvents.forEach((e) => push(localDateKey(eventStartDate(e.startTime)), { kind: "parish", title: e.title }));
    reservations.forEach((r) => push(r.date, { kind: "confession", title: "Confession" }));
    bulletin.forEach((e) => push(e.event_date!, { kind: e.event_type, title: e.title }));
    return map;
  }, [bulletin, parishEvents, reservations]);

  const selectedKey = localDateKey(selected);
  const selectedItems: ScheduleItem[] = [
    ...parishEvents
      .filter((e) => isSameDay(eventStartDate(e.startTime), selected))
      .map((e) =>
        parishEventItem(e, () => setActiveEvent(e), chantEnabled && isChantServiceEvent(e.title, e.startTime, e.endTime))
      ),
    ...(isAdmin
      ? dayConfessions.map((c) => confessionItem(c, `Confession with ${c.personName || "a parishioner"}`))
      : reservations
          .filter((r) => r.date === selectedKey)
          .map((r) =>
            confessionItem(
              {
                id: r.id,
                schedule_id: r.schedule_id,
                user_id: userId,
                status: "confirmed",
                notes: r.notes,
                created_at: "",
                updated_at: "",
                confession_schedules: { date: r.date, time_slot: r.time_slot ?? "", parish_id: parish?.id ?? "" },
              },
              parish?.priest_name ? `Confession with ${parish.priest_name}` : "Confession"
            )
          )),
    ...bulletin.filter((e) => e.event_date === selectedKey).map((e) => bulletinItem(e)),
  ];

  const today = startOfDay(new Date());
  const goToMonth = (offset: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + offset, 1));
  const goToday = () => {
    setMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelected(today);
  };

  return (
    <>
      <PageHeader
        eyebrow="Calendar"
        title={month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        description={
          isAdmin
            ? "Parish services, every confession booking, and all dated bulletin posts."
            : "Parish services alongside your confessions, RSVPs, and volunteer sign-ups."
        }
        actions={
          <>
            <Segmented
              size="sm"
              value={tradition}
              onChange={setTradition}
              options={[
                { value: "greek", label: "Greek" },
                { value: "slavic", label: "Slavic" },
              ]}
            />
            <div className="ml-2 flex items-center gap-1">
              <IconButton icon="chevron-back" label="Previous month" onClick={() => goToMonth(-1)} />
              <Button size="sm" variant="secondary" onClick={goToday}>
                Today
              </Button>
              <IconButton icon="chevron-forward" label="Next month" onClick={() => goToMonth(1)} />
            </div>
          </>
        }
      />

      {isAdmin && parish && !parish.parish_calendar_id && (
        <div className="mb-6">
          <CalendarSetupCallout onSetup={() => setSetupOpen(true)} />
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-7 self-start" padded={false}>
          <div className="grid grid-cols-7 border-b border-zinc-100 px-3 pb-2 pt-4 dark:border-white/[0.06]">
            {WEEKDAYS.map((day) => (
              <span key={day} className="text-center text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                {day}
              </span>
            ))}
          </div>
          <div className="relative grid grid-cols-7 gap-1 p-3">
            {loading && (
              <div className="absolute right-4 top-4">
                <Spinner size={14} className="text-zinc-400" />
              </div>
            )}
            {days.map((day) => {
              const key = localDateKey(day);
              const entries = eventsByDay.get(key) ?? [];
              const inMonth = day.getMonth() === month.getMonth();
              const isSelected = isSameDay(day, selected);
              const isToday = isSameDay(day, today);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelected(startOfDay(day))}
                  aria-pressed={isSelected}
                  aria-label={day.toDateString()}
                  className={cx(
                    "flex h-[92px] flex-col rounded-2xl p-1.5 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-red/50",
                    isSelected
                      ? "bg-red-600/[0.07] ring-1 ring-red-500/40 dark:bg-red-500/[0.12]"
                      : "hover:bg-zinc-900/[0.03] dark:hover:bg-white/[0.04]",
                    !inMonth && "opacity-40"
                  )}
                >
                  <span
                    className={cx(
                      "mb-1 flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-semibold",
                      isToday ? "bg-red-600 text-white" : "text-zinc-700 dark:text-zinc-300"
                    )}
                  >
                    {day.getDate()}
                  </span>
                  <span className="flex min-h-0 flex-col gap-0.5 overflow-hidden">
                    {entries.slice(0, 2).map((entry, i) => (
                      <span
                        key={i}
                        className="truncate rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold leading-tight"
                        style={{ backgroundColor: eventKindStyle[entry.kind].tint, color: eventKindStyle[entry.kind].color }}
                      >
                        {entry.title}
                      </span>
                    ))}
                    {entries.length > 2 && (
                      <span className="px-1.5 text-[10.5px] font-semibold text-zinc-400">+{entries.length - 2} more</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-4 border-t border-zinc-100 px-5 py-3 dark:border-white/[0.06]">
            {(["parish", "confession", "event", "volunteer"] as const).map((kind) => (
              <span key={kind} className="flex items-center gap-1.5 text-[12px] text-zinc-500 dark:text-zinc-400">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: eventKindStyle[kind].color }} />
                {eventKindStyle[kind].label}
              </span>
            ))}
            {chantEnabled && (
              <span className="flex items-center gap-1.5 text-[12px] text-zinc-500 dark:text-zinc-400">
                <Icon name="musical-notes" size={12} className="text-purple-500" />
                Open for chant sign-up
              </span>
            )}
          </div>
        </Card>

        <div className="col-span-5 space-y-6">
          <Card>
            <CardHeader
              eyebrow={isSameDay(selected, today) ? "Today" : selected.toLocaleDateString("en-US", { weekday: "long" })}
              title={selected.toLocaleDateString("en-US", { month: "long", day: "numeric" })}
            />
            <ScheduleList
              items={selectedItems}
              loading={loading || dayConfessionsLoading}
              emptyTitle="Nothing scheduled"
              emptyMessage="No services or personal items on this day."
            />
          </Card>
          <LiturgicalDayCard data={orthodox} loading={orthodoxLoading} date={selected} />
        </div>
      </div>

      <ParishEventDialog
        event={activeEvent}
        onClose={() => setActiveEvent(null)}
        parishId={parish?.id ?? null}
        userId={userId}
        chantEnabled={chantEnabled}
      />

      {isAdmin && parish && (
        <CalendarSetupDialog
          open={setupOpen}
          onClose={() => setSetupOpen(false)}
          parishId={parish.id}
          onSaved={(calendarId) => setParish({ ...parish, parish_calendar_id: calendarId })}
        />
      )}
    </>
  );
}
