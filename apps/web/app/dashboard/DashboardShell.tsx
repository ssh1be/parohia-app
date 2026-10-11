"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Icon, type IconName } from "../../components/Icon";
import { useTheme } from "../../components/ThemeProvider";
import { Avatar, Pill, Skeleton, cx } from "../../components/app/ui";
import { useDashboard } from "./DashboardContext";

interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  visible: boolean;
}

export function DashboardShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { parish, isAdmin } = useDashboard();

  const nav: NavItem[] = [
    { href: "/dashboard", label: "Today", icon: "today-outline", visible: true },
    { href: "/dashboard/calendar", label: "Calendar", icon: "calendar-outline", visible: true },
    { href: "/dashboard/bulletin", label: "Bulletin", icon: "newspaper-outline", visible: !!parish },
    {
      href: "/dashboard/confession",
      label: "Confession",
      icon: "time-outline",
      visible: !!parish && (isAdmin || !!parish.confession_enabled),
    },
    { href: "/dashboard/parish", label: "Parish", icon: "business-outline", visible: true },
    { href: "/dashboard/settings", label: "Settings", icon: "settings-outline", visible: true },
  ];

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <div className="min-h-[100dvh] bg-zinc-50 dark:bg-black">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-[248px] flex-col border-r border-zinc-200/70 bg-white/80 px-4 py-6 backdrop-blur-xl dark:border-white/[0.06] dark:bg-zinc-950/80">
        <Link href="/dashboard" className="flex items-center gap-2.5 px-2">
          <img src="/App_store_1024_1x.png" alt="" className="h-9 w-9 rounded-full shadow-md shadow-brand-red/20" />
          <span className="font-display text-[22px] leading-none text-zinc-900 dark:text-white">Parohia</span>
        </Link>

        <div className="mx-1 mt-6 rounded-2xl bg-zinc-900/[0.04] px-3 py-2.5 dark:bg-white/[0.05]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">
            {isAdmin ? "Administering" : "Your parish"}
          </p>
          <p className="mt-0.5 truncate font-sans-semibold text-[13px] text-zinc-800 dark:text-zinc-100">
            {parish?.name ?? "No parish yet"}
          </p>
        </div>

        <nav className="mt-6 flex flex-col gap-0.5" aria-label="Dashboard">
          {nav
            .filter((item) => item.visible)
            .map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cx(
                    "relative flex h-10 items-center gap-3 rounded-xl px-3 text-[14px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-red/50",
                    active
                      ? "text-red-700 dark:text-red-300"
                      : "text-zinc-600 hover:bg-zinc-900/[0.04] hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.05] dark:hover:text-white"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="dashboard-nav-active"
                      transition={{ type: "spring", damping: 30, stiffness: 400 }}
                      className="absolute inset-0 rounded-xl bg-red-600/[0.08] dark:bg-red-500/[0.12]"
                    />
                  )}
                  <Icon name={item.icon} size={18} className="relative" />
                  <span className="relative">{item.label}</span>
                </Link>
              );
            })}
        </nav>

        <div className="mt-auto">
          <UserMenu />
        </div>
      </aside>

      <main className="pl-[248px]">
        <div className="mx-auto max-w-[1180px] px-10 pb-16 pt-10">{children}</div>
      </main>
    </div>
  );
}

