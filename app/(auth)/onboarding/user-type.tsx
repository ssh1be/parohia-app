import React from 'react';
import {
  View,
  Text,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useOnboarding, UserType } from '../../../contexts/OnboardingContext';
import { useAuth } from '../../../contexts/AuthContext';

export default function UserTypeScreen() {
  const { data, updateData, nextStep } = useOnboarding();
  const { signOut } = useAuth();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleUserTypeSelect = (userType: UserType) => {
    console.log('User type selected:', userType);
    updateData({ userType });
    console.log('Data updated, calling nextStep with userType:', userType);
    nextStep(userType);
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-black">
      <View className="flex-1 px-6 pt-12">
        {/* Back and Title */}
        <View className="flex-row items-center mb-6">
          <Pressable 
            className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center active:opacity-70"
            onPress={() => router.push('/(auth)/welcome')}
          >
            <Ionicons name="arrow-back" size={16} color={isDark ? 'white' : '#374151'} />
          </Pressable>
          <Text className="ml-4 text-xl font-bold text-gray-900 dark:text-white">Create Account</Text>
        </View>
        
        {/* Progress Indicator */}
        <View className="flex-row items-center justify-between mb-8">
          <View className="flex-1 h-1 rounded-full bg-red-600" />
          <View className="flex-1 h-1 rounded-full mx-1 bg-gray-200 dark:bg-gray-700" />
          <View className="flex-1 h-1 rounded-full bg-gray-200 dark:bg-gray-700" />
        </View>
        
        <Text className="text-gray-900 dark:text-white text-lg font-bold mb-6">I am a...</Text>
        
        {/* User Type Selection */}
        <View className="space-y-4 mt-8">
          <Pressable 
            className="w-full py-4 rounded-xl text-gray-900 dark:text-white font-medium bg-gray-100 dark:bg-gray-800 shadow-md mb-4 active:opacity-70"
            onPress={() => handleUserTypeSelect('regular_user')}
          >
            <View className="flex-row items-center px-4">
              <View className="h-12 w-12 rounded-full flex items-center justify-center mr-4 bg-red-600">
                <Ionicons name="person" size={24} color="white" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-base text-gray-900 dark:text-white">Parishioner</Text>
                <Text className="text-xs opacity-70 text-gray-900 dark:text-white">Connect with your parish and community</Text>
              </View>
            </View>
          </Pressable>
          
          <Pressable 
            className="w-full py-4 rounded-xl text-gray-900 dark:text-white font-medium bg-gray-100 dark:bg-gray-800 shadow-md mb-4 active:opacity-70"
            onPress={() => handleUserTypeSelect('parish_admin')}
          >
            <View className="flex-row items-center px-4">
              <View className="h-12 w-12 rounded-full flex items-center justify-center mr-4 bg-red-600">
                <Ionicons name="business" size={24} color="white" />
              </View>
              <View className="flex-1">
                <Text className="font-semibold text-base text-gray-900 dark:text-white">Parish Administrator</Text>
                <Text className="text-xs opacity-70 text-gray-900 dark:text-white">Manage your parish's profile, schedule and events</Text>
              </View>
            </View>
          </Pressable>
        </View>
        
        {/* Bottom Text */}
        <View className="absolute bottom-8 left-0 right-0 flex justify-center px-6">
          <Text className="text-gray-900 dark:text-white opacity-50 text-xs text-center mb-4">
            Select the option that best describes how you plan to use Parohia
          </Text>
          
          <Pressable
            className="w-full py-3 rounded-xl border border-gray-300 dark:border-gray-600 active:opacity-70"
            onPress={signOut}
          >
            <Text className="text-gray-900 dark:text-white text-center opacity-70">Sign Out</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
} 