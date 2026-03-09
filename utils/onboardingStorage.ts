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

export const clearOnboardingStatus = async () => {
  try {
    await storage.removeItem(ONBOARDING_COMPLETE_KEY);
  } catch (error) {
    if (__DEV__) {
      console.error('Error clearing onboarding status:', error);
    }
  }
}; 