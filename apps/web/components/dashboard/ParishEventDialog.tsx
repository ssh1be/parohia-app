"use client";

import { ChantService, isChantServiceEvent, type ChantSignup, type ParishEvent } from "@parohia/shared";
import { useEffect, useState } from "react";
import { Icon } from "../Icon";
import { Avatar, Button, Dialog, Pill, Spinner } from "../app/ui";
import { useToast } from "../app/toast";
import { eventStartDate, formatEventRange } from "../../lib/format";

const stripHtml = (value: string) =>
  value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();

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
  const [signups, setSignups] = useState<ChantSignup[]>([]);
  const [loading, setLoading] = useState(false);
  const [toggling, setToggling] = useState(false);

  const isChant =
    !!event && !!parishId && chantEnabled && isChantServiceEvent(event.title, event.startTime, event.endTime);

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
      : await ChantService.signUp({
          parishId,
          calendarEventId: event.id,
          userId,
          eventTitle: event.title,
          eventStart: event.startTime,
        });
    if (!result.success) {
      setSignups(previous);
      toast(result.error || "Couldn't update your chant sign-up", "error");
    } else {
      setSignups(await ChantService.listSignups(parishId, event.id).catch(() => previous));
      toast(signedUp ? "Removed from chanters" : "You're signed up to chant", "success");
    }
    setToggling(false);
  };

  const date = event ? eventStartDate(event.startTime) : null;

  return (
    <Dialog
      open={!!event}
      onClose={onClose}
      eyebrow="Parish calendar"
      title={event?.title || "Untitled event"}
      width={600}
      footer={
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      }
    >
      {event && date && (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <Pill icon="calendar-outline">
              {date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </Pill>
            <Pill icon="time-outline">{formatEventRange(event.startTime, event.endTime)}</Pill>
            {event.location && <Pill icon="location-outline">{event.location}</Pill>}
          </div>

          {event.description && (
            <p className="whitespace-pre-line text-[14px] leading-relaxed text-zinc-600 dark:text-zinc-300">
              {stripHtml(event.description)}
            </p>
          )}

          {isChant && (
            <section className="rounded-3xl border border-purple-200/70 bg-purple-50/60 p-5 dark:border-purple-500/20 dark:bg-purple-500/[0.07]">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-300">
                    <Icon name="musical-notes" size={18} />
                  </span>
                  <div>
                    <p className="font-sans-bold text-[15px] text-zinc-900 dark:text-white">Chanters</p>
                    <p className="text-[13px] text-zinc-500 dark:text-zinc-400">
                      {signups.length === 0
                        ? "No one has signed up yet."
                        : `${signups.length} ${signups.length === 1 ? "person" : "people"} signed up`}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={signedUp ? "danger" : "primary"}
                  icon={signedUp ? "close-circle-outline" : "musical-notes-outline"}
                  loading={toggling}
                  onClick={toggle}
                >
                  {signedUp ? "Withdraw" : "Sign up to chant"}
                </Button>
              </div>
              {loading ? (
                <div className="mt-4 flex items-center gap-2 text-[13px] text-zinc-500">
                  <Spinner size={14} /> Loading sign-ups…
                </div>
              ) : (
                signups.length > 0 && (
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {signups.map((s) => (
                      <li
                        key={s.id}
                        className="flex items-center gap-2 rounded-full bg-white py-1 pl-1 pr-3 text-[13px] font-semibold text-zinc-700 shadow-sm dark:bg-white/[0.06] dark:text-zinc-200"
                      >
                        <Avatar name={s.name} size={24} />
                        {s.userId === userId ? "You" : s.name}
                      </li>
                    ))}
                  </ul>
                )
              )}
            </section>
          )}
        </div>
      )}
    </Dialog>
  );
}
