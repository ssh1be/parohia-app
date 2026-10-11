import "server-only";

import type { SupabaseClient } from "@parohia/shared";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/** Per-request client bound to the auth cookies (Server Components, Route Handlers). */
export async function getServerSupabase(): Promise<SupabaseClient> {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
          } catch {
            // Called from a Server Component; the proxy refreshes the session instead.
          }
        },
      },
    }
  );
}
