import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNotifications } from '../contexts/NotificationContext';
import DateTimePicker from './DateTimePicker';

export default function NotificationSettings() {
  const { preferences, scheduledNotifications, updatePreferences, cancelAllNotifications, loading, refreshNotifications } = useNotifications();
  const [updating, setUpdating] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);

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
      // Refresh notifications to reschedule daily digest with new time
      await refreshNotifications();
    } catch (error) {
      Alert.alert('Error', 'Failed to update daily digest time');
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
    { label: '15 minutes', value: 15 },
    { label: '30 minutes', value: 30 },
    { label: '1 hour', value: 60 },
    { label: '2 hours', value: 120 },
  ];

  const selectedOption = reminderTimeOptions.find(option => option.value === preferences.reminderTime);

  if (loading) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="white" />
        <Text className="text-white mt-4">Loading notification settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-black">
      <View className="p-6 space-y-6">
        {/* Header */}
        <View className="mb-6">
          <Text className="text-2xl font-bold text-white mb-2">Notification Settings</Text>
          <Text className="text-gray-400 text-sm">
            Configure how and when you receive notifications about parish events
          </Text>
        </View>

        {/* Notification Status */}
        <View className="bg-gray-800 rounded-xl p-4 mb-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-white font-semibold text-lg">Notification Status</Text>
            <View className={`px-2 py-1 rounded-lg ${preferences.enabled ? 'bg-green-600' : 'bg-red-600'}`}>
              <Text className="text-white text-xs font-medium">
                {preferences.enabled ? 'Enabled' : 'Disabled'}
              </Text>
            </View>
          </View>
          <Text className="text-gray-400 text-sm">
            {preferences.enabled 
              ? `Notifications will be sent ${preferences.reminderTime} minutes before events`
              : 'Notifications are currently disabled'
            }
          </Text>
          {preferences.enabled && preferences.dailyDigest && (
            <Text className="text-gray-400 text-sm mt-1">
              Daily digest sent at {formatTime(preferences.dailyDigestTime)}
            </Text>
          )}
        </View>

        {/* Enable Notifications */}
        <View className="bg-gray-900 rounded-xl p-4 mb-2">
          <View className="flex-row justify-between items-center">
            <View className="flex-1">
              <Text className="text-white font-semibold text-lg">Enable Notifications</Text>
              <Text className="text-gray-400 text-sm mt-1">
                Receive notifications about upcoming parish events
              </Text>
            </View>
            <Switch
              value={preferences.enabled}
              onValueChange={(value) => handleToggle('enabled', value)}
              trackColor={{ false: '#374151', true: '#3B82F6' }}
              thumbColor={preferences.enabled ? '#FFFFFF' : '#9CA3AF'}
              disabled={updating}
            />
          </View>
        </View>

        {/* Reminder Time */}
        {preferences.enabled && (
          <View className="bg-gray-900 rounded-xl p-4 mb-2">
            <Text className="text-white font-semibold text-lg mb-3">Reminder Time</Text>
            <Text className="text-gray-400 text-sm mb-4">
              How long before an event should you be notified?
            </Text>
            
            {/* Dropdown Trigger */}
            <TouchableOpacity
              onPress={() => setDropdownVisible(true)}
              disabled={updating}
              className="flex-row items-center justify-between p-3 rounded-lg border border-gray-700 bg-gray-800"
            >
              <Text className="text-white">{selectedOption?.label || 'Select time'}</Text>
              <Ionicons name="chevron-down" size={20} color="#9CA3AF" />
            </TouchableOpacity>

            {/* Dropdown Modal */}
            <Modal
              visible={dropdownVisible}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setDropdownVisible(false)}
            >
              <TouchableOpacity
                className="flex-1 bg-black/50 justify-center items-center"
                activeOpacity={1}
                onPress={() => setDropdownVisible(false)}
              >
                <View className="bg-gray-900 rounded-xl p-4 mx-6 w-80 max-w-sm">
                  <Text className="text-white font-semibold text-lg mb-4 text-center">
                    Select Reminder Time
                  </Text>
                  <View className="space-y-2">
                    {reminderTimeOptions.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        onPress={() => {
                          handleReminderTimeChange(option.value);
                          setDropdownVisible(false);
                        }}
                        disabled={updating}
                        className={`flex-row items-center justify-between p-3 rounded-lg border mb-2 ${
                          preferences.reminderTime === option.value
                            ? 'border-blue-500 bg-blue-500/10'
                            : 'border-gray-700 bg-gray-800'
                        }`}
                      >
                        <Text className="text-white">{option.label}</Text>
                        {preferences.reminderTime === option.value && (
                          <Ionicons name="checkmark" size={20} color="#3B82F6" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                  <TouchableOpacity
                    onPress={() => setDropdownVisible(false)}
                    className="mt-4 p-3 bg-gray-800 rounded-lg"
                  >
                    <Text className="text-gray-400 text-center">Cancel</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </Modal>
          </View>
        )}

        {/* Daily Digest */}
        {preferences.enabled && (
          <View className="bg-gray-900 rounded-xl p-4 mb-2">
            <View className="flex-row justify-between items-center">
              <View className="flex-1">
                <Text className="text-white font-semibold text-lg">Daily Digest</Text>
                
              </View>
              
              <Switch
                value={preferences.dailyDigest}
                onValueChange={(value) => handleToggle('dailyDigest', value)}
                trackColor={{ false: '#374151', true: '#3B82F6' }}
                thumbColor={preferences.dailyDigest ? '#FFFFFF' : '#9CA3AF'}
                disabled={updating}
              />
            </View>
            <Text className="text-gray-400 text-sm mt-1">
              Receive a summary of all events for the day
            </Text>
            {preferences.dailyDigest && (
              <DateTimePicker
                value={preferences.dailyDigestTime}
                onChange={handleDailyDigestTimeChange}
                placeholder="Select time"
                mode="time"
                label=""
              />
            )}
          </View>
        )}

        {/* Sound */}
        {preferences.enabled && (
          <View className="bg-gray-900 rounded-xl p-4 mb-2">
            <View className="flex-row justify-between items-center">
              <View className="flex-1">
                <Text className="text-white font-semibold text-lg">Sound</Text>
                <Text className="text-gray-400 text-sm mt-1">
                  Play sound when notifications arrive
                </Text>
              </View>
              <Switch
                value={preferences.soundEnabled}
                onValueChange={(value) => handleToggle('soundEnabled', value)}
                trackColor={{ false: '#374151', true: '#3B82F6' }}
                thumbColor={preferences.soundEnabled ? '#FFFFFF' : '#9CA3AF'}
                disabled={updating}
              />
            </View>
          </View>
        )}

        {/* Vibration */}
        {preferences.enabled && (
          <View className="bg-gray-900 rounded-xl p-4 mb-2">
            <View className="flex-row justify-between items-center">
              <View className="flex-1">
                <Text className="text-white font-semibold text-lg">Vibration</Text>
                <Text className="text-gray-400 text-sm mt-1">
                  Vibrate when notifications arrive
                </Text>
              </View>
              <Switch
                value={preferences.vibrationEnabled}
                onValueChange={(value) => handleToggle('vibrationEnabled', value)}
                trackColor={{ false: '#374151', true: '#3B82F6' }}
                thumbColor={preferences.vibrationEnabled ? '#FFFFFF' : '#9CA3AF'}
                disabled={updating}
              />
            </View>
          </View>
        )}



        {/* Cancel All Notifications */}
        {/* <View className="bg-gray-900 rounded-xl p-4 mb-2">
          <TouchableOpacity
            onPress={handleCancelAllNotifications}
            className="flex-row items-center justify-center p-3 bg-red-600 rounded-lg"
          >
            <Ionicons name="notifications-off" size={20} color="white" />
            <Text className="text-white font-semibold ml-2">Cancel All Notifications</Text>
          </TouchableOpacity>
          <Text className="text-gray-400 text-sm text-center mt-2">
            This will cancel all scheduled notifications
          </Text>
        </View> */}

        {/* Info Section */}
        <View className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
          <View className="flex-row items-start">
            <Ionicons name="information-circle" size={20} color="#3B82F6" />
            <View className="ml-3 flex-1">
              <Text className="text-blue-400 font-semibold mb-1">How it works</Text>
              <Text className="text-gray-300 text-sm">
                Notifications are automatically scheduled based on your parish's Google Calendar events. 
                They will be sent at the reminder time you set before each event. Daily digest notifications 
                will be sent at your preferred time each day.
              </Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
} 