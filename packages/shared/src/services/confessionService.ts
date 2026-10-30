import { supabase } from '../client';

export interface ConfessionSchedule {
  id: string;
  parish_id: string;
  date: string;
  time_slot: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConfessionReservation {
  id: string;
  schedule_id: string;
  user_id: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ConfessionReservationWithSchedule extends ConfessionReservation {
  confession_schedules: {
    date: string;
    time_slot: string;
    parish_id: string;
  };
}

export interface TimeSlot {
  id: string;
  time: string;
  displayTime: string;
  available: boolean;
  reservedBy?: string;
  scheduleId?: string;
  reservationId?: string;
}

export interface DaySchedule {
  date: Date;
  dayName: string;
  dateString: string;
  timeSlots: TimeSlot[];
}

function toLocalDateString(date: Date): string {
  return (
    date.getFullYear() +
    '-' +
    String(date.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(date.getDate()).padStart(2, '0')
  );
}

export class ConfessionService {
  // Get confession schedules for a parish within a date range
  static async getSchedules(parishId: string, startDate: Date, endDate: Date): Promise<ConfessionSchedule[]> {
    // Use local date formatting to avoid timezone issues
    const startDateStr = startDate.getFullYear() + '-' + 
      String(startDate.getMonth() + 1).padStart(2, '0') + '-' + 
      String(startDate.getDate()).padStart(2, '0');
    const endDateStr = endDate.getFullYear() + '-' + 
      String(endDate.getMonth() + 1).padStart(2, '0') + '-' + 
      String(endDate.getDate()).padStart(2, '0');
      
    const { data, error } = await supabase
      .from('confession_schedules')
      .select('*')
      .eq('parish_id', parishId)
      .gte('date', startDateStr)
      .lte('date', endDateStr)
      .order('date', { ascending: true })
      .order('time_slot', { ascending: true });

    if (error) {
      console.error('Error fetching confession schedules:', error);
      throw error;
    }

    return data || [];
  }

  // Get reservations for a parish within a date range
  static async getReservations(parishId: string, startDate: Date, endDate: Date): Promise<ConfessionReservation[]> {
    // Use local date formatting to avoid timezone issues
    const startDateStr = startDate.getFullYear() + '-' + 
      String(startDate.getMonth() + 1).padStart(2, '0') + '-' + 
      String(startDate.getDate()).padStart(2, '0');
    const endDateStr = endDate.getFullYear() + '-' + 
      String(endDate.getMonth() + 1).padStart(2, '0') + '-' + 
      String(endDate.getDate()).padStart(2, '0');
      
    const { data, error } = await supabase
      .from('confession_reservations')
      .select(`
        *,
        confession_schedules!inner(parish_id, date)
      `)
      .eq('confession_schedules.parish_id', parishId)
      .eq('status', 'confirmed')
      .gte('confession_schedules.date', startDateStr)
      .lte('confession_schedules.date', endDateStr)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching confession reservations:', error);
      throw error;
    }

    return data || [];
  }

  /** Booked slots visible to any parish member; reservation_id is only set for the caller's own bookings (or all, for the admin). */
  static async getBookedSlots(
    parishId: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ schedule_id: string; reservation_id: string | null }[]> {
    const { data, error } = await supabase.rpc('get_booked_confession_slots', {
      p_parish_id: parishId,
      p_start: toLocalDateString(startDate),
      p_end: toLocalDateString(endDate),
    });

    if (error) {
      console.error('Error fetching booked confession slots:', error);
      throw error;
    }

    return data || [];
  }

  // Create or update schedule availability (for parish admins)
  static async updateScheduleAvailability(
    parishId: string, 
    date: string, 
    timeSlot: string, 
    isAvailable: boolean
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('Updating schedule availability:', { parishId, date, timeSlot, isAvailable });
      
      // First check if the record exists
      const { data: existingRecord, error: checkError } = await supabase
        .from('confession_schedules')
        .select('id, is_available')
        .eq('parish_id', parishId)
        .eq('date', date)
        .eq('time_slot', timeSlot)
        .single();

      console.log('Check result:', { existingRecord, checkError });

      if (checkError && (checkError as any).code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error checking existing schedule:', checkError);
        return { success: false, error: (checkError as any).message };
      }

      if (existingRecord) {
        console.log('Updating existing record:', existingRecord.id);
        // Update existing record
        const { data: updateData, error: updateError } = await supabase
          .from('confession_schedules')
          .update({ is_available: isAvailable })
          .eq('id', existingRecord.id)
          .select();

        console.log('Update result:', { updateData, updateError });

        if (updateError) {
          console.error('Error updating schedule:', updateError);
          return { success: false, error: (updateError as any).message };
        }
      } else {
        console.log('Inserting new record');
        // Insert new record
        const { data: insertData, error: insertError } = await supabase
          .from('confession_schedules')
          .insert({
            parish_id: parishId,
            date,
            time_slot: timeSlot,
            is_available: isAvailable
          })
          .select();

        console.log('Insert result:', { insertData, insertError });

        if (insertError) {
          console.error('Error inserting schedule:', insertError);
          return { success: false, error: (insertError as any).message };
        }
      }

      console.log('Schedule update completed successfully');
      return { success: true };
    } catch (error) {
      console.error('Error updating schedule availability:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  // Make a reservation (for regular users)
  static async makeReservation(
    scheduleId: string, 
    userId: string, 
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if the schedule is available and not already reserved
      const { data: schedule, error: scheduleError } = await supabase
        .from('confession_schedules')
        .select('*')
        .eq('id', scheduleId)
        .eq('is_available', true)
        .single();

      if (scheduleError || !schedule) {
        return { success: false, error: 'Schedule not available' };
      }

      // schedule_id is unique, so a slot someone else holds (invisible under RLS) fails here
      const { error: insertError } = await supabase
        .from('confession_reservations')
        .insert({
          schedule_id: scheduleId,
          user_id: userId,
          status: 'confirmed',
          notes
        });

      if (insertError?.code === '23505') {
        return { success: false, error: 'Time slot already reserved' };
      }
      if (insertError) throw insertError;

      return { success: true };
    } catch (error) {
      console.error('Error making reservation:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  // Cancel a reservation
  static async cancelReservation(
    reservationId: string, 
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('confession_reservations')
        .delete()
        .eq('id', reservationId)
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      return { success: false, error: (error as Error).message };
    }
  }

  // Get reservation details with user information
  static async getReservationDetails(scheduleId: string): Promise<any> {
    // First get the reservation with schedule details
    const { data: reservation, error: reservationError } = await supabase
      .from('confession_reservations')
      .select(`
        *,
        confession_schedules(date, time_slot)
      `)
      .eq('schedule_id', scheduleId)
      .eq('status', 'confirmed')
      .single();

    if (reservationError) {
      console.error('Error fetching reservation details:', reservationError);
      throw reservationError;
    }

    if (!reservation) {
      throw new Error('Reservation not found');
    }

    // Then get the user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('full_name, email, phone_number')
      .eq('id', reservation.user_id)
      .single();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      // Return reservation data without profile if profile fetch fails
      return {
        ...reservation,
        user_profiles: null
      };
    }

    return {
      ...reservation,
      user_profiles: profile
    };
  }

  // Get user's reservations (filtered by current parish)
  static async getUserReservations(userId: string): Promise<ConfessionReservationWithSchedule[]> {
    // First, get the user's current parish
    const { data: parishConnection, error: parishError } = await supabase
      .from('user_parish_connections')
      .select('parish_id')
      .eq('user_id', userId)
      .single();

    if (parishError || !parishConnection) {
      console.log('No parish connection found for user, returning empty reservations');
      return [];
    }

    const { data, error } = await supabase
      .from('confession_reservations')
      .select(`
        *,
        confession_schedules!inner(date, time_slot, parish_id)
      `)
      .eq('user_id', userId)
      .eq('confession_schedules.parish_id', parishConnection.parish_id)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user reservations:', error);
      throw error;
    }

    return data || [];
  }

  // Get parish reservations (for parish admins)
  static async getParishReservations(parishId: string, date: Date): Promise<ConfessionReservationWithSchedule[]> {
    // Use local date formatting to avoid timezone issues
    const dateStr = date.getFullYear() + '-' + 
      String(date.getMonth() + 1).padStart(2, '0') + '-' + 
      String(date.getDate()).padStart(2, '0');
      
    const { data, error } = await supabase
      .from('confession_reservations')
      .select(`
        *,
        confession_schedules!inner(date, time_slot, parish_id)
      `)
      .eq('confession_schedules.parish_id', parishId)
      .eq('confession_schedules.date', dateStr)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching parish reservations:', error);
      throw error;
    }

    return data || [];
  }

  // Generate time slots for a week with availability data
  static async generateWeekSchedule(
    parishId: string, 
    startDate: Date
  ): Promise<DaySchedule[]> {
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);

    const schedules = await this.getSchedules(parishId, startDate, endDate);
    const reservations = await this.getBookedSlots(parishId, startDate, endDate);

    const weekSchedule: DaySchedule[] = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const dateString = date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      
      // Generate time slots for each day (9 AM to 5 PM, 15-minute intervals)
      const timeSlots: TimeSlot[] = [];
      for (let hour = 9; hour <= 17; hour++) {
        for (let minute = 0; minute < 60; minute += 15) {
          const displayHour = hour > 12 ? hour - 12 : hour;
          const ampm = hour >= 12 ? 'PM' : 'AM';
          const minuteStr = minute === 0 ? '00' : minute.toString();
          const time = `${displayHour}:${minuteStr} ${ampm}`;
          
          // Create a shorter display time for the UI
          const displayTime = minute === 0 ? `${displayHour}${ampm}` : `${displayHour}:${minuteStr}`;
          
          // Format time for database comparison
          const dbTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
          // Use local date formatting to avoid timezone issues
          const dateStr = date.getFullYear() + '-' + 
            String(date.getMonth() + 1).padStart(2, '0') + '-' + 
            String(date.getDate()).padStart(2, '0');
          
          // Find if this slot has a schedule
          const schedule = schedules.find(s => 
            s.date === dateStr && s.time_slot === dbTime
          );
          
          // Find if this slot has a reservation
          const reservation = reservations.find(r => 
            r.schedule_id === schedule?.id
          );
          
          timeSlots.push({
            id: `${dateStr}-${hour}-${minute}`,
            time,
            displayTime,
            available: schedule?.is_available || false,
            reservedBy: reservation ? 'Reserved' : undefined,
            scheduleId: schedule?.id,
            reservationId: reservation?.reservation_id ?? undefined
          });
        }
      }
      
      weekSchedule.push({
        date,
        dayName,
        dateString,
        timeSlots
      });
    }
    
    return weekSchedule;
  }

} 