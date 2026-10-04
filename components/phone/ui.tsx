"use client";

import { motion } from "motion/react";
import { useId, type ComponentProps, type ReactNode } from "react";
import { Icon, type IconName } from "../Icon";
import { cardSpring, eventKindStyle, fastingStyle, palette, snappySpring, type EventKind, type FastingKind } from "./tokens";

type PressableProps = Omit<ComponentProps<typeof motion.button>, "children"> & {
  children?: ReactNode;
  scaleTo?: number;
};

/** Web stand-in for the app's PressableScale: a button that dips slightly while pressed. */
export function Pressable({ scaleTo = 0.97, className = "", children, ...rest }: PressableProps) {
  return (
    <motion.button
      type="button"
      whileTap={{ scale: scaleTo }}
      transition={snappySpring}
      className={`text-left outline-none focus-visible:ring-2 focus-visible:ring-red-500/60 ${className}`}
      {...rest}
    >
      {children}
    </motion.button>
  );
}

export function LargeHeader({
  eyebrow,
  title,
  subtitle,
  right,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="px-6 pb-2 pt-4">
      <div className="flex items-end justify-between">
        <div className="min-w-0 flex-1 pr-3">
          {eyebrow && (
            <p className="mb-1 font-sans-semibold text-[12px] uppercase tracking-[1.4px] text-red-600 dark:text-red-400">{eyebrow}</p>
          )}
          <h3 className="font-display text-[40px] leading-[44px] text-gray-900 dark:text-white">{title}</h3>
        </div>
        {right}
      </div>
      {subtitle && <div className="mt-1 font-sans text-[15px] text-gray-500 dark:text-gray-400">{subtitle}</div>}
    </div>
  );
}

export function SectionHeader({
  title,
  caption,
  action,
}: {
  title: string;
  caption?: string;
  action?: { label: string; icon?: IconName; iconColor?: string };
}) {
  return (
    <div className="mb-3 flex items-end justify-between">
      <div className="min-w-0 flex-1 pr-3">
        <h4 className="font-display text-[24px] leading-[28px] text-gray-900 dark:text-white">{title}</h4>
        {caption && <p className="mt-0.5 font-sans text-[13px] text-gray-500 dark:text-gray-400">{caption}</p>}
      </div>
      {action && (
        <span className="flex h-8 items-center rounded-full bg-gray-200/70 px-3 dark:bg-white/10">
          {action.icon && <Icon name={action.icon} size={14} color={action.iconColor} className="text-gray-700 dark:text-gray-200" />}
          <span className={`font-sans-semibold text-xs text-gray-800 dark:text-gray-100 ${action.icon ? "ml-1.5" : ""}`}>{action.label}</span>
        </span>
      )}
    </div>
  );
}

const TIME_PATTERN = /(\d{1,2}(?::\d{2})?\s*(?:AM|PM))/i;

function leadingTime(time?: string) {
  const match = time?.match(TIME_PATTERN);
  return match ? match[1].replace(/\s+/, " ") : "All day";
}

