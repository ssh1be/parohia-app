"use client";

import { clearOnboardingStatus, deleteAccount, type CalendarSystem, type CalendarTradition } from "@parohia/shared";
import { useState, type ReactNode } from "react";
import { Icon, type IconName } from "../../../components/Icon";
import { useTheme, type ThemePreference } from "../../../components/ThemeProvider";
import { Avatar, Button, Card, ConfirmDialog, Segmented, cx } from "../../../components/app/ui";
import { useToast } from "../../../components/app/toast";
import { useDashboard } from "../DashboardContext";
import { PageHeader } from "../DashboardShell";

const SUPPORT_EMAIL = "support@parohia.app";
const DONATE_URL = "https://buymeacoffee.com/parohia";

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: IconName; description: string }[] = [
  { value: "light", label: "Light", icon: "sunny-outline", description: "Always use the light theme" },
  { value: "dark", label: "Dark", icon: "moon-outline", description: "Always use the dark theme" },
  { value: "system", label: "System", icon: "desktop-outline", description: "Match your computer's setting" },
];

const TRADITION_FOOTERS: Record<CalendarTradition, string> = {
  greek: "Greek tradition follows Antiochian and Greek Orthodox Archdiocese (GOA) rubrics for commemorations, readings, and fasting.",
  slavic: "Slavic tradition follows OCA and ROCOR rubrics for commemorations, readings, and fasting.",
};

const SYSTEM_FOOTERS: Record<CalendarSystem, string> = {
  gregorian: "Gregorian is the New Calendar used by most Greek and Antiochian parishes.",
  julian: "Julian is the Old Calendar used by ROCOR and many Slavic parishes (currently 13 days behind Gregorian).",
};

export default function SettingsPage() {
  const toast = useToast();
  const {
    profile,
    email,
    isAdmin,
    parish,
    tradition,
    setTradition,
    calendarSystem,
    setCalendarSystem,
    signOut,
  } = useDashboard();
  const { preference, setPreference } = useTheme();
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [deleting, setDeleting] = useState(false);

  const runDelete = async () => {
    setDeleting(true);
    try {
      const result = await deleteAccount();
      if (!result.success) {
        toast(result.error || "Failed to delete account. Please try again.", "error");
        return;
      }
      await clearOnboardingStatus();
      await signOut();
    } catch (error) {
      toast((error as Error).message || "Failed to delete account. Please try again.", "error");
    } finally {
      setDeleting(false);
      setStep(0);
    }
  };

  return (
    <>
      <PageHeader eyebrow="Settings" title="Preferences" description="These settings apply to this browser." />

      <div className="grid grid-cols-2 items-start gap-6">
        <Section title="Account" className="col-span-2">
          <div className="flex items-center gap-4">
            <Avatar name={profile?.full_name || email} size={52} />
            <div className="min-w-0 flex-1">
              <p className="font-sans-bold text-[16px] text-zinc-900 dark:text-white">{profile?.full_name || "—"}</p>
              <p className="text-[13px] text-zinc-500 dark:text-zinc-400">
                {email} · {isAdmin ? "Parish administrator" : "Parish member"}
                {parish ? ` · ${parish.name}` : ""}
              </p>
            </div>
            <Button variant="secondary" icon="log-out-outline" onClick={signOut}>
              Sign out
            </Button>
          </div>
        </Section>

        <Section title="Appearance">
          <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="Theme">
            {THEME_OPTIONS.map((option) => {
              const active = preference === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setPreference(option.value)}
                  className={cx(
                    "rounded-3xl border-2 p-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-brand-red/50",
                    active ? "border-red-500" : "border-zinc-200/80 hover:border-zinc-300 dark:border-white/10 dark:hover:border-white/20"
                  )}
                >
                  <ThemePreview scheme={option.value} />
                  <span className="mt-3 flex items-center gap-2 px-1">
                    <Icon name={option.icon} size={15} className={active ? "text-red-500" : "text-zinc-400"} />
                    <span className="font-sans-semibold text-[14px] text-zinc-900 dark:text-white">{option.label}</span>
                  </span>
                  <span className="mt-0.5 block px-1 text-[12px] text-zinc-500 dark:text-zinc-400">{option.description}</span>
                </button>
              );
            })}
          </div>
        </Section>

        <div className="space-y-6">
          <Section
            title="Liturgical calendar"
            footer={`${TRADITION_FOOTERS[tradition]} ${SYSTEM_FOOTERS[calendarSystem]}`}
          >
            <div className="flex items-center justify-between gap-4 border-b border-zinc-100 pb-4 dark:border-white/[0.06]">
              <div>
                <p className="font-sans-semibold text-[15px] text-zinc-900 dark:text-white">Calendar tradition</p>
                <p className="text-[13px] text-zinc-500 dark:text-zinc-400">Used for readings, commemorations, and fasting.</p>
              </div>
              <Segmented
                value={tradition}
                onChange={setTradition}
                options={[
                  { value: "greek", label: "Greek" },
                  { value: "slavic", label: "Slavic" },
                ]}
              />
            </div>
            <div className="flex items-center justify-between gap-4 pt-4">
              <div>
                <p className="font-sans-semibold text-[15px] text-zinc-900 dark:text-white">Civil calendar</p>
                <p className="text-[13px] text-zinc-500 dark:text-zinc-400">Gregorian (New) or Julian (Old) for Orthocal dates.</p>
              </div>
              <Segmented
                value={calendarSystem}
                onChange={setCalendarSystem}
                options={[
                  { value: "gregorian", label: "Gregorian" },
                  { value: "julian", label: "Julian" },
                ]}
              />
            </div>
          </Section>

          <Section title="Support">
            <a
              href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Parohia feedback")}`}
              className="flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-zinc-900/[0.04] dark:hover:bg-white/[0.05]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-300">
                <Icon name="mail-outline" size={16} />
              </span>
              <span className="flex-1">
                <span className="block font-sans-semibold text-[14px] text-zinc-900 dark:text-white">Contact support</span>
                <span className="block text-[12px] text-zinc-500">Send feedback, ideas, or bug reports</span>
              </span>
              <Icon name="open-outline" size={14} className="text-zinc-400" />
            </a>
            <a
              href={DONATE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-zinc-900/[0.04] dark:hover:bg-white/[0.05]"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-300">
                <Icon name="cafe-outline" size={16} />
              </span>
              <span className="flex-1">
                <span className="block font-sans-semibold text-[14px] text-zinc-900 dark:text-white">Buy me a coffee</span>
                <span className="block text-[12px] text-zinc-500">Your generosity keeps Parohia free for everyone</span>
              </span>
              <Icon name="open-outline" size={14} className="text-zinc-400" />
            </a>
          </Section>
        </div>

        <Section title="Danger zone" className="col-span-2">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-sans-semibold text-[15px] text-zinc-900 dark:text-white">
                {isAdmin ? "Delete parish account" : "Delete account"}
              </p>
              <p className="text-[13px] text-zinc-500 dark:text-zinc-400">
                {isAdmin ? "Permanently removes your account and your parish from Parohia." : "Permanently removes your Parohia account."}
              </p>
            </div>
            <Button variant="danger" icon="trash-outline" onClick={() => setStep(1)}>
              Delete…
            </Button>
          </div>
        </Section>
      </div>

      <ConfirmDialog
        open={step === 1}
        onClose={() => setStep(0)}
        onConfirm={() => setStep(2)}
        destructive
        title={isAdmin ? "Delete parish account?" : "Delete account?"}
        message={
          isAdmin
            ? "This permanently deletes your account and your parish from Parohia.\n\n• All posts, channels, and confession schedules for your parish will be removed\n• Members will be unassigned and asked to choose a parish next time they sign in\n• This cannot be undone"
            : "This permanently deletes your Parohia account.\n\n• Your parish membership, channel subscriptions, and RSVPs will be removed\n• Posts you authored as a channel manager will be removed\n• This cannot be undone"
        }
        confirmLabel="Continue"
      />
      <ConfirmDialog
        open={step === 2}
        onClose={() => setStep(0)}
        onConfirm={runDelete}
        loading={deleting}
        destructive
        title="Are you sure?"
        message={
          isAdmin
            ? "Choose Delete forever only if you intend to remove your parish and account permanently."
            : "Choose Delete forever only if you intend to remove your account permanently."
        }
        confirmLabel="Delete forever"
      />
    </>
  );
}

