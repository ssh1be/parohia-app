"use client";

import {
  BulletinService,
  ChannelService,
  ConfessionService,
  fetchParishEventsForMultipleDays,
  isChantServiceEvent,
  type BulletinEvent,
  type ConfessionReservationWithSchedule,
  type OrthodoxCalendarData,
  type ParishEvent,
} from "@parohia/shared";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Icon } from "../../components/Icon";
import { Button, Card, CardHeader, EmptyState, Skeleton, useSeeMore } from "../../components/app/ui";
import { useToast } from "../../components/app/toast";
import { CalendarSetupCallout, CalendarSetupDialog } from "../../components/dashboard/CalendarSetupDialog";
import { PersonalEventDialog, type PersonalDetail } from "../../components/dashboard/EventDetailDialog";
import { ParishEventDialog } from "../../components/dashboard/ParishEventDialog";
import {
  LiturgicalDayCard,
  ScheduleList,
  bulletinDetail,
  bulletinItem,
  confessionDetail,
  confessionItem,
  parishEventItem,
  type ScheduleItem,
} from "../../components/dashboard/Schedule";
import { eventStartDate, firstName, formatEventRange, isSameDay, localDateKey } from "../../lib/format";
import { getOrthodoxDay } from "../../lib/orthocal";
import { useDashboard } from "./DashboardContext";
import { PageHeader } from "./DashboardShell";

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
};

type ConfessionWithName = ConfessionReservationWithSchedule & { personName?: string };

