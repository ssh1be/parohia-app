import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  Pressable,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { isOnboardingComplete } from '../../utils/onboardingStorage';

export default function LoginScreen() {
  const params = useLocalSearchParams();
  const [isSignUp, setIsSignUp] = useState(params.mode === 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, resetPassword, user } = useAuth();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

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
      className="flex-1 bg-gray-50 dark:bg-black"
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
          <Pressable 
            className="h-8 w-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center active:opacity-70"
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={16} color={isDark ? 'white' : '#374151'} />
          </Pressable>
          <Text className="ml-4 text-xl font-bold text-gray-900 dark:text-white">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </Text>
        </View>
        
        {/* Sign In/Up Form */}
        <View className="mt-6">
          <View className="mb-5">
            <Text className="text-gray-900 dark:text-white text-sm font-medium mb-2">Email</Text>
            <TextInput
              className="w-full py-3 px-4 rounded-xl text-gray-900 dark:text-white font-medium bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
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
              <Text className="text-gray-900 dark:text-white text-sm font-medium">Password</Text>
              {!isSignUp && (
                <Pressable className="active:opacity-70" onPress={handleResetPassword}>
                  <Text className="text-blue-400 text-xs">Forgot Password?</Text>
                </Pressable>
              )}
            </View>
            <TextInput
              className="w-full py-3 px-4 rounded-xl text-gray-900 dark:text-white font-medium bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
              placeholder="••••••••"
              placeholderTextColor="#9CA3AF"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>
          
          {/* Sign In/Up Button */}
          <Pressable
            className={`w-full py-3.5 rounded-xl text-white font-medium shadow-md mt-4 flex-row items-center justify-center active:opacity-70 ${
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
          </Pressable>
          
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
            <Text className="text-gray-900 dark:text-white opacity-70 text-sm">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            </Text>
            <Pressable
              className="ml-1 active:opacity-70"
              onPress={() => setIsSignUp(!isSignUp)}
            >
              <Text className="text-blue-400 text-sm">
                {isSignUp ? 'Sign In' : 'Create One'}
              </Text>
            </Pressable>
          </View>
        </View>
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
} 