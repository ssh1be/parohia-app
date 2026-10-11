"use client";

import {
  BulletinService,
  ConfessionService,
  fetchParishEventsForMultipleDays,
  getFastingKind,
  isChantServiceEvent,
  isLiturgicalServiceTitle,
  type BulletinEvent,
  type ConfessionReservationWithSchedule,
  type OrthodoxCalendarData,
  type ParishEvent,
} from "@parohia/shared";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { Icon } from "../../../components/Icon";
import { Button, Card, IconButton, Spinner, cx } from "../../../components/app/ui";
import { CalendarSetupCallout, CalendarSetupDialog } from "../../../components/dashboard/CalendarSetupDialog";
import { PersonalEventDialog, type PersonalDetail } from "../../../components/dashboard/EventDetailDialog";
import { ParishEventDialog } from "../../../components/dashboard/ParishEventDialog";
import {
  LiturgicalDayCard,
  ScheduleList,
  bulletinDetail,
  bulletinItem,
  confessionDetail,
  confessionItem,
  parishEventItem,
  type ScheduleItem,
} from "../../../components/dashboard/Schedule";
import { eventKindStyle, fastingStyle } from "../../../components/phone/tokens";
import { addDays, eventStartDate, isSameDay, localDateKey, startOfDay } from "../../../lib/format";
import { getOrthodoxDay, useFastingForDays } from "../../../lib/orthocal";
import { useDashboard } from "../DashboardContext";
import { PageHeader } from "../DashboardShell";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type DayEntry = { kind: keyof typeof eventKindStyle; title: string; service?: boolean; chant?: boolean };

type ConfessionWithName = ConfessionReservationWithSchedule & { personName?: string };

type ReservationRow = { id: string; date: string; time_slot?: string; schedule_id: string; notes?: string };

