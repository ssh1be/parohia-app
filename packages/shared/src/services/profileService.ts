import { supabase } from '../client';

/** Display names of a parish's admin and members, keyed by user id. Contact details stay admin-only. */
export async function getParishProfileNames(
  parishId: string,
  userIds: string[]
): Promise<Map<string, string>> {
  const ids = [...new Set(userIds.filter(Boolean))];
  if (ids.length === 0) return new Map();

  const { data, error } = await supabase.rpc('get_parish_profile_names', {
    p_parish_id: parishId,
    p_user_ids: ids,
  });

  if (error) {
    console.error('Error loading profile names:', error);
    return new Map();
  }

  return new Map(
    ((data || []) as { id: string; full_name: string | null }[]).map((row) => [
      row.id,
      row.full_name?.trim() || 'Unknown',
    ])
  );
}
