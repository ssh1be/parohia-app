import { useEffect } from 'react';
import { useOrthodoxCalendar } from './useOrthodoxCalendar';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';

export const useNotificationCalendar = () => {
  const { user } = useAuth();
  const { parishEvents, refreshData } = useOrthodoxCalendar(user?.id);
  const { refreshNotifications, preferences } = useNotifications();

  // Refresh notifications when events change or preferences change
  useEffect(() => {
    if (user && preferences.enabled && parishEvents.length > 0) {
      refreshNotifications();
    }
  }, [parishEvents, preferences.enabled, user]);

  // Refresh notifications when user changes
  useEffect(() => {
    if (user && preferences.enabled) {
      refreshNotifications();
    }
  }, [user]);

  return {
    parishEvents,
    refreshData,
    refreshNotifications,
  };
}; 