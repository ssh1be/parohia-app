import { supabase } from '../config/supabase';

export interface BulletinEvent {
  id: string;
  parish_id: string;
  created_by: string;
  title: string;
  description?: string;
  event_type: 'announcement' | 'volunteer' | 'event';
  event_date?: string;
  event_time?: string;
  location?: string;
  contact_info?: string;
  volunteers_needed?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by_profile?: {
    full_name: string;
    email: string;
  };
  responses_count?: number;
  user_response?: {
    response_type: string;
    notes?: string;
  };
  volunteer_count?: number;
}

export interface CreateEventData {
  title: string;
  description?: string;
  event_type: 'announcement' | 'volunteer' | 'event';
  event_date?: string;
  event_time?: string;
  location?: string;
  contact_info?: string;
  volunteers_needed?: number;
}

export interface EventResponse {
  response_type: 'interested' | 'unavailable' | 'attending' | 'volunteer';
  notes?: string;
}

export class BulletinService {
  static async getParishEvents(parishId: string, userId?: string): Promise<BulletinEvent[]> {
    try {
      let query = supabase
        .from('bulletin_events')
        .select(`
          *,
          created_by_profile:user_profiles!bulletin_events_created_by_fkey(full_name, email)
        `)
        .eq('parish_id', parishId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching parish events:', error);
        throw error;
      }

      // If user is provided, fetch their responses for these events
      if (userId && data) {
        const eventIds = data.map(event => event.id);
        const { data: responses } = await supabase
          .from('bulletin_responses')
          .select('event_id, response_type, notes')
          .eq('user_id', userId)
          .in('event_id', eventIds);

        // Merge responses with events
        const responseMap = new Map();
        responses?.forEach(response => {
          responseMap.set(response.event_id, {
            response_type: response.response_type,
            notes: response.notes
          });
        });

        data.forEach(event => {
          event.user_response = responseMap.get(event.id);
        });
      }

      // Get volunteer counts for volunteer events
      if (data) {
        const volunteerEventIds = data
          .filter(event => event.event_type === 'volunteer')
          .map(event => event.id);

        if (volunteerEventIds.length > 0) {
          const { data: volunteerResponses } = await supabase
            .from('bulletin_responses')
            .select('event_id')
            .in('event_id', volunteerEventIds)
            .eq('response_type', 'volunteer');

          // Create a map of event_id to volunteer count
          const volunteerCountMap = new Map();
          volunteerResponses?.forEach(response => {
            const count = volunteerCountMap.get(response.event_id) || 0;
            volunteerCountMap.set(response.event_id, count + 1);
          });

          data.forEach(event => {
            if (event.event_type === 'volunteer') {
              event.volunteer_count = volunteerCountMap.get(event.id) || 0;
            }
          });
        }
      }

      return data || [];
    } catch (error) {
      console.error('Error in getParishEvents:', error);
      throw error;
    }
  }

  static async createEvent(parishId: string, userId: string, eventData: CreateEventData): Promise<{ success: boolean; event?: BulletinEvent; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('bulletin_events')
        .insert({
          parish_id: parishId,
          created_by: userId,
          ...eventData
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating event:', error);
        return { success: false, error: error.message };
      }

      return { success: true, event: data };
    } catch (error) {
      console.error('Error in createEvent:', error);
      return { success: false, error: 'Failed to create event' };
    }
  }

  static async updateEvent(eventId: string, eventData: Partial<CreateEventData>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('bulletin_events')
        .update({
          ...eventData,
          updated_at: new Date().toISOString()
        })
        .eq('id', eventId);

      if (error) {
        console.error('Error updating event:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in updateEvent:', error);
      return { success: false, error: 'Failed to update event' };
    }
  }

  static async deleteEvent(eventId: string): Promise<{ success: boolean; error?: string }> {
    try {
      // First, delete all responses for this event
      const { error: responsesError } = await supabase
        .from('bulletin_responses')
        .delete()
        .eq('event_id', eventId);

      if (responsesError) {
        console.error('Error deleting event responses:', responsesError);
        return { success: false, error: responsesError.message };
      }

      // Then, soft delete the event
      const { error: eventError } = await supabase
        .from('bulletin_events')
        .update({ is_active: false })
        .eq('id', eventId);

      if (eventError) {
        console.error('Error deleting event:', eventError);
        return { success: false, error: eventError.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in deleteEvent:', error);
      return { success: false, error: 'Failed to delete event' };
    }
  }

  static async respondToEvent(eventId: string, userId: string, response: EventResponse): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('bulletin_responses')
        .upsert({
          event_id: eventId,
          user_id: userId,
          response_type: response.response_type,
          notes: response.notes
        });

      if (error) {
        console.error('Error responding to event:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in respondToEvent:', error);
      return { success: false, error: 'Failed to respond to event' };
    }
  }

  static async removeResponse(eventId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('bulletin_responses')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error removing response:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in removeResponse:', error);
      return { success: false, error: 'Failed to remove response' };
    }
  }

  static async getEventResponses(eventId: string): Promise<{ success: boolean; responses?: any[]; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('bulletin_responses')
        .select(`
          *,
          user_profile:user_profiles!bulletin_responses_user_id_fkey(full_name, email)
        `)
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching event responses:', error);
        return { success: false, error: error.message };
      }

      return { success: true, responses: data || [] };
    } catch (error) {
      console.error('Error in getEventResponses:', error);
      return { success: false, error: 'Failed to fetch responses' };
    }
  }

  static async getUserPersonalEvents(userId: string, date?: Date): Promise<BulletinEvent[]> {
    try {
      // Get all events where the user has responded with 'attending' or 'volunteer'
      let query = supabase
        .from('bulletin_responses')
        .select(`
          event_id,
          response_type,
          notes,
          created_at,
          bulletin_events!inner(
            id,
            parish_id,
            created_by,
            title,
            description,
            event_type,
            event_date,
            event_time,
            location,
            contact_info,
            volunteers_needed,
            is_active,
            created_at,
            updated_at,
            created_by_profile:user_profiles!bulletin_events_created_by_fkey(full_name, email)
          )
        `)
        .eq('user_id', userId)
        .in('response_type', ['attending', 'volunteer'])
        .eq('bulletin_events.is_active', true);

      // If a specific date is provided, filter by that date (use local date to avoid UTC offset issues)
      if (date) {
        const dateStr =
          date.getFullYear() +
          '-' +
          String(date.getMonth() + 1).padStart(2, '0') +
          '-' +
          String(date.getDate()).padStart(2, '0');
        query = query.eq('bulletin_events.event_date', dateStr);
      }

      const { data, error } = await query as any;

      if (error) {
        console.error('Error fetching user personal events:', error);
        throw error;
      }

      // Transform the data to match BulletinEvent interface
      const events: BulletinEvent[] = (data ?? []).map((item: any) => ({
        ...(item.bulletin_events as BulletinEvent),
        user_response: {
          response_type: item.response_type,
          notes: item.notes
        }
      }));

      return events;
    } catch (error) {
      console.error('Error in getUserPersonalEvents:', error);
      throw error;
    }
  }
} 