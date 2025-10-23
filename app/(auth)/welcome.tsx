import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { router } from 'expo-router';
// Using require for image import
const parohiaIcon = require('../../assets/images/parohia_icon.png');

export default function WelcomeScreen() {
  const { user } = useAuth();

  // Don't redirect to main app - let onboarding handle navigation
  React.useEffect(() => {
    if (user) {
      console.log('User authenticated, but staying in auth flow');
    }
  }, [user]);

  const handleSignIn = () => {
    router.push('/(auth)/login');
  };

  const handleCreateAccount = () => {
    router.push('/(auth)/login?mode=signup');
  };

  const handleGoogleSignIn = () => {
    // TODO: Implement Google sign-in
    console.log('Google sign-in not implemented yet');
  };

  return (
    <View className="flex-1 bg-black relative overflow-hidden">
      {/* Subtle Cross Pattern Background */}
      <View className="absolute inset-0 opacity-5">
        {/* This would need a custom SVG component for the cross pattern */}
        <View className="w-full h-full bg-gray-800" />
      </View>
      
        {/* Logo and Title */}
        <View className="flex-1 flex-col items-center justify-center px-10">
          <View className="h-20 w-20 rounded-2xl bg-red-600 flex items-center justify-center mb-8 shadow-lg overflow-hidden">
            <Image 
              source={parohiaIcon} 
              style={{ width: 75, height: 75, tintColor: 'white' }}
              resizeMode="contain"
            />
          </View>
          <Text className="text-4xl font-bold text-white mb-2">Parohia</Text>
          <Text className="text-xs text-white opacity-70 mb-14">Embrace the Orthodox Faith</Text>
        
        {/* Login Options */}
        <View className="w-full space-y-4">
          <TouchableOpacity 
            className="w-full py-3.5 rounded-xl text-white font-medium bg-gray-800"
            onPress={handleSignIn}
          >
            <View className="flex-row items-center justify-center">
              <Ionicons name="log-in" size={20} color="white" style={{ marginRight: 8 }} />
              <Text className="text-white font-medium">Sign In</Text>
            </View>
          </TouchableOpacity>
          
          <View className="flex-row items-center justify-center mt-8 mb-8">
            <View className="h-px flex-grow bg-gray-700" />
            <Text className="text-white opacity-60 text-xs px-4">or</Text>
            <View className="h-px flex-grow bg-gray-700" />
          </View>
          
          <TouchableOpacity 
            className="w-full py-3.5 rounded-xl text-white font-medium bg-red-600"
            onPress={handleCreateAccount}
          >
            <View className="flex-row items-center justify-center">
              <Ionicons name="add-circle" size={20} color="white" style={{ marginRight: 8 }} />
              <Text className="text-white font-medium">Create Account</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Sign in with Google */}
        {/* <View className="w-full mt-4">
          <TouchableOpacity 
            className="w-full py-3.5 rounded-xl text-sm text-white opacity-70 border border-white border-opacity-20 flex-row items-center justify-center"
            onPress={handleGoogleSignIn}
          >
            <Ionicons name="logo-google" size={16} color="white" style={{ marginRight: 8 }} />
            <Text className="text-white opacity-70">Continue with Google</Text>
          </TouchableOpacity>
        </View> */}
        
        {/* Privacy Notice */}
        <View className="absolute bottom-8 left-0 right-0 flex justify-center px-10">
          <Text className="text-xs text-white opacity-40 text-center">
            By signing in, you agree to our{' '}
            <Text className="underline">Terms of Service</Text>
            {' '}and{' '}
            <Text className="underline">Privacy Policy</Text>
          </Text>
        </View>
      </View>
    </View>
  );
} 