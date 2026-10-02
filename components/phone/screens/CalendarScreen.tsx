"use client";

import { AnimatePresence, motion } from "motion/react";
import { useId, useState } from "react";
import { Icon } from "../../Icon";
import { fastingFor, PARISH, SEPTEMBER_10, type LiturgicalDay } from "../data";
import { fastingStyle, palette } from "../tokens";
import {
  EmptyState,
  FastingBadge,
  LargeHeader,
  ReadingCards,
  ReminderBell,
  Rise,
  ScreenScroll,
  SectionHeader,
  SegmentedControl,
  TabBar,
  TimelineItem,
  type TabKey,
} from "../ui";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS = ["S", "M", "T", "W", "T", "F", "S"];
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const FASTING_TEXT = { none: "No Fast", fish: "Fast Day (Fish Allowed)", wine: "Fast Day (Wine and Oil Allowed)", strict: "Fast Day" } as const;

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

function monthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const start = new Date(year, month, 1 - first.getDay());
  return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
}

export function CalendarScreen({ day = SEPTEMBER_10, onTab }: { day?: LiturgicalDay; onTab?: (tab: TabKey) => void }) {
  const today = new Date(day.year, day.month, day.day);
  const [mode, setMode] = useState<"month" | "week">("month");
  const [month, setMonth] = useState({ year: day.year, month: day.month, dir: 1 });
  const [selected, setSelected] = useState(today);
  const [bells, setBells] = useState(() => Object.fromEntries(day.parish.map((e) => [e.id, !!e.reminder])));
  const selectionId = useId();

  const isSample = sameDay(selected, today);
  const selectedFasting = isSample ? day.fastingKind : fastingFor(selected.getMonth(), selected.getDate(), selected.getFullYear());
  const days = monthGrid(month.year, month.month);
  const week = Array.from({ length: 7 }, (_, i) => new Date(today.getFullYear(), today.getMonth(), today.getDate() + i));

  const shiftMonth = (dir: number) =>
    setMonth((m) => {
      const d = new Date(m.year, m.month + dir, 1);
      return { year: d.getFullYear(), month: d.getMonth(), dir };
    });

  const select = (date: Date) => {
    setSelected(date);
    if (date.getMonth() !== month.month) setMonth({ year: date.getFullYear(), month: date.getMonth(), dir: date > selected ? 1 : -1 });
  };

  const renderDay = (date: Date, inMonth: boolean, height: number) => {
    const kind = fastingFor(date.getMonth(), date.getDate(), date.getFullYear());
    const isSelected = sameDay(date, selected);
    const isToday = sameDay(date, today);
    const isSunday = date.getDay() === 0;
    return (
      <button
        key={date.toISOString()}
        type="button"
        onClick={() => select(date)}
        aria-pressed={isSelected}
        aria-label={`${MONTHS[date.getMonth()]} ${date.getDate()}`}
        className="relative flex flex-col items-center justify-center outline-none"
        style={{ height }}
      >
        {isSelected && (
          <motion.span
            layoutId={`sel-${selectionId}`}
            transition={{ type: "spring", damping: 20, stiffness: 240 }}
            className="absolute top-[3px] h-10 w-10 rounded-full"
            style={{ backgroundColor: palette.accent }}
          />
        )}
        {isToday && !isSelected && <span className="absolute top-[3px] h-10 w-10 rounded-full border-[1.5px]" style={{ borderColor: palette.accentSoft }} />}
        <span
          className={`relative -mt-1.5 font-sans-semibold text-[15px] ${
            isSelected
              ? "text-white"
              : !inMonth
                ? "text-gray-300 dark:text-gray-700"
                : isToday || isSunday
                  ? "text-red-600 dark:text-red-400"
                  : "text-gray-900 dark:text-gray-100"
          }`}
        >
          {date.getDate()}
        </span>
        <span className="absolute flex h-2.5 items-center" style={{ bottom: isSelected ? 9 : 4 }}>
          {kind !== "none" && inMonth && (
            <Icon name={fastingStyle[kind].icon} size={9} color={isSelected ? "rgba(255,255,255,0.9)" : fastingStyle[kind].color} />
          )}
        </span>
      </button>
    );
  };

  return (
    <>
      <ScreenScroll>
        <LargeHeader
          title="Calendar"
          subtitle={PARISH.name}
          right={
            <AnimatePresence>
              {!isSample && (
                <motion.button
                  type="button"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: "spring", damping: 20, stiffness: 240 }}
                  onClick={() => select(today)}
                  className="mb-1.5 flex h-9 items-center rounded-full bg-red-600 px-4 text-white"
                >
                  <Icon name="today-outline" size={14} />
                  <span className="ml-1.5 font-sans-semibold text-[13px]">Today</span>
                </motion.button>
              )}
            </AnimatePresence>
          }
        />

        <div className="mx-4 mt-3">
          <SegmentedControl
            segments={[
              { key: "month", label: "Month", icon: "grid-outline" },
              { key: "week", label: "Week", icon: "list-outline" },
            ]}
            value={mode}
            onChange={setMode}
          />
        </div>

        <div data-spot="month-grid" className="mx-4 mt-3 rounded-[28px] border border-gray-100 bg-white px-3 pb-3 pt-4 dark:border-white/[0.06] dark:bg-white/[0.04]">
          <div className="flex items-center justify-between px-2">
            <p className="flex items-baseline font-display text-[28px] text-gray-900 dark:text-white">
              {mode === "month" ? MONTHS[month.month] : `${MONTHS[today.getMonth()].slice(0, 3)} ${week[0].getDate()} - ${week[6].getDate()}`}
              <span className="ml-2 text-gray-400 dark:text-gray-500">{month.year}</span>
            </p>
            <div className="flex gap-2">
              {(["chevron-back", "chevron-forward"] as const).map((icon, i) => (
                <button
                  key={icon}
                  type="button"
                  aria-label={i === 0 ? "Previous month" : "Next month"}
                  onClick={() => shiftMonth(i === 0 ? -1 : 1)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700 active:opacity-70 dark:bg-white/10 dark:text-gray-200"
                >
                  <Icon name={icon} size={17} />
                </button>
              ))}
            </div>
          </div>

          {mode === "month" ? (
            <>
              <div className="mb-1 mt-4 grid grid-cols-7">
                {DAYS.map((d, i) => (
                  <span key={i} className={`text-center font-sans-bold text-[11px] ${i === 0 ? "text-red-600 dark:text-red-400" : "text-gray-400 dark:text-gray-500"}`}>
                    {d}
                  </span>
                ))}
              </div>
              <AnimatePresence mode="popLayout" initial={false} custom={month.dir}>
                <motion.div
                  key={`${month.year}-${month.month}`}
                  custom={month.dir}
                  initial={{ opacity: 0, x: month.dir * 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: month.dir * -24 }}
                  transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
                  className="grid grid-cols-7"
                >
                  {days.map((date) => renderDay(date, date.getMonth() === month.month, 50))}
                </motion.div>
              </AnimatePresence>
            </>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3.5 grid grid-cols-7">
              {week.map((date) => (
                <div key={date.toISOString()} className="flex flex-col items-center">
                  <span className={`font-sans-bold text-[11px] ${date.getDay() === 0 ? "text-red-600 dark:text-red-400" : "text-gray-400 dark:text-gray-500"}`}>
                    {DAYS[date.getDay()]}
                  </span>
                  {renderDay(date, true, 56)}
                </div>
              ))}
            </motion.div>
          )}

          <div className="mt-2 flex items-center justify-center border-t border-gray-100 pt-3 dark:border-white/[0.06]">
            {(["fish", "wine", "strict"] as const).map((kind) => (
              <span key={kind} className="mx-2.5 flex items-center">
                <Icon name={fastingStyle[kind].icon} size={11} color={fastingStyle[kind].color} />
                <span className="ml-1 font-sans-medium text-[11px] text-gray-500 dark:text-gray-400">{fastingStyle[kind].label}</span>
              </span>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={selected.toDateString()} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
            <div className="mt-8 px-6">
              <p className="font-sans-bold text-[12px] uppercase tracking-[1.4px] text-red-600 dark:text-red-400">
                {WEEKDAYS[selected.getDay()]}
                {isSample ? " \u00b7 Today" : ""}
              </p>
              <p className="mt-1 font-display text-[34px] leading-[38px] text-gray-900 dark:text-white">
                {MONTHS[selected.getMonth()]} {selected.getDate()}, {selected.getFullYear()}
              </p>
              {isSample && <p className="mt-1 font-display-italic text-[19px] leading-[25px] text-gray-600 dark:text-gray-300">{day.title}</p>}
              <span data-spot="fasting" className="mt-4 inline-flex rounded-full">
                <FastingBadge text={isSample ? day.fasting : FASTING_TEXT[selectedFasting]} kind={selectedFasting} />
              </span>
            </div>

            {isSample && (
              <Rise i={1} className="mt-8 px-5">
                <div data-spot="commemorations">
                  <SectionHeader title="Commemorations" caption={`${day.saints.length} remembered today`} />
                  <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white dark:border-white/[0.06] dark:bg-white/[0.04]">
                    {day.saints.map((saint, i) => (
                      <div key={saint} className={`flex items-center px-4 py-3.5 ${i > 0 ? "border-t border-gray-100 dark:border-white/[0.06]" : ""}`}>
                        <span className="mr-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
                          <Icon name="sparkles" size={15} color={palette.amber} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-serif text-[18px] leading-[23px] text-gray-900 dark:text-white">{saint}</span>
                          <span className="mt-0.5 block font-sans-medium text-xs text-gray-500 dark:text-gray-400">Read the life</span>
                        </span>
                        <Icon name="chevron-forward" size={16} className="text-gray-300 dark:text-gray-600" />
                      </div>
                    ))}
                  </div>
                </div>
              </Rise>
            )}

            <Rise i={2} className="mt-8 px-5">
              <div data-spot="parish-schedule">
                <SectionHeader title="Parish schedule" action={{ label: "Reminders", icon: "notifications", iconColor: palette.green }} />
                {isSample && day.parish.length > 0 ? (
                  <div className="-ml-1">
                    {day.parish.map((event, i) => (
                      <TimelineItem
                        key={event.id}
                        kind="parish"
                        title={event.title}
                        time={event.time}
                        meta={event.meta}
                        isLast={i === day.parish.length - 1}
                        right={
                          <ReminderBell on={!!bells[event.id]} label={event.title} onToggle={() => setBells((b) => ({ ...b, [event.id]: !b[event.id] }))} />
                        }
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState icon="calendar-outline" title="Nothing on the parish calendar" message="No events scheduled for this day." />
                )}
              </div>
            </Rise>

            {isSample && day.personal.length > 0 && (
              <Rise i={3} className="mt-8 px-5">
                <div data-spot="personal-schedule">
                  <SectionHeader title="Your schedule" action={{ label: "Schedule", icon: "add", iconColor: palette.accentSoft }} />
                  <div className="-ml-1">
                    {day.personal.map((event, i) => (
                      <TimelineItem key={event.id} kind={event.kind} title={event.title} time={event.time} meta={event.meta} isLast={i === day.personal.length - 1} />
                    ))}
                  </div>
                </div>
              </Rise>
            )}

            {isSample && day.readings.length > 0 && (
              <Rise i={4} className="mt-8">
                <div data-spot="readings">
                  <div className="px-5">
                    <SectionHeader title="Readings" caption="Appointed for this day" />
                  </div>
                  <ReadingCards readings={day.readings} />
                </div>
              </Rise>
            )}
          </motion.div>
        </AnimatePresence>
      </ScreenScroll>
      <TabBar active="calendar" onChange={onTab} />
    </>
  );
}
