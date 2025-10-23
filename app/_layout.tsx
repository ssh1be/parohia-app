import { Stack } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from "react";
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from "../contexts/AuthContext";
import { NotificationProvider } from "../contexts/NotificationContext";
import "../global.css";

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

function InitialLoadingScreen() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    const hideSplashScreen = async () => {
      try {
        await SplashScreen.hideAsync();
        setAppIsReady(true);
      } catch (error) {
        console.warn('Error hiding splash screen:', error);
        setAppIsReady(true);
      }
    };

    // Hide splash screen after a short delay
    const timeoutId = setTimeout(hideSplashScreen, 1000);
    return () => clearTimeout(timeoutId);
  }, []);

  if (!appIsReady) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <NotificationProvider>
          <InitialLoadingScreen />
        </NotificationProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
