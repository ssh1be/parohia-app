import { Stack } from 'expo-router';
import { OnboardingProvider } from '../../../contexts/OnboardingContext';

export default function OnboardingLayout() {
  return (
    <OnboardingProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Stack.Screen name="user-type" />
        <Stack.Screen name="user-info" />
        <Stack.Screen name="parish-selection" />
        <Stack.Screen name="parish-details" />
        <Stack.Screen name="welcome-complete" options={{ animation: 'fade' }} />
      </Stack>
    </OnboardingProvider>
  );
}
