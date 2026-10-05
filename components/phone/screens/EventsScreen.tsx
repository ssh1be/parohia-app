"use client";

import { AnimatePresence, motion } from "motion/react";
import { useId, useState } from "react";
import { Icon } from "../../Icon";
import { PARISH } from "../data";
import { cardSpring, eventKindStyle, palette, type EventKind } from "../tokens";
import { EmptyState, Pressable, SegmentedControl, TabBar, type TabKey } from "../ui";

type Tab = "bulletin" | "confession";
type Filter = "all" | "announcement" | "event" | "volunteer";

export interface Post {
  id: string;
  kind: Exclude<EventKind, "confession" | "parish">;
  title: string;
  description: string;
  posted: string;
  date?: { month: string; day: number; weekday: string };
  time?: string;
  location?: string;
  volunteers?: { count: number; needed: number };
  attending?: boolean;
}

export const POSTS: Post[] = [
  {
    id: "delay",
    kind: "announcement",
    title: "Bible study delayed until 5 PM today",
    description: "Sorry for the inconvenience. We're on the Labor Day schedule this weekend.",
    posted: "Just now",
  },
  {
    id: "festival",
    kind: "volunteer",
    title: "Help set up for the Greek Festival",
    description: "We need volunteers to help set up before the festival begins on Saturday!",
    posted: "3d ago",
    date: { month: "Aug", day: 30, weekday: "Sun" },
    time: "10:00 AM",
    location: "Church Property",
    volunteers: { count: 1, needed: 10 },
  },
  {
    id: "picnic",
    kind: "event",
    title: "Back to Sunday School Picnic",
    description: "Families are welcome after Divine Liturgy. Bring a dish to share.",
    posted: "5d ago",
    date: { month: "Sep", day: 6, weekday: "Sun" },
    time: "12:30 PM",
    location: "Church Grounds",
    attending: true,
  },
];

const FILTERS: { key: Filter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "announcement", label: "Announcements" },
  { key: "event", label: "Events" },
  { key: "volunteer", label: "Volunteer" },
];

export function EventsScreen({
  initialTab = "bulletin",
  admin = false,
  onTab,
  onOpenPost,
}: {
  initialTab?: Tab;
  admin?: boolean;
  onTab?: (tab: TabKey) => void;
  onOpenPost?: (post: Post) => void;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);

  return (
    <>
      <div className="absolute inset-0 flex flex-col" style={{ paddingTop: 59 }}>
        <div className="px-6 pb-4 pt-4">
          <h3 className="font-display text-[40px] leading-[44px] text-gray-900 dark:text-white">Events</h3>
          <p className="mt-1 font-sans text-[15px] text-gray-500 dark:text-gray-400">News and confession at {PARISH.name}</p>
        </div>
        <div className="px-5" data-spot="confession-tab">
          <SegmentedControl
            value={tab}
            onChange={setTab}
            segments={[
              { key: "bulletin", label: "Bulletin Board", icon: tab === "bulletin" ? "pin" : "pin-outline" },
              { key: "confession", label: "Confession", icon: tab === "confession" ? "time" : "time-outline" },
            ]}
          />
        </div>
        <div className="relative flex-1">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={tab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }} className="absolute inset-0">
              {tab === "bulletin" ? <Bulletin admin={admin} onOpenPost={onOpenPost} /> : <Confession />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <TabBar active="events" onChange={onTab} />
    </>
  );
}

