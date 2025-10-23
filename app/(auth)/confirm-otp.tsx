import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '../../config/supabase';

export default function ConfirmOTPScreen() {
  const params = useLocalSearchParams();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const { user } = useAuth();
  const email = params.email as string;

  // Show loading if email is not yet available
  if (!email) {
    return (
      <View className="flex-1 bg-black justify-center items-center">
        <ActivityIndicator size="large" color="white" />
      </View>
    );
  }

  // Don't redirect to main app - let onboarding handle navigation
  useEffect(() => {
    if (user) {
      console.log('User authenticated, but staying in onboarding flow');
    }
  }, [user]);

  // Redirect back to login if no email is provided
  useEffect(() => {
    if (!email) {
      console.log('No email provided, redirecting to login');
      router.replace('/(auth)/login');
    }
  }, [email]);

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleConfirmOTP = async () => {
    if (!otp || otp.length < 6) {
      Alert.alert('Error', 'Please enter the 6-digit OTP code');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'signup',
      });

      if (error) {
        throw error;
      }

      Alert.alert(
        'Success!',
        'Your email has been verified. Let\'s complete your profile.',
        [{ 
          text: 'Continue', 
          onPress: () => router.push('/(auth)/onboarding/user-type')
        }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (error) {
        throw error;
      }

      setCountdown(60); // 60 second countdown
      Alert.alert('Success!', 'A new OTP code has been sent to your email.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
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
                onPress={() => router.back()}
              >
                <Ionicons name="arrow-back" size={16} color="white" />
              </TouchableOpacity>
              <Text className="ml-4 text-xl font-bold text-white">
                Verify Email
              </Text>
            </View>
            
            {/* Content */}
            <View className="flex-1 justify-center">
              <View className="mb-8">
                <View className="h-16 w-16 rounded-full bg-red-600 flex items-center justify-center mb-6 mx-auto">
                  <Ionicons name="mail" size={32} color="white" />
                </View>
                
                <Text className="text-2xl font-bold text-white text-center mb-2">
                  Check Your Email
                </Text>
                
                <Text className="text-white opacity-70 text-center mb-2">
                  We've sent a 6-digit verification code to:
                </Text>
                
                <Text className="text-blue-400 text-center font-medium mb-6">
                  {email}
                </Text>
                
                <Text className="text-white opacity-70 text-center text-sm">
                  Enter the code below to verify your email address
                </Text>
              </View>
              
              {/* OTP Input */}
              <View className="mb-8">
                <Text className="text-white text-sm font-medium mb-3">Verification Code</Text>
                <TextInput
                  className="w-full py-4 px-4 rounded-xl text-white font-medium bg-gray-800 border border-gray-700 text-center text-xl tracking-widest"
                  placeholder="000000"
                  placeholderTextColor="#9CA3AF"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                  onSubmitEditing={handleConfirmOTP}
                />
              </View>
              
              {/* Verify Button */}
              <TouchableOpacity
                className={`w-full py-3.5 rounded-xl text-white font-medium shadow-md mb-6 flex-row items-center justify-center ${
                  loading 
                    ? 'bg-gray-600' 
                    : 'bg-red-600'
                }`}
                onPress={handleConfirmOTP}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <Ionicons
                    name="checkmark-circle"
                    size={20}
                    color="white"
                    style={{ marginRight: 8 }}
                  />
                )}
                <Text className="text-white font-medium">
                  {loading ? 'Verifying...' : 'Verify Email'}
                </Text>
              </TouchableOpacity>
              
              {/* Resend OTP */}
              <View className="items-center">
                <Text className="text-white opacity-70 text-sm mb-4">
                  Didn't receive the code?
                </Text>
                
                <TouchableOpacity
                  className={`py-2 px-4 rounded-lg ${
                    countdown > 0 || resendLoading
                      ? 'opacity-50'
                      : 'bg-gray-800'
                  }`}
                  onPress={handleResendOTP}
                  disabled={countdown > 0 || resendLoading}
                >
                  {resendLoading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text className="text-blue-400 font-medium">
                      {countdown > 0 
                        ? `Resend in ${countdown}s` 
                        : 'Resend Code'
                      }
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
} 