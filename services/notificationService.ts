import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { Platform } from 'react-native';
import { supabase } from '../config/supabase';
import { BulletinService } from './bulletinService';
import { fetchParishEventsForMultipleDays, ParishEvent } from './calendarService';
import { ConfessionService } from './confessionService';
import { getUserProfile } from './onboardingService';
import { getParishByAdminId, getParishByUserId } from './parishService';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    console.log('Notification handler called for:', notification.request.content.title);
    console.log('Notification trigger:', notification.request.trigger);
    return {
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    };
  },
});

export interface NotificationPreferences {
  enabled: boolean;
  reminderTime: number; // minutes before event
  dailyDigest: boolean;
  dailyDigestTime: string; // HH:mm format, e.g., "08:00"
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export interface NotificationEvent {
  id: string;
  eventId: string;
  title: string;
  body: string;
  scheduledTime: Date;
  eventTime: Date;
}

const NOTIFICATION_PREFERENCES_KEY = 'notification_preferences';
const SCHEDULED_NOTIFICATIONS_KEY = 'scheduled_notifications';
const DISABLED_EVENT_NOTIFICATIONS_KEY = 'disabled_event_notifications';
// Explicit allowlist for parish (Google Calendar) event reminders
const ENABLED_PARISH_EVENT_NOTIFICATIONS_KEY = 'enabled_parish_event_notifications';

export class NotificationService {
  private static instance: NotificationService;
  private isInitialized = false;
  private refreshTimeout: number | null = null;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('Notification permissions not granted');
        return;
      }

      // Get push token for remote notifications (only if project is properly configured)
      if (Device.isDevice) {
        try {
          const resolvedProjectId = (Constants as any)?.easConfig?.projectId || (Constants as any)?.expoConfig?.extra?.eas?.projectId;
          const token = resolvedProjectId
            ? await Notifications.getExpoPushTokenAsync({ projectId: resolvedProjectId })
            : await Notifications.getExpoPushTokenAsync();
          console.log('Push token:', token.data);
          await this.savePushToken(token.data);
        } catch (error) {
          console.log('Push notifications not configured yet:', error instanceof Error ? error.message : 'Unknown error');
          // This is expected if push notifications aren't set up yet
        }
      }

      // Set up notification categories
      await this.setupNotificationCategories();