function Bulletin({ admin, onOpenPost }: { admin: boolean; onOpenPost?: (post: Post) => void }) {
  const [filter, setFilter] = useState<Filter>("all");
  const posts = filter === "all" ? POSTS : POSTS.filter((p) => p.kind === filter);

  return (
    <>
      <div data-scroll className="no-scrollbar absolute inset-0 overflow-y-auto overscroll-contain" style={{ paddingBottom: 34 + 64 + 12 + 32 + (admin ? 56 : 0) }}>
        <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 pb-2 pt-4">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            const count = f.key === "all" ? POSTS.length : POSTS.filter((p) => p.kind === f.key).length;
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                aria-pressed={active}
                className={`flex h-9 shrink-0 items-center rounded-full border px-4 transition-colors duration-200 ${
                  active ? "border-gray-900 bg-gray-900 dark:border-white dark:bg-white" : "border-gray-200 dark:border-white/10"
                }`}
              >
                <span className={`font-sans-semibold text-[13px] ${active ? "text-white dark:text-gray-900" : "text-gray-600 dark:text-gray-300"}`}>{f.label}</span>
                <span className={`ml-1.5 font-sans-semibold text-[12px] ${active ? "text-white/60 dark:text-gray-500" : "text-gray-400"}`}>{count}</span>
              </button>
            );
          })}
        </div>

        <div className="px-5 pt-3">
          <AnimatePresence mode="popLayout" initial={false}>
            {posts.length === 0 ? (
              <EmptyState icon="newspaper-outline" title="Nothing here" message="No posts match this filter." />
            ) : (
              posts.map((post, index) => (
                <motion.div
                  key={post.id}
                  layout
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ ...cardSpring, delay: Math.min(index, 6) * 0.05 }}
                  className="mb-3"
                >
                  <PostCard post={post} onOpen={onOpenPost} />
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>

      {admin && (
        <motion.div
          data-spot="new-post"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", damping: 20, stiffness: 240, delay: 0.2 }}
          className="absolute right-5 z-10 rounded-full"
          style={{ bottom: 34 + 64 + 16 }}
        >
          <Pressable scaleTo={0.94} className="flex h-14 items-center rounded-full bg-red-600 pl-5 pr-6 text-white shadow-[0_8px_16px_rgba(220,38,38,0.35)]">
            <Icon name="add" size={22} />
            <span className="ml-1.5 font-sans-bold text-[15px]">New post</span>
          </Pressable>
        </motion.div>
      )}
    </>
  );
}

