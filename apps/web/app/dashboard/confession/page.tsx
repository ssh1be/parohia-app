"use client";

import {
  ConfessionService,
  confessionPriest,
  updateParishConfessionEnabled,
  type ConfessionReservationWithSchedule,
  type DaySchedule,
  type TimeSlot,
} from "@parohia/shared";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "../../../components/Icon";
import {
  Avatar,
  Button,
  Card,
  CardHeader,
  ConfirmDialog,
  Dialog,
  EmptyState,
  Notice,
  Skeleton,
  Spinner,
  Switch,
  TextArea,
  cx,
  useSeeMore,
} from "../../../components/app/ui";
import { useToast } from "../../../components/app/toast";
import { formatConfessionRange, formatPhone, isSameDay, localDateKey, parseLocalDate } from "../../../lib/format";
import { useDashboard } from "../DashboardContext";
import { NoParishState, PageHeader } from "../DashboardShell";

const HOURS = [9, 10, 11, 12, 13, 14, 15, 16, 17];
const QUARTERS = [0, 15, 30, 45];

const slotParts = (slot: TimeSlot) => {
  const [hour, minute] = slot.id.split("-").slice(-2).map(Number);
  return { hour, minute, dbTime: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00` };
};

const isSlotPassed = (day: DaySchedule, slot: TimeSlot) => {
  const now = new Date();
  if (!isSameDay(day.date, now)) return false;
  const { hour, minute } = slotParts(slot);
  const slotTime = new Date(now);
  slotTime.setHours(hour, minute, 0, 0);
  return now > slotTime;
};

const hourLabel = (hour: number) => `${hour > 12 ? hour - 12 : hour} ${hour >= 12 ? "PM" : "AM"}`;

interface ReservationDetails {
  id: string;
  user_id: string;
  notes?: string | null;
  confession_schedules?: { date: string; time_slot: string };
  user_profiles?: { full_name?: string; email?: string; phone_number?: string | null } | null;
}

export default function ConfessionPage() {
  const { parish, isAdmin } = useDashboard();
  if (!parish) {
    return (
      <>
        <PageHeader eyebrow="Confession" title="Confession" />
        <NoParishState feature="confession booking" />
      </>
    );
  }
  if (!isAdmin && !parish.confession_enabled) {
    return (
      <>
        <PageHeader eyebrow="Confession" title="Confession" />
        <Card>
          <EmptyState
            icon="time-outline"
            title="Confession booking isn't available"
            message="Your parish hasn't opened confession times on Parohia yet."
          />
        </Card>
      </>
    );
  }
  return isAdmin ? <AdminConfession /> : <MemberConfession />;
}

function useWeekSchedule(parishId: string, enabled: boolean) {
  const [week, setWeek] = useState<DaySchedule[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!enabled) {
      setWeek([]);
      setLoading(false);
      return [];
    }
    try {
      await ConfessionService.cleanupOldData(7).catch(() => undefined);
      const schedule = await ConfessionService.generateWeekSchedule(parishId, new Date());
      setWeek(schedule);
      return schedule;
    } finally {
      setLoading(false);
    }
  }, [enabled, parishId]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load]);

  return { week, setWeek, loading, reload: load };
}

/* ------------------------------------------------------------------------------------------------
 * Admin
 * ---------------------------------------------------------------------------------------------- */

function AdminConfession() {
  const toast = useToast();
  const { parish, setParish } = useDashboard();
  const priestName = confessionPriest(parish)?.name;
  const enabled = !!parish!.confession_enabled;
  const { week, setWeek, loading, reload } = useWeekSchedule(parish!.id, enabled);
  const [toggling, setToggling] = useState(false);
  const [confirmOff, setConfirmOff] = useState(false);
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [details, setDetails] = useState<Record<string, ReservationDetails>>({});
  const [openReservation, setOpenReservation] = useState<ReservationDetails | null>(null);
  const requested = useRef(new Set<string>());

  const reservedSlots = useMemo(
    () => week.flatMap((day) => day.timeSlots.filter((s) => s.reservedBy && s.scheduleId).map((slot) => ({ day, slot }))),
    [week]
  );
  const bookingList = useSeeMore(reservedSlots, 5);

  useEffect(() => {
    const missing = reservedSlots.filter(({ slot }) => !requested.current.has(slot.scheduleId!));
    if (missing.length === 0) return;
    missing.forEach(({ slot }) => requested.current.add(slot.scheduleId!));
    Promise.all(
      missing.map(({ slot }) =>
        ConfessionService.getReservationDetails(slot.scheduleId!)
          .then((d: ReservationDetails) => [slot.scheduleId!, d] as const)
          .catch(() => null)
      )
    ).then((rows) =>
      setDetails((prev) => {
        const next = { ...prev };
        rows.forEach((row) => row && (next[row[0]] = row[1]));
        return next;
      })
    );
  }, [reservedSlots]);

  const setEnabled = async (value: boolean) => {
    setToggling(true);
    const result = await updateParishConfessionEnabled(parish!.id, value);
    setToggling(false);
    setConfirmOff(false);
    if (!result.success) return toast(result.error || "Failed to update confession settings", "error");
    setParish({ ...parish!, confession_enabled: value });
    toast(value ? "Confession booking is on" : "Confession booking is off", "success");
  };

  const updateSlots = async (day: DaySchedule, slots: TimeSlot[], available: boolean) => {
    const targets = slots.filter((s) => !s.reservedBy && s.available !== available);
    if (targets.length === 0) return;
    setPending((prev) => new Set([...prev, ...targets.map((s) => s.id)]));
    const dateStr = localDateKey(day.date);
    const results = await Promise.all(
      targets.map((slot) => ConfessionService.updateScheduleAvailability(parish!.id, dateStr, slotParts(slot).dbTime, available))
    );
    const failed = results.filter((r) => !r.success);
    if (failed.length) toast(failed[0].error || "Failed to update some slots", "error");
    // Reload so new slots pick up their schedule ids
    await reload();
    setPending((prev) => {
      const next = new Set(prev);
      targets.forEach((s) => next.delete(s.id));
      return next;
    });
  };

  const onSlotClick = (day: DaySchedule, slot: TimeSlot) => {
    if (slot.reservedBy && slot.scheduleId) {
      const d = details[slot.scheduleId];
      if (d) setOpenReservation(d);
      return;
    }
    setWeek((prev) =>
      prev.map((d) =>
        d === day ? { ...d, timeSlots: d.timeSlots.map((s) => (s.id === slot.id ? { ...s, available: !s.available } : s)) } : d
      )
    );
    void updateSlots(day, [slot], !slot.available);
  };

  return (
    <>
      <PageHeader
        eyebrow="Confession"
        title={priestName ? `Confession with ${priestName}` : "Confession schedule"}
        description="Open times for the coming week. Parishioners book from the app or the dashboard."
      />

      <Card className="mb-6 flex items-center gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-600/10 text-red-600 dark:text-red-400">
          <Icon name="time" size={20} />
        </span>
        <div className="flex-1">
          <p className="font-sans-bold text-[15px] text-zinc-900 dark:text-white">Offer confession booking</p>
          <p className="text-[13px] text-zinc-500 dark:text-zinc-400">
            {enabled ? "Parishioners can see and book the times you open." : "Booking is hidden from parishioners."}
          </p>
        </div>
        {toggling && <Spinner size={16} className="text-zinc-400" />}
        <Switch
          checked={enabled}
          disabled={toggling}
          label="Offer confession booking"
          onChange={(value) => (value ? void setEnabled(true) : setConfirmOff(true))}
        />
      </Card>

      {!enabled ? (
        <Notice tone="accent" icon="time-outline" title="Confession scheduling is off">
          Turn it on to open 15-minute slots between 9 AM and 6 PM for the coming week.
        </Notice>
      ) : (
        <div className="grid grid-cols-12 gap-6">
          <Card className="col-span-9 overflow-x-auto" padded={false}>
            <div className="flex items-center justify-between px-6 pb-3 pt-5">
              <div className="flex items-center gap-4 text-[12px] text-zinc-500 dark:text-zinc-400">
                <Legend className="bg-emerald-500" label="Open" />
                <Legend className="bg-red-600" label="Booked" />
                <Legend className="border border-zinc-300 dark:border-white/20" label="Closed" />
              </div>
              <p className="text-[12px] text-zinc-400">Click a time to open or close it</p>
            </div>
            {loading ? (
              <div className="p-6">
                <Skeleton className="h-[420px]" />
              </div>
            ) : (
              <table className="w-full table-fixed border-separate border-spacing-0 text-[11px]">
                <thead>
                  <tr>
                    <th className="w-14" />
                    {week.map((day) => {
                      const openCount = day.timeSlots.filter((s) => s.available).length;
                      return (
                        <th key={day.dateString} className="px-1 pb-2 align-bottom">
                          <div
                            className={cx(
                              "rounded-2xl px-2 py-2",
                              isSameDay(day.date, new Date()) && "bg-red-600/[0.06] dark:bg-red-500/[0.1]"
                            )}
                          >
                            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{day.dayName}</p>
                            <p className="font-display text-[18px] leading-tight text-zinc-900 dark:text-white">{day.date.getDate()}</p>
                            <div className="mt-1 flex justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => updateSlots(day, day.timeSlots, true)}
                                className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400"
                              >
                                Open all
                              </button>
                              {openCount > 0 && (
                                <button
                                  type="button"
                                  onClick={() => updateSlots(day, day.timeSlots, false)}
                                  className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-zinc-500 hover:bg-zinc-900/[0.05] dark:hover:bg-white/[0.06]"
                                >
                                  Clear
                                </button>
                              )}
                            </div>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {HOURS.map((hour) => (
                    <tr key={hour}>
                      <td className="border-t border-zinc-100 pr-2 pt-1.5 text-right align-top text-[11px] font-semibold text-zinc-400 dark:border-white/[0.06]">
                        {hourLabel(hour)}
                      </td>
                      {week.map((day) => (
                        <td key={day.dateString} className="border-t border-zinc-100 px-1 py-1.5 dark:border-white/[0.06]">
                          <div className="grid grid-cols-2 gap-1">
                            {QUARTERS.map((minute) => {
                              const slot = day.timeSlots.find((s) => {
                                const parts = slotParts(s);
                                return parts.hour === hour && parts.minute === minute;
                              });
                              if (!slot) return <span key={minute} />;
                              const reserved = !!slot.reservedBy;
                              const name = reserved && slot.scheduleId ? details[slot.scheduleId]?.user_profiles?.full_name : undefined;
                              return (
                                <button
                                  key={minute}
                                  type="button"
                                  disabled={pending.has(slot.id)}
                                  onClick={() => onSlotClick(day, slot)}
                                  title={reserved ? `Booked${name ? ` by ${name}` : ""}` : slot.time}
                                  className={cx(
                                    "h-6 truncate rounded-md px-1 text-[10px] font-semibold transition-colors disabled:opacity-50",
                                    reserved
                                      ? "bg-red-600 text-white"
                                      : slot.available
                                        ? "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-300"
                                        : "border border-zinc-200 text-zinc-400 hover:border-zinc-300 hover:text-zinc-600 dark:border-white/10 dark:text-zinc-500"
                                  )}
                                >
                                  :{String(minute).padStart(2, "0")}
                                </button>
                              );
                            })}
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          <Card className="col-span-3 self-start">
            <CardHeader eyebrow="This week" title="Bookings" />
            {loading ? (
              <Skeleton className="h-40" />
            ) : reservedSlots.length === 0 ? (
              <EmptyState compact icon="people-outline" title="No bookings yet" />
            ) : (
              <>
                <ul className="space-y-1">
                  {bookingList.visible.map(({ day, slot }) => {
                    const d = details[slot.scheduleId!];
                    const name = d?.user_profiles?.full_name || "Loading…";
                    return (
                      <li key={slot.id}>
                        <button
                          type="button"
                          disabled={!d}
                          onClick={() => d && setOpenReservation(d)}
                          className="flex w-full items-center gap-3 rounded-2xl p-2 text-left hover:bg-zinc-900/[0.04] dark:hover:bg-white/[0.05]"
                        >
                          <Avatar name={name} size={32} />
                          <span className="min-w-0">
                            <span className="block truncate font-sans-semibold text-[13px] text-zinc-900 dark:text-white">{name}</span>
                            <span className="block text-[12px] text-zinc-500">
                              {day.dayName} {day.dateString} · {slot.time}
                            </span>
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                {bookingList.toggle}
              </>
            )}
          </Card>
        </div>
      )}

      <ConfirmDialog
        open={confirmOff}
        onClose={() => setConfirmOff(false)}
        onConfirm={() => setEnabled(false)}
        loading={toggling}
        destructive
        title="Turn off confession?"
        message="Parishioners will no longer see confession booking. Existing reservations stay on their calendars."
        confirmLabel="Turn off"
      />

      <Dialog
        open={!!openReservation}
        onClose={() => setOpenReservation(null)}
        eyebrow="Confession booking"
        title={openReservation?.user_profiles?.full_name || "Parishioner"}
        width={480}
        footer={
          <Button variant="secondary" onClick={() => setOpenReservation(null)}>
            Close
          </Button>
        }
      >
        {openReservation && (
          <dl className="space-y-3 text-[14px]">
            {openReservation.confession_schedules && (
              <DetailRow icon="calendar-outline" label="When">
                {parseLocalDate(openReservation.confession_schedules.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}{" "}
                · {formatConfessionRange(openReservation.confession_schedules.time_slot)}
              </DetailRow>
            )}
            {openReservation.user_profiles?.email && (
              <DetailRow icon="mail-outline" label="Email">
                <a href={`mailto:${openReservation.user_profiles.email}`} className="text-red-600 hover:underline dark:text-red-400">
                  {openReservation.user_profiles.email}
                </a>
              </DetailRow>
            )}
            {openReservation.user_profiles?.phone_number && (
              <DetailRow icon="call-outline" label="Phone">
                {formatPhone(openReservation.user_profiles.phone_number)}
              </DetailRow>
            )}
            {openReservation.notes && (
              <DetailRow icon="chatbubbles-outline" label="Notes">
                “{openReservation.notes}”
              </DetailRow>
            )}
          </dl>
        )}
      </Dialog>
    </>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cx("h-3 w-3 rounded", className)} />
      {label}
    </span>
  );
}

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: "calendar-outline" | "mail-outline" | "call-outline" | "chatbubbles-outline";
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-zinc-900/[0.03] p-3 dark:bg-white/[0.04]">
      <Icon name={icon} size={16} className="mt-0.5 text-red-500" />
      <div>
        <dt className="text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-400">{label}</dt>
        <dd className="mt-0.5 text-zinc-800 dark:text-zinc-200">{children}</dd>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------------------------------
 * Member
 * ---------------------------------------------------------------------------------------------- */

function MemberConfession() {
  const toast = useToast();
  const { parish, userId } = useDashboard();
  const priestName = confessionPriest(parish)?.name;
  const { week, loading, reload } = useWeekSchedule(parish!.id, true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mine, setMine] = useState<ConfessionReservationWithSchedule[]>([]);
  const [booking, setBooking] = useState<{ day: DaySchedule; slot: TimeSlot } | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState<ConfessionReservationWithSchedule | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  const loadMine = useCallback(async () => {
    const rows = await ConfessionService.getUserReservations(userId).catch(() => []);
    setMine(rows);
  }, [userId]);

  useEffect(() => {
    void loadMine();
  }, [loadMine]);

  const mineIds = new Set(mine.map((r) => r.id));
  const day = week[selectedIndex];
  const todayKey = localDateKey(new Date());
  const upcoming = mine
    .filter((r) => r.confession_schedules.date >= todayKey)
    .sort((a, b) =>
      `${a.confession_schedules.date}${a.confession_schedules.time_slot}`.localeCompare(
        `${b.confession_schedules.date}${b.confession_schedules.time_slot}`
      )
    );
  const upcomingList = useSeeMore(upcoming, 3);

  const book = async () => {
    if (!booking?.slot.scheduleId) return;
    setSubmitting(true);
    const result = await ConfessionService.makeReservation(booking.slot.scheduleId, userId, notes.trim() || undefined);
    setSubmitting(false);
    if (!result.success) {
      toast(result.error || "Failed to make reservation", "error");
      return;
    }
    toast("Reservation confirmed", "success");
    setBooking(null);
    setNotes("");
    await Promise.all([reload(), loadMine()]);
  };

  const cancel = async () => {
    if (!cancelling) return;
    setCancelLoading(true);
    const result = await ConfessionService.cancelReservation(cancelling.id, userId);
    setCancelLoading(false);
    if (!result.success) {
      toast(result.error || "Failed to cancel reservation", "error");
      return;
    }
    toast("Reservation cancelled", "success");
    setCancelling(null);
    await Promise.all([reload(), loadMine()]);
  };

  const openCount = (d: DaySchedule) => d.timeSlots.filter((s) => s.available && !s.reservedBy && !isSlotPassed(d, s)).length;

  return (
    <>
      <PageHeader
        eyebrow="Confession"
        title={priestName ? `Confession with ${priestName}` : "Book confession"}
        description="Choose a time that works for you. Each slot is 15 minutes."
      />

      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-8">
          {loading ? (
            <Skeleton className="h-[360px]" />
          ) : (
            <>
              <div className="grid grid-cols-7 gap-2">
                {week.map((d, index) => {
                  const count = openCount(d);
                  const active = index === selectedIndex;
                  return (
                    <button
                      key={d.dateString}
                      type="button"
                      onClick={() => setSelectedIndex(index)}
                      aria-pressed={active}
                      className={cx(
                        "flex flex-col items-center rounded-2xl py-3 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-red/50",
                        active
                          ? "bg-brand-gradient text-white shadow-md shadow-brand-red/25"
                          : "bg-zinc-900/[0.03] hover:bg-zinc-900/[0.06] dark:bg-white/[0.04] dark:hover:bg-white/[0.07]"
                      )}
                    >
                      <span className={cx("text-[10px] font-bold uppercase tracking-wider", active ? "text-white/80" : "text-zinc-400")}>
                        {d.dayName}
                      </span>
                      <span className={cx("font-display text-[22px] leading-tight", !active && "text-zinc-900 dark:text-white")}>
                        {d.date.getDate()}
                      </span>
                      <span
                        className={cx(
                          "text-[11px] font-semibold",
                          active ? "text-white/90" : count ? "text-emerald-600 dark:text-emerald-400" : "text-zinc-400"
                        )}
                      >
                        {count ? `${count} open` : "—"}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6">
                {day && (
                  <h3 className="mb-3 font-sans-semibold text-[14px] text-zinc-700 dark:text-zinc-300">
                    {day.date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                  </h3>
                )}
                {day &&
                day.timeSlots.some(
                  (s) => (s.available && !s.reservedBy && !isSlotPassed(day, s)) || (s.reservationId && mineIds.has(s.reservationId))
                ) ? (
                  <div className="grid grid-cols-6 gap-2 2xl:grid-cols-8">
                    {day.timeSlots.map((slot) => {
                      const isMine = !!slot.reservationId && mineIds.has(slot.reservationId);
                      const bookable = slot.available && !slot.reservedBy && !isSlotPassed(day, slot);
                      if (!isMine && !bookable) return null;
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => {
                            if (isMine) {
                              const reservation = mine.find((r) => r.id === slot.reservationId);
                              if (reservation) setCancelling(reservation);
                            } else {
                              setBooking({ day, slot });
                            }
                          }}
                          className={cx(
                            "h-11 rounded-2xl text-[13px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-red/50",
                            isMine
                              ? "bg-red-600 text-white"
                              : "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300"
                          )}
                        >
                          {isMine && <Icon name="checkmark" size={12} className="mr-1 inline" />}
                          {slot.time}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState compact icon="time-outline" title="No open times" message="Try another day this week." />
                )}
              </div>
            </>
          )}
        </Card>

        <Card className="col-span-4 self-start">
          <CardHeader eyebrow="Your bookings" title="Upcoming" />
          {upcoming.length === 0 ? (
            <EmptyState compact icon="calendar-outline" title="No upcoming confessions" />
          ) : (
            <>
              <ul className="space-y-2">
                {upcomingList.visible.map((r) => (
                  <li key={r.id} className="flex items-center gap-3 rounded-2xl bg-zinc-900/[0.03] p-3 dark:bg-white/[0.04]">
                    <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-2xl bg-red-600/10">
                      <span className="text-[9px] font-bold uppercase text-red-600 dark:text-red-400">
                        {parseLocalDate(r.confession_schedules.date).toLocaleDateString("en-US", { weekday: "short" })}
                      </span>
                      <span className="font-display text-[18px] leading-none text-zinc-900 dark:text-white">
                        {parseLocalDate(r.confession_schedules.date).getDate()}
                      </span>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-sans-semibold text-[13px] text-zinc-900 dark:text-white">
                        {formatConfessionRange(r.confession_schedules.time_slot)}
                      </span>
                      {r.notes && <span className="block truncate text-[12px] text-zinc-500">“{r.notes}”</span>}
                    </span>
                    <Button size="sm" variant="ghost" onClick={() => setCancelling(r)}>
                      Cancel
                    </Button>
                  </li>
                ))}
              </ul>
              {upcomingList.toggle}
            </>
          )}
        </Card>
      </div>

      <Dialog
        open={!!booking}
        onClose={() => setBooking(null)}
        eyebrow="Book confession"
        title={
          booking
            ? `${booking.day.date.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })} at ${booking.slot.time}`
            : ""
        }
        width={480}
        dismissible={!submitting}
        footer={
          <>
            <Button variant="ghost" onClick={() => setBooking(null)} disabled={submitting}>
              Cancel
            </Button>
            <Button icon="checkmark" loading={submitting} onClick={book}>
              Confirm booking
            </Button>
          </>
        }
      >
        <TextArea
          label="Notes for the priest (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything you'd like Father to know beforehand"
        />
      </Dialog>

      <ConfirmDialog
        open={!!cancelling}
        onClose={() => setCancelling(null)}
        onConfirm={cancel}
        loading={cancelLoading}
        destructive
        title="Cancel reservation?"
        message={
          cancelling
            ? `Your confession on ${parseLocalDate(cancelling.confession_schedules.date).toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              })} at ${formatConfessionRange(cancelling.confession_schedules.time_slot)} will be released.`
            : ""
        }
        confirmLabel="Yes, cancel"
      />
    </>
  );
}
