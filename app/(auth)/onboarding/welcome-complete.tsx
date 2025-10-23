import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useOnboarding } from '../../../contexts/OnboardingContext';
import { useAuth } from '../../../contexts/AuthContext';
import { setOnboardingComplete } from '../../../utils/onboardingStorage';
import { saveOnboardingData } from '../../../services/onboardingService';
import { Alert } from 'react-native';

export default function WelcomeCompleteScreen() {
  const { data } = useOnboarding();
  const { user } = useAuth();

  const handleGetStarted = async () => {
    if (!user) {
      Alert.alert('Error', 'User not found');
      return;
    }

    try {
      console.log('Starting onboarding completion for user:', user.id);
      
      // Save all onboarding data to Supabase
      const result = await saveOnboardingData(user.id, data);
      
      if (!result.success) {
        console.error('Failed to save onboarding data:', result.error);
        Alert.alert('Error', result.error || 'Failed to save your information');
        return;
      }

      console.log('Onboarding data saved successfully, result:', result);

      // Mark onboarding as complete for this user
      await setOnboardingComplete(user.id);
      console.log('Onboarding marked as complete in storage');
      
      // Navigate to main app
      console.log('Navigating to main app');
      router.replace('/');
    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      Alert.alert('Error', 'Failed to complete onboarding. Please try again.');
    }
  };

  return (
    <View className="flex-1 bg-black relative overflow-hidden">
      {/* Gradient Background with Pattern */}
      <View className="absolute inset-0 bg-gradient-to-b from-blue-900 to-black" />
      
      {/* Content */}
      <View className="flex-1 flex-col items-center justify-center p-8">
        <View className="h-20 w-20 rounded-full bg-red-600 flex items-center justify-center mb-6">
          <Ionicons name="checkmark" size={40} color="white" />
        </View>
        
        <Text className="text-white text-3xl font-bold mb-4 text-center">
          Welcome, {data.fullName?.split(' ')[0] || 'User'}!
        </Text>
        
        <Text className="text-white opacity-80 text-center mb-12 px-4">
          Your account has been created successfully. You're now ready to connect with your faith community.
        </Text>
        
        <TouchableOpacity
          className="w-full py-4 rounded-xl text-white font-medium bg-red-600 shadow-lg"
          onPress={handleGetStarted}
        >
          <Text className="text-white font-medium text-center">Get Started</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
} 