export default function CalendarPage() {
  const { userId, parish, isAdmin, tradition, chantSubscribed, setParish } = useDashboard();
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
  const [adminConfessions, setAdminConfessions] = useState<Record<string, ConfessionWithName[]>>({});
  const requestedDays = useRef(new Set<string>());
  const [menu, setMenu] = useState<{ day: Date; rect: DOMRect } | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [activeEvent, setActiveEvent] = useState<ParishEvent | null>(null);
  const [activePersonal, setActivePersonal] = useState<PersonalDetail | null>(null);
  const [setupOpen, setSetupOpen] = useState(false);

  const gridStart = useMemo(() => addDays(month, -month.getDay()), [month]);
  const days = useMemo(() => Array.from({ length: 42 }, (_, i) => addDays(gridStart, i)), [gridStart]);
  const chantEnabled = isAdmin || chantSubscribed;
  const fastingByDay = useFastingForDays(days, tradition);

  const loadMonth = useCallback(async () => {
    setLoading(true);
    requestedDays.current.clear();
    setAdminConfessions({});
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
    getOrthodoxDay(selected, tradition)
      .then(setOrthodox)
      .finally(() => setOrthodoxLoading(false));
  }, [selected, tradition]);

  // Month rows lack names and times, so admins fetch a day's confessions the first time it's previewed
  const loadAdminConfessions = useCallback(
    (day: Date) => {
      const key = localDateKey(day);
      if (!isAdmin || !parish || requestedDays.current.has(key)) return;
      requestedDays.current.add(key);
      ConfessionService.getParishReservations(parish.id, day)
        .then((rows) =>
          Promise.all(
            rows.map(async (r) => {
              const details = await ConfessionService.getReservationDetails(r.schedule_id).catch(() => null);
              return { ...r, personName: details?.user_profiles?.full_name as string | undefined };
            })
          )
        )
        .catch(() => {
          requestedDays.current.delete(key);
          return [] as ConfessionWithName[];
        })
        .then((list) => setAdminConfessions((prev) => ({ ...prev, [key]: list })));
    },
    [isAdmin, parish]
  );

  const dialogOpen = !!activeEvent || !!activePersonal;

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const inPanel = (target: EventTarget | null) => target instanceof Node && !!panelRef.current?.contains(target);
    const onScroll = (event: Event) => !inPanel(event.target) && close();
    // Day cells toggle the menu themselves; dialog clicks land outside the panel but should keep it open underneath
    const onPointerDown = (event: PointerEvent) => {
      const onCell = event.target instanceof Element && !!event.target.closest("[data-day-cell]");
      if (!dialogOpen && !onCell && !inPanel(event.target)) close();
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && !dialogOpen && close();
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    window.addEventListener("resize", close);
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("resize", close);
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [dialogOpen, menu]);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, DayEntry[]>();
    const push = (key: string, entry: DayEntry) => {
      map.set(key, [...(map.get(key) ?? []), entry]);
    };
    parishEvents.forEach((e) =>
      push(localDateKey(eventStartDate(e.startTime)), {
        kind: "parish",
        title: e.title,
        service: isLiturgicalServiceTitle(e.title),
        chant: chantEnabled && isChantServiceEvent(e.title, e.startTime, e.endTime),
      })
    );
    reservations.forEach((r) => push(r.date, { kind: "confession", title: "Confession" }));
    bulletin.forEach((e) => push(e.event_date!, { kind: e.event_type, title: e.title }));
    return map;
  }, [bulletin, chantEnabled, parishEvents, reservations]);

  const confessionTitle = (personName?: string) =>
    isAdmin
      ? `Confession with ${personName || "a parishioner"}`
      : parish?.priest_name
        ? `Confession with ${parish.priest_name}`
        : "Confession";

  const itemsFor = (day: Date): ScheduleItem[] => {
    const key = localDateKey(day);
    const confessions: ConfessionReservationWithSchedule[] = isAdmin
      ? (adminConfessions[key] ?? [])
      : reservations
          .filter((r) => r.date === key)
          .map((r) => ({
            id: r.id,
            schedule_id: r.schedule_id,
            user_id: userId,
            status: "confirmed",
            notes: r.notes,
            created_at: "",
            updated_at: "",
            confession_schedules: { date: r.date, time_slot: r.time_slot ?? "", parish_id: parish?.id ?? "" },
          }));
    return [
      ...parishEvents
        .filter((e) => isSameDay(eventStartDate(e.startTime), day))
        .map((e) => parishEventItem(e, () => setActiveEvent(e), chantEnabled && isChantServiceEvent(e.title, e.startTime, e.endTime))),
      ...confessions.map((c) => {
        const title = confessionTitle((c as ConfessionWithName).personName);
        return confessionItem(c, title, () => setActivePersonal(confessionDetail(c, title)));
      }),
      ...bulletin.filter((e) => e.event_date === key).map((e) => bulletinItem(e, () => setActivePersonal(bulletinDetail(e)))),
    ];
  };

  const toggleDay = (day: Date, target: HTMLElement) => {
    setSelected(startOfDay(day));
    if ((menu && isSameDay(menu.day, day)) || !eventsByDay.get(localDateKey(day))?.length) {
      setMenu(null);
      return;
    }
    loadAdminConfessions(day);
    setMenu({ day, rect: target.getBoundingClientRect() });
  };

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
          <div className="flex items-center gap-1">
            <IconButton icon="chevron-back" label="Previous month" onClick={() => goToMonth(-1)} />
            <Button size="sm" variant="secondary" onClick={goToday}>
              Today
            </Button>
            <IconButton icon="chevron-forward" label="Next month" onClick={() => goToMonth(1)} />
          </div>
        }
      />

      {isAdmin && parish && !parish.parish_calendar_id && (
        <div className="mb-6">
          <CalendarSetupCallout onSetup={() => setSetupOpen(true)} />
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-8 self-start" padded={false}>
          <div className="relative grid grid-cols-7 border-b border-zinc-100 px-3 pb-2 pt-4 dark:border-white/[0.06]">
            {WEEKDAYS.map((day, index) => (
              <span
                key={day}
                className={cx(
                  "text-center text-[11px] font-semibold uppercase tracking-wider",
                  index === 0 ? "text-red-500 dark:text-red-400" : "text-zinc-400"
                )}
              >
                {day}
              </span>
            ))}
            {loading && (
              <div className="absolute right-4 top-4">
                <Spinner size={12} className="text-zinc-400" />
              </div>
            )}
          </div>
          <div className="grid grid-cols-7 gap-1 p-3">
            {days.map((day) => {
              const key = localDateKey(day);
              const entries = eventsByDay.get(key) ?? [];
              const inMonth = day.getMonth() === month.getMonth();
              const isSelected = isSameDay(day, selected);
              const isToday = isSameDay(day, today);
              const fastingKind = getFastingKind(fastingByDay[key]);
              const fasting = fastingStyle[fastingKind];
              return (
                <button
                  key={key}
                  type="button"
                  data-day-cell
                  onClick={(e) => toggleDay(day, e.currentTarget)}
                  aria-pressed={isSelected}
                  aria-expanded={entries.length ? !!menu && isSameDay(menu.day, day) : undefined}
                  aria-label={`${day.toDateString()}${fastingKind !== "none" ? `, ${fasting.label}` : ""}`}
                  className={cx(
                    "flex h-[124px] flex-col rounded-2xl p-2 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-red/50",
                    isSelected
                      ? "bg-red-600/[0.07] ring-1 ring-red-500/40 dark:bg-red-500/[0.12]"
                      : "hover:bg-zinc-900/[0.03] dark:hover:bg-white/[0.04]",
                    !inMonth && "opacity-40"
                  )}
                >
                  <span className="mb-1 flex items-center justify-between">
                    <span
                      className={cx(
                        "flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-semibold",
                        isToday
                          ? "bg-red-600 text-white"
                          : day.getDay() === 0
                            ? "text-red-600 dark:text-red-400"
                            : "text-zinc-700 dark:text-zinc-300"
                      )}
                    >
                      {day.getDate()}
                    </span>
                    {fastingKind !== "none" && (
                      <span
                        title={fastingByDay[key]}
                        className="flex h-5 w-5 items-center justify-center rounded-full"
                        style={{ backgroundColor: `${fasting.color}1f`, color: fasting.color }}
                      >
                        <Icon name={fasting.icon} size={11} />
                      </span>
                    )}
                  </span>
                  <span className="flex min-h-0 flex-col gap-0.5 overflow-hidden">
                    {entries.slice(0, 3).map((entry, i) =>
                      entry.service ? (
                        <span
                          key={i}
                          className={cx(
                            "flex items-center gap-1 rounded-md bg-zinc-900 px-1.5 py-0.5 text-[11px] font-semibold leading-tight text-white dark:bg-white dark:text-zinc-900",
                            day < today && "opacity-60"
                          )}
                        >
                          {entry.chant && <Icon name="musical-notes" size={10} className="shrink-0" />}
                          <span className="truncate">{entry.title}</span>
                        </span>
                      ) : (
                        <span
                          key={i}
                          className="truncate rounded-md px-1.5 py-0.5 text-[11px] font-semibold leading-tight"
                          style={{ backgroundColor: eventKindStyle[entry.kind].tint, color: eventKindStyle[entry.kind].color }}
                        >
                          {entry.title}
                        </span>
                      )
                    )}
                    {entries.length > 3 && (
                      <span className="px-1.5 text-[11px] font-semibold text-zinc-400">+{entries.length - 3} more</span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-zinc-100 px-5 py-3 dark:border-white/[0.06]">
            <span className="flex items-center gap-1.5 text-[12px] text-zinc-500 dark:text-zinc-400">
              <span className="h-2 w-3 rounded-[3px] bg-zinc-900 dark:bg-white" />
              Service
            </span>
            {(["parish", "confession", "event", "volunteer"] as const).map((kind) => (
              <span key={kind} className="flex items-center gap-1.5 text-[12px] text-zinc-500 dark:text-zinc-400">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: eventKindStyle[kind].color }} />
                {eventKindStyle[kind].label}
              </span>
            ))}
            {chantEnabled && (
              <span className="flex items-center gap-1.5 text-[12px] text-zinc-500 dark:text-zinc-400">
                <Icon name="musical-notes" size={12} className="text-red-500" />
                Open for chant sign-up
              </span>
            )}
            <span className="ml-auto flex items-center gap-4">
              {(["fish", "wine", "strict"] as const).map((kind) => (
                <span key={kind} className="flex items-center gap-1.5 text-[12px] text-zinc-500 dark:text-zinc-400">
                  <Icon name={fastingStyle[kind].icon} size={12} style={{ color: fastingStyle[kind].color }} />
                  {fastingStyle[kind].label}
                </span>
              ))}
            </span>
          </div>
        </Card>

        <div className="col-span-4">
          <LiturgicalDayCard key={localDateKey(selected)} data={orthodox} loading={orthodoxLoading} date={selected} />
        </div>
      </div>

      <AnimatePresence>
        {menu && (
          <DayPreview
            key={localDateKey(menu.day)}
            day={menu.day}
            rect={menu.rect}
            isToday={isSameDay(menu.day, today)}
            items={itemsFor(menu.day)}
            loading={isAdmin && reservations.some((r) => r.date === localDateKey(menu.day)) && !adminConfessions[localDateKey(menu.day)]}
            fasting={fastingByDay[localDateKey(menu.day)]}
            panelRef={panelRef}
          />
        )}
      </AnimatePresence>

      <ParishEventDialog
        event={activeEvent}
        onClose={() => setActiveEvent(null)}
        parishId={parish?.id ?? null}
        userId={userId}
        chantEnabled={chantEnabled}
      />
      <PersonalEventDialog detail={activePersonal} onClose={() => setActivePersonal(null)} />

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

const PREVIEW_WIDTH = 340;

function DayPreview({
  day,
  rect,
  isToday,
  items,
  loading,
  fasting,
  panelRef,
}: {
  day: Date;
  rect: DOMRect;
  isToday: boolean;
  items: ScheduleItem[];
  loading: boolean;
  fasting?: string;
  panelRef: RefObject<HTMLDivElement>;
}) {
  const fitsRight = rect.right + 10 + PREVIEW_WIDTH < window.innerWidth - 12;
  const left = fitsRight ? rect.right + 10 : Math.max(12, rect.left - 10 - PREVIEW_WIDTH);
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  useLayoutEffect(() => {
    const node = contentRef.current;
    if (!node) return;
    // p-4 padding + 1px border on each side of the panel.
    const measure = () => setHeight(node.offsetHeight + 34);
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    measure();
    return () => observer.disconnect();
  }, []);
  const top = Math.max(12, Math.min(rect.top - 6, window.innerHeight - height - 12));
  const fastingKind = getFastingKind(fasting);
  const fastingInfo = fastingStyle[fastingKind];

  return createPortal(
    <motion.div
      role="dialog"
      aria-label={day.toDateString()}
      ref={panelRef}
      initial={{ opacity: 0, x: fitsRight ? -6 : 6, scale: 0.98 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.12 } }}
      transition={{ type: "spring", damping: 30, stiffness: 420 }}
      style={{ left, top, width: PREVIEW_WIDTH, maxHeight: window.innerHeight - top - 12 }}
      className="no-scrollbar fixed z-40 overflow-y-auto rounded-3xl border border-zinc-200/80 bg-white p-4 shadow-[0_20px_50px_-12px_rgba(9,9,11,0.25)] dark:border-white/10 dark:bg-zinc-900 dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.7)]"
    >
      <div ref={contentRef}>
        <div className="mb-3 flex items-start justify-between gap-3 px-1">
          <div>
            <p className="font-sans-semibold text-[11px] uppercase tracking-[0.14em] text-red-600 dark:text-red-400">
              {isToday ? "Today" : day.toLocaleDateString("en-US", { weekday: "long" })}
            </p>
            <p className="font-display text-[22px] leading-tight text-zinc-900 dark:text-white">
              {day.toLocaleDateString("en-US", { month: "long", day: "numeric" })}
            </p>
          </div>
          {fastingKind !== "none" && (
            <span
              title={fasting}
              className="mt-1 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold"
              style={{ backgroundColor: `${fastingInfo.color}1f`, color: fastingInfo.color }}
            >
              <Icon name={fastingInfo.icon} size={11} />
              {fastingInfo.label}
            </span>
          )}
        </div>
        <ScheduleList items={items} loading={loading} limit={Infinity} emptyTitle="Nothing scheduled" />
      </div>
    </motion.div>,
    document.body
  );
}
