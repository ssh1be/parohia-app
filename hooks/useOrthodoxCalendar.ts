import { useEffect, useState } from 'react';
import { useCalendarTradition } from '../contexts/CalendarTraditionContext';
import { fetchOrthodoxCalendarData, fetchParishEventsForToday, OrthodoxCalendarData, ParishEvent } from '../services/calendarService';
import { getDayOfWeek, getGreeting, getTodayDate } from '../utils/dateUtils';

interface UseOrthodoxCalendarReturn {
  calendarData: OrthodoxCalendarData | null;
  parishEvents: ParishEvent[];
  greeting: string;
  todayDate: string;
  dayOfWeek: string;
  loading: boolean;
  error: string | null;
  refreshData: () => void;
}

export const useOrthodoxCalendar = (userId?: string): UseOrthodoxCalendarReturn => {
  const { tradition } = useCalendarTradition();
  const [calendarData, setCalendarData] = useState<OrthodoxCalendarData | null>(null);
  const [parishEvents, setParishEvents] = useState<ParishEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = getTodayDate();
  const greeting = getGreeting();
  const todayDate = today.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
  const dayOfWeek = getDayOfWeek(today);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [calendar, parish] = await Promise.all([
        fetchOrthodoxCalendarData(today, tradition),
        fetchParishEventsForToday(today, userId)
      ]);
      setCalendarData(calendar);
      setParishEvents(parish);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch calendar data');
      if (__DEV__) {
        console.error('Error in useOrthodoxCalendar:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshData = () => {
    fetchData();
  };

  useEffect(() => {
    fetchData();
  }, [userId, tradition]);

  return {
    calendarData,
    parishEvents,
    greeting,
    todayDate,
    dayOfWeek,
    loading,
    error,
    refreshData
  };
}; 