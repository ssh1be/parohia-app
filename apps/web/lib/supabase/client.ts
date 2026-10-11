"use client";

import { configureShared, type KeyValueStorage, type SupabaseClient } from "@parohia/shared";
import { createBrowserClient } from "@supabase/ssr";

let browserClient: SupabaseClient | null = null;

const localStorageAdapter: KeyValueStorage = {
  getItem: (key) => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Private mode / storage disabled
    }
  },
  removeItem: (key) => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Private mode / storage disabled
    }
  },
};

/** Cookie-backed browser client, registered with @parohia/shared on first use. */
export function getBrowserSupabase(): SupabaseClient {
  if (!browserClient) {
    browserClient = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    configureShared({
      supabase: browserClient,
      storage: localStorageAdapter,
      googleCalendarApiKey: process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_API_KEY,
    });
  }
  return browserClient;
}
