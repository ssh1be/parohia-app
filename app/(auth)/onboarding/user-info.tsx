import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useOnboarding } from '../../../contexts/OnboardingContext';

export default function UserInfoScreen() {
  const { data, updateData, nextStep, previousStep } = useOnboarding();
  
  const [fullName, setFullName] = useState(data.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(data.phoneNumber || '');
  const [termsAccepted, setTermsAccepted] = useState(data.termsAccepted || false);

  const handleContinue = () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }
    
    if (!termsAccepted) {
      Alert.alert('Error', 'Please accept the Terms of Service and Privacy Policy');
      return;
    }
    
    updateData({
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim(),
      termsAccepted,
    });
    
    nextStep();
  };

  return (
    <KeyboardAvoidingView 
      className="flex-1 bg-black"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView 
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6 pt-12 pb-8">
        {/* Back and Title */}
        <View className="flex-row items-center mb-6">
          <TouchableOpacity 
            className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center"
            onPress={previousStep}
          >
            <Ionicons name="arrow-back" size={16} color="white" />
          </TouchableOpacity>
          <Text className="ml-4 text-xl font-bold text-white">Create Account</Text>
        </View>
        
        {/* Progress Indicator */}
        <View className="flex-row items-center justify-between mb-8">
          <View className="flex-1 h-1 rounded-full bg-red-600" />
          <View className="flex-1 h-1 rounded-full mx-1 bg-red-600" />
          <View className="flex-1 h-1 rounded-full bg-gray-700" />
        </View>
        
        <Text className="text-white text-lg font-bold mb-6">Your Information</Text>
        
        {/* User Information Form */}
        <View className="flex-1">
          <View className="mb-4">
            <Text className="text-white text-sm font-medium mb-2">Full Name</Text>
            <TextInput
              className="w-full py-3 px-4 rounded-xl text-white font-medium bg-gray-800 border border-gray-700"
              placeholder="John Doe"
              placeholderTextColor="#9CA3AF"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>
          
          <View className="mb-4">
            <Text className="text-white text-sm font-medium mb-2">Phone Number (Optional)</Text>
            <TextInput
              className="w-full py-3 px-4 rounded-xl text-white font-medium bg-gray-800 border border-gray-700"
              placeholder="(503) 123-4567"
              placeholderTextColor="#9CA3AF"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
            />
          </View>
          
          <View className="flex-row items-center mb-6">
            <Switch
              value={termsAccepted}
              onValueChange={setTermsAccepted}
              trackColor={{ false: '#374151', true: '#ff0000' }}
              thumbColor={termsAccepted ? '#ffffff' : '#9ca3af'}
            />
            <Text className="text-xs text-white opacity-70 ml-3 flex-1">
              I agree to the{' '}
              <Text className="text-blue-400">Terms of Service</Text>
              {' '}and{' '}
              <Text className="text-blue-400">Privacy Policy</Text>
            </Text>
          </View>
          
          <TouchableOpacity
            className="w-full py-3.5 rounded-xl text-white font-medium bg-red-600 shadow-md mt-4"
            onPress={handleContinue}
          >
            <Text className="text-white font-medium text-center">Continue</Text>
          </TouchableOpacity>
        </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
} 