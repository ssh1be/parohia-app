import { Stack } from 'expo-router';
import { ObserveMarkInteractive } from '../../components/ObserveMarkInteractive';

export default function AuthLayout() {
  return (
    <>
      <ObserveMarkInteractive />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade_from_bottom',
          contentStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Stack.Screen name="welcome" />
        <Stack.Screen name="login" />
        <Stack.Screen name="confirm-otp" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="reset-password" />
        <Stack.Screen name="onboarding" />
      </Stack>
    </>
  );
}
