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
          className="mx-auto mb-7 h-16 w-16 rounded-[20px] shadow-lg shadow-brand-red/25"
        />
        <h1 className="font-display text-[32px] leading-[1.1] text-zinc-900 dark:text-white">Use the Parohia app</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-zinc-500 dark:text-zinc-400">
          The dashboard is for desktop. On your phone, open the app to sign in.
        </p>

        <a
          href={APP_STORE_URL || "/notify"}
          className="mt-8 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-brand-gradient px-6 text-[15px] font-semibold text-white shadow-md shadow-brand-red/25"
        >
          <Icon name="phone-portrait-outline" size={18} />
          {APP_STORE_URL ? "Get the Parohia app" : "Join the waitlist"}
        </a>

        <a
          href="/"
          className="mt-8 inline-flex items-center justify-center gap-1.5 text-[13px] text-zinc-400 transition-colors hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-300"
        >
          <Icon name="arrow-back" size={13} />
          Back to parohia.app
        </a>
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
