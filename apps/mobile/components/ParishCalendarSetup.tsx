import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, Text, View } from 'react-native';
import { palette } from '../constants/theme';
import { useAuth } from '../contexts/AuthContext';
import { getParishByAdminId, updateParishCalendarId } from '@parohia/shared';
import { Button } from './ui/Button';
import { Field } from './ui/Field';
import { Sheet } from './ui/Sheet';

interface ParishCalendarSetupProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const HELP_URL = 'https://xfanatical.com/blog/how-to-find-your-google-calendar-id/';

export default function ParishCalendarSetup({ visible, onClose, onSuccess }: ParishCalendarSetupProps) {
  const [calendarId, setCalendarId] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!visible) {
      setCalendarId('');
      setLoading(false);
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!calendarId.trim()) {
      Alert.alert('Error', 'Please enter a valid Google Calendar ID');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    try {
      setLoading(true);

      const parish = await getParishByAdminId(user.id);
      if (!parish) {
        Alert.alert('Error', 'Parish not found');
        return;
      }

      const result = await updateParishCalendarId(parish.id, calendarId.trim());

      if (result.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        onSuccess();
        onClose();
      } else {
        Alert.alert('Error', result.error || 'Failed to update calendar ID');
      }
    } catch (error) {
      console.error('Error updating calendar ID:', error);
      Alert.alert('Error', 'Failed to update calendar ID. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      eyebrow="Parish admin"
      title="Connect calendar"
      subtitle="Link your parish Google Calendar so events appear for everyone."
      dismissible={!loading}
      footer={
        <View className="flex-row">
          <Button
            label="Cancel"
            variant="secondary"
            onPress={onClose}
            disabled={loading}
            style={{ flex: 1, marginRight: 8 }}
          />
          <Button
            label="Save calendar"
            icon="checkmark"
            loading={loading}
            onPress={handleSubmit}
            style={{ flex: 1 }}
          />
        </View>
      }
    >
      <View className="rounded-3xl p-4 mb-5 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20">
        <View className="flex-row items-start">
          <View className="h-10 w-10 rounded-2xl bg-red-600/15 items-center justify-center">
            <Ionicons name="calendar-outline" size={18} color={palette.accent} />
          </View>
          <View className="flex-1 ml-3">
            <Text className="font-sans-semibold text-[14px] text-gray-900 dark:text-white">
              Use your calendar’s email ID
            </Text>
            <Text className="font-sans text-[13px] leading-5 text-gray-600 dark:text-gray-300 mt-1">
              This is usually an address like{' '}
              <Text className="font-sans-semibold">parish@example.com</Text>
              {' '}or a long{' '}
              <Text className="font-sans-semibold">…@group.calendar.google.com</Text>
              {' '}ID.
            </Text>
          </View>
        </View>
      </View>

      <Field
        label="Google Calendar ID"
        required
        placeholder="parish@example.com"
        value={calendarId}
        onChangeText={setCalendarId}
        autoCapitalize="none"
        keyboardType="email-address"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        helper="Calendar must be public or shared so the app can read events."
      />

      <Pressable
        onPress={() => Linking.openURL(HELP_URL)}
        className="flex-row items-center self-start rounded-full px-3.5 h-9 bg-gray-100 dark:bg-white/10 active:opacity-70 mt-1 mb-2"
        accessibilityRole="link"
        accessibilityLabel="How to find your Google Calendar ID"
      >
        <Ionicons name="help-circle-outline" size={16} color={palette.accent} />
        <Text className="font-sans-semibold text-[13px] text-red-600 dark:text-red-400 ml-1.5">
          How to find your Calendar ID
        </Text>
      </Pressable>
    </Sheet>
  );
}

/** Compact admin prompt used on Home and Calendar when no calendar is connected. */
export function CalendarSetupCallout({ onPress }: { onPress: () => void }) {
  return (
    <View className="rounded-3xl p-5 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20">
      <View className="flex-row items-start">
        <View className="h-10 w-10 rounded-2xl bg-red-600/15 items-center justify-center">
          <Ionicons name="calendar-outline" size={18} color={palette.accent} />
        </View>
        <View className="flex-1 ml-3">
          <Text className="font-sans-bold text-[15px] text-gray-900 dark:text-white">
            Set up your parish calendar
          </Text>
          <Text className="font-sans text-[13px] leading-5 text-gray-600 dark:text-gray-300 mt-1">
            Connect your Google Calendar to display parish events in the app.
          </Text>
          <Button
            label="Set up calendar"
            icon="link-outline"
            size="sm"
            onPress={onPress}
            className="mt-3 self-start"
          />
        </View>
      </View>
    </View>
  );
}
