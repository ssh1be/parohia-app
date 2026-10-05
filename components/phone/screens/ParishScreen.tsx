"use client";

import { Icon, type IconName } from "../../Icon";
import { PARISH } from "../data";
import { palette } from "../tokens";
import { LargeHeader, Pressable, Rise, ScreenScroll, SectionHeader, TabBar, type TabKey } from "../ui";

const QUICK_ACTIONS: { label: string; icon: IconName }[] = [
  { label: "Directions", icon: "navigate" },
  { label: "Call", icon: "call" },
  { label: "Website", icon: "globe-outline" },
  { label: "Email", icon: "mail-outline" },
];

export function ParishScreen({ onTab }: { onTab?: (tab: TabKey) => void }) {
  return (
    <>
      <ScreenScroll>
        <LargeHeader title="Parish" subtitle="Your spiritual home" />

        <Rise i={1} className="mt-3 px-5">
          <div data-spot="parish-hero" className="overflow-hidden rounded-[28px] border border-red-100 dark:border-red-500/15">
            <div className="bg-gradient-to-br from-white to-[#FEF2F2] p-[22px] dark:from-[#1C0A0B] dark:to-[#0A0A0D]">
              <div className="flex items-start justify-between">
                <p className="flex-1 pr-3 font-display text-[32px] leading-[35px] text-gray-900 dark:text-white">{PARISH.fullName}</p>
                <span className="flex h-9 items-center rounded-full bg-gray-900/[0.06] px-3.5 text-gray-800 dark:bg-white/10 dark:text-gray-100">
                  <Icon name="swap-horizontal" size={14} />
                  <span className="ml-1.5 font-sans-semibold text-[13px]">Change</span>
                </span>
              </div>
              <p className="mt-2 flex items-center font-sans-medium text-[13px] leading-[18px] text-gray-500 dark:text-gray-400">
                {PARISH.jurisdiction}
                <Icon name="checkmark-circle" size={14} color={palette.green} className="ml-2" />
              </p>
              <div className="mt-6 flex gap-3.5">
                {QUICK_ACTIONS.map((action, i) => (
                  <Pressable key={action.label} scaleTo={0.92} className="flex flex-col items-center">
                    <span
                      className={`flex h-14 w-14 items-center justify-center rounded-[18px] ${
                        i === 0 ? "bg-red-600 text-white" : "border border-gray-100 bg-white text-gray-700 dark:border-white/10 dark:bg-white/10 dark:text-gray-200"
                      }`}
                    >
                      <Icon name={action.icon} size={18} />
                    </span>
                    <span className="mt-1.5 font-sans-semibold text-[11px] text-gray-600 dark:text-gray-300">{action.label}</span>
                  </Pressable>
                ))}
              </div>
            </div>
          </div>
        </Rise>

        <Rise i={2} className="mt-7 px-5">
          <SectionHeader title="Visit & contact" />
          <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white dark:border-white/[0.06] dark:bg-white/[0.04]">
            {[
              { icon: "location-outline" as const, label: "Address", value: PARISH.address },
              { icon: "call-outline" as const, label: "Phone", value: PARISH.phone },
              { icon: "globe-outline" as const, label: "Website", value: PARISH.website },
            ].map((row, i) => (
              <div key={row.label} className={`flex items-center px-4 py-3.5 ${i > 0 ? "border-t border-gray-100 dark:border-white/[0.06]" : ""}`}>
                <span className="mr-3 flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-gray-300">
                  <Icon name={row.icon} size={17} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-sans-medium text-xs text-gray-500 dark:text-gray-400">{row.label}</span>
                  <span className="block truncate font-sans-semibold text-[14px] text-gray-900 dark:text-white">{row.value}</span>
                </span>
                <Icon name="chevron-forward" size={16} className="text-gray-300 dark:text-gray-600" />
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3.5 dark:border-white/[0.06]">
              <span className="font-sans-medium text-[13px] text-gray-500 dark:text-gray-400">Parish calendar</span>
              <span className="flex items-center rounded-full bg-emerald-500/10 px-2.5 py-1">
                <Icon name="checkmark-circle" size={13} color={palette.green} />
                <span className="ml-1 font-sans-bold text-[11px] text-emerald-600 dark:text-emerald-400">Connected</span>
              </span>
            </div>
          </div>
        </Rise>

        <Rise i={3} className="mt-7 px-5">
          <SectionHeader title="Clergy" />
          <div className="flex items-center rounded-3xl border border-gray-100 bg-white p-5 dark:border-white/[0.06] dark:bg-white/[0.04]">
            <span className="mr-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-600/10 font-display text-[22px] text-red-600 dark:text-red-400">{PARISH.priestInitials}</span>
            <span className="flex-1">
              <span className="block font-display text-[22px] leading-[26px] text-gray-900 dark:text-white">{PARISH.priest}</span>
              <span className="mt-0.5 block font-sans-medium text-xs text-gray-500 dark:text-gray-400">Parish priest</span>
            </span>
            {(["chatbubble", "mail"] as const).map((icon) => (
              <span key={icon} className="ml-2 flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-200">
                <Icon name={icon} size={17} />
              </span>
            ))}
          </div>
        </Rise>

        <Rise i={4} className="mt-7 px-5">
          <SectionHeader title="Support our parish" />
          <div className="rounded-3xl bg-gradient-to-br from-[#DC2626] to-[#991B1B] p-[22px] text-white">
            <Icon name="heart" size={22} className="opacity-90" />
            <p className="mt-3 font-display text-[24px] leading-[29px]">Help us complete the new iconostasis</p>
            <span className="mt-[18px] inline-flex h-11 items-center rounded-full bg-white px-5 font-sans-bold text-[15px] text-red-700">
              Donate now
              <Icon name="arrow-forward" size={15} color={palette.accent} className="ml-1.5" />
            </span>
          </div>
        </Rise>
      </ScreenScroll>
      <TabBar active="parish" onChange={onTab} />
    </>
  );
}
