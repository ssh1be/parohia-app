import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { router, useLocalSearchParams } from 'expo-router';
import { isOnboardingComplete } from '../../utils/onboardingStorage';

export default function LoginScreen() {
  const params = useLocalSearchParams();
  const [isSignUp, setIsSignUp] = useState(params.mode === 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, resetPassword, user } = useAuth();

  // Redirect to main app if user is authenticated and onboarding is complete
  useEffect(() => {
    let isMounted = true;
    const checkAndRedirect = async () => {
      if (user) {
        const complete = await isOnboardingComplete(user.id);
        if (complete && isMounted) {
          console.log('User authenticated and onboarding complete, redirecting to main app');
          router.replace('/');
        }
      }
    };
    checkAndRedirect();
    return () => { isMounted = false; };
  }, [user]);

  // Don't redirect to main app - let onboarding handle navigation
  useEffect(() => {
    if (user) {
      console.log('User authenticated, but staying in auth flow');
    }
  }, [user]);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password);
      } else {
        await signIn(email, password);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    await resetPassword(email);
  };

  const handleGoogleSignIn = async () => {
    console.log('Google sign in button pressed');
    // TODO: Implement Google sign in
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
            {isSignUp ? 'Create Account' : 'Sign In'}
          </Text>
        </View>
        
        {/* Sign In/Up Form */}
        <View className="mt-6">
          <View className="mb-5">
            <Text className="text-white text-sm font-medium mb-2">Email</Text>
            <TextInput
              className="w-full py-3 px-4 rounded-xl text-white font-medium bg-gray-800 border border-gray-700"
              placeholder="your-email@example.com"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-white text-sm font-medium">Password</Text>
              {!isSignUp && (
                <TouchableOpacity onPress={handleResetPassword}>
                  <Text className="text-blue-400 text-xs">Forgot Password?</Text>
                </TouchableOpacity>
              )}
            </View>
            <TextInput
              className="w-full py-3 px-4 rounded-xl text-white font-medium bg-gray-800 border border-gray-700"
              placeholder="••••••••"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>
          
          {/* Sign In/Up Button */}
          <TouchableOpacity
            className={`w-full py-3.5 rounded-xl text-white font-medium shadow-md mt-4 flex-row items-center justify-center ${
              loading 
                ? 'bg-gray-600' 
                : 'bg-red-600'
            }`}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <Ionicons
                name={isSignUp ? 'person-add' : 'log-in'}
                size={20}
                color="white"
                style={{ marginRight: 8 }}
              />
            )}
            <Text className="text-white font-medium">
              {loading ? 'Loading...' : isSignUp ? 'Create Account' : 'Sign In'}
            </Text>
          </TouchableOpacity>
          
          {/* Divider */}
          {/* <View className="flex-row items-center justify-center mt-8 mb-8">
            <View className="h-px flex-grow bg-gray-700" />
            <Text className="text-white opacity-60 text-xs px-4">or</Text>
            <View className="h-px flex-grow bg-gray-700" />
          </View> */}
          
          {/* Google Sign In Button */}
          {/* <TouchableOpacity 
            className="w-full py-3.5 rounded-xl text-sm text-white opacity-70 border border-white border-opacity-20 flex-row items-center justify-center"
            onPress={handleGoogleSignIn}
          >
            <Ionicons name="logo-google" size={16} color="white" style={{ marginRight: 8 }} />
            <Text className="text-white opacity-70">Continue with Google</Text>
          </TouchableOpacity> */}
        </View>
        
        {/* Sign Up/Sign In Link */}
        <View className="absolute bottom-8 left-0 right-0 flex justify-center px-6">
          <View className="flex-row justify-center">
            <Text className="text-white opacity-70 text-sm">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            </Text>
            <TouchableOpacity
              className="ml-1"
              onPress={() => setIsSignUp(!isSignUp)}
            >
              <Text className="text-blue-400 text-sm">
                {isSignUp ? 'Sign In' : 'Create One'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
} 