function UserMenu() {
  const { profile, email, isAdmin, signOut } = useDashboard();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: MouseEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const name = profile?.full_name || email;

  return (
    <div ref={ref} className="relative">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.16 }}
            className="absolute bottom-full left-0 right-0 mb-2 overflow-hidden rounded-2xl border border-zinc-200/80 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-zinc-900"
            role="menu"
          >
            <button
              type="button"
              role="menuitem"
              onClick={toggleTheme}
              className="flex h-9 w-full items-center gap-2.5 rounded-xl px-3 text-[13px] font-semibold text-zinc-700 hover:bg-zinc-900/[0.05] dark:text-zinc-200 dark:hover:bg-white/[0.06]"
            >
              <Icon name={theme === "dark" ? "sunny-outline" : "moon-outline"} size={16} />
              {theme === "dark" ? "Light mode" : "Dark mode"}
            </button>
            <Link
              href="/dashboard/settings"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex h-9 w-full items-center gap-2.5 rounded-xl px-3 text-[13px] font-semibold text-zinc-700 hover:bg-zinc-900/[0.05] dark:text-zinc-200 dark:hover:bg-white/[0.06]"
            >
              <Icon name="settings-outline" size={16} />
              Settings
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={signOut}
              className="flex h-9 w-full items-center gap-2.5 rounded-xl px-3 text-[13px] font-semibold text-red-600 hover:bg-red-600/[0.06] dark:text-red-400"
            >
              <Icon name="log-out-outline" size={16} />
              Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center gap-3 rounded-2xl p-2 text-left outline-none transition-colors hover:bg-zinc-900/[0.04] focus-visible:ring-2 focus-visible:ring-brand-red/50 dark:hover:bg-white/[0.05]"
      >
        <Avatar name={name} size={36} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-sans-semibold text-[13px] text-zinc-900 dark:text-white">{name}</span>
          <span className="block truncate text-[11px] text-zinc-500 dark:text-zinc-400">
            {isAdmin ? "Parish administrator" : "Parish member"}
          </span>
        </span>
        <Icon name="chevron-up" size={14} className="text-zinc-400" />
      </button>
    </div>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  badge,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  badge?: string;
}) {
  return (
    <header className="mb-8 flex items-end justify-between gap-6">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-2 font-sans-semibold text-[12px] uppercase tracking-[0.16em] text-red-600 dark:text-red-400">
            {eyebrow}
          </p>
        )}
        <div className="flex items-center gap-3">
          <h1 className="font-display text-[44px] leading-[1.02] text-zinc-900 dark:text-white">{title}</h1>
          {badge && <Pill className="mt-2">{badge}</Pill>}
        </div>
        {description && <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-zinc-500 dark:text-zinc-400">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </header>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-[100dvh] bg-zinc-50 dark:bg-black">
      <aside className="fixed inset-y-0 left-0 flex w-[248px] flex-col gap-3 border-r border-zinc-200/70 px-4 py-6 dark:border-white/[0.06]">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="mt-4 h-14" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10" />
        ))}
      </aside>
      <main className="pl-[248px]">
        <div className="mx-auto max-w-[1180px] px-10 pt-10">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-3 h-12 w-80" />
          <div className="mt-10 grid grid-cols-3 gap-5">
            <Skeleton className="col-span-2 h-72 rounded-[28px]" />
            <Skeleton className="h-72 rounded-[28px]" />
          </div>
        </div>
      </main>
    </div>
  );
}

/** Shown when a parish-only page is opened by someone without a parish. */
export function NoParishState({ feature }: { feature: string }) {
  return (
    <div className="rounded-[28px] border border-dashed border-zinc-300 bg-white/60 px-8 dark:border-white/10 dark:bg-white/[0.02]">
      <div className="flex flex-col items-center py-16 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[20px] bg-red-600/10 text-red-600 dark:bg-red-500/15 dark:text-red-400">
          <Icon name="business-outline" size={24} />
        </div>
        <h3 className="font-display text-[24px] text-zinc-900 dark:text-white">Join a parish to use {feature}</h3>
        <p className="mt-1.5 max-w-sm text-[14px] leading-relaxed text-zinc-500 dark:text-zinc-400">
          {feature} belongs to a parish community. Choose your parish to get started.
        </p>
        <Link
          href="/dashboard/parish"
          className="mt-5 inline-flex h-10 items-center gap-2 rounded-full bg-brand-gradient px-5 text-sm font-semibold text-white shadow-md shadow-brand-red/25"
        >
          Find a parish
          <Icon name="arrow-forward" size={15} />
        </Link>
      </div>
    </div>
  );
}
