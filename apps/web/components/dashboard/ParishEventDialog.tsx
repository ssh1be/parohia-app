"use client";

import { ChantService, isChantServiceEvent, type ChantSignup, type ParishEvent } from "@parohia/shared";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Icon } from "../Icon";
import { Spinner, cx } from "../app/ui";
import { useToast } from "../app/toast";
import { eventStartDate, formatEventRange } from "../../lib/format";
import { useDashboard } from "../../app/dashboard/DashboardContext";
import { EventDetailDialog } from "./EventDetailDialog";

/** Google Calendar event details, with chant sign-ups for eligible services. */
export function ParishEventDialog({
  event,
  onClose,
  parishId,
  userId,
  chantEnabled,
}: {
  event: ParishEvent | null;
  onClose: () => void;
  parishId: string | null;
  userId: string;
  /** Admins and Chant channel subscribers can sign up. */
  chantEnabled: boolean;
}) {
  const toast = useToast();
  const { parish } = useDashboard();
  const [signups, setSignups] = useState<ChantSignup[]>([]);
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [shown, setShown] = useState(event);

  const isChant = !!event && !!parishId && chantEnabled && isChantServiceEvent(event.title, event.startTime, event.endTime);

  useEffect(() => {
    if (event) setShown(event);
  }, [event]);

  useEffect(() => {
    if (!event || !isChant || !parishId) {
      setSignups([]);
      return;
    }
    setLoading(true);
    ChantService.listSignups(parishId, event.id)
      .then(setSignups)
      .catch(() => setSignups([]))
      .finally(() => setLoading(false));
  }, [event, isChant, parishId]);

  const signedUp = signups.some((s) => s.userId === userId);

  const toggle = async () => {
    if (!event || !parishId || toggling) return;
    const previous = signups;
    setSignups(
      signedUp
        ? signups.filter((s) => s.userId !== userId)
        : [...signups, { id: `optimistic-${userId}`, userId, name: "You", createdAt: new Date().toISOString() }]
    );
    setToggling(true);
    const result = signedUp
      ? await ChantService.removeSignup({ parishId, calendarEventId: event.id, userId })
      : await ChantService.signUp({ parishId, calendarEventId: event.id, userId, eventTitle: event.title, eventStart: event.startTime });
    if (!result.success) {
      setSignups(previous);
      toast(result.error || "Couldn't update your chant sign-up", "error");
    } else {
      setSignups(await ChantService.listSignups(parishId, event.id).catch(() => previous));
    }
    setToggling(false);
  };

  const date = shown ? eventStartDate(shown.startTime) : null;

  return (
    <EventDetailDialog
      open={!!event}
      onClose={onClose}
      eyebrow={parish?.name || "Parish event"}
      title={shown?.title || "Untitled event"}
      when={shown ? (shown.startTime.includes("T") ? formatEventRange(shown.startTime, shown.endTime) : "All day") : undefined}
      whenDetail={date?.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
      location={shown?.location}
      description={shown?.description}
    >
      {isChant && (
        <ChantersSection
          key={event?.id}
          signups={signups}
          loading={loading}
          toggling={toggling}
          signedUp={signedUp}
          userId={userId}
          onToggle={toggle}
        />
      )}
    </EventDetailDialog>
  );
}

function ChantersSection({
  signups,
  loading,
  toggling,
  signedUp,
  userId,
  onToggle,
}: {
  signups: ChantSignup[];
  loading: boolean;
  toggling: boolean;
  signedUp: boolean;
  userId: string;
  onToggle: () => void;
}) {
  const busy = loading || toggling;
  const [open, setOpen] = useState(false);
  return (
    <section className="mt-6">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-2xl border border-zinc-100 bg-zinc-50 px-3.5 py-3 text-left outline-none transition-colors hover:bg-zinc-100/70 focus-visible:ring-2 focus-visible:ring-brand-red/50 dark:border-white/[0.06] dark:bg-white/[0.04] dark:hover:bg-white/[0.06]"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-600/10 text-red-600 dark:text-red-400">
          <Icon name="musical-notes" size={17} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-sans-semibold text-[15px] text-zinc-900 dark:text-white">Chanters</span>
          <span className="mt-0.5 block text-[12px] text-zinc-500 dark:text-zinc-400">
            {loading && signups.length === 0
              ? "Loading…"
              : signedUp
                ? `You and ${signups.length - 1} ${signups.length - 1 === 1 ? "other" : "others"} signed up`
                : `${signups.length} ${signups.length === 1 ? "person" : "people"} signed up`}
          </span>
        </span>
        {loading && signups.length === 0 ? (
          <Spinner size={14} className="text-zinc-400" />
        ) : (
          <Icon name="chevron-down" size={16} className={cx("text-zinc-400 transition-transform duration-200", open && "rotate-180")} />
        )}
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
            className="overflow-hidden"
          >
            <div className="mt-3 overflow-hidden rounded-3xl border border-zinc-100 bg-zinc-50 dark:border-white/[0.06] dark:bg-white/[0.04]">
              {loading && signups.length === 0 ? (
                <div className="flex justify-center py-6">
                  <Spinner size={16} className="text-zinc-400" />
                </div>
              ) : signups.length === 0 ? (
                <div className="flex flex-col items-center px-5 py-6 text-center">
                  <span className="mb-2.5 flex h-11 w-11 items-center justify-center rounded-2xl bg-red-600/10 text-red-600 dark:text-red-400">
                    <Icon name="musical-notes-outline" size={20} />
                  </span>
                  <p className="font-sans-semibold text-[14px] text-zinc-900 dark:text-white">Be the first to chant</p>
                  <p className="mt-1 text-[12px] leading-[17px] text-zinc-500 dark:text-zinc-400">
                    Let others know you’ll be singing for this service.
                  </p>
                </div>
              ) : (
                <ul>
                  <AnimatePresence initial={false}>
                    {signups.map((person, i) => {
                      const isYou = person.userId === userId;
                      return (
                        <motion.li
                          key={person.userId}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className={cx("flex items-center gap-3 px-4 py-3", i > 0 && "border-t border-zinc-100 dark:border-white/[0.06]")}
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-600/10 font-sans-bold text-[12px] text-red-700 dark:text-red-300">
                            {(person.name.trim()[0] || "?").toUpperCase()}
                          </span>
                          <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-zinc-900 dark:text-white">
                            {person.name}
                          </span>
                          {isYou && (
                            <>
                              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                                You
                              </span>
                              <button
                                type="button"
                                onClick={onToggle}
                                disabled={busy}
                                aria-label="Remove me from chanters"
                                className="flex h-7 min-w-[72px] items-center justify-center gap-1 rounded-full bg-red-600/10 px-2.5 text-[11px] font-bold text-red-700 transition-opacity hover:bg-red-600/15 disabled:opacity-50 dark:text-red-300"
                              >
                                {toggling ? (
                                  <Spinner size={12} />
                                ) : (
                                  <>
                                    <Icon name="close-circle" size={13} />
                                    Remove
                                  </>
                                )}
                              </button>
                            </>
                          )}
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            <div className="mt-4 min-h-12">
              {!signedUp ? (
                <button
                  type="button"
                  onClick={onToggle}
                  disabled={busy}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-red-500/35 bg-red-600/[0.1] font-sans-bold text-[15px] text-red-700 outline-none transition-[background-color,transform] hover:bg-red-600/[0.14] focus-visible:ring-2 focus-visible:ring-brand-red/50 active:scale-[0.99] disabled:opacity-50 dark:text-red-300"
                >
                  {toggling ? (
                    <Spinner size={16} />
                  ) : (
                    <>
                      <Icon name="hand-left" size={18} />I can chant
                    </>
                  )}
                </button>
              ) : (
                <div className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.08] px-4 font-sans-semibold text-[14px] text-emerald-700 dark:text-emerald-400">
                  <Icon name="checkmark-circle" size={18} />
                  You’re signed up to chant
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
