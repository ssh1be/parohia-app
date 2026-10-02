"use client";

import { AnimatePresence, motion } from "motion/react";
import { useId, useState } from "react";
import { Icon } from "../../Icon";
import { palette } from "../tokens";
import { Pressable, Rise, SegmentedControl, SettingsGroup, SettingsRow, Switch } from "../ui";

const REMINDER_OPTIONS = [
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "1 hr", value: 60 },
  { label: "2 hr", value: 120 },
];

/** Notification settings, presented as the app's iOS page sheet over the Calendar tab. */
export function NotificationsScreen() {
  const [enabled, setEnabled] = useState(true);
  const [reminder, setReminder] = useState(30);
  const [digest, setDigest] = useState(true);
  const [digestMode, setDigestMode] = useState<"day_of" | "day_before">("day_of");
  const [sound, setSound] = useState(true);
  const [vibration, setVibration] = useState(false);
  const layoutId = useId();

  const reminderLabel = REMINDER_OPTIONS.find((o) => o.value === reminder)?.label;
  const statusLine = enabled
    ? `Reminders ${reminderLabel} before each event.${digest ? ` Digest ${digestMode === "day_before" ? "the evening before" : "the morning of"} at 8:00 AM.` : ""}`
    : "Turn on to get reminders before parish services and events.";

  return (
    <div className="absolute inset-0 bg-black">
      <div className="absolute inset-x-[18px] top-[50px] h-6 rounded-t-[32px] bg-gray-200 opacity-70 dark:bg-gray-800" />
      <div data-scroll className="no-scrollbar absolute inset-x-0 bottom-0 top-[60px] overflow-y-auto overscroll-contain rounded-t-[32px] bg-gray-50 dark:bg-[#0B0F17]">
        <div className="flex items-end justify-between px-6 pb-2 pt-6">
          <div>
            <p className="mb-1 font-sans-semibold text-[12px] uppercase tracking-[1.4px] text-red-600 dark:text-red-400">Settings</p>
            <h3 className="font-display text-[36px] leading-[40px] text-gray-900 dark:text-white">Notifications</h3>
          </div>
          <span className="mb-1 flex h-9 w-9 items-center justify-center rounded-full bg-gray-200/80 text-gray-700 dark:bg-white/10 dark:text-gray-200">
            <Icon name="close" size={18} />
          </span>
        </div>

        <div className="px-5 pb-12">
          <Rise className="mt-4">
            <div
              data-spot="notif-status"
              className={`overflow-hidden rounded-[28px] border border-gray-100 bg-gradient-to-br p-5 transition-colors duration-500 dark:border-white/[0.06] ${
                enabled ? "from-[#ECFDF5] to-white dark:from-[#062A1F] dark:to-[#0A0A0D]" : "from-white to-gray-100 dark:from-[#16161A] dark:to-[#0A0A0D]"
              }`}
            >
              <div className="flex items-center">
                <span
                  className="mr-3.5 flex h-12 w-12 items-center justify-center rounded-2xl transition-colors"
                  style={{ backgroundColor: enabled ? "rgba(16,185,129,0.15)" : "rgba(156,163,175,0.15)" }}
                >
                  <Icon name={enabled ? "notifications" : "notifications-off-outline"} size={22} color={enabled ? palette.green : palette.gray400} />
                </span>
                <div className="flex-1">
                  <p className="font-display text-[24px] leading-[28px] text-gray-900 dark:text-white">{enabled ? "Reminders on" : "Reminders off"}</p>
                  {enabled && <p className="mt-0.5 font-sans-medium text-xs text-emerald-700 dark:text-emerald-400">6 scheduled</p>}
                </div>
                <Switch on={enabled} onChange={setEnabled} label="Enable notifications" />
              </div>
              <p className="mt-4 font-sans text-[13px] leading-[19px] text-gray-600 dark:text-gray-300">{statusLine}</p>
            </div>
          </Rise>

          <AnimatePresence initial={false}>
            {enabled && (
              <motion.div
                key="groups"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                transition={{ type: "spring", damping: 26, stiffness: 170, delay: 0.06 }}
              >
                <SettingsGroup title="Event reminders" footer="How long before an event you'll be notified." spot="reminder-time">
                  <div className="flex gap-1.5 p-2">
                    {REMINDER_OPTIONS.map((option) => {
                      const active = option.value === reminder;
                      return (
                        <Pressable
                          key={option.value}
                          scaleTo={0.94}
                          onClick={() => setReminder(option.value)}
                          role="radio"
                          aria-checked={active}
                          className={`relative flex h-12 flex-1 items-center justify-center rounded-2xl ${active ? "" : "bg-gray-100 dark:bg-white/[0.06]"}`}
                        >
                          {active && <motion.span layoutId={`chip-${layoutId}`} transition={{ type: "spring", damping: 20, stiffness: 260 }} className="absolute inset-0 rounded-2xl bg-red-600" />}
                          <span className={`relative font-sans-semibold text-[14px] ${active ? "text-white" : "text-gray-700 dark:text-gray-300"}`}>{option.label}</span>
                        </Pressable>
                      );
                    })}
                  </div>
                </SettingsGroup>

                <SettingsGroup title="Daily digest" spot="digest">
                  <SettingsRow
                    first
                    icon="newspaper-outline"
                    iconColor={palette.blue}
                    title="Daily digest"
                    subtitle="A summary of all events for the day"
                    right={<Switch on={digest} onChange={setDigest} label="Daily digest" />}
                  />
                  <AnimatePresence initial={false}>
                    {digest && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="px-4 pb-4 pt-1">
                        <p className="mb-2 font-sans-semibold text-[13px] text-gray-700 dark:text-gray-300">When to receive</p>
                        <SegmentedControl
                          segments={[
                            { key: "day_of", label: "Morning of", icon: "sunny-outline" },
                            { key: "day_before", label: "Evening before", icon: "moon-outline" },
                          ]}
                          value={digestMode}
                          onChange={setDigestMode}
                        />
                        <p className="mb-2 mt-4 font-sans-semibold text-[13px] text-gray-700 dark:text-gray-300">Digest time</p>
                        <div className="flex h-12 items-center justify-between rounded-2xl border border-gray-200 bg-gray-50 px-4 dark:border-white/10 dark:bg-white/[0.04]">
                          <span className="font-sans-medium text-[15px] text-gray-900 dark:text-white">8:00 AM</span>
                          <Icon name="time-outline" size={18} color={palette.gray400} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </SettingsGroup>

                <SettingsGroup title="Alerts">
                  <SettingsRow
                    first
                    icon="volume-high-outline"
                    iconColor={palette.purple}
                    title="Sound"
                    subtitle="Play a sound when notifications arrive"
                    right={<Switch on={sound} onChange={setSound} label="Sound" />}
                  />
                  <SettingsRow
                    icon="phone-portrait-outline"
                    iconColor={palette.amber}
                    title="Vibration"
                    subtitle="Vibrate when notifications arrive"
                    right={<Switch on={vibration} onChange={setVibration} label="Vibration" />}
                  />
                </SettingsGroup>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8 flex px-1">
            <Icon name="information-circle-outline" size={16} color={palette.gray400} className="mt-px" />
            <p className="ml-2 flex-1 font-sans text-xs leading-[18px] text-gray-500 dark:text-gray-400">
              Notifications are scheduled automatically from your parish&apos;s Google Calendar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
