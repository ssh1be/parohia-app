import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/** Minimal async key/value store (AsyncStorage on native, localStorage/cookies on web). */
export interface KeyValueStorage {
  getItem: (key: string) => Promise<string | null> | string | null;
  setItem: (key: string, value: string) => Promise<void> | void;
  removeItem: (key: string) => Promise<void> | void;
}

export interface CreateSupabaseClientOptions {
  url: string;
  anonKey: string;
  storage?: KeyValueStorage;
  detectSessionInUrl?: boolean;
}

/** Builds a Supabase client with platform-provided session storage. */
export function createSupabaseClient({
  url,
  anonKey,
  storage,
  detectSessionInUrl = false,
}: CreateSupabaseClientOptions): SupabaseClient {
  return createClient(url, anonKey, {
    auth: {
      storage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl,
    },
  });
}

export function createMemoryStorage(): KeyValueStorage {
  const memory = new Map<string, string>();
  return {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => {
      memory.set(key, value);
    },
    removeItem: (key) => {
      memory.delete(key);
    },
  };
}

interface SharedConfig {
  supabase: SupabaseClient | null;
  storage: KeyValueStorage;
  googleCalendarApiKey?: string;
}

const config: SharedConfig = {
  supabase: null,
  storage: createMemoryStorage(),
};

export interface ConfigureSharedOptions {
  supabase: SupabaseClient;
  /** Local fallback store for onboarding status; defaults to in-memory. */
  storage?: KeyValueStorage;
  googleCalendarApiKey?: string;
}

/** Each app registers its own client (and optional storage/API keys) once at startup. */
export function configureShared(options: ConfigureSharedOptions) {
  config.supabase = options.supabase;
  if (options.storage) config.storage = options.storage;
  if (options.googleCalendarApiKey !== undefined) {
    config.googleCalendarApiKey = options.googleCalendarApiKey;
  }
}

export function getSupabase(): SupabaseClient {
  if (!config.supabase) {
    throw new Error('@parohia/shared: call configureShared({ supabase }) before using services');
  }
  return config.supabase;
}

export function getSharedStorage(): KeyValueStorage {
  return config.storage;
}

export function getGoogleCalendarApiKey(): string | undefined {
  return config.googleCalendarApiKey;
}

/** Lazily forwards to the configured client so services can keep `supabase.from(...)` call sites. */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabase();
    const value = Reflect.get(client, prop, client);
    return typeof value === 'function' ? value.bind(client) : value;
  },
});

export type { AuthError, Session, SupabaseClient, User } from '@supabase/supabase-js';
