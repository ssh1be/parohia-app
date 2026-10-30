"use client";

import type { OnboardingData } from "@parohia/shared";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Icon } from "../../components/Icon";
import { Button, cx } from "../../components/app/ui";
import { getBrowserSupabase } from "../../lib/supabase/client";

const STORAGE_KEY = "parohia.onboarding";

interface OnboardingContextValue {
  userId: string;
  email: string;
  rejoin: boolean;
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
  reset: () => void;
  signOut: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used inside the onboarding layout");
  return ctx;
}

const STEPS = [
  { key: "user-type", label: "Your role", description: "Member or administrator" },
  { key: "profile", label: "About you", description: "Name and contact" },
  { key: "parish", label: "Your parish", description: "Join or register" },
  { key: "complete", label: "All set", description: "Open the dashboard" },
] as const;

const stepIndexFor = (pathname: string) => {
  if (pathname.endsWith("/user-type")) return 0;
  if (pathname.endsWith("/profile")) return 1;
  if (pathname.endsWith("/parish-selection") || pathname.endsWith("/parish-details")) return 2;
  if (pathname.endsWith("/complete")) return 3;
  return 0;
};

export function OnboardingShell({
  userId,
  email,
  rejoin,
  children,
}: {
  userId: string;
  email: string;
  rejoin: boolean;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [data, setData] = useState<OnboardingData>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    getBrowserSupabase();
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as { userId: string; data: OnboardingData };
        if (parsed.userId === userId) setData(parsed.data);
      }
    } catch {
      // Ignore corrupt session state
    }
    setHydrated(true);
  }, [userId]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ userId, data }));
    } catch {
      // Storage unavailable
    }
  }, [data, hydrated, userId]);

  const updateData = useCallback((updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  }, []);

  const reset = useCallback(() => {
    setData({});
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage unavailable
    }
  }, []);

  const signOut = useCallback(async () => {
    reset();
    await getBrowserSupabase().auth.signOut();
    router.replace("/login");
    router.refresh();
  }, [reset, router]);

  const current = stepIndexFor(pathname);

  return (
    <OnboardingContext.Provider value={{ userId, email, rejoin, data, updateData, reset, signOut }}>
      <div className="ambient-glow min-h-[100dvh]">
        <div className="mx-auto flex min-h-[100dvh] max-w-6xl flex-col px-10 py-12">
          <a href="/" className="flex w-fit items-center gap-2.5">
            <img src="/App_store_1024_1x.png" alt="" className="h-10 w-10 rounded-full shadow-md shadow-brand-red/20" />
            <span className="font-display text-[24px] leading-none">Parohia</span>
          </a>

          <div className="relative grid flex-1 grid-cols-[280px_1fr] gap-16">
            <aside className="flex flex-col">
              {!rejoin && (
                <ol className="my-auto space-y-1">
                  {STEPS.map((step, index) => {
                    const done = index < current;
                    const active = index === current;
                    return (
                      <li key={step.key} className="relative flex gap-4 pb-8 last:pb-0">
                        {index < STEPS.length - 1 && (
                          <span
                            aria-hidden
                            className={cx(
                              "absolute left-[15px] top-9 h-[calc(100%-36px)] w-px",
                              done ? "bg-red-500/60" : "bg-zinc-200 dark:bg-white/10"
                            )}
                          />
                        )}
                        <span
                          className={cx(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold transition-colors",
                            done && "bg-red-600 text-white",
                            active && "bg-brand-gradient text-white shadow-md shadow-brand-red/30",
                            !done && !active && "bg-zinc-100 text-zinc-400 dark:bg-white/[0.06] dark:text-zinc-500"
                          )}
                        >
                          {done ? <Icon name="checkmark" size={15} /> : index + 1}
                        </span>
                        <div className="pt-1">
                          <p
                            className={cx(
                              "font-sans-semibold text-[14px]",
                              active ? "text-zinc-900 dark:text-white" : "text-zinc-500 dark:text-zinc-400"
                            )}
                          >
                            {step.label}
                          </p>
                          <p className="text-[12px] text-zinc-400 dark:text-zinc-500">{step.description}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </aside>

            <main className="flex items-center">
              <div className="w-full max-w-[620px]">{hydrated ? children : null}</div>
            </main>

            <div className="absolute bottom-0 left-0 w-[280px]">
              <p className="truncate text-[12px] text-zinc-400 dark:text-zinc-500">Signed in as {email}</p>
              <Button variant="ghost" size="sm" icon="log-out-outline" className="-ml-3 mt-1" onClick={signOut}>
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </OnboardingContext.Provider>
  );
}

export function StepHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: ReactNode }) {
  return (
    <header className="mb-8">
      <p className="mb-2 font-sans-semibold text-[12px] uppercase tracking-[0.16em] text-red-600 dark:text-red-400">
        {eyebrow}
      </p>
      <h1 className="font-display text-[48px] leading-[1.02] text-zinc-900 dark:text-white">{title}</h1>
      {subtitle && <p className="mt-3 text-[16px] leading-relaxed text-zinc-500 dark:text-zinc-400">{subtitle}</p>}
    </header>
  );
}
