/** Sentinel parish for users who skip parish selection during onboarding. */
export const NO_PARISH_ID = '00000000-0000-0000-0000-000000000001';
export const NO_PARISH_NAME = 'No Parish';

export function isNoParishId(id?: string | null): boolean {
  return !!id && id === NO_PARISH_ID;
}
