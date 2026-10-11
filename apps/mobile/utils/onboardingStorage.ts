import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { supabase } from '../config/supabase';

const ONBOARDING_COMPLETE_KEY = 'onboarding_complete';

const createStorageAdapter = () => {
  if (Platform.OS === 'web') {
    const isLocalStorageAvailable = typeof window !== 'undefined' && window.localStorage;
    if (isLocalStorageAvailable) {
      return {
        getItem: (key: string) => {
          try {
            return Promise.resolve(localStorage.getItem(key));
          } catch (error) {
            if (__DEV__) {
              console.error('Storage getItem error:', error);
            }
            return Promise.resolve(null);
          }
        },
        setItem: (key: string, value: string) => {
          try {
            localStorage.setItem(key, value);
            return Promise.resolve();
          } catch (error) {
            if (__DEV__) {
              console.error('Storage setItem error:', error);
            }
            return Promise.resolve();
          }
        },
        removeItem: (key: string) => {
          try {
            localStorage.removeItem(key);
            return Promise.resolve();
          } catch (error) {
            if (__DEV__) {
              console.error('Storage removeItem error:', error);
            }
            return Promise.resolve();
          }
        },
      };
    } else {
      const memoryStorage = new Map();
      return {
        getItem: (key: string) => Promise.resolve(memoryStorage.get(key) || null),
        setItem: (key: string, value: string) => {
          memoryStorage.set(key, value);
          return Promise.resolve();
        },
        removeItem: (key: string) => {
          memoryStorage.delete(key);
          return Promise.resolve();
        },
      };
    }
  } else {
    return AsyncStorage;
  }
};

const storage = createStorageAdapter();

export const setOnboardingComplete = async (userId: string) => {
  try {
    await storage.setItem(ONBOARDING_COMPLETE_KEY, userId);
  } catch (error) {
    if (__DEV__) {
      console.error('Error setting onboarding complete:', error);
    }
  }
};

export const isOnboardingComplete = async (userId: string): Promise<boolean> => {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (!profileError && profile) {
      return true;
    }

    // Fallback: check AsyncStorage in case Supabase is unreachable
    const stored = await storage.getItem(ONBOARDING_COMPLETE_KEY);
    return stored === userId;
  } catch (error) {
    try {
      const stored = await storage.getItem(ONBOARDING_COMPLETE_KEY);
      return stored === userId;
    } catch {
      return false;
    }
  }
};

/** Where an authenticated user should land after sign-in. */
export type AuthDestination = 'tabs' | 'onboarding' | 'parish-selection';

/**
 * - No profile → full onboarding
 * - regular_user without parish connection → parish selection only
 * - otherwise → main tabs
 */
export const resolveAuthDestination = async (userId: string): Promise<AuthDestination> => {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, user_type')
      .eq('id', userId)
      .maybeSingle();

    if (profileError || !profile) {
      const stored = await storage.getItem(ONBOARDING_COMPLETE_KEY);
      return stored === userId ? 'tabs' : 'onboarding';
    }

    if (profile.user_type === 'regular_user') {
      // Missing connection → rejoin flow (e.g. parish was deleted).
      // Connection to the "No Parish" sentinel still counts as complete (skipped selection).
      const { data: connections } = await supabase
        .from('user_parish_connections')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (!connections || connections.length === 0) {
        return 'parish-selection';
      }
    }

    if (profile.user_type === 'parish_admin') {
      const { data: parish } = await supabase
        .from('parishes')
        .select('id')
        .eq('admin_user_id', userId)
        .maybeSingle();

      if (!parish) {
        return 'onboarding';
      }
    }

    return 'tabs';
  } catch (error) {
    console.error('Error resolving auth destination:', error);
    const complete = await isOnboardingComplete(userId);
    return complete ? 'tabs' : 'onboarding';
  }
};

export const clearOnboardingStatus = async () => {
  try {
    await storage.removeItem(ONBOARDING_COMPLETE_KEY);
  } catch (error) {
    if (__DEV__) {
      console.error('Error clearing onboarding status:', error);
    }
  }
}; 