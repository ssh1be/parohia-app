export type UserType = 'regular_user' | 'parish_admin';

export interface OnboardingData {
  // Step 1: User Type Selection
  userType?: UserType;

  // Step 2: User Information
  fullName?: string;
  email?: string;
  password?: string;
  phoneNumber?: string;
  termsAccepted?: boolean;

  // Step 3: Parish Selection (for regular users)
  selectedParishId?: string;

  // Step 4: Parish Information (for parish admins)
  parishName?: string;
  jurisdiction?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  parishPhoneNumber?: string;
  parishWebsite?: string;
  parishEmail?: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  user_type: UserType;
  phone_number?: string | null;
  created_at?: string;
  updated_at?: string;
}
