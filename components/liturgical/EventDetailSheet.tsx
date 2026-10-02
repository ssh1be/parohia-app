import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Linking, Platform, Pressable, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { palette } from '../../constants/theme';
import { useNotifications } from '../../contexts/NotificationContext';
import { Button } from '../ui/Button';
import { Sheet } from '../ui/Sheet';
import { useThemeColors } from '../ui/useThemeColors';

type IconName = keyof typeof Ionicons.glyphMap;

export interface EventReminder {
  /** Whether the event has a future start time that a reminder can be scheduled against. */
  isUpcoming: boolean;
  isTimed: boolean;
  isOn: boolean;
  loading?: boolean;
  onToggle: () => void;
  onOpenSettings: () => void;
}

interface EventDetailSheetProps {
  visible: boolean;
  onClose: () => void;
  eyebrow?: string;
  title?: string;
  when?: string;
  whenDetail?: string;
  location?: string;
  description?: string;
  notes?: string;
  reminder?: EventReminder;
  secondaryAction?: { label: string; icon: IconName; onPress: () => void };
}

export function openDirections(location: string) {
  const encoded = encodeURIComponent(location);
  const mapsUrl = Platform.OS === 'ios'
    ? `http://maps.apple.com/?q=${encoded}`
    : `https://maps.google.com/maps?q=${encoded}`;
  Linking.openURL(mapsUrl);
}

/** Google Calendar descriptions often arrive as HTML. */
export function plainDescription(html?: string) {
  return (html ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function EventDetailSheet({
  visible,
  onClose,
  eyebrow,
  title,
  when,
  whenDetail,
  location,
  description,
  notes,
  reminder,
  secondaryAction,
}: EventDetailSheetProps) {
  const colors = useThemeColors();
  const { preferences } = useNotifications();
  const [copied, setCopied] = useState(false);
  const body = plainDescription(description);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(timeout);
  }, [copied]);

  useEffect(() => {
    if (!visible) setCopied(false);
  }, [visible]);

  const copyAddress = async () => {
    if (!location) return;
    await Clipboard.setStringAsync(location);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setCopied(true);
  };

  const reminderLead =
    preferences.reminderTime >= 60
      ? `${preferences.reminderTime / 60} ${preferences.reminderTime === 60 ? 'hour' : 'hours'}`
      : `${preferences.reminderTime} minutes`;
  const canRemind = !!reminder?.isUpcoming && preferences.enabled;

  const reminderButton = !reminder ? null : !reminder.isUpcoming ? (
    <Button
      label={reminder.isTimed ? 'Event passed' : 'All-day event'}
      icon="notifications-off-outline"
      variant="secondary"
      disabled
      fullWidth
    />
  ) : !preferences.enabled ? (
    <Button
      label="Turn on reminders"
      icon="notifications-outline"
      variant="secondary"
      onPress={reminder.onOpenSettings}
      fullWidth
    />
  ) : (
    <Button
      label={reminder.isOn ? 'Reminder set' : 'Remind me'}
      icon={reminder.isOn ? 'notifications' : 'notifications-outline'}
      variant={reminder.isOn ? 'secondary' : 'primary'}
      loading={reminder.loading}
      onPress={reminder.onToggle}
      fullWidth
    />
  );

  const secondaryButton = secondaryAction ? (
    <Button
      label={secondaryAction.label}
      icon={secondaryAction.icon}
      variant="secondary"
      onPress={secondaryAction.onPress}
      fullWidth
    />
  ) : null;

  const directionsButton = location ? (
    <Button label="Directions" icon="navigate" variant="secondary" onPress={() => openDirections(location)} fullWidth />
  ) : null;

  const actions = [reminderButton, secondaryButton, directionsButton].filter(Boolean);

  return (
    <Sheet visible={visible} onClose={onClose} eyebrow={eyebrow} title={title}>
      <View className="rounded-3xl bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06] overflow-hidden">
        {!!when && (
          <View className="flex-row items-center px-4 py-3.5">
            <View className="h-9 w-9 rounded-xl bg-red-600/10 items-center justify-center mr-3">
              <Ionicons name="time-outline" size={17} color={palette.accent} />
            </View>
            <View className="flex-1">
              <Text className="font-sans-semibold text-[15px] text-gray-900 dark:text-white">{when}</Text>
              {!!whenDetail && (
                <Text className="font-sans text-xs text-gray-500 dark:text-gray-400 mt-0.5">{whenDetail}</Text>
              )}
            </View>
          </View>
        )}

        {!!location && (
          <Pressable
            onPress={copyAddress}
            accessibilityRole="button"
            accessibilityLabel={`Copy address: ${location}`}
            accessibilityHint="Copies the address to your clipboard"
            className={`flex-row items-center px-4 py-3.5 active:bg-gray-100 dark:active:bg-white/5 ${
              when ? 'border-t border-gray-100 dark:border-white/[0.06]' : ''
            }`}
          >
            <View className="h-9 w-9 rounded-xl bg-blue-500/10 items-center justify-center mr-3">
              <Ionicons name="location-outline" size={17} color={palette.blue} />
            </View>
            <View className="flex-1 pr-2">
              <Text className="font-sans-medium text-[14px] leading-5 text-gray-900 dark:text-white" numberOfLines={3}>
                {location}
              </Text>
              {copied && (
                <Animated.View entering={FadeIn.duration(160)}>
                  <Text className="font-sans-semibold text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">Copied to clipboard</Text>
                </Animated.View>
              )}
            </View>
            {copied ? (
              <Animated.View key="copied" entering={FadeIn.duration(160)}>
                <Ionicons name="checkmark-circle" size={18} color={palette.green} />
              </Animated.View>
            ) : (
              <Ionicons name="copy-outline" size={16} color={colors.textFaint} />
            )}
          </Pressable>
        )}

        {canRemind && (
          <View
            className={`flex-row items-center px-4 py-3.5 ${
              when || location ? 'border-t border-gray-100 dark:border-white/[0.06]' : ''
            }`}
          >
            <View className="h-9 w-9 rounded-xl bg-emerald-500/10 items-center justify-center mr-3">
              <Ionicons name={reminder?.isOn ? 'notifications' : 'notifications-outline'} size={17} color={palette.green} />
            </View>
            <Text className="flex-1 font-sans text-[13px] leading-[18px] text-gray-600 dark:text-gray-300">
              {reminder?.isOn
                ? `You'll be reminded ${reminderLead} before it starts.`
                : `Get a reminder ${reminderLead} before it starts.`}
            </Text>
          </View>
        )}
      </View>

      {!!notes && (
        <View className="mt-5 rounded-2xl px-4 py-3 bg-amber-500/[0.08] border border-amber-500/15">
          <Text className="font-sans-bold text-[11px] tracking-[1.2px] uppercase text-amber-700 dark:text-amber-400 mb-1">Your note</Text>
          <Text className="font-sans text-[14px] leading-5 text-gray-700 dark:text-gray-300">{notes}</Text>
        </View>
      )}

      {!!body && (
        <Text className="font-sans text-[15px] leading-[23px] text-gray-700 dark:text-gray-300 mt-5">{body}</Text>
      )}

      {actions.length > 0 && (
        <View className="flex-row mt-6">
          {actions.map((action, i) => (
            <View key={i} style={{ flex: 1, marginLeft: i > 0 ? 10 : 0 }}>
              {action}
            </View>
          ))}
        </View>
      )}
    </Sheet>
  );
}
