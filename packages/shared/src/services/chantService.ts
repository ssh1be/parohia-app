import { supabase } from '../client';
import { getParishProfileNames } from './profileService';

const CHANT_SERVICE_TERMS = [
  'liturgy',
  'orthros',
  'vespers',
  'paraklesis',
  'akathist',
  'vigil',
] as const;

export type ChantSignup = {
  id: string;
  userId: string;
  name: string;
  createdAt: string;
};

function eventHasPassed(startTime: string, endTime?: string): boolean {
  const now = new Date();

  if (startTime.includes('T')) {
    const end = endTime?.includes('T') ? new Date(endTime) : new Date(startTime);
    return end.getTime() <= now.getTime();
  }

  // All-day: treat as passed after the local calendar day ends.
  const datePart = startTime.slice(0, 10);
  const [year, month, day] = datePart.split('-').map(Number);
  if (!year || !month || !day) return true;
  const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);
  return endOfDay.getTime() <= now.getTime();
}

/** True for liturgical services (Liturgy, Vespers, …) regardless of date. */
export function isLiturgicalServiceTitle(title: string): boolean {
  const normalized = (title || '').toLowerCase();
  return CHANT_SERVICE_TERMS.some((term) => normalized.includes(term));
}

export function isChantServiceEvent(
  title: string,
  startTime: string,
  endTime?: string
): boolean {
  if (!isLiturgicalServiceTitle(title)) {
    return false;
  }
  return !eventHasPassed(startTime, endTime);
}

function parseEventStart(startTime: string): string | null {
  if (!startTime) return null;
  if (startTime.includes('T')) {
    const d = new Date(startTime);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  const datePart = startTime.slice(0, 10);
  const [year, month, day] = datePart.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day, 0, 0, 0, 0).toISOString();
}

export class ChantService {
  static async listSignups(
    parishId: string,
    calendarEventId: string
  ): Promise<ChantSignup[]> {
    const { data, error } = await supabase
      .from('chant_signups')
      .select('id, user_id, created_at')
      .eq('parish_id', parishId)
      .eq('calendar_event_id', calendarEventId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error listing chant signups:', error);
      throw error;
    }

    const rows = data || [];
    if (rows.length === 0) return [];

    const nameById = await getParishProfileNames(
      parishId,
      rows.map((r) => r.user_id)
    );

    return rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      name: nameById.get(row.user_id) || 'Unknown',
      createdAt: row.created_at,
    }));
  }

  static async signUp(params: {
    parishId: string;
    calendarEventId: string;
    userId: string;
    eventTitle?: string;
    eventStart?: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.from('chant_signups').upsert(
        {
          parish_id: params.parishId,
          calendar_event_id: params.calendarEventId,
          user_id: params.userId,
          event_title: params.eventTitle || null,
          event_start: params.eventStart ? parseEventStart(params.eventStart) : null,
        },
        { onConflict: 'parish_id,calendar_event_id,user_id', ignoreDuplicates: true }
      );

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error) {
      console.error('Error signing up to chant:', error);
      return { success: false, error: 'Failed to sign up' };
    }
  }

  static async removeSignup(params: {
    parishId: string;
    calendarEventId: string;
    userId: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('chant_signups')
        .delete()
        .eq('parish_id', params.parishId)
        .eq('calendar_event_id', params.calendarEventId)
        .eq('user_id', params.userId);

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error) {
      console.error('Error removing chant signup:', error);
      return { success: false, error: 'Failed to remove signup' };
    }
  }
}
