import React from 'react';
import { Stack } from 'expo-router';
import { OnboardingProvider } from '../../../contexts/OnboardingContext';

export default function OnboardingLayout() {
  return (
    <OnboardingProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="user-type" />
        <Stack.Screen name="user-info" />
        <Stack.Screen name="parish-selection" />
        <Stack.Screen name="parish-details" />
        <Stack.Screen name="welcome-complete" />
      </Stack>
    </OnboardingProvider>
  );
} 