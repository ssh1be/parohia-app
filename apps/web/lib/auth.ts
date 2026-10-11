import type { AuthDestination } from "@parohia/shared";

export const DASHBOARD_PATH = "/dashboard";

export function destinationPath(destination: AuthDestination): string {
  if (destination === "onboarding") return "/onboarding/user-type";
  if (destination === "parish-selection") return "/onboarding/parish-selection";
  return DASHBOARD_PATH;
}

/** Routes that need a signed-in desktop session. */
export const PROTECTED_PREFIXES = ["/dashboard", "/onboarding"];

/** Routes that only make sense on desktop (sign-in surface + product). */
export const DESKTOP_ONLY_PREFIXES = [
  "/login",
  "/verify",
  "/forgot-password",
  "/reset-password",
  ...PROTECTED_PREFIXES,
];

export const matchesPrefix = (pathname: string, prefixes: string[]) =>
  prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));

const PHONE_UA = /iPhone|iPod|Android.+Mobile|Windows Phone|BlackBerry|IEMobile|Opera Mini|Mobile Safari/i;

/** Phones only; tablets (iPad, Android tablets) fall through to the viewport gate. */
export const isPhoneUserAgent = (userAgent: string | null) => !!userAgent && PHONE_UA.test(userAgent);

export function getSiteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost:3030";
}
