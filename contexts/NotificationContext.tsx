import * as Notifications from 'expo-notifications';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { InteractionManager } from 'react-native';
import { NotificationEvent, NotificationPreferences, notificationService } from '../services/notificationService';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  preferences: NotificationPreferences;
  scheduledNotifications: NotificationEvent[];
  disabledEventNotifications: string[];
  loading: boolean;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  cancelAllNotifications: () => Promise<void>;
  initializeNotifications: () => Promise<void>;
  setEventNotificationDisabled: (eventId: string, disabled: boolean) => Promise<void>;
  isEventNotificationDisabled: (eventId: string) => Promise<boolean>;
  // Parish (Google Calendar) events: OFF by default, explicit enable
  setParishEventNotificationEnabled: (eventId: string, enabled: boolean) => Promise<void>;
  isParishEventNotificationEnabled: (eventId: string) => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    enabled: true,
    reminderTime: 30,
    dailyDigest: true,
    dailyDigestTime: '08:00',
    soundEnabled: true,
    vibrationEnabled: true,
  });
  const [scheduledNotifications, setScheduledNotifications] = useState<NotificationEvent[]>([]);
  const [disabledEventNotifications, setDisabledEventNotifications] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [handledInitialResponse, setHandledInitialResponse] = useState(false);
  const { user } = useAuth();

  const initializeNotifications = async () => {
    try {
      setLoading(true);
      await notificationService.initialize();
      
      // Load preferences
      const prefs = await notificationService.getNotificationPreferences();
      setPreferences(prefs);
      
      // Load scheduled notifications
      const scheduled = await notificationService.getScheduledNotifications();
      setScheduledNotifications(scheduled);
      
      // Load disabled event notifications
      const disabled = await notificationService.getDisabledEventNotifications();
      setDisabledEventNotifications(disabled);
      
      // Set up notification response handler
      const subscription = Notifications.addNotificationResponseReceivedListener(
        notificationService.handleNotificationResponse
      );
      
      // Cleanup function will be handled in useEffect cleanup
    } catch (error) {
      console.error('Error initializing notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (newPreferences: Partial<NotificationPreferences>) => {
    try {
      await notificationService.updateNotificationPreferences(newPreferences);
      setPreferences(prev => ({ ...prev, ...newPreferences }));
      
      // Refresh notifications with new preferences
      if (user) {
        await refreshNotifications();
      }
    } catch (error) {
      console.error('Error updating notification preferences:', error);
    }
  };

  const refreshNotifications = async () => {
    try {
      if (user) {
        await notificationService.refreshEventNotifications(user.id);
        const scheduled = await notificationService.getScheduledNotifications();
        setScheduledNotifications(scheduled);
        
        // Reload disabled event notifications
        const disabled = await notificationService.getDisabledEventNotifications();
        setDisabledEventNotifications(disabled);
      }
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    }
  };

  const cancelAllNotifications = async () => {
    try {
      await notificationService.cancelAllNotifications();
      setScheduledNotifications([]);
    } catch (error) {
      console.error('Error canceling notifications:', error);
    }
  };

  const setEventNotificationDisabled = async (eventId: string, disabled: boolean) => {
    try {
      await notificationService.setEventNotificationDisabled(eventId, disabled);
      
      // Update local state
      if (disabled) {
        setDisabledEventNotifications(prev => 
          prev.includes(eventId) ? prev : [...prev, eventId]
        );
      } else {
        setDisabledEventNotifications(prev => 
          prev.filter(id => id !== eventId)
        );
      }
      
      // Refresh notifications to apply changes
      if (user) {
        await refreshNotifications();
      }
    } catch (error) {
      console.error('Error setting event notification disabled state:', error);
    }
  };

  const isEventNotificationDisabled = async (eventId: string): Promise<boolean> => {
    try {
      return await notificationService.isEventNotificationDisabled(eventId);
    } catch (error) {
      console.error('Error checking if event notification is disabled:', error);
      return false;
    }
  };

  // Parish (Google Calendar) events: explicit enable API
  const setParishEventNotificationEnabled = async (eventId: string, enabled: boolean) => {
    try {
      await notificationService.setParishEventNotificationEnabled(eventId, enabled);
      // When enabling/disabling a parish event, refresh to apply scheduling changes
      if (user) {
        await refreshNotifications();
      }
    } catch (error) {
      console.error('Error setting parish event notification enabled state:', error);
    }
  };

  const isParishEventNotificationEnabled = async (eventId: string): Promise<boolean> => {
    try {
      return await notificationService.isParishEventNotificationEnabled(eventId);
    } catch (error) {
      console.error('Error checking if parish event notification is enabled:', error);
      return false;
    }
  };



  useEffect(() => {
    // Defer heavy notification initialization until after initial render/interaction
    const task = InteractionManager.runAfterInteractions(() => {
      initializeNotifications();
    });
    return () => task.cancel();
  }, []);

  useEffect(() => {
    if (user && preferences.enabled) {
      // Ensure any previously saved token is synced once user session is available
      notificationService.syncStoredPushTokenToSupabase().catch(() => {});
      // Add a small delay to prevent multiple rapid calls
      const timeoutId = setTimeout(() => {
        refreshNotifications();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [user, preferences.enabled]);

  // Handle cold-start tap on a remote notification
  useEffect(() => {
    const handleInitialResponse = async () => {
      try {
        if (handledInitialResponse) return;
        // Small delay to ensure router and auth state are ready
        await new Promise(res => setTimeout(res, 200));
        const last = await Notifications.getLastNotificationResponseAsync();
        if (last) {
          await notificationService.handleNotificationResponse(last);
          setHandledInitialResponse(true);
        }
      } catch (error) {
        console.error('Error processing initial notification response:', error);
      }
    };

    handleInitialResponse();
  }, [handledInitialResponse, user]);

  const value: NotificationContextType = {
    preferences,
    scheduledNotifications,
    disabledEventNotifications,
    loading,
    updatePreferences,
    refreshNotifications,
    cancelAllNotifications,
    initializeNotifications,
    setEventNotificationDisabled,
    isEventNotificationDisabled,
    setParishEventNotificationEnabled,
    isParishEventNotificationEnabled,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}; 