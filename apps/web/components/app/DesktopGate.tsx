import type { ReactNode } from "react";
import { Icon } from "../Icon";

const APP_STORE_URL = process.env.NEXT_PUBLIC_APP_STORE_URL;

export function UseTheAppMessage() {
  return (
    <div className="ambient-glow flex min-h-[100dvh] items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm text-center">
        <img
          src="/App_store_1024_1x.png"
          alt=""
          className="mx-auto mb-8 h-20 w-20 rounded-[24px] shadow-lg shadow-brand-red/25"
        />
        <p className="mb-2 font-sans-semibold text-[12px] uppercase tracking-[0.16em] text-red-600 dark:text-red-400">
          On your phone?
        </p>
        <h1 className="font-display text-[38px] leading-[1.05] text-zinc-900 dark:text-white">
          Parohia lives in the app
        </h1>
        <p className="mt-4 font-display-italic text-[18px] leading-relaxed text-zinc-500 dark:text-zinc-400">
          The web dashboard is built for desktop. On a phone, sign in with the Parohia app for the calendar,
          bulletin, and confession booking.
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <a
            href={APP_STORE_URL || "/notify"}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-brand-gradient px-6 text-[15px] font-semibold text-white shadow-md shadow-brand-red/25"
          >
            <Icon name="phone-portrait-outline" size={18} />
            {APP_STORE_URL ? "Get the Parohia app" : "Join the waitlist"}
          </a>
          <a
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-full px-6 text-[15px] font-semibold text-zinc-600 hover:bg-zinc-900/[0.05] dark:text-zinc-300 dark:hover:bg-white/[0.06]"
          >
            Back to parohia.app
          </a>
        </div>

        <p className="mt-10 flex items-center justify-center gap-2 text-[12px] text-zinc-400 dark:text-zinc-500">
          <Icon name="desktop-outline" size={14} />
          On a computer? Widen your browser window to continue.
        </p>
      </div>
    </div>
  );
}

/** Below the desktop breakpoint the product UI is not rendered as usable; phones get pointed to the app. */
export function DesktopGate({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="hidden lg:contents">{children}</div>
      <div className="lg:hidden">
        <UseTheAppMessage />
      </div>
    </>
  );
}
