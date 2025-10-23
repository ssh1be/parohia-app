import { supabase } from '../config/supabase';
import { OnboardingData, UserType } from '../contexts/OnboardingContext';

export interface SaveOnboardingResult {
  success: boolean;
  error?: string;
  userProfileId?: string;
  parishId?: string;
}

export const saveOnboardingData = async (
  userId: string,
  data: OnboardingData
): Promise<SaveOnboardingResult> => {
  try {
    console.log('Saving onboarding data for user:', userId, data);

    // Get user email from auth
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Failed to get user data');
    }

    // 1. Save user profile
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: userId,
        full_name: data.fullName,
        user_type: data.userType,
        email: user.email,
        phone_number: data.phoneNumber || null,
      })
      .select()
      .single();

    if (profileError) {
      console.error('Error saving user profile:', profileError);
      throw new Error(`Failed to save user profile: ${profileError.message}`);
    }

    console.log('User profile saved:', profileData);

    // 2. Handle parish data based on user type
    let parishId: string | undefined;

    if (data.userType === 'parish_admin' && data.parishName) {
      // Save new parish for parish admin
      const { data: parishData, error: parishError } = await supabase
        .from('parishes')
        .insert({
          name: data.parishName,
          jurisdiction: data.jurisdiction,
          address: data.address,
          city: data.city,
          state: data.state,
          zip_code: data.zipCode,
          phone_number: data.parishPhoneNumber,
          website: data.parishWebsite,
          email: data.parishEmail,
          admin_user_id: userId,
        })
        .select()
        .single();

      if (parishError) {
        console.error('Error saving parish:', parishError);
        throw new Error(`Failed to save parish: ${parishError.message}`);
      }

      parishId = parishData.id;
      console.log('Parish saved:', parishData);
    } else if (data.userType === 'regular_user' && data.selectedParishId) {
      // Connect regular user to existing parish
      const { error: connectionError } = await supabase
        .from('user_parish_connections')
        .insert({
          user_id: userId,
          parish_id: data.selectedParishId,
        });

      if (connectionError) {
        console.error('Error connecting user to parish:', connectionError);
        throw new Error(`Failed to connect to parish: ${connectionError.message}`);
      }

      parishId = data.selectedParishId;
      console.log('User connected to parish:', data.selectedParishId);
    }

    return {
      success: true,
      userProfileId: profileData.id,
      parishId,
    };
  } catch (error: any) {
    console.error('Error saving onboarding data:', error);
    return {
      success: false,
      error: error.message || 'Failed to save onboarding data',
    };
  }
};

// Function to get parishes for regular users to select from
export const getParishes = async () => {
  try {
    console.log('getParishes: Starting fetch...');
    const { data, error } = await supabase
      .from('parishes')
      .select('id, name, jurisdiction, city, state, is_verified')
      .order('name');

    if (error) {
      console.error('getParishes: Supabase error:', error);
      throw error;
    }

    console.log('getParishes: Successfully fetched parishes:', data);
    console.log('getParishes: Number of parishes:', data?.length || 0);
    return data;
  } catch (error: any) {
    console.error('Error fetching parishes:', error);
    throw new Error('Failed to fetch parishes');
  }
};

// Function to check if user profile exists
export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      throw error;
    }

    return data;
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    return null;
  }
}; 