import { supabase as defaultClient, type SupabaseClient } from '../client';

export type SignUpResult =
  | 'needs_otp'
  | 'needs_onboarding'
  | 'already_complete'
  | 'already_registered'
  | 'error';

export type EmailSignUpOutcome =
  | { status: 'needs_otp' }
  | { status: 'already_registered' }
  | { status: 'error'; message: string };

/** Email/password sign-up; with email confirmation on, success means an OTP was emailed. */
export const signUpWithEmail = async (
  email: string,
  password: string,
  client: SupabaseClient = defaultClient
): Promise<EmailSignUpOutcome> => {
  try {
    const { data, error } = await client.auth.signUp({ email, password });

    if (error) {
      const code = (error as { code?: string }).code;
      const message = error.message?.toLowerCase() ?? '';
      const alreadyRegistered =
        message.includes('already registered') ||
        message.includes('already been registered') ||
        code === 'user_already_exists' ||
        code === 'email_exists';

      if (alreadyRegistered) return { status: 'already_registered' };
      return { status: 'error', message: error.message };
    }

    // With email confirmation enabled, Supabase returns a fake user (empty identities)
    // for an existing confirmed email instead of an error — treat that as already registered.
    if (data.user && (data.user.identities?.length ?? 0) === 0) {
      return { status: 'already_registered' };
    }

    return { status: 'needs_otp' };
  } catch (error: any) {
    return { status: 'error', message: error?.message || 'Failed to create account' };
  }
};
