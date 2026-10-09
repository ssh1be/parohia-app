import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { entrance, palette } from '../constants/theme';
import { useNotifications } from '../contexts/NotificationContext';
import DateTimePicker from './DateTimePicker';
import { PressableScale } from './ui/PressableScale';
import { SegmentedControl } from './ui/SegmentedControl';
import { SettingsGroup, SettingsHeader, SettingsRow, SettingsSwitch } from './ui/Settings';
import { Skeleton } from './ui/Skeleton';
import { Spinner } from './ui/Spinner';
import { useThemeColors } from './ui/useThemeColors';

export default function NotificationSettings() {
  const { preferences, scheduledNotifications, updatePreferences, cancelAllNotifications, loading, refreshNotifications } = useNotifications();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const [updating, setUpdating] = useState(false);

  // Helper function to format time in 12-hour format with AM/PM
  const formatTime = (timeString: string): string => {
    const [hours, minutes] = timeString.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleToggle = async (key: keyof typeof preferences, value: boolean) => {
    try {
      setUpdating(true);
      Haptics.selectionAsync().catch(() => {});
      await updatePreferences({ [key]: value });
      // Recompute schedules when toggles change (enabled, dailyDigest, sound, vibration)
      await refreshNotifications();
    } catch (error) {
      Alert.alert('Error', 'Failed to update notification settings');
    } finally {
      setUpdating(false);
    }
  };

  const handleReminderTimeChange = async (minutes: number) => {
    try {
      setUpdating(true);
      await updatePreferences({ reminderTime: minutes });
      // Reschedule event reminders with the new lead time
      await refreshNotifications();
    } catch (error) {
      Alert.alert('Error', 'Failed to update reminder time');
    } finally {
      setUpdating(false);
    }
  };

  const handleDailyDigestTimeChange = async (time: string) => {
    try {
      setUpdating(true);
      await updatePreferences({ dailyDigestTime: time });
      await refreshNotifications();
    } catch (error) {
      Alert.alert('Error', 'Failed to update daily digest time');
    } finally {
      setUpdating(false);
    }
  };

  const handleDigestModeChange = async (mode: 'day_of' | 'day_before') => {
    if (mode === preferences.dailyDigestMode) return;
    try {
      setUpdating(true);
      const defaultTime = mode === 'day_before' ? '20:00' : '08:00';
      await updatePreferences({ dailyDigestMode: mode, dailyDigestTime: defaultTime });
      await refreshNotifications();
    } catch (error) {
      Alert.alert('Error', 'Failed to update digest mode');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancelAllNotifications = () => {
    Alert.alert(
      'Cancel All Notifications',
      'Are you sure you want to cancel all scheduled notifications?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Cancel All',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelAllNotifications();
              Alert.alert('Success', 'All notifications have been cancelled');
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel notifications');
            }
          },
        },
      ]
    );
  };

  const reminderTimeOptions = [
    { label: '15 min', value: 15 },
    { label: '30 min', value: 30 },
    { label: '1 hr', value: 60 },
    { label: '2 hr', value: 120 },
  ];

  const selectedOption = reminderTimeOptions.find(option => option.value === preferences.reminderTime);
  const close = router.canGoBack() ? () => router.back() : undefined;

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-black">
        <SettingsHeader eyebrow="Settings" title="Notifications" onClose={close} />
        <View className="px-5 mt-5">
          <Skeleton height={150} radius={28} />
          <Skeleton height={120} radius={24} className="mt-7" />
          <Skeleton height={120} radius={24} className="mt-7" />
        </View>
      </View>
    );
  }

  const statusLine = preferences.enabled
    ? `Reminders ${selectedOption?.label ?? `${preferences.reminderTime} min`} before each event${
        preferences.dailyDigest
          ? `. Digest ${preferences.dailyDigestMode === 'day_before' ? 'the evening before' : 'the morning of'} at ${formatTime(preferences.dailyDigestTime)}.`
          : '.'
      }`
    : 'Turn on to get reminders before parish services and events.';

  return (
    <View className="flex-1 bg-gray-50 dark:bg-black">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        <SettingsHeader eyebrow="Settings" title="Notifications" onClose={close} />

        <View className="px-5">
          {/* Status + master switch */}
          <Animated.View entering={entrance.card()} style={{ marginTop: 16 }}>
            <View className="rounded-[28px] overflow-hidden border border-gray-100 dark:border-white/[0.06]">
              <LinearGradient
                colors={
                  preferences.enabled
                    ? colors.isDark ? ['#062A1F', '#0A0A0D'] : ['#ECFDF5', '#FFFFFF']
                    : colors.isDark ? ['#16161A', '#0A0A0D'] : ['#FFFFFF', '#F3F4F6']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 20 }}
              >
                <View className="flex-row items-center">
                  <View
                    className="h-12 w-12 rounded-2xl items-center justify-center mr-3.5"
                    style={{ backgroundColor: preferences.enabled ? 'rgba(16,185,129,0.15)' : 'rgba(156,163,175,0.15)' }}
                  >
                    <Ionicons
                      name={preferences.enabled ? 'notifications' : 'notifications-off-outline'}
                      size={22}
                      color={preferences.enabled ? palette.green : palette.gray400}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="font-display text-[24px] leading-[28px] text-gray-900 dark:text-white">
                      {preferences.enabled ? 'Reminders on' : 'Reminders off'}
                    </Text>
                    {preferences.enabled && scheduledNotifications.length > 0 && (
                      <Text className="font-sans-medium text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                        {scheduledNotifications.length} scheduled
                      </Text>
                    )}
                  </View>
                  {updating ? (
                    <Spinner size="sm" style={{ marginRight: 8 }} />
                  ) : null}
                  <SettingsSwitch
                    value={preferences.enabled}
                    onValueChange={(value) => handleToggle('enabled', value)}
                    disabled={updating}
                  />
                </View>
                <Text className="font-sans text-[13px] leading-[19px] text-gray-600 dark:text-gray-300 mt-4">{statusLine}</Text>
              </LinearGradient>
            </View>
          </Animated.View>

          {preferences.enabled && (
            <Animated.View entering={entrance.card(60)} exiting={FadeOut.duration(150)} layout={LinearTransition}>
              {/* Reminder time */}
              <SettingsGroup title="Event reminders" footer="How long before an event you'll be notified.">
                <View className="flex-row p-2">
                  {reminderTimeOptions.map((option, i) => {
                    const active = preferences.reminderTime === option.value;
                    return (
                      <PressableScale
                        key={option.value}
                        onPress={() => {
                          if (active) return;
                          Haptics.selectionAsync().catch(() => {});
                          handleReminderTimeChange(option.value);
                        }}
                        disabled={updating}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: active }}
                        style={{ flex: 1, marginRight: i < reminderTimeOptions.length - 1 ? 6 : 0 }}
                        className={`h-12 rounded-2xl items-center justify-center ${
                          active ? 'bg-red-600' : 'bg-gray-100 dark:bg-white/[0.06]'
                        }`}
                      >
                        <Text className={`font-sans-semibold text-[14px] ${active ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                          {option.label}
                        </Text>
                      </PressableScale>
                    );
                  })}
                </View>
              </SettingsGroup>

              {/* Daily digest */}
              <SettingsGroup title="Daily digest">
                <SettingsRow
                  first
                  icon="newspaper-outline"
                  iconColor={palette.blue}
                  title="Daily digest"
                  subtitle="A summary of all events for the day"
                  right={
                    <SettingsSwitch
                      value={preferences.dailyDigest}
                      onValueChange={(value) => handleToggle('dailyDigest', value)}
                      disabled={updating}
                    />
                  }
                />
                {preferences.dailyDigest && (
                  <Animated.View entering={FadeIn.duration(220)} exiting={FadeOut.duration(120)}>
                    <View className="px-4 pt-1 pb-4">
                      <Text className="font-sans-semibold text-[13px] text-gray-700 dark:text-gray-300 mb-2">When to receive</Text>
                      <SegmentedControl
                        segments={[
                          { key: 'day_of', label: 'Morning of', icon: 'sunny-outline' },
                          { key: 'day_before', label: 'Evening before', icon: 'moon-outline' },
                        ]}
                        value={preferences.dailyDigestMode}
                        onChange={handleDigestModeChange}
                      />
                      <Text className="font-sans-semibold text-[13px] text-gray-700 dark:text-gray-300 mt-4 mb-2">Digest time</Text>
                      <DateTimePicker
                        value={preferences.dailyDigestTime}
                        onChange={handleDailyDigestTimeChange}
                        placeholder="Select time"
                        mode="time"
                        label=""
                      />
                    </View>
                  </Animated.View>
                )}
              </SettingsGroup>

              {/* Alert style */}
              <SettingsGroup title="Alerts">
                <SettingsRow
                  first
                  icon="volume-high-outline"
                  iconColor={palette.purple}
                  title="Sound"
                  subtitle="Play a sound when notifications arrive"
                  right={
                    <SettingsSwitch
                      value={preferences.soundEnabled}
                      onValueChange={(value) => handleToggle('soundEnabled', value)}
                      disabled={updating}
                    />
                  }
                />
                <SettingsRow
                  icon="phone-portrait-outline"
                  iconColor={palette.amber}
                  title="Vibration"
                  subtitle="Vibrate when notifications arrive"
                  right={
                    <SettingsSwitch
                      value={preferences.vibrationEnabled}
                      onValueChange={(value) => handleToggle('vibrationEnabled', value)}
                      disabled={updating}
                    />
                  }
                />
              </SettingsGroup>
            </Animated.View>
          )}

          {/* How it works */}
          <Animated.View layout={LinearTransition}>
            <View className="flex-row mt-8 px-1">
              <Ionicons name="information-circle-outline" size={16} color={palette.gray400} style={{ marginTop: 1 }} />
              <Text className="flex-1 font-sans text-xs leading-[18px] text-gray-500 dark:text-gray-400 ml-2">
                Notifications are scheduled automatically from your parish's Google Calendar. Reminders arrive at the lead time you choose, and the daily digest arrives at your preferred time.
              </Text>
            </View>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
}
