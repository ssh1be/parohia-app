import type { ReactNode, Ref } from "react";
import { Icon } from "../Icon";

/** Logical device size in points (an iPhone 15 screen plus a 10pt bezel). */
export const DEVICE = { width: 410, height: 864, bezel: 10, screenWidth: 390, screenRadius: 56 };

interface PhoneFrameProps {
  children: ReactNode;
  /** Set the rendered size with a `[--s:<scale>]` class, e.g. `[--s:0.7] lg:[--s:0.82]`. */
  className?: string;
  screenRef?: Ref<HTMLDivElement>;
  /** Status bar text color; lock screens sit on a dark wallpaper in both themes. */
  statusTone?: "auto" | "light";
  label?: string;
  /** Interactive copies stay in the accessibility tree; decorative ones are exposed as a single image. */
  interactive?: boolean;
}

export function PhoneFrame({ children, className = "", screenRef, statusTone = "auto", label, interactive = false }: PhoneFrameProps) {
  return (
    <div
      role={interactive ? "group" : "img"}
      aria-label={label}
      className={`relative shrink-0 ${className}`}
      style={{ width: `calc(${DEVICE.width}px * var(--s, 0.8))`, height: `calc(${DEVICE.height}px * var(--s, 0.8))` }}
    >
      <div
        className="absolute left-0 top-0 origin-top-left rounded-[66px] bg-[#0c0c0e] p-[10px] shadow-[0_50px_100px_-40px_rgba(141,3,0,0.45),0_30px_60px_-30px_rgba(9,9,11,0.45)] ring-1 ring-black/5 dark:ring-white/10"
        style={{ width: DEVICE.width, height: DEVICE.height, transform: "scale(var(--s, 0.8))" }}
      >
        <div className="pointer-events-none absolute inset-[3px] rounded-[63px] ring-1 ring-white/10" />
        <div
          ref={screenRef}
          className="app-screen relative h-full w-full overflow-hidden rounded-[56px] bg-gray-50 text-gray-900 dark:bg-black dark:text-white"
          aria-hidden={!interactive}
          {...((interactive ? {} : { inert: true }) as object)}
        >
          {children}
          {statusTone === "auto" && (
            <>
              <div className="pointer-events-none absolute inset-x-0 top-0 z-[25] h-[62px] bg-gradient-to-b from-gray-50 from-50% to-gray-50/0 dark:from-black dark:to-black/0" />
              <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[15] h-[130px] bg-gradient-to-t from-gray-50/90 from-25% to-gray-50/0 backdrop-blur-md [clip-path:inset(0_round_0_0_56px_56px)] [mask-image:linear-gradient(to_top,black_45%,transparent)] dark:from-black/90 dark:to-black/0" />
            </>
          )}
          <StatusBar tone={statusTone} />
          <div className="pointer-events-none absolute left-1/2 top-[11px] z-40 h-[35px] w-[122px] -translate-x-1/2 rounded-full bg-black" />
          <div
            className={`pointer-events-none absolute bottom-[8px] left-1/2 z-40 h-[5px] w-[136px] -translate-x-1/2 rounded-full ${
              statusTone === "light" ? "bg-white" : "bg-gray-900 dark:bg-white"
            }`}
          />
        </div>
      </div>
    </div>
  );
}

function StatusBar({ tone }: { tone: "auto" | "light" }) {
  return (
    <div
      className={`pointer-events-none absolute inset-x-0 top-0 z-30 flex h-[54px] items-center justify-between pl-[44px] pr-[34px] pt-[4px] ${
        tone === "light" ? "text-white" : "text-gray-900 dark:text-white"
      }`}
    >
      <span className="font-sans-bold text-[16px] tracking-[-0.2px]">9:41</span>
      <span className="flex items-center gap-[6px]">
        <Icon name="cellular" size={17} />
        <Icon name="wifi" size={17} />
        <Icon name="battery-full" size={26} />
      </span>
    </div>
  );
}