export function PostCard({
  post,
  onOpen,
  className = "border-gray-100 bg-white dark:border-white/[0.06] dark:bg-white/[0.04]",
}: {
  post: Post;
  onOpen?: (post: Post) => void;
  /** Surface classes (border, background, shadow) for the card. */
  className?: string;
}) {
  const kind = eventKindStyle[post.kind];
  return (
    <Pressable
      scaleTo={0.985}
      onClick={() => onOpen?.(post)}
      data-spot={post.kind === "volunteer" ? "volunteer-card" : post.kind === "announcement" ? "announcement-card" : undefined}
      className={`block w-full rounded-3xl border p-5 ${className}`}
    >
      <span className="mb-3 flex items-center justify-between">
        <span className="flex items-center rounded-full py-1 pl-1.5 pr-2.5" style={{ backgroundColor: kind.tint }}>
          <Icon name={kind.icon} size={11} color={kind.color} />
          <span className="ml-1 font-sans-bold text-[11px]" style={{ color: kind.color }}>
            {kind.label}
          </span>
        </span>
        <span className="font-sans text-xs text-gray-400 dark:text-gray-500">{post.posted}</span>
      </span>

      <span className="flex">
        {post.date && (
          <span className="mr-4 flex min-h-[68px] w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-red-600/[0.08] py-2 dark:bg-red-500/[0.12]">
            <span className="font-sans-bold text-[10px] uppercase tracking-[1.2px] text-red-600 dark:text-red-400">{post.date.month}</span>
            <span className="font-display text-[26px] leading-[28px] text-gray-900 dark:text-white">{post.date.day}</span>
            <span className="font-sans-medium text-[10px] text-gray-500 dark:text-gray-400">{post.date.weekday}</span>
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block font-display text-[23px] leading-[27px] text-gray-900 dark:text-white">{post.title}</span>
          <span className="mt-1.5 line-clamp-2 block font-sans text-[14px] leading-5 text-gray-600 dark:text-gray-300">{post.description}</span>
          {(post.time || post.location) && (
            <span className="mt-2.5 flex flex-wrap">
              {post.time && (
                <span className="mb-1 mr-3 flex items-center font-sans-medium text-xs text-gray-500 dark:text-gray-400">
                  <Icon name="time-outline" size={13} color={palette.gray400} />
                  <span className="ml-1">{post.time}</span>
                </span>
              )}
              {post.location && (
                <span className="mb-1 flex items-center font-sans-medium text-xs text-gray-500 dark:text-gray-400">
                  <Icon name="location-outline" size={13} color={palette.gray400} />
                  <span className="ml-1">{post.location}</span>
                </span>
              )}
            </span>
          )}
        </span>
      </span>

      {(post.volunteers || post.attending) && (
        <span className="mt-4 flex items-center border-t border-gray-100 pt-3 dark:border-white/[0.06]">
          {post.attending && (
            <span className="flex items-center font-sans-semibold text-xs text-emerald-600 dark:text-emerald-400">
              <Icon name="checkmark-circle" size={15} color={palette.green} />
              <span className="ml-1">Attending</span>
            </span>
          )}
          {post.volunteers && (
            <span className="flex flex-1 items-center">
              <Icon name="people" size={14} color={palette.green} />
              <span className="ml-1 font-sans-semibold text-xs text-emerald-600 dark:text-emerald-400">
                {post.volunteers.count}/{post.volunteers.needed} volunteers
              </span>
              <span className="ml-3 h-1.5 flex-1 overflow-hidden rounded-full bg-emerald-500/15">
                <span className="block h-1.5 rounded-full bg-emerald-500" style={{ width: `${(post.volunteers.count / post.volunteers.needed) * 100}%` }} />
              </span>
            </span>
          )}
        </span>
      )}
    </Pressable>
  );
}

type SlotStatus = "open" | "reserved" | "closed";

const WEEK = [
  { label: "Sat", date: 29, times: ["6:00", "6:15", "6:30", "6:45"] },
  { label: "Sun", date: 30, times: ["9:00", "9:15", "9:30", "9:45", "10:00", "10:15", "10:30", "10:45", "11:00"] },
  { label: "Mon", date: 31, times: [] },
  { label: "Tue", date: 1, times: [] },
  { label: "Wed", date: 2, times: ["5:30", "5:45", "6:00"] },
  { label: "Thu", date: 3, times: ["6:00", "6:15", "6:30", "6:45", "7:00", "7:15"] },
  { label: "Fri", date: 4, times: [] },
];

const FULL_DATES: Record<number, string> = {
  29: "Saturday, August 29",
  30: "Sunday, August 30",
  31: "Monday, August 31",
  1: "Tuesday, September 1",
  2: "Wednesday, September 2",
  3: "Thursday, September 3",
  4: "Friday, September 4",
};

const initialStatus = (date: number, i: number): SlotStatus => {
  const seed = (date * 7 + i * 3) % 9;
  if (seed === 2 || seed === 5) return "reserved";
  if (seed === 7) return "closed";
  return "open";
};

/** Confession booking, ported from the Events tab's confession view. */
export function Confession() {
  const [day, setDay] = useState(30);
  const [mine, setMine] = useState<string | null>("30-9:00");
  const selected = WEEK.find((d) => d.date === day)!;
  const layoutId = useId();

  return (
    <div data-scroll className="no-scrollbar absolute inset-0 overflow-y-auto overscroll-contain" style={{ paddingBottom: 34 + 64 + 12 + 32 }}>
      <div className="px-5 pt-5">
        <div className="flex items-center rounded-3xl border border-gray-100 bg-white p-5 dark:border-white/[0.06] dark:bg-white/[0.04]">
          <span className="mr-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-600/10">
            <Icon name="time" size={22} color={palette.accent} />
          </span>
          <div className="flex-1">
            <p className="font-display text-[24px] leading-[28px] text-gray-900 dark:text-white">Confession with {PARISH.priest}</p>
            <p className="mt-0.5 font-sans text-[13px] text-gray-500 dark:text-gray-400">Choose a time to schedule your confession</p>
          </div>
        </div>
      </div>

      <div data-spot="week-strip" className="no-scrollbar flex gap-2.5 overflow-x-auto px-5 py-5">
        {WEEK.map((d) => {
          const isSelected = d.date === day;
          const open = d.times.length > 0;
          return (
            <Pressable
              key={d.date}
              scaleTo={0.94}
              onClick={() => setDay(d.date)}
              aria-pressed={isSelected}
              className={`relative flex w-[60px] shrink-0 flex-col items-center rounded-[22px] border py-3 ${
                isSelected ? "border-red-600" : "border-gray-100 bg-white dark:border-white/[0.06] dark:bg-white/[0.04]"
              }`}
            >
              {isSelected && <motion.span layoutId={`day-${layoutId}`} transition={{ type: "spring", damping: 20, stiffness: 260 }} className="absolute inset-0 rounded-[22px] bg-red-600" />}
              <span className={`relative font-sans-semibold text-[11px] uppercase tracking-[1px] ${isSelected ? "text-white/80" : "text-gray-500 dark:text-gray-400"}`}>{d.label}</span>
              <span className={`relative mt-0.5 font-display text-[26px] leading-[30px] ${isSelected ? "text-white" : "text-gray-900 dark:text-white"}`}>{d.date}</span>
              <span className="relative mt-0.5 flex h-3 items-center">
                {open && <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? "bg-white" : "bg-emerald-500"}`} />}
              </span>
            </Pressable>
          );
        })}
      </div>

      <div className="px-5">
        <p className="font-display text-[24px] leading-[28px] text-gray-900 dark:text-white">{FULL_DATES[day]}</p>
        <p className="mt-0.5 font-sans text-[13px] text-gray-500 dark:text-gray-400">Available times</p>
        <div className="mb-4 mt-3 flex">
          {[
            { label: "Open", color: palette.green },
            { label: "Reserved", color: palette.gray400 },
            { label: "Unavailable", color: "#9CA3AF55" },
          ].map((item) => (
            <span key={item.label} className="mr-4 flex items-center">
              <span className="mr-1.5 h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="font-sans-medium text-[11px] text-gray-500 dark:text-gray-400">{item.label}</span>
            </span>
          ))}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={day} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            {selected.times.length === 0 ? (
              <EmptyState icon="time-outline" title="No times listed" message="There are no confession times for this day." />
            ) : (
              <div data-spot="slot-grid" className="grid grid-cols-3 gap-x-2.5 gap-y-2.5">
                {selected.times.map((time, i) => {
                  const id = `${day}-${time}`;
                  const isMine = mine === id;
                  const status = initialStatus(day, i);
                  const disabled = !isMine && status !== "open";
                  let caption = "Open";
                  let box = "border-emerald-500/30 bg-white dark:bg-white/[0.04]";
                  let icon: "checkmark-circle" | "person" | "close-circle-outline" = "checkmark-circle";
                  let iconColor = palette.green;
                  let captionClass = "text-emerald-600 dark:text-emerald-400";
                  if (isMine) {
                    caption = "Yours";
                    box = "border-red-500/30 bg-red-600/[0.08]";
                    icon = "person";
                    iconColor = palette.accentSoft;
                    captionClass = "text-red-600 dark:text-red-400";
                  } else if (status === "reserved") {
                    caption = "Reserved";
                    box = "border-transparent bg-gray-100 dark:bg-white/[0.06]";
                    icon = "person";
                    iconColor = palette.gray400;
                    captionClass = "text-gray-500 dark:text-gray-400";
                  } else if (status === "closed") {
                    caption = "Closed";
                    box = "border-dashed border-gray-300 dark:border-white/10";
                    icon = "close-circle-outline";
                    iconColor = palette.gray400;
                    captionClass = "text-gray-500 dark:text-gray-400";
                  }
                  return (
                    <Pressable
                      key={id}
                      scaleTo={0.94}
                      disabled={disabled}
                      onClick={() => setMine(isMine ? null : id)}
                      data-spot={isMine ? "your-slot" : undefined}
                      aria-label={`${time}, ${caption}`}
                      className={`flex flex-col items-center rounded-2xl border py-3.5 transition-colors duration-200 ${box} ${disabled ? "cursor-default" : ""}`}
                    >
                      <motion.span key={caption} initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: "spring", damping: 14, stiffness: 300 }}>
                        <Icon name={icon} size={16} color={iconColor} />
                      </motion.span>
                      <span className="mt-1 font-sans-bold text-[15px] text-gray-900 dark:text-white">{time}</span>
                      <span className={`mt-0.5 font-sans-medium text-[11px] ${captionClass}`}>{caption}</span>
                    </Pressable>
                  );
                })}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
