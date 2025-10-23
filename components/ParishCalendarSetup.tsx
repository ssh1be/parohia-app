import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { updateParishCalendarId, getParishByAdminId } from '../services/parishService';
import { useAuth } from '../contexts/AuthContext';

interface ParishCalendarSetupProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ParishCalendarSetup({ visible, onClose, onSuccess }: ParishCalendarSetupProps) {
  const [calendarId, setCalendarId] = useState('');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

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
      
      // Get the parish for this admin
      const parish = await getParishByAdminId(user.id);
      if (!parish) {
        Alert.alert('Error', 'Parish not found');
        return;
      }

      // Update the calendar ID
      const result = await updateParishCalendarId(parish.id, calendarId.trim());
      
      if (result.success) {
        Alert.alert(
          'Success',
          'Calendar ID updated successfully! Your parish events will now appear in the app.',
          [
            {
              text: 'OK',
              onPress: () => {
                onSuccess();
                onClose();
              }
            }
          ]
        );
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

  const openHelpArticle = () => {
    Linking.openURL('https://xfanatical.com/blog/how-to-find-your-google-calendar-id/');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-center items-center bg-black/80 px-4">
        <View className="bg-gray-900 rounded-2xl p-6 w-full max-w-md shadow-lg border border-gray-700">
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-xl text-white font-bold">Set Up Parish Calendar</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
          </View>

          <Text className="text-white text-sm mb-4 leading-5">
            To display your parish events, you need to provide your Google Calendar ID. 
            This should be the email address associated with your parish's Google Calendar.
          </Text>

          <Text className="text-gray-300 text-xs mb-2">Google Calendar ID (email address)</Text>
          <TextInput
            className="bg-gray-800 text-white p-3 rounded-lg mb-4 border border-gray-600"
            placeholder="e.g., parish@example.com"
            placeholderTextColor="#9CA3AF"
            value={calendarId}
            onChangeText={setCalendarId}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
          />

          <Text className="text-gray-400 text-xs mb-4 leading-4">
            Make sure your Google Calendar is public or shared with the appropriate permissions.
          </Text>

          <TouchableOpacity 
            className="mb-6 flex-row items-center justify-center"
            onPress={openHelpArticle}
          >
            <Ionicons name="help-circle-outline" size={16} color="#3B82F6" />
            <Text className="text-blue-400 text-xs ml-2 underline">
              How to find your Google Calendar ID
            </Text>
          </TouchableOpacity>

          <View className="flex-row space-x-3">
            <TouchableOpacity
              className="flex-1 bg-gray-700 rounded-lg py-3 mr-2"
              onPress={onClose}
              disabled={loading}
            >
              <Text className="text-white text-center font-medium">Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className="flex-1 bg-blue-600 rounded-lg py-3 flex-row items-center justify-center"
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Ionicons name="checkmark" size={20} color="white" />
              )}
              <Text className="text-white text-center font-medium ml-2">
                {loading ? 'Saving...' : 'Save'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
} 