/** Matches the Supabase Auth default minimum password length. */
export const MIN_PASSWORD_LENGTH = 6;

/** Returns a user-facing error for an invalid new password, or null when it can be submitted. */
export const validateNewPassword = (password: string, confirm: string): string | null => {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (password !== confirm) {
    return "Passwords don't match.";
  }
  return null;
};
