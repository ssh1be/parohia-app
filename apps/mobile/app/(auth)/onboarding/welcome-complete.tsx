import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../../components/ui/Button';
import { Reveal } from '../../../components/ui/Reveal';
import { useThemeColors } from '../../../components/ui/useThemeColors';
import { entrance } from '../../../constants/theme';
import { useAuth } from '../../../contexts/AuthContext';
import { useOnboarding } from '../../../contexts/OnboardingContext';
import { saveOnboardingData } from '../../../services/onboardingService';
import { setOnboardingComplete } from '../../../utils/onboardingStorage';

export default function WelcomeCompleteScreen() {
  const { data } = useOnboarding();
  const { user } = useAuth();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const firstName = data.fullName?.split(' ')[0] || 'friend';

  const handleGetStarted = async () => {
    if (!user) {
      Alert.alert('Error', 'User not found');
      return;
    }

    setLoading(true);
    try {
      const result = await saveOnboardingData(user.id, data);

      if (!result.success) {
        Alert.alert('Error', result.error || 'Failed to save your information');
        return;
      }

      await setOnboardingComplete(user.id);
      router.dismissAll();
      router.replace('/');
    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      Alert.alert('Error', 'Failed to complete onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-black">
      <LinearGradient
        colors={colors.isDark ? ['#1C0A0B', '#000000'] : ['#FEF2F2', '#F9FAFB']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <View
        className="flex-1 px-6 justify-center"
        style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}
      >
        <Reveal index={0}>
          <View className="items-center mb-10">
            <Animated.View entering={entrance.pop()}>
              <View className="h-24 w-24 rounded-[28px] bg-red-600 items-center justify-center mb-8">
                <Ionicons name="checkmark" size={44} color="#FFFFFF" />
              </View>
            </Animated.View>

            <Text className="font-sans-semibold text-[12px] tracking-[1.6px] uppercase text-red-600 dark:text-red-400 mb-2">
              You're all set
            </Text>
            <Text className="font-display text-[40px] leading-[44px] text-gray-900 dark:text-white text-center">
              Welcome, {firstName}!
            </Text>
            <Text className="font-display-italic text-[18px] leading-[26px] text-gray-500 dark:text-gray-400 text-center mt-4 px-4">
              Your account is ready. Connect with your faith community and begin your journey.
            </Text>
          </View>
        </Reveal>

        <Reveal index={2}>
          <Button
            label="Get Started"
            icon="arrow-forward"
            size="lg"
            fullWidth
            loading={loading}
            onPress={handleGetStarted}
          />
        </Reveal>
      </View>
    </View>
  );
}