export function TimelineItem({
  kind,
  title,
  time,
  meta,
  isLast = false,
  right,
  onPress,
  spot,
}: {
  kind: EventKind;
  title: string;
  time?: string;
  meta?: string;
  isLast?: boolean;
  right?: ReactNode;
  onPress?: () => void;
  spot?: string;
}) {
  const style = eventKindStyle[kind];
  const [clock, period] = leadingTime(time).split(" ");

  return (
    <div className="flex" data-spot={spot}>
      <div className="w-[58px] shrink-0 pr-2 pt-[18px] text-right">
        <p className="font-sans-bold text-[13px] text-gray-900 dark:text-white">{clock}</p>
        {period && <p className="-mt-0.5 font-sans-medium text-[10px] text-gray-500 dark:text-gray-400">{period}</p>}
      </div>
      <div className="flex w-5 shrink-0 flex-col items-center">
        <span className="mt-[21px] h-3 w-3 rounded-full border-2" style={{ borderColor: style.color, backgroundColor: `${style.color}33` }} />
        {!isLast && <span className="mt-1 w-[1.5px] flex-1 rounded-full bg-gray-300/80 dark:bg-white/15" />}
      </div>
      <div
        onClick={onPress}
        className="mb-3 ml-2 min-w-0 flex-1 rounded-2xl border border-gray-100 bg-white p-4 dark:border-white/[0.06] dark:bg-white/[0.04]"
      >
        <div className="flex items-start">
          <div className="min-w-0 flex-1 pr-2">
            <p className="font-sans-semibold text-[15px] leading-5 text-gray-900 dark:text-white">{title}</p>
            {time && <p className="mt-1 font-sans text-[13px] text-gray-500 dark:text-gray-400">{time}</p>}
            {meta && (
              <p className="mt-1.5 flex items-center font-sans text-xs text-gray-500 dark:text-gray-400">
                <Icon name="location-outline" size={12} color={palette.gray400} />
                <span className="ml-1 truncate">{meta}</span>
              </p>
            )}
          </div>
          {right ?? (
            <span className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: style.tint }}>
              <Icon name={style.icon} size={15} color={style.color} />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function ReminderBell({ on, onToggle, label }: { on: boolean; onToggle?: () => void; label: string }) {
  return (
    <Pressable
      scaleTo={0.88}
      onClick={(e) => {
        e.stopPropagation();
        onToggle?.();
      }}
      role="switch"
      aria-checked={on}
      aria-label={`Reminder for ${label}`}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors duration-200 ${
        on ? "bg-emerald-500/15" : "bg-gray-100 dark:bg-white/10"
      }`}
    >
      <motion.span key={on ? "on" : "off"} initial={{ scale: 0.6, rotate: on ? -18 : 0 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", damping: 12, stiffness: 320 }}>
        <Icon name={on ? "notifications" : "notifications-off-outline"} size={16} color={on ? palette.green : palette.gray400} />
      </motion.span>
    </Pressable>
  );
}

export function FastingBadge({ text, kind, className = "" }: { text: string; kind: FastingKind; className?: string }) {
  const style = fastingStyle[kind];
  return (
    <span className={`inline-flex items-center self-start rounded-full bg-gray-900/[0.05] py-1.5 pl-2 pr-3 dark:bg-white/[0.07] ${className}`}>
      <span className="flex h-5 w-5 items-center justify-center rounded-full" style={{ backgroundColor: `${style.color}22` }}>
        <Icon name={style.icon} size={11} color={style.color} />
      </span>
      <span className="ml-1.5 font-sans-semibold text-xs text-gray-800 dark:text-gray-200">{text}</span>
    </span>
  );
}

export function SegmentedControl<T extends string>({
  segments,
  value,
  onChange,
  className = "",
}: {
  segments: { key: T; label: string; icon?: IconName }[];
  value: T;
  onChange?: (value: T) => void;
  className?: string;
}) {
  const id = useId();
  return (
    <div role="tablist" className={`flex h-11 rounded-full bg-gray-200/70 p-1 dark:bg-white/[0.07] ${className}`}>
      {segments.map((segment) => {
        const active = segment.key === value;
        return (
          <button
            key={segment.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange?.(segment.key)}
            className="relative flex flex-1 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-red-500/60"
          >
            {active && (
              <motion.span
                layoutId={`segment-${id}`}
                transition={snappySpring}
                className="absolute inset-0 rounded-full bg-white shadow-[0_2px_6px_rgba(17,24,39,0.08)] dark:bg-gray-800 dark:shadow-none"
              />
            )}
            <span className="relative flex items-center">
              {segment.icon && (
                <Icon name={segment.icon} size={15} color={active ? palette.accent : undefined} className={`mr-1.5 ${active ? "" : "text-gray-500 dark:text-gray-400"}`} />
              )}
              <span className={`font-sans-semibold text-[13px] ${active ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"}`}>
                {segment.label}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function Switch({ on, onChange, label }: { on: boolean; onChange?: (on: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange?.(!on)}
      className={`relative h-[31px] w-[51px] shrink-0 rounded-full p-[2px] outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-red-500/60 ${
        on ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-700"
      }`}
    >
      <motion.span
        animate={{ x: on ? 20 : 0 }}
        transition={{ type: "spring", damping: 22, stiffness: 420 }}
        className="block h-[27px] w-[27px] rounded-full bg-white shadow-[0_3px_8px_rgba(0,0,0,0.15),0_1px_1px_rgba(0,0,0,0.16)]"
      />
    </button>
  );
}

export function SettingsGroup({ title, footer, children, spot }: { title?: string; footer?: string; children: ReactNode; spot?: string }) {
  return (
    <div className="mt-7" data-spot={spot}>
      {title && <p className="mb-2 px-1 font-sans-bold text-[11px] uppercase tracking-[1.2px] text-gray-500 dark:text-gray-400">{title}</p>}
      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white dark:border-white/[0.06] dark:bg-white/[0.04]">{children}</div>
      {footer && <p className="mt-2 px-1 font-sans text-xs leading-[18px] text-gray-500 dark:text-gray-400">{footer}</p>}
    </div>
  );
}

export function SettingsRow({
  icon,
  iconColor,
  title,
  subtitle,
  right,
  first = false,
  children,
}: {
  icon?: IconName;
  iconColor?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  first?: boolean;
  children?: ReactNode;
}) {
  const tint = iconColor ?? palette.gray500;
  return (
    <div className={`px-4 py-3.5 ${first ? "" : "border-t border-gray-100 dark:border-white/[0.06]"}`}>
      <div className="flex items-center">
        {icon && (
          <span className="mr-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${tint}1F` }}>
            <Icon name={icon} size={17} color={tint} />
          </span>
        )}
        <div className="min-w-0 flex-1 pr-3">
          <p className="font-sans-semibold text-[15px] text-gray-900 dark:text-white">{title}</p>
          {subtitle && <p className="mt-0.5 font-sans text-[12.5px] leading-[17px] text-gray-500 dark:text-gray-400">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

export function ReadingCards({ readings, spot }: { readings: { kind: string; display: string }[]; spot?: string }) {
  return (
    <div className="no-scrollbar flex snap-x snap-mandatory scroll-px-6 gap-3 overflow-x-auto px-6" data-spot={spot}>
      {readings.map((reading) => {
        const gospel = reading.kind === "Gospel";
        return (
          <Pressable
            key={reading.display}
            scaleTo={0.97}
            className={`flex min-h-[148px] w-[210px] shrink-0 snap-start flex-col justify-between rounded-3xl border p-5 ${
              gospel ? "border-red-600 bg-red-600" : "border-gray-100 bg-white dark:border-white/[0.06] dark:bg-white/[0.04]"
            }`}
          >
            <span className="flex w-full items-center justify-between">
              <span className={`font-sans-bold text-[11px] uppercase tracking-[1.4px] ${gospel ? "text-white/80" : "text-red-600 dark:text-red-400"}`}>
                {reading.kind}
              </span>
              <Icon name="book" size={15} color={gospel ? "rgba(255,255,255,0.85)" : palette.gray400} />
            </span>
            <span className={`mt-3 font-display text-[24px] leading-[27px] ${gospel ? "text-white" : "text-gray-900 dark:text-white"}`}>
              {reading.display}
            </span>
            <span className={`mt-4 flex items-center font-sans-semibold text-xs ${gospel ? "text-white/90" : "text-gray-500 dark:text-gray-400"}`}>
              Read passage
              <Icon name="arrow-forward" size={12} className="ml-1" />
            </span>
          </Pressable>
        );
      })}
    </div>
  );
}

export type TabKey = "home" | "calendar" | "events" | "parish";

const TABS: { key: TabKey; label: string; active: IconName; inactive: IconName }[] = [
  { key: "home", label: "Home", active: "home", inactive: "home-outline" },
  { key: "calendar", label: "Calendar", active: "calendar", inactive: "calendar-outline" },
  { key: "events", label: "Events", active: "newspaper", inactive: "newspaper-outline" },
  { key: "parish", label: "Parish", active: "location", inactive: "location-outline" },
];

/** The app's floating glass tab bar with its sliding selection pill. */
export function TabBar({ active, onChange, spot }: { active: TabKey; onChange?: (tab: TabKey) => void; spot?: string }) {
  const id = useId();
  return (
    <>
      {/* Paired with the tab bar so transitions keep the bar above the fade, clipped by the screen. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[15] h-[130px] overflow-hidden bg-gradient-to-t from-gray-50/90 from-25% to-gray-50/0 backdrop-blur-md [mask-image:linear-gradient(to_top,black_45%,transparent)] dark:from-black/90 dark:to-black/0" />
      <div data-tabbar className="absolute inset-x-4 bottom-[34px] z-20 rounded-[26px] shadow-[0_10px_24px_rgba(3,7,18,0.10)] dark:shadow-[0_10px_24px_rgba(0,0,0,0.4)]" data-spot={spot}>
        <div className="glass relative flex h-16 overflow-hidden rounded-[26px] border border-white/70 px-1.5 dark:border-white/[0.14]">
          <div className="pointer-events-none absolute inset-0 rounded-[26px] bg-gradient-to-b from-white/50 via-white/10 to-transparent dark:from-white/10 dark:via-white/[0.02]" />
          {TABS.map((tab) => {
            const focused = tab.key === active;
            return (
              <button
                key={tab.key}
                type="button"
                aria-label={tab.label}
                aria-current={focused ? "page" : undefined}
                onClick={() => onChange?.(tab.key)}
                className="relative flex flex-1 flex-col items-center justify-center outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-500/60"
              >
                {focused && (
                  <motion.span
                    layoutId={`tab-${id}`}
                    transition={snappySpring}
                    className="absolute inset-y-1.5 inset-x-0 rounded-[20px]"
                    style={{ backgroundColor: palette.accentMuted }}
                  />
                )}
                <motion.span
                  animate={{ scale: focused ? 1 : 0.92 }}
                  transition={{ type: "spring", damping: 12, stiffness: 320 }}
                  className="relative"
                >
                  <Icon
                    name={focused ? tab.active : tab.inactive}
                    size={22}
                    color={focused ? palette.accent : undefined}
                    className={focused ? "" : "text-gray-500 dark:text-gray-400"}
                  />
                </motion.span>
                <span
                  className={`relative mt-0.5 text-[10.5px] ${focused ? "font-sans-bold" : "font-sans-medium text-gray-500 dark:text-gray-400"}`}
                  style={focused ? { color: palette.accent } : undefined}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

/** Cards rising into place on mount, staggered like the app's Reveal. */
export function Rise({ i = 0, children, className = "" }: { i?: number; children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...cardSpring, delay: Math.min(i, 8) * 0.06 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function EmptyState({ icon, title, message }: { icon: IconName; title: string; message?: string }) {
  return (
    <div className="flex flex-col items-center rounded-3xl border border-dashed border-gray-200 px-6 py-6 text-center dark:border-white/10">
      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-100 dark:bg-white/[0.06]">
        <Icon name={icon} size={20} color={palette.gray400} />
      </span>
      <p className="mt-3 font-sans-bold text-[15px] text-gray-900 dark:text-white">{title}</p>
      {message && <p className="mt-1 font-sans text-[13px] leading-[19px] text-gray-500 dark:text-gray-400">{message}</p>}
    </div>
  );
}

/** Scrollable screen body that clears the status bar and floating tab bar like the app's ScrollViews. */
export function ScreenScroll({
  children,
  tabBar = true,
  className = "",
  scrollable = true,
}: {
  children: ReactNode;
  tabBar?: boolean;
  className?: string;
  /** Decorative previews lock the screen so a swipe scrolls the page. */
  scrollable?: boolean;
}) {
  return (
    <div
      data-scroll
      className={`no-scrollbar absolute inset-0 ${scrollable ? "overflow-y-auto overscroll-contain" : "overflow-hidden"} ${className}`}
    >
      <div style={{ paddingTop: 59, paddingBottom: tabBar ? 34 + 64 + 12 + 32 : 48 }}>{children}</div>
    </div>
  );
}
