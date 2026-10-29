"use client";

import type { BulletinEvent } from "@parohia/shared";
import { motion } from "motion/react";
import { Icon, type IconName } from "../../../components/Icon";
import { eventKindStyle } from "../../../components/phone/tokens";
import { parseLocalDate } from "../../../lib/format";

/** Stored in `volunteers_needed` when a post accepts any number of volunteers. */
export const VOLUNTEERS_UNLIMITED = -1;
export const isUnlimitedVolunteers = (needed?: number | null) => typeof needed === "number" && needed < 0;

export const RESPONSE_LABEL: Record<string, string> = {
  interested: "Interested",
  unavailable: "Can't make it",
  attending: "Attending",
  volunteer: "Volunteering",
};

export const channelIcon = (channel: { is_default?: boolean; is_chant?: boolean }): IconName =>
  channel.is_chant ? "musical-notes-outline" : channel.is_default ? "home-outline" : "chatbubbles-outline";

export const isDatedPost = (event: Pick<BulletinEvent, "event_type">) =>
  event.event_type === "event" || event.event_type === "volunteer";

export function DateTile({ value }: { value: string }) {
  const date = parseLocalDate(value);
  return (
    <span className="flex h-[64px] w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-red-600/[0.07] dark:bg-red-500/[0.12]">
      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-red-600 dark:text-red-400">
        {date.toLocaleDateString("en-US", { month: "short" })}
      </span>
      <span className="font-display text-[24px] leading-none text-zinc-900 dark:text-white">{date.getDate()}</span>
      <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400">
        {date.toLocaleDateString("en-US", { weekday: "short" })}
      </span>
    </span>
  );
}

export function KindBadge({ kind }: { kind: BulletinEvent["event_type"] }) {
  const style = eventKindStyle[kind];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none"
      style={{ color: style.color, backgroundColor: style.tint }}
    >
      <Icon name={style.icon} size={11} />
      {style.label}
    </span>
  );
}

export function VolunteerProgress({ count, needed }: { count: number; needed?: number | null }) {
  if (isUnlimitedVolunteers(needed)) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.07] p-4">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
          <Icon name="people" size={20} />
        </span>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-emerald-700/80 dark:text-emerald-400/90">
            Signed up
          </p>
          <p className="font-sans-bold text-[22px] leading-tight text-zinc-900 dark:text-white">
            {count}
            <span className="ml-1 text-[14px] font-semibold text-zinc-500">{count === 1 ? "volunteer" : "volunteers"}</span>
          </p>
        </div>
      </div>
    );
  }
  const target = needed || 0;
  const ratio = target ? Math.min(1, count / target) : 0;
  const reached = !!target && count >= target;
  return (
    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.07] p-4">
      <div className="flex items-end justify-between">
        <p className="font-sans-bold text-[22px] leading-none text-zinc-900 dark:text-white">
          {count}
          <span className="ml-1 text-[14px] font-semibold text-zinc-500">of {target}</span>
        </p>
        <span className="text-[13px] font-bold text-emerald-700 dark:text-emerald-400">{Math.round(ratio * 100)}%</span>
      </div>
      <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-emerald-500/15">
        <motion.div
          className="h-full rounded-full bg-emerald-500"
          initial={{ width: 0 }}
          animate={{ width: `${ratio * 100}%` }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <p className="mt-2 flex items-center gap-1 text-[12px] text-zinc-600 dark:text-zinc-300">
        {reached && <Icon name="checkmark-circle" size={13} className="text-emerald-500" />}
        {reached ? "Volunteer goal reached" : `${target - count} more ${target - count === 1 ? "volunteer" : "volunteers"} needed`}
      </p>
    </div>
  );
}