      this.isInitialized = true;
      console.log('Notification service initialized');
    } catch (error) {
      console.error('Error initializing notification service:', error);
    }
  }

  private async setupNotificationCategories(): Promise<void> {
    await Notifications.setNotificationCategoryAsync('event-reminder', [
      {
        identifier: 'view-event',
        buttonTitle: 'View Event',
        options: {
          isDestructive: false,
          isAuthenticationRequired: false,
        },
      },
      {
        identifier: 'dismiss',
        buttonTitle: 'Dismiss',
        options: {
          isDestructive: true,
          isAuthenticationRequired: false,
        },
      },
    ]);
  }

  private async savePushToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem('push_token', token);
      // Also upsert token to Supabase for remote pushes
      try {
        const { data: userRes } = await supabase.auth.getUser();
        const userId = userRes.user?.id;
        if (!userId) return;
        await supabase.from('user_push_tokens').upsert({
          user_id: userId,
          token,
          platform: Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web',
          device_id: Device.osBuildId ?? undefined,
          last_seen_at: new Date().toISOString(),
          revoked: false,
        }, { onConflict: 'user_id,token' });
      } catch (err) {
        console.error('Error upserting push token to Supabase:', err);
      }
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  }

  // Public method to sync any previously saved token once the user session is available
  async syncStoredPushTokenToSupabase(): Promise<void> {
    try {
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes.user?.id;
      if (!userId) return;

      const token = await AsyncStorage.getItem('push_token');
      if (!token) return;

      await supabase.from('user_push_tokens').upsert({
        user_id: userId,
        token,
        platform: Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : 'web',
        device_id: Device.osBuildId ?? undefined,
        last_seen_at: new Date().toISOString(),
        revoked: false,
      }, { onConflict: 'user_id,token' });
    } catch (error) {
      console.error('Error syncing stored push token to Supabase:', error);
    }
  }

  async getNotificationPreferences(): Promise<NotificationPreferences> {
    try {
      const preferences = await AsyncStorage.getItem(NOTIFICATION_PREFERENCES_KEY);
      if (preferences) {
        const parsedPreferences = JSON.parse(preferences);
        // Ensure backward compatibility for existing users
        if (!parsedPreferences.dailyDigestTime) {
          parsedPreferences.dailyDigestTime = '08:00';
          // Save the updated preferences
          await AsyncStorage.setItem(NOTIFICATION_PREFERENCES_KEY, JSON.stringify(parsedPreferences));
        }
        return parsedPreferences;
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }

    // Default preferences
    return {
      enabled: true,
      reminderTime: 30, // 30 minutes before event
      dailyDigest: true,
      dailyDigestTime: '08:00',
      soundEnabled: true,
      vibrationEnabled: true,
    };
  }

  async updateNotificationPreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
    try {
      const currentPreferences = await this.getNotificationPreferences();
      const updatedPreferences = { ...currentPreferences, ...preferences };
      await AsyncStorage.setItem(NOTIFICATION_PREFERENCES_KEY, JSON.stringify(updatedPreferences));
    } catch (error) {
      console.error('Error updating notification preferences:', error);
    }
  }

  async scheduleEventNotification(event: ParishEvent, userId?: string, parishName?: string): Promise<string | null> {
    try {
      const preferences = await this.getNotificationPreferences();
      if (!preferences.enabled) return null;

      // Check if this specific event has notifications disabled
      const isDisabled = await this.isEventNotificationDisabled(event.id);
      if (isDisabled) {
        console.log(`Skipping notification for "${event.title}" - notifications disabled for this event`);
        return null;
      }

      // Debug the raw event data
      console.log(`Raw event data for "${event.title}":`);
      console.log(`  startTime: "${event.startTime}"`);
      console.log(`  endTime: "${event.endTime}"`);
      
      // Parse the event time properly, handling timezone
      let eventTime: Date;
      if (event.startTime.includes('T')) {
        // This is a datetime with timezone info
        eventTime = new Date(event.startTime);
      } else {
        // This is a date-only event (all-day event)
        console.log(`Skipping notification for "${event.title}" - all-day events don't need time-based notifications`);
        return null;
      }
      
      const now = new Date();
      
      // Don't schedule if the event has already started
      if (eventTime <= now) {
        console.log(`Skipping notification for "${event.title}" - event already started at ${eventTime.toISOString()}`);
        return null;
      }

      const reminderTime = new Date(eventTime.getTime() - preferences.reminderTime * 60 * 1000);
      
      // Add debugging for timing
      const timeUntilEvent = eventTime.getTime() - now.getTime();
      const timeUntilReminder = reminderTime.getTime() - now.getTime();
      
      console.log(`Event: "${event.title}"`);
      console.log(`  Event time: ${eventTime.toISOString()}`);
      console.log(`  Reminder time: ${reminderTime.toISOString()}`);
      console.log(`  Time until event: ${Math.round(timeUntilEvent / 60000)} minutes`);
      console.log(`  Time until reminder: ${Math.round(timeUntilReminder / 60000)} minutes`);
      
      // Don't schedule if reminder time is in the past
      if (reminderTime <= now) {
        console.log(`Skipping notification for "${event.title}" - reminder time (${reminderTime.toISOString()}) is in the past`);
        return null;
      }
      
      // Don't schedule if event is too close (less than reminder time away)
      if (timeUntilEvent < preferences.reminderTime * 60 * 1000) {
        console.log(`Skipping notification for "${event.title}" - event is too close (${Math.round(timeUntilEvent / 60000)} minutes away, need ${preferences.reminderTime} minutes)`);
        return null;
      }

      // Don't schedule if reminder time is too close (less than 1 minute away)
      if (timeUntilReminder < 60 * 1000) {
        console.log(`Skipping notification for "${event.title}" - reminder time is too close (${Math.round(timeUntilReminder / 60000)} minutes away, need at least 1 minute)`);
        return null;
      }

      console.log(`Scheduling notification for "${event.title}" at ${reminderTime.toISOString()} (${Math.round(timeUntilReminder / 60000)} minutes from now)`);
      
      const eventTitle = parishName || 'Upcoming Parish Event';
      
      // Convert minutes to hours when appropriate
      let timeText: string;
      if (preferences.reminderTime >= 60) {
        const hours = Math.floor(preferences.reminderTime / 60);
        const minutes = preferences.reminderTime % 60;
        if (minutes === 0) {
          timeText = `${hours} hour${hours > 1 ? 's' : ''}`;
        } else {
          timeText = `${hours} hour${hours > 1 ? 's' : ''} and ${minutes} minute${minutes > 1 ? 's' : ''}`;
        }
      } else {
        timeText = `${preferences.reminderTime} minute${preferences.reminderTime > 1 ? 's' : ''}`;
      }
      
      const eventBody = `${event.title} starts in ${timeText}`;

      // Log the event notification for testing
      console.log(`🔔 EVENT NOTIFICATION:`);
      console.log(`   Title: "${eventTitle}"`);
      console.log(`   Body: "${eventBody}"`);
      console.log(`   Event: "${event.title}"`);
      console.log(`   Scheduled for: ${reminderTime.toLocaleString()}`);
      console.log(`   Event time: ${eventTime.toLocaleString()}`);

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: eventTitle,
          body: eventBody,
          data: {
            eventId: event.id,
            eventTitle: event.title,
            eventTime: event.startTime,
            type: 'event-reminder',
          },
          categoryIdentifier: 'event-reminder',
          sound: preferences.soundEnabled ? 'default' : undefined,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminderTime,
        },
      });

      console.log(`✅ Successfully scheduled event notification with ID: ${notificationId}`);

      // Save scheduled notification info
      await this.saveScheduledNotification({
        id: notificationId,
        eventId: event.id,
        title: event.title,
        body: `${event.title} starts in ${preferences.reminderTime} minutes`,
        scheduledTime: reminderTime,
        eventTime: eventTime,
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling event notification:', error);
      return null;
    }
  }

  // Remote-only for bulletin broadcasts; local immediate notifications removed

  async scheduleDailyDigest(events: ParishEvent[], date: Date, parishName?: string): Promise<string | null> {
    try {
      const preferences = await this.getNotificationPreferences();
      if (!preferences.enabled || !preferences.dailyDigest) return null;

      const digestTime = new Date(date);
      const dailyDigestTime = preferences.dailyDigestTime || '08:00'; // Fallback for existing users
      const [hours, minutes] = dailyDigestTime.split(':').map(Number);
      digestTime.setHours(hours, minutes, 0, 0);

      // Don't schedule if digest time is in the past
      if (digestTime <= new Date()) return null;

      // Filter out events that have already started
      const now = new Date();
      const upcomingEvents = events.filter(event => new Date(event.startTime) > now);
      
      if (upcomingEvents.length === 0) {
        console.log(`No upcoming events for daily digest on ${date.toDateString()}`);
        return null;
      }

      const eventCount = upcomingEvents.length;
      const eventTitles = upcomingEvents.slice(0, 3).map(e => e.title).join(', ');
      const moreText = upcomingEvents.length > 3 ? ` and ${upcomingEvents.length - 3} more` : '';

      const digestTitle = parishName || 'Today\'s Parish Events';
      const digestBody = `${eventCount} event${eventCount > 1 ? 's' : ''} today: ${eventTitles}${moreText}`;

      // Log the digest message for testing
      console.log(`📅 DAILY DIGEST for ${date.toDateString()}:`);
      console.log(`   Title: "${digestTitle}"`);
      console.log(`   Body: "${digestBody}"`);
      console.log(`   Scheduled for: ${digestTime.toLocaleString()}`);
      console.log(`   Events: ${upcomingEvents.map(e => e.title).join(', ')}`);

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: digestTitle,
          body: digestBody,
          data: {
            type: 'daily-digest',
            date: date.toISOString(),
            eventCount,
          },
          sound: preferences.soundEnabled ? 'default' : undefined,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: digestTime,
        },
      });

      console.log(`✅ Scheduled daily digest for ${date.toDateString()} with ${eventCount} events`);
      return notificationId;
    } catch (error) {
      console.error('Error scheduling daily digest:', error);
      return null;
    }
  }



  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      await this.removeScheduledNotification(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await AsyncStorage.removeItem(SCHEDULED_NOTIFICATIONS_KEY);
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  // Mark the stored push token as revoked for the current user
  async revokeStoredPushTokenForCurrentUser(): Promise<void> {
    try {
      const token = await AsyncStorage.getItem('push_token');
      if (!token) return;
      const { data: userRes } = await supabase.auth.getUser();
      const userId = userRes.user?.id;
      if (!userId) return;
      await supabase
        .from('user_push_tokens')
        .update({ revoked: true, last_seen_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('token', token);
    } catch (error) {
      console.error('Error revoking stored push token:', error);
    }
  }

  async refreshEventNotifications(userId?: string): Promise<void> {
    // Clear any existing timeout
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
    }

    // Debounce the refresh to prevent multiple rapid calls
    this.refreshTimeout = setTimeout(async () => {
      try {
        console.log('🔄 Starting notification refresh for the next 3 days...');
        
        // Cancel existing event notifications
        await this.cancelAllNotifications();

        // Get events for the next 3 days (today + next 2 days)
        const today = new Date();
        const numDays = 3;
        const events = await fetchParishEventsForMultipleDays(today, numDays, userId);

        console.log(`Processing ${events.length} events for notification scheduling (next ${numDays} days)`);

        let scheduledCount = 0;
        
        // Group events by day string
        const eventsByDay = new Map<string, ParishEvent[]>();
        events.forEach(event => {
          const key = new Date(event.startTime).toDateString();
          const list = eventsByDay.get(key) || [];
          list.push(event);
          eventsByDay.set(key, list);
        });

        // Get parish name for notification titles
        let parishName: string | undefined;
        if (userId) {
          try {
            const profile = await getUserProfile(userId);
            if (profile?.user_type === 'parish_admin') {
              const parish = await getParishByAdminId(userId);
              parishName = parish?.name;
            } else if (profile?.user_type === 'regular_user') {
              const parish = await getParishByUserId(userId);
              parishName = parish?.name;
            }
          } catch (error) {
            console.error('Error fetching parish name for notifications:', error);
          }
        }

        // For each of the next numDays days, schedule ONLY daily digest for parish events
        for (let i = 0; i < numDays; i++) {
          const day = new Date(today);
          day.setDate(day.getDate() + i);
          const key = day.toDateString();
          const dayEvents = eventsByDay.get(key) || [];

          const digestId = await this.scheduleDailyDigest(dayEvents, day, parishName);
          if (digestId) scheduledCount++;
        }

        // After digest, schedule parish events ONLY if explicitly enabled by the user
        const enabledParishIds = await this.getEnabledParishEventNotifications();
        if (enabledParishIds.length > 0) {
          for (const event of events) {
            if (enabledParishIds.includes(event.id)) {
              const notificationId = await this.scheduleEventNotification(event, userId, parishName);
              if (notificationId) scheduledCount++;
            }
          }
        }

        // Additionally schedule PERSONAL schedule items (confessions + personal bulletin events)
        if (userId) {
          try {
            const profile = await getUserProfile(userId);

            // Schedule personal confessions for today and tomorrow (user's reservations only)
            const userReservations = await ConfessionService.getUserReservations(userId);

            const scheduleConfessionForDate = async (date: Date) => {
              const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
              const reservationsForDate = userReservations.filter(r => r.confession_schedules?.date === dateStr);
              for (const r of reservationsForDate) {
                const timeStr: string | undefined = r.confession_schedules?.time_slot;
                if (!timeStr) continue;
                const [hh, mm] = timeStr.split(':').map(Number);
                const start = new Date(date);
                start.setHours(hh || 0, mm || 0, 0, 0);
                const end = new Date(start.getTime() + 15 * 60 * 1000);
                const personalEventId = `confession:${r.id}`;
                const title = 'Confession';
                const maybeId = await this.scheduleEventNotification({
                  id: personalEventId,
                  title,
                  startTime: start.toISOString(),
                  endTime: end.toISOString(),
                } as ParishEvent, userId, parishName);
                if (maybeId) scheduledCount++;
              }
            };

            for (let i = 0; i < numDays; i++) {
              const day = new Date(today);
              day.setDate(day.getDate() + i);
              await scheduleConfessionForDate(day);
            }

            // Schedule personal bulletin events (user RSVPs) for today and tomorrow; only timed events
            const schedulePersonalBulletinForDate = async (date: Date) => {
              const personalEvents = await BulletinService.getUserPersonalEvents(userId, date);
              for (const evt of personalEvents) {
                if (!evt.event_date || !evt.event_time) continue; // skip all-day
                const [y, m, d] = evt.event_date.split('-').map(Number);
                const [hhs, mms] = evt.event_time.split(':').map(Number);
                const start = new Date(y, (m || 1) - 1, d || 1, hhs || 0, mms || 0, 0);
                const end = new Date(start.getTime() + 60 * 60 * 1000);
                const personalEventId = `personal:${evt.id}`;
                const maybeId = await this.scheduleEventNotification({
                  id: personalEventId,
                  title: evt.title,
                  startTime: start.toISOString(),
                  endTime: end.toISOString(),
                  location: evt.location || undefined,
                  description: evt.description || undefined,
                } as ParishEvent, userId, parishName);
                if (maybeId) scheduledCount++;
              }
            };

            for (let i = 0; i < numDays; i++) {
              const day = new Date(today);
              day.setDate(day.getDate() + i);
              await schedulePersonalBulletinForDate(day);
            }
          } catch (personalErr) {
            console.error('Error scheduling personal items:', personalErr);
          }
        }

        console.log(`Scheduled ${scheduledCount} notifications`);
      } catch (error) {
        console.error('Error refreshing event notifications:', error);
      }
    }, 500); // 500ms debounce
  }

  private async saveScheduledNotification(notification: NotificationEvent): Promise<void> {
    try {
      const existing = await AsyncStorage.getItem(SCHEDULED_NOTIFICATIONS_KEY);
      const notifications: NotificationEvent[] = existing ? JSON.parse(existing) : [];
      notifications.push(notification);
      await AsyncStorage.setItem(SCHEDULED_NOTIFICATIONS_KEY, JSON.stringify(notifications));
    } catch (error) {
      console.error('Error saving scheduled notification:', error);
    }
  }

  private async removeScheduledNotification(notificationId: string): Promise<void> {
    try {
      const existing = await AsyncStorage.getItem(SCHEDULED_NOTIFICATIONS_KEY);
      if (existing) {
        const notifications: NotificationEvent[] = JSON.parse(existing);
        const filtered = notifications.filter(n => n.id !== notificationId);
        await AsyncStorage.setItem(SCHEDULED_NOTIFICATIONS_KEY, JSON.stringify(filtered));
      }
    } catch (error) {
      console.error('Error removing scheduled notification:', error);
    }
  }

  async getScheduledNotifications(): Promise<NotificationEvent[]> {
    try {
      const existing = await AsyncStorage.getItem(SCHEDULED_NOTIFICATIONS_KEY);
      return existing ? JSON.parse(existing) : [];
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  async getDisabledEventNotifications(): Promise<string[]> {
    try {
      const disabled = await AsyncStorage.getItem(DISABLED_EVENT_NOTIFICATIONS_KEY);
      return disabled ? JSON.parse(disabled) : [];
    } catch (error) {
      console.error('Error getting disabled event notifications:', error);
      return [];
    }
  }

  // Parish events are OFF by default – store explicit enables
  async getEnabledParishEventNotifications(): Promise<string[]> {
    try {
      const enabled = await AsyncStorage.getItem(ENABLED_PARISH_EVENT_NOTIFICATIONS_KEY);
      return enabled ? JSON.parse(enabled) : [];
    } catch (error) {
      console.error('Error getting enabled parish event notifications:', error);
      return [];
    }
  }

  async isParishEventNotificationEnabled(eventId: string): Promise<boolean> {
    try {
      const enabled = await this.getEnabledParishEventNotifications();
      return enabled.includes(eventId);
    } catch (error) {
      console.error('Error checking if parish event notification is enabled:', error);
      return false;
    }
  }

  async setParishEventNotificationEnabled(eventId: string, enabled: boolean): Promise<void> {
    try {
      const current = await this.getEnabledParishEventNotifications();
      let updated = current;

      if (enabled) {
        if (!current.includes(eventId)) {
          updated = [...current, eventId];
        }
      } else {
        updated = current.filter(id => id !== eventId);
        // Cancel existing scheduled notification for this parish event
        const scheduled = await this.getScheduledNotifications();
        const match = scheduled.find(n => n.eventId === eventId);
        if (match) {
          await this.cancelNotification(match.id);
        }
      }

      await AsyncStorage.setItem(ENABLED_PARISH_EVENT_NOTIFICATIONS_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error setting parish event notification enabled state:', error);
    }
  }

  async setEventNotificationDisabled(eventId: string, disabled: boolean): Promise<void> {
    try {
      const currentDisabled = await this.getDisabledEventNotifications();
      let updatedDisabled: string[];
      
      if (disabled) {
        // Add to disabled list if not already there
        if (!currentDisabled.includes(eventId)) {
          updatedDisabled = [...currentDisabled, eventId];
        } else {
          return; // Already disabled
        }
      } else {
        // Remove from disabled list
        updatedDisabled = currentDisabled.filter(id => id !== eventId);
      }
      
      await AsyncStorage.setItem(DISABLED_EVENT_NOTIFICATIONS_KEY, JSON.stringify(updatedDisabled));
      
      // If we're disabling, cancel any existing notification for this event
      if (disabled) {
        const scheduled = await this.getScheduledNotifications();
        const eventNotification = scheduled.find(n => n.eventId === eventId);
        if (eventNotification) {
          await this.cancelNotification(eventNotification.id);
        }
      } else {
        // If we're enabling, refresh notifications to potentially schedule this event
        // This will be handled by the calling component
      }
    } catch (error) {
      console.error('Error setting event notification disabled state:', error);
    }
  }

  async isEventNotificationDisabled(eventId: string): Promise<boolean> {
    try {
      const disabled = await this.getDisabledEventNotifications();
      return disabled.includes(eventId);
    } catch (error) {
      console.error('Error checking if event notification is disabled:', error);
      return false;
    }
  }

  // Helper method to check if an event is upcoming
  isEventUpcoming(event: ParishEvent): boolean {
    const eventTime = new Date(event.startTime);
    const now = new Date();
    return eventTime > now;
  }

  // Debug method to log current scheduled notifications
  async logScheduledNotifications(): Promise<void> {
    try {
      const scheduled = await this.getScheduledNotifications();
      console.log(`Currently scheduled notifications: ${scheduled.length}`);
      scheduled.forEach((notification, index) => {
        console.log(`  ${index + 1}. "${notification.title}" at ${notification.scheduledTime.toISOString()}`);
      });
    } catch (error) {
      console.error('Error logging scheduled notifications:', error);
    }
  }

  // Debug method to test the new multi-day scheduling
  async testMultiDayScheduling(userId?: string): Promise<void> {
    try {
      console.log('=== Testing Multi-Day Notification Scheduling ===');
      
      const today = new Date();
      const events = await fetchParishEventsForMultipleDays(today, 2, userId);
      
      console.log(`Fetched ${events.length} total events for today and tomorrow`);
      
      // Group events by day
      const todayEvents: ParishEvent[] = [];
      const tomorrowEvents: ParishEvent[] = [];
      
      events.forEach(event => {
        const eventDate = new Date(event.startTime);
        const todayDate = new Date(today);
        
        if (eventDate.toDateString() === todayDate.toDateString()) {
          todayEvents.push(event);
        } else {
          tomorrowEvents.push(event);
        }
      });
      
      console.log(`Today's events: ${todayEvents.length}`);
      todayEvents.forEach(event => console.log(`  - ${event.title} at ${event.startTime}`));
      
      console.log(`Tomorrow's events: ${tomorrowEvents.length}`);
      tomorrowEvents.forEach(event => console.log(`  - ${event.title} at ${event.startTime}`));
      
      // Test scheduling
      await this.refreshEventNotifications(userId);
      
      // Log scheduled notifications
      await this.logScheduledNotifications();
      
    } catch (error) {
      console.error('Error testing multi-day scheduling:', error);
    }
  }


  // Method to handle notification responses
  async handleNotificationResponse(response: Notifications.NotificationResponse): Promise<void> {
    const { data } = response.notification.request.content;
    
    try {
      if (data.type === 'bulletin-broadcast') {
        // Navigate directly to the Events tab
        router.push('/(tabs)/events');
      } else if (data.type === 'event-reminder') {
        router.push('/(tabs)/calendar');
      }
    } catch (error) {
      console.error('Error handling notification navigation:', error);
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance(); 