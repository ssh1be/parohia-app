import type { ReactNode } from "react";
import { Icon, type IconName } from "../Icon";

const HIGHLIGHTS: { icon: IconName; title: string; body: string }[] = [
  { icon: "calendar-outline", title: "The liturgical year at a glance", body: "Fasting, readings, and feasts beside your parish services." },
  { icon: "megaphone-outline", title: "Run the parish bulletin", body: "Post to channels, rally volunteers, and notify parishioners." },
  { icon: "time-outline", title: "Confession, organized", body: "Open slots for the week and see who has booked." },
];

export function AuthBrandPanel() {
  return (
    <aside className="relative flex flex-col justify-between overflow-hidden bg-brand-gradient px-12 py-12 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 10% 0%, rgba(255,255,255,0.18), transparent 60%), radial-gradient(ellipse 60% 60% at 100% 100%, rgba(0,0,0,0.35), transparent 60%)",
        }}
      />
      <a href="/" className="relative flex items-center gap-3">
        <img src="/App_store_1024_1x.png" alt="" className="h-11 w-11 rounded-full ring-1 ring-white/30" />
        <span className="font-display text-[26px] leading-none">Parohia</span>
      </a>

      <div className="relative max-w-md">
        <p className="mb-3 font-sans-semibold text-[12px] uppercase tracking-[0.18em] text-white/70">Parish dashboard</p>
        <h1 className="font-display text-[52px] leading-[1.02] tracking-[-0.01em]">
          Your parish, on the big screen.
        </h1>
        <ul className="mt-10 space-y-5">
          {HIGHLIGHTS.map((item) => (
            <li key={item.title} className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/20">
                <Icon name={item.icon} size={18} />
              </span>
              <div>
                <p className="font-sans-semibold text-[15px]">{item.title}</p>
                <p className="mt-0.5 text-[14px] leading-relaxed text-white/75">{item.body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="relative font-display-italic text-[17px] text-white/70">
        Same account as the Parohia app. Sign in with the email you use on your phone.
      </p>
    </aside>
  );
}

export function AuthHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: ReactNode;
}) {
  return (
    <header className="mb-8">
      <p className="mb-2 font-sans-semibold text-[12px] uppercase tracking-[0.16em] text-red-600 dark:text-red-400">
        {eyebrow}
      </p>
      <h1 className="font-display text-[44px] leading-[1.02] text-zinc-900 dark:text-white">{title}</h1>
      {subtitle && <p className="mt-3 text-[15px] leading-relaxed text-zinc-500 dark:text-zinc-400">{subtitle}</p>}
    </header>
  );
}

export function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="mb-5 flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] leading-5 text-red-700 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-300"
    >
      <Icon name="alert-circle-outline" size={16} className="mt-0.5" />
      <span>{message}</span>
    </div>
  );
}

export function FormNotice({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="status"
      className="mb-5 flex items-start gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] leading-5 text-emerald-700 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-300"
    >
      <Icon name="checkmark-circle-outline" size={16} className="mt-0.5" />
      <span>{message}</span>
    </div>
  );
}
