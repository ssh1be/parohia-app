"use client";

import { Icon } from "../../Icon";
import { AUGUST_30, PARISH, type LiturgicalDay } from "../data";
import { palette } from "../tokens";
import { FastingBadge, LargeHeader, ReadingCards, Rise, ScreenScroll, SectionHeader, TabBar, TimelineItem, type TabKey } from "../ui";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export function HomeScreen({ day = AUGUST_30, onTab }: { day?: LiturgicalDay; onTab?: (tab: TabKey) => void }) {
  const schedule = [...day.personal, ...day.parish];

  return (
    <>
      <ScreenScroll>
        <LargeHeader
          eyebrow={`${day.weekday}, ${MONTHS[day.month]} ${day.day}`}
          title="Good morning, Alex"
          subtitle={
            <span className="flex items-center">
              <Icon name="location" size={13} color={palette.accentSoft} />
              <span className="ml-1 truncate font-sans-medium text-[14px]">{PARISH.name}</span>
            </span>
          }
        />

        <Rise i={1} className="mt-3 px-5">
          <div data-spot="today-card" className="overflow-hidden rounded-[28px] border border-red-100 dark:border-red-500/15">
            <div className="bg-gradient-to-br from-white to-[#FEF2F2] p-[22px] dark:from-[#1C0A0B] dark:to-[#0A0A0D]">
              <div className="flex items-center justify-between">
                <p className="font-sans-bold text-[11px] uppercase tracking-[1.6px] text-red-600 dark:text-red-400">Today in the Church</p>
                <Icon name="arrow-forward" size={16} color={palette.accentSoft} />
              </div>
              <p className="mt-3 font-display text-[30px] leading-[34px] text-gray-900 dark:text-white">{day.title}</p>
              <p className="mt-3 font-display-italic text-[18px] leading-[24px] text-gray-600 dark:text-gray-300">{day.saints.join(". ")}</p>
              <FastingBadge text={day.fasting} kind={day.fastingKind} className="mt-5" />
            </div>
          </div>
        </Rise>

        <Rise i={3} className="mt-8 px-5">
          <SectionHeader title="Today's schedule" caption={PARISH.name} />
          <div className="-ml-1 mt-1" data-spot="home-schedule">
            {schedule.map((item, i) => (
              <TimelineItem key={item.id} kind={item.kind} title={item.title} time={item.time} meta={item.meta} isLast={i === schedule.length - 1} />
            ))}
          </div>
        </Rise>

        {day.readings.length > 0 && (
          <Rise i={4} className="mt-8">
            <div className="px-5">
              <SectionHeader title="Daily readings" caption="Tap a passage to read" />
            </div>
            <ReadingCards readings={day.readings} />
          </Rise>
        )}
      </ScreenScroll>
      <TabBar active="home" onChange={onTab} />
    </>
  );
}
