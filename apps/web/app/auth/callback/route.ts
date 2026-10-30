import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { getServerSupabase } from "../../../lib/supabase/server";

/** Same-origin path only; URL parsing treats `\` and stripped control characters like `/`, so `/\evil.com` would leave the site. */
function safeNextPath(next: string | null, origin: string): string {
  if (!next || !next.startsWith("/") || /[\\\x00-\x1f]/.test(next)) return "/dashboard";
  const url = new URL(next, origin);
  return url.origin === origin ? `${url.pathname}${url.search}${url.hash}` : "/dashboard";
}

/** Handles Supabase email links (password recovery, confirmation) for both PKCE codes and token hashes. */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNextPath(searchParams.get("next"), origin);

  const supabase = await getServerSupabase();

  let failed = true;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    failed = !!error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    failed = !!error;
  }

  return NextResponse.redirect(new URL(failed ? "/reset-password" : next, origin));
}
