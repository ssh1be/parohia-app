import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import {
  Image,
  Linking,
  Pressable,
  Text,
  View,
} from 'react-native';
const parohiaIcon = require('../../assets/images/parohia_icon.png');

export default function WelcomeScreen() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';


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
    <View className="flex-1 bg-gray-50 dark:bg-black relative overflow-hidden">
      {/* Subtle Cross Pattern Background */}
      <View className="absolute inset-0 opacity-5">
        {/* This would need a custom SVG component for the cross pattern */}
        <View className="w-full h-full bg-gray-100 dark:bg-gray-800" />
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
          <Text className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Parohia</Text>
          <Text className="text-xs text-gray-900 dark:text-white opacity-70 mb-14">Embrace the Orthodox Faith</Text>
        
        {/* Login Options */}
        <View className="w-full space-y-4">
          <Pressable 
            className="w-full py-3.5 rounded-xl text-gray-900 dark:text-white font-medium bg-gray-100 dark:bg-gray-800 active:opacity-70"
            onPress={handleSignIn}
          >
            <View className="flex-row items-center justify-center">
              <Ionicons name="log-in" size={20} color={isDark ? 'white' : '#374151'} style={{ marginRight: 8 }} />
              <Text className="text-gray-900 dark:text-white font-medium">Sign In</Text>
            </View>
          </Pressable>
          
          <View className="flex-row items-center justify-center mt-8 mb-8">
            <View className="h-px flex-grow bg-gray-200 dark:bg-gray-700" />
            <Text className="text-gray-900 dark:text-white opacity-60 text-xs px-4">or</Text>
            <View className="h-px flex-grow bg-gray-200 dark:bg-gray-700" />
          </View>
          
          <Pressable 
            className="w-full py-3.5 rounded-xl text-white font-medium bg-red-600 active:opacity-70"
            onPress={handleCreateAccount}
          >
            <View className="flex-row items-center justify-center">
              <Ionicons name="add-circle" size={20} color="white" style={{ marginRight: 8 }} />
              <Text className="text-white font-medium">Create Account</Text>
            </View>
          </Pressable>
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
          <Text className="text-xs text-gray-900 dark:text-white opacity-40 text-center">
            By signing in, you agree to our{' '}
            <Text className="underline" onPress={() => Linking.openURL('https://parohia.app/terms')}>Terms of Service</Text>
            {' '}and{' '}
            <Text className="underline" onPress={() => Linking.openURL('https://parohia.app/privacy')}>Privacy Policy</Text>
          </Text>
        </View>
      </View>
    </View>
  );
} 