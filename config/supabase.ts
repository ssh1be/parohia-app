import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// Replace these with your actual Supabase project credentials
const supabaseUrl = 'https://fiuxfvdpyahixtnviecn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZpdXhmdmRweWFoaXh0bnZpZWNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NzQ5NTUsImV4cCI6MjA2ODU1MDk1NX0.xoSmo5cHdqX9eaKdMxf4B8Rwevnj5WLlyNjVOY4PASg';

// Create storage adapter based on platform
const createStorageAdapter = () => {
  if (__DEV__) {
    console.log('Creating storage adapter for platform:', Platform.OS);
  }
  
  if (Platform.OS === 'web') {
    // Check if localStorage is available (browser environment)
    const isLocalStorageAvailable = typeof window !== 'undefined' && window.localStorage;
    
    if (isLocalStorageAvailable) {
      // Use localStorage for web
      return {
        getItem: (key: string) => {
          try {
            const value = localStorage.getItem(key);
            return Promise.resolve(value);
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
      // Fallback for server-side rendering or when localStorage is not available
      if (__DEV__) {
        console.log('localStorage not available, using memory storage');
      }
      const memoryStorage = new Map();
      return {
        getItem: (key: string) => {
          const value = memoryStorage.get(key) || null;
          return Promise.resolve(value);
        },
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
    // Use AsyncStorage for native platforms
    return AsyncStorage;
  }
};

// Create Supabase client with platform-appropriate storage
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: createStorageAdapter(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Export types for better TypeScript support
export type { AuthError, Session, User } from '@supabase/supabase-js';

