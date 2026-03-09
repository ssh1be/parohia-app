import { Redirect } from "expo-router";
import { useColorScheme } from "nativewind";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useAuth } from "../contexts/AuthContext";
import { isOnboardingComplete } from "../utils/onboardingStorage";

export default function Index() {
  const { user, loading } = useAuth();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  // Check onboarding status when user is available
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (user && !onboardingChecked) {
        const isComplete = await isOnboardingComplete(user.id);
        setOnboardingComplete(isComplete);
        setOnboardingChecked(true);
      }
    };

    checkOnboardingStatus();
  }, [user, onboardingChecked]);

  // While authenticated user is checking onboarding, show loader
  if (user && !onboardingChecked) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-black justify-center items-center">
        <ActivityIndicator size="large" color={isDark ? 'white' : '#374151'} />
        <Text className="text-gray-900 dark:text-white mt-4">Loading...</Text>
      </View>
    );
  }

  // Do not block unauthenticated auth screens during initial auth init
  if (loading && !user) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-black justify-center items-center">
        <ActivityIndicator size="large" color={isDark ? 'white' : '#374151'} />
        <Text className="text-gray-900 dark:text-white mt-4">Loading...</Text>
      </View>
    );
  }

  // Redirect to auth if no user
  if (!user) {
    return <Redirect href="/(auth)/welcome" />;
  }

  // Redirect to onboarding if user exists but hasn't completed onboarding
  if (user && onboardingChecked && !onboardingComplete) {
    return <Redirect href="/(auth)/onboarding/user-type" />;
  }

  // Redirect to main app if user is authenticated and onboarding is complete
  return <Redirect href="/(tabs)" />;
}
