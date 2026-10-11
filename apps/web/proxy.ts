import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  DASHBOARD_PATH,
  DESKTOP_ONLY_PREFIXES,
  PROTECTED_PREFIXES,
  isPhoneUserAgent,
  matchesPrefix,
} from "./lib/auth";

const SIGNED_OUT_ONLY = ["/login", "/verify", "/forgot-password"];

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (matchesPrefix(pathname, DESKTOP_ONLY_PREFIXES) && isPhoneUserAgent(request.headers.get("user-agent"))) {
    const url = request.nextUrl.clone();
    url.pathname = "/get-the-app";
    url.search = "";
    return NextResponse.redirect(url);
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  // Refreshes the session cookie; must run before any redirect decision.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const redirectTo = (path: string, params?: Record<string, string>) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = params ? `?${new URLSearchParams(params)}` : "";
    const redirect = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  };

  if (!user && matchesPrefix(pathname, PROTECTED_PREFIXES)) {
    return redirectTo("/login", { next: `${pathname}${search}` });
  }

  if (user && matchesPrefix(pathname, SIGNED_OUT_ONLY)) {
    // The dashboard layout routes unfinished accounts into onboarding.
    return redirectTo(DASHBOARD_PATH);
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/login",
    "/verify",
    "/forgot-password",
    "/reset-password",
  ],
};
