import { supabase } from '../config/supabase';

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
    const { data, error } = await supabase
      .from('user_parish_connections')
      .select(`
        parish_id,
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
          created_at,
          updated_at
        )
      `)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return (data?.parishes as any) || null;
  } catch (error: any) {
    console.error('Error fetching parish by user ID:', error);
    return null;
  }
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