function Section({ title, footer, className, children }: { title: string; footer?: string; className?: string; children: ReactNode }) {
  return (
    <section className={className}>
      <h2 className="mb-2 px-1 font-sans-semibold text-[12px] uppercase tracking-[0.14em] text-zinc-400 dark:text-zinc-500">{title}</h2>
      <Card>{children}</Card>
      {footer && <p className="mt-2 px-1 text-[12px] leading-5 text-zinc-500 dark:text-zinc-400">{footer}</p>}
    </section>
  );
}

const LIGHT = { bg: "#F9FAFB", card: "#FFFFFF", line: "#E5E7EB", text: "#111827" };
const DARK = { bg: "#000000", card: "#1A1A1E", line: "#2A2A30", text: "#F9FAFB" };

function ThemePreview({ scheme }: { scheme: ThemePreference }) {
  const half = (theme: typeof LIGHT) => (
    <div className="flex-1 p-2.5" style={{ backgroundColor: theme.bg }}>
      <div className="h-1.5 w-3/4 rounded-full opacity-80" style={{ backgroundColor: theme.text }} />
      <div className="mt-2 h-5 rounded-md" style={{ background: "linear-gradient(135deg, #FA433F, #8D0300)" }} />
      <div className="mt-1.5 h-3.5 rounded" style={{ backgroundColor: theme.card, border: `1px solid ${theme.line}` }} />
      <div className="mt-1 h-3.5 rounded" style={{ backgroundColor: theme.card, border: `1px solid ${theme.line}` }} />
    </div>
  );
  return (
    <div className="flex h-[88px] overflow-hidden rounded-2xl">
      {scheme !== "dark" && half(LIGHT)}
      {scheme !== "light" && half(DARK)}
    </div>
  );
}
