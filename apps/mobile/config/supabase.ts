import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  configureShared,
  createMemoryStorage,
  createSupabaseClient,
  type KeyValueStorage,
} from '@parohia/shared';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const createStorageAdapter = (): KeyValueStorage => {
  if (Platform.OS !== 'web') {
    return AsyncStorage;
  }

  if (typeof window === 'undefined' || !window.localStorage) {
    // Server-side rendering of the static web export
    return createMemoryStorage();
  }

  return {
    getItem: (key) => {
      try {
        return localStorage.getItem(key);
      } catch (error) {
        if (__DEV__) console.error('Storage getItem error:', error);
        return null;
      }
    },
    setItem: (key, value) => {
      try {
        localStorage.setItem(key, value);
      } catch (error) {
        if (__DEV__) console.error('Storage setItem error:', error);
      }
    },
    removeItem: (key) => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        if (__DEV__) console.error('Storage removeItem error:', error);
      }
    },
  };
};

const storage = createStorageAdapter();

export const supabase = createSupabaseClient({
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
  storage,
});

configureShared({
  supabase,
  storage,
  googleCalendarApiKey: process.env.EXPO_PUBLIC_GOOGLE_CALENDAR_API_KEY,
});

export type { AuthError, Session, User } from '@parohia/shared';
