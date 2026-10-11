import { supabase } from '../client';

/** Deletes the signed-in user's account (parish admin or regular member). */
export const deleteAccount = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const { data, error } = await supabase.functions.invoke('delete-parish-admin-account', {
      method: 'POST',
      body: {},
    });

    if (error) {
      return { success: false, error: error.message || 'Failed to delete account' };
    }

    if (data?.error) {
      return { success: false, error: data.error };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting account:', error);
    return { success: false, error: error?.message || 'Failed to delete account' };
  }
};

/** @deprecated Prefer deleteAccount — same edge function handles both roles. */
export const deleteParishAdminAccount = deleteAccount;
