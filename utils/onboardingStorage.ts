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
    // First check if user profile exists
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_type')
      .eq('id', userId)
      .single();

    if (profileError) {
      return false;
    }

    // Check based on user type
    if (profile.user_type === 'parish_admin') {
      // For parish admins, check if they have a parish
      const { data: parish, error: parishError } = await supabase
        .from('parishes')
        .select('id')
        .eq('admin_user_id', userId)
        .single();

      if (parishError) {
        return false;
      }

      return true;
    } else if (profile.user_type === 'regular_user') {
      // For regular users, check if they have a parish connection
      const { data: connection, error: connectionError } = await supabase
        .from('user_parish_connections')
        .select('parish_id')
        .eq('user_id', userId)
        .single();

      if (connectionError) {
        return false;
      }

      return true;
    }

    return false;
  } catch (error) {
    if (__DEV__) {
      console.error('Error checking onboarding status:', error);
    }
    return false;
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