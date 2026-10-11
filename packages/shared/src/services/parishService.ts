import { isNoParishId } from '../constants/parishes';
import { supabase } from '../client';
import { ChannelService } from './channelService';

export interface Parish {
  id: string;
  name: string;
  jurisdiction: string;
  address: string;
  city: string;
  state: string;
  zip_code?: string;
  phone_number?: string;
  website?: string;
  email?: string;
  admin_user_id: string;
  parish_calendar_id?: string;
  is_verified: boolean;
  // Priest Information
  priest_name?: string;
  priest_phone_number?: string;
  priest_email?: string;
  // Donation fields
  paypal_donation_url?: string;
  donation_enabled?: boolean;
  donation_message?: string;
  /** When false, confession booking is hidden from parishioners. */
  confession_enabled?: boolean;
  created_at: string;
  updated_at: string;
}

// Get parish by user ID (for parish admins)
export const getParishByAdminId = async (adminUserId: string): Promise<Parish | null> => {
  try {
    const { data, error } = await supabase
      .from('parishes')
      .select('*')
      .eq('admin_user_id', adminUserId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      throw error;
    }

    return data;
  } catch (error: any) {
    console.error('Error fetching parish by admin ID:', error);
    return null;
  }
};

// Get parish by user ID (for regular users)
export const getParishByUserId = async (userId: string): Promise<Parish | null> => {
  try {
    // Prefer a real parish if both a sentinel and a real connection somehow exist.
    const { data, error } = await supabase
      .from('user_parish_connections')
      .select(`
        parish_id,
        created_at,
        parishes (
          id,
          name,
          jurisdiction,
          address,
          city,
          state,
          zip_code,
          phone_number,
          website,
          email,
          admin_user_id,
          parish_calendar_id,
          is_verified,
          priest_name,
          priest_phone_number,
          priest_email,
          paypal_donation_url,
          donation_enabled,
          donation_message,
          confession_enabled,
          created_at,
          updated_at
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    const rows = data || [];
    for (const row of rows) {
      const parish = row.parishes as any;
      if (parish && !isNoParishId(parish.id)) {
        return parish;
      }
    }
    return null;
  } catch (error: any) {
    console.error('Error fetching parish by user ID:', error);
    return null;
  }
};

export interface ParishDetailsUpdate {
  name: string;
  jurisdiction: string;
  address: string;
  city: string;
  state: string;
  zip_code?: string | null;
  phone_number?: string | null;
  website?: string | null;
  email?: string | null;
  parish_calendar_id?: string | null;
}

export const updateParishDetails = async (
  parishId: string,
  details: ParishDetailsUpdate
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('parishes')
      .update({
        name: details.name,
        jurisdiction: details.jurisdiction,
        address: details.address,
        city: details.city,
        state: details.state,
        zip_code: details.zip_code || null,
        phone_number: details.phone_number || null,
        website: details.website || null,
        email: details.email || null,
        parish_calendar_id: details.parish_calendar_id || null,
      })
      .eq('id', parishId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Error updating parish:', error);
    return { success: false, error: error.message || 'Failed to update parish information' };
  }
};

/**
 * Moves a member to another parish. Inserts the new connection before removing others
 * (including the "No Parish" sentinel) so a failed insert can't orphan the user.
 */
export const switchUserParish = async (userId: string, parishId: string): Promise<Parish> => {
  const { data: existing, error: existingError } = await supabase
    .from('user_parish_connections')
    .select('id, parish_id')
    .eq('user_id', userId);
  if (existingError) throw existingError;

  const alreadyLinked = (existing || []).some((row) => row.parish_id === parishId);

  if (!alreadyLinked) {
    const { error: insertError } = await supabase
      .from('user_parish_connections')
      .insert({ user_id: userId, parish_id: parishId });
    if (insertError) throw insertError;
  }

  const { error: deleteError } = await supabase
    .from('user_parish_connections')
    .delete()
    .eq('user_id', userId)
    .neq('parish_id', parishId);
  if (deleteError) throw deleteError;

  await ChannelService.ensureGeneralSubscription(userId, parishId);
  await ChannelService.ensureChantChannel(parishId);

  const newParish = await getParishByUserId(userId);
  if (!newParish) {
    throw new Error('Parish connection saved but could not be loaded');
  }
  return newParish;
};

// Update parish priest information
export const updateParishPriestInfo = async (
  parishId: string,
  priestInfo: {
    priest_name?: string;
    priest_phone_number?: string;
    priest_email?: string;
  }
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Convert empty strings to null for proper database storage
    const cleanedPriestInfo = {
      priest_name: priestInfo.priest_name?.trim() || null,
      priest_phone_number: priestInfo.priest_phone_number?.trim() || null,
      priest_email: priestInfo.priest_email?.trim() || null,
    };

    const { error } = await supabase
      .from('parishes')
      .update(cleanedPriestInfo)
      .eq('id', parishId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error updating parish priest info:', error);
    return {
      success: false,
      error: error.message || 'Failed to update priest information'
    };
  }
};

// Update parish calendar ID
export const updateParishCalendarId = async (
  parishId: string,
  calendarId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('parishes')
      .update({ parish_calendar_id: calendarId })
      .eq('id', parishId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error updating parish calendar ID:', error);
    return {
      success: false,
      error: error.message || 'Failed to update calendar ID'
    };
  }
};

// Enable or disable confession scheduling for a parish
export const updateParishConfessionEnabled = async (
  parishId: string,
  enabled: boolean
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('parishes')
      .update({ confession_enabled: enabled })
      .eq('id', parishId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error updating confession enabled:', error);
    return {
      success: false,
      error: error.message || 'Failed to update confession settings',
    };
  }
};

// Update parish donation settings
export const updateParishDonationSettings = async (
  parishId: string,
  donationSettings: {
    paypal_donation_url?: string;
    donation_enabled?: boolean;
    donation_message?: string;
  }
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Convert empty strings to null for proper database storage
    const cleanedSettings = {
      paypal_donation_url: donationSettings.paypal_donation_url?.trim() || null,
      donation_enabled: donationSettings.donation_enabled || false,
      donation_message: donationSettings.donation_message?.trim() || null,
    };

    const { error } = await supabase
      .from('parishes')
      .update(cleanedSettings)
      .eq('id', parishId);

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error: any) {
    console.error('Error updating parish donation settings:', error);
    return {
      success: false,
      error: error.message || 'Failed to update donation settings'
    };
  }
};

// Get parish calendar ID
export const getParishCalendarId = async (userId: string): Promise<string | null> => {
  try {
    // First try to get as parish admin
    let parish = await getParishByAdminId(userId);
    
    if (!parish) {
      // If not found as admin, try as regular user
      parish = await getParishByUserId(userId);
    }

    return parish?.parish_calendar_id || null;
  } catch (error: any) {
    console.error('Error getting parish calendar ID:', error);
    return null;
  }
};

export type ParishMemberRole = 'admin' | 'manager' | 'member';

export interface ParishMember {
  user_id: string;
  full_name: string;
  email: string;
  phone_number?: string | null;
  role: ParishMemberRole;
  joined_at?: string | null;
}

const ROLE_SORT: Record<ParishMemberRole, number> = {
  admin: 0,
  manager: 1,
  member: 2,
};

/**
 * Roster of parish members plus the parish admin.
 * Prefer General-channel subscribers: admins can SELECT those under current RLS,
 * while user_parish_connections is typically limited to the caller's own row.
 * Role priority: admin > manager (any channel assignment) > member.
 */
export const getParishMembers = async (
  parishId: string,
  adminUserId: string
): Promise<ParishMember[]> => {
  try {
    const joinedAtByUserId = new Map<string, string | null>();

    // Connections may return only the caller's row (or none for admins) under RLS.
    const { data: connections } = await supabase
      .from('user_parish_connections')
      .select('user_id, created_at')
      .eq('parish_id', parishId);

    for (const connection of connections || []) {
      if (connection.user_id) {
        joinedAtByUserId.set(connection.user_id, connection.created_at ?? null);
      }
    }

    // General channel subscriptions are auto-created on join and readable by parish admins.
    const { data: generalChannel } = await supabase
      .from('bulletin_channels')
      .select('id')
      .eq('parish_id', parishId)
      .eq('is_default', true)
      .maybeSingle();

    if (generalChannel?.id) {
      const { data: subscriptions, error: subscriptionsError } = await supabase
        .from('bulletin_channel_subscriptions')
        .select('user_id, created_at')
        .eq('channel_id', generalChannel.id);

      if (subscriptionsError) {
        throw subscriptionsError;
      }

      for (const subscription of subscriptions || []) {
        if (subscription.user_id && !joinedAtByUserId.has(subscription.user_id)) {
          joinedAtByUserId.set(subscription.user_id, subscription.created_at ?? null);
        }
      }
    }

    const { data: managerRows } = await supabase
      .from('bulletin_channel_managers')
      .select('user_id, bulletin_channels!inner(parish_id, is_archived)')
      .eq('bulletin_channels.parish_id', parishId)
      .eq('bulletin_channels.is_archived', false);

    const managerUserIds = new Set(
      (managerRows || []).map((row: any) => row.user_id).filter(Boolean) as string[]
    );

    const userIds = Array.from(
      new Set([...joinedAtByUserId.keys(), adminUserId, ...managerUserIds])
    );

    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('id, full_name, email, phone_number')
      .in('id', userIds);

    if (profilesError) {
      throw profilesError;
    }

    const members: ParishMember[] = (profiles || []).map((profile) => {
      let role: ParishMemberRole = 'member';
      if (profile.id === adminUserId) {
        role = 'admin';
      } else if (managerUserIds.has(profile.id)) {
        role = 'manager';
      }

      return {
        user_id: profile.id,
        full_name: profile.full_name || 'Unknown',
        email: profile.email || '',
        phone_number: profile.phone_number ?? null,
        role,
        joined_at: joinedAtByUserId.get(profile.id) ?? null,
      };
    });

    members.sort((a, b) => {
      const roleDiff = ROLE_SORT[a.role] - ROLE_SORT[b.role];
      if (roleDiff !== 0) return roleDiff;
      return a.full_name.localeCompare(b.full_name);
    });

    return members;
  } catch (error: any) {
    console.error('Error fetching parish members:', error);
    return [];
  }
};