import { router } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { Session, supabase, User } from '../config/supabase';
import { notificationService } from '../services/notificationService';
import { isOnboardingComplete } from '../utils/onboardingStorage';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<SignUpResult>;
  signIn: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

export type SignUpResult =
  | 'needs_otp'
  | 'needs_onboarding'
  | 'already_complete'
  | 'already_registered'
  | 'error';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error && __DEV__) {
          console.error('Error getting session:', error);
        }
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (error) {
        if (__DEV__) {
          console.error('Error initializing auth:', error);
        }
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (mounted && loading) {
        if (__DEV__) {
          console.log('Auth initialization timeout, setting loading to false');
        }
        setLoading(false);
      }
    }, 3000); // 3 second timeout for faster production experience

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (__DEV__) {
          console.log('Auth state changed:', event, session ? 'has session' : 'no session');
        }
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string): Promise<SignUpResult> => {
    try {
      // Check if user is already authenticated
      if (user) {
        const onboardingComplete = await isOnboardingComplete(user.id);

        if (!onboardingComplete) {
          return 'needs_onboarding';
        }
        return 'already_complete';
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        const alreadyRegistered =
          error.message?.toLowerCase().includes('already registered') ||
          error.message?.toLowerCase().includes('already been registered') ||
          (error as { code?: string }).code === 'user_already_exists' ||
          (error as { code?: string }).code === 'email_exists';

        if (alreadyRegistered) {
          Alert.alert(
            'Account already exists',
            'An account with this email is already registered. Please sign in instead.',
          );
          return 'already_registered';
        }

        throw error;
      }

      // With email confirmation enabled, Supabase returns a fake user (empty identities)
      // for an existing confirmed email instead of an error — treat that as already registered.
      if (data.user && (data.user.identities?.length ?? 0) === 0) {
        Alert.alert(
          'Account already exists',
          'An account with this email is already registered. Please sign in instead.',
        );
        return 'already_registered';
      }

      return 'needs_otp';
    } catch (error: any) {
      Alert.alert('Error', error.message);
      return 'error';
    }
  };

  const signIn = async (email: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Check if user has completed onboarding
      if (data.user) {
        const onboardingComplete = await isOnboardingComplete(data.user.id);
        // Let the root layout handle navigation based on onboarding status
        if (__DEV__) {
          console.log('User signed in, onboarding complete:', onboardingComplete);
        }
      }
      return true;
    } catch (error: any) {
      Alert.alert('Error', error.message);
      return false;
    }
  };

  const signOut = async () => {
    try {
      // Cancel local notifications and revoke token before signing out
      await notificationService.cancelAllNotifications();
      await notificationService.revokeStoredPushTokenForCurrentUser();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Redirect to auth screen after successful sign out
      router.replace('/(auth)/welcome');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'parohia://reset-password',
      });
      
      if (error) throw error;
      
      Alert.alert(
        'Success!',
        'Please check your email for a password reset link.',
        [{ text: 'OK' }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 