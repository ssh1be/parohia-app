import { getSharedStorage, supabase as defaultClient, type SupabaseClient } from '../client';

const ONBOARDING_COMPLETE_KEY = 'onboarding_complete';

export const setOnboardingComplete = async (userId: string) => {
  try {
    await getSharedStorage().setItem(ONBOARDING_COMPLETE_KEY, userId);
  } catch (error) {
    console.error('Error setting onboarding complete:', error);
  }
};

const storedCompleteFor = async (userId: string): Promise<boolean> => {
  try {
    return (await getSharedStorage().getItem(ONBOARDING_COMPLETE_KEY)) === userId;
  } catch {
    return false;
  }
};

export const isOnboardingComplete = async (
  userId: string,
  client: SupabaseClient = defaultClient
): Promise<boolean> => {
  try {
    const { data: profile, error: profileError } = await client
      .from('user_profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (!profileError && profile) {
      return true;
    }

    // Fallback to the local flag in case Supabase is unreachable
    return storedCompleteFor(userId);
  } catch {
    return storedCompleteFor(userId);
  }
};

/** Where an authenticated user should land after sign-in. */
export type AuthDestination = 'tabs' | 'onboarding' | 'parish-selection';

/**
 * - No profile → full onboarding
 * - regular_user without parish connection → parish selection only
 * - otherwise → main tabs
 */
export const resolveAuthDestination = async (
  userId: string,
  client: SupabaseClient = defaultClient
): Promise<AuthDestination> => {
  try {
    const { data: profile, error: profileError } = await client
      .from('user_profiles')
      .select('id, user_type')
      .eq('id', userId)
      .maybeSingle();

    if (profileError || !profile) {
      return (await storedCompleteFor(userId)) ? 'tabs' : 'onboarding';
    }

    if (profile.user_type === 'regular_user') {
      // Missing connection → rejoin flow (e.g. parish was deleted).
      // Connection to the "No Parish" sentinel still counts as complete (skipped selection).
      const { data: connections } = await client
        .from('user_parish_connections')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      if (!connections || connections.length === 0) {
        return 'parish-selection';
      }
    }

    if (profile.user_type === 'parish_admin') {
      const { data: parish } = await client
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
    const complete = await isOnboardingComplete(userId, client);
    return complete ? 'tabs' : 'onboarding';
  }
};

export const clearOnboardingStatus = async () => {
  try {
    await getSharedStorage().removeItem(ONBOARDING_COMPLETE_KEY);
  } catch (error) {
    console.error('Error clearing onboarding status:', error);
  }
};