export default function TodayPage() {
  const toast = useToast();
  const { userId, profile, parish, isAdmin, tradition, chantSubscribed, setChantSubscribed, setParish } = useDashboard();
  const today = useMemo(() => new Date(), []);

  const [orthodox, setOrthodox] = useState<OrthodoxCalendarData | null>(null);
  const [orthodoxLoading, setOrthodoxLoading] = useState(true);
  const [weekEvents, setWeekEvents] = useState<ParishEvent[]>([]);
  const [confessions, setConfessions] = useState<ConfessionWithName[]>([]);
  const [personal, setPersonal] = useState<BulletinEvent[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [activeEvent, setActiveEvent] = useState<ParishEvent | null>(null);
  const [activePersonal, setActivePersonal] = useState<PersonalDetail | null>(null);
  const [setupOpen, setSetupOpen] = useState(false);
  const [joiningChant, setJoiningChant] = useState(false);

  useEffect(() => {
    setOrthodoxLoading(true);
    getOrthodoxDay(today, tradition)
      .then(setOrthodox)
      .finally(() => setOrthodoxLoading(false));
  }, [today, tradition]);

  const loadSchedule = useCallback(async () => {
    setScheduleLoading(true);
    try {
      const todayKey = localDateKey(today);
      const [events, reservations, personalEvents] = await Promise.all([
        parish?.parish_calendar_id ? fetchParishEventsForMultipleDays(today, 7, userId) : Promise.resolve([]),
        !parish
          ? Promise.resolve([] as ConfessionReservationWithSchedule[])
          : isAdmin
            ? ConfessionService.getParishReservations(parish.id, today).catch(() => [])
            : ConfessionService.getUserReservations(userId)
                .then((rows) => rows.filter((r) => r.confession_schedules?.date === todayKey))
                .catch(() => []),
        BulletinService.getUserPersonalEvents(userId, today).catch(() => []),
      ]);
      setWeekEvents(events);
      setPersonal(personalEvents);

      const named: ConfessionWithName[] = isAdmin
        ? await Promise.all(
            reservations.map(async (r) => {
              const details = await ConfessionService.getReservationDetails(r.schedule_id).catch(() => null);
              return { ...r, personName: details?.user_profiles?.full_name as string | undefined };
            })
          )
        : reservations;
      setConfessions(named);
    } finally {
      setScheduleLoading(false);
    }
  }, [isAdmin, parish, today, userId]);

  useEffect(() => {
    void loadSchedule();
  }, [loadSchedule]);

  const chantEnabled = isAdmin || chantSubscribed;
  const todayEvents = weekEvents.filter((e) => isSameDay(eventStartDate(e.startTime), today));
  const upcomingChant = chantEnabled ? weekEvents.filter((e) => isChantServiceEvent(e.title, e.startTime, e.endTime)) : [];
  const chantList = useSeeMore(upcomingChant, 3);

  const items: ScheduleItem[] = [
    ...todayEvents.map((e) =>
      parishEventItem(e, () => setActiveEvent(e), chantEnabled && isChantServiceEvent(e.title, e.startTime, e.endTime))
    ),
    ...confessions.map((c) => {
      const title = isAdmin
        ? `Confession with ${c.personName || "a parishioner"}`
        : parish?.priest_name
          ? `Confession with ${parish.priest_name}`
          : "Confession";
      return confessionItem(c, title, () => setActivePersonal(confessionDetail(c, title)));
    }),
    ...personal.map((e) => bulletinItem(e, () => setActivePersonal(bulletinDetail(e)))),
  ];

  const joinChant = async () => {
    if (!parish) return;
    setJoiningChant(true);
    try {
      const channels = await ChannelService.listChannels(parish.id);
      const chant = channels.find((c) => c.is_chant);
      if (!chant) throw new Error("Chant channel not found");
      const result = await ChannelService.subscribe(chant.id, userId);
      if (!result.success) throw new Error(result.error);
      setChantSubscribed(true);
      toast("You joined the Chant channel", "success");
    } catch (error) {
      toast((error as Error).message || "Couldn't join the Chant channel", "error");
    } finally {
      setJoiningChant(false);
    }
  };

  const name = firstName(profile?.full_name);

  return (
    <>
      <PageHeader
        eyebrow={today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        title={name ? `${greeting()}, ${name}` : greeting()}
        description={parish ? parish.name : "You haven't joined a parish yet."}
      />

      {isAdmin && parish && !parish.parish_calendar_id && (
        <div className="mb-6">
          <CalendarSetupCallout onSetup={() => setSetupOpen(true)} />
        </div>
      )}

      {!parish && (
        <div className="mb-6">
          <Card className="flex items-center gap-5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-600/10 text-red-600 dark:text-red-400">
              <Icon name="business-outline" size={22} />
            </span>
            <div className="flex-1">
              <p className="font-sans-bold text-[15px] text-zinc-900 dark:text-white">Connect with your parish</p>
              <p className="text-[13px] text-zinc-500 dark:text-zinc-400">
                Join your parish to see services, the bulletin, and confession times.
              </p>
            </div>
            <Link href="/dashboard/parish">
              <Button iconRight="arrow-forward">Find a parish</Button>
            </Link>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-12 gap-6">
        <LiturgicalDayCard className="col-span-7" data={orthodox} loading={orthodoxLoading} date={today} />

        <div className="col-span-5 space-y-6">
          <Card>
            <CardHeader
              eyebrow="Today"
              title="Your schedule"
              action={
                <Link href="/dashboard/calendar" className="mt-1 text-[13px] font-semibold text-red-600 hover:underline dark:text-red-400">
                  Open calendar
                </Link>
              }
            />
            <ScheduleList
              items={items}
              loading={scheduleLoading}
              emptyTitle="A quiet day"
              emptyMessage={
                parish?.parish_calendar_id || !parish
                  ? "No services, confessions, or events on your schedule today."
                  : "Your parish hasn't connected a calendar yet."
              }
            />
          </Card>

          {parish && chantEnabled && (
            <Card>
              <CardHeader eyebrow="This week" title="Services to chant" />
              {scheduleLoading ? (
                <Skeleton className="h-28" />
              ) : upcomingChant.length === 0 ? (
                <EmptyState compact icon="musical-notes-outline" title="No upcoming services" />
              ) : (
                <>
                  <ul className="space-y-1.5">
                    {chantList.visible.map((event) => {
                      const date = eventStartDate(event.startTime);
                      return (
                        <li key={event.id}>
                          <button
                            type="button"
                            onClick={() => setActiveEvent(event)}
                            className="flex w-full items-center gap-3 rounded-2xl p-2.5 text-left transition-colors hover:bg-zinc-900/[0.04] dark:hover:bg-white/[0.05]"
                          >
                            <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-2xl bg-red-600/10">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                                {date.toLocaleDateString("en-US", { weekday: "short" })}
                              </span>
                              <span className="font-display text-[18px] leading-none text-zinc-900 dark:text-white">{date.getDate()}</span>
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-sans-semibold text-[14px] text-zinc-900 dark:text-white">
                                {event.title}
                              </span>
                              <span className="text-[12px] text-zinc-500 dark:text-zinc-400">
                                {formatEventRange(event.startTime, event.endTime)}
                              </span>
                            </span>
                            <Icon name="chevron-forward" size={14} className="text-zinc-300 dark:text-zinc-600" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  {chantList.toggle}
                </>
              )}
            </Card>
          )}

          {parish && !chantEnabled && (
            <Card className="relative overflow-hidden">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-red-600/10 text-red-600 dark:text-red-400">
                  <Icon name="musical-notes" size={20} />
                </span>
                <div className="flex-1">
                  <p className="font-sans-bold text-[15px] text-zinc-900 dark:text-white">Chant at services</p>
                  <p className="mt-0.5 text-[13px] leading-5 text-zinc-500 dark:text-zinc-400">
                    Join the Chant channel to see upcoming services and sign up to help sing.
                  </p>
                  <Button size="sm" className="mt-3" icon="add" loading={joiningChant} onClick={joinChant}>
                    Join Chant channel
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

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
