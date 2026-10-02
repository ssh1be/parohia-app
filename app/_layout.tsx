import { CormorantGaramond_500Medium } from '@expo-google-fonts/cormorant-garamond/500Medium';
import { CormorantGaramond_600SemiBold } from '@expo-google-fonts/cormorant-garamond/600SemiBold';
import { CormorantGaramond_600SemiBold_Italic } from '@expo-google-fonts/cormorant-garamond/600SemiBold_Italic';
import { CormorantGaramond_700Bold } from '@expo-google-fonts/cormorant-garamond/700Bold';
import { Manrope_400Regular } from '@expo-google-fonts/manrope/400Regular';
import { Manrope_500Medium } from '@expo-google-fonts/manrope/500Medium';
import { Manrope_600SemiBold } from '@expo-google-fonts/manrope/600SemiBold';
import { Manrope_700Bold } from '@expo-google-fonts/manrope/700Bold';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider, Stack } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { useColorScheme } from 'nativewind';
import { useEffect, useState } from "react";
import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PortalHost } from "../components/ui/Portal";
import { AuthProvider } from "../contexts/AuthContext";
import { CalendarTraditionProvider } from "../contexts/CalendarTraditionContext";
import { NotificationProvider } from "../contexts/NotificationContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import "../global.css";

// Prevent the splash screen from auto-hiding before asset loading is complete
SplashScreen.preventAutoHideAsync();

const LIGHT_BACKGROUND = '#F9FAFB';
const DARK_BACKGROUND = '#000000';

const navigationLightTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: LIGHT_BACKGROUND, card: '#FFFFFF' },
};
const navigationDarkTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: DARK_BACKGROUND, card: '#0B0F17' },
};

function InitialLoadingScreen() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    CormorantGaramond_500Medium,
    CormorantGaramond_600SemiBold,
    CormorantGaramond_600SemiBold_Italic,
    CormorantGaramond_700Bold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  });
  const fontsReady = fontsLoaded || !!fontError;
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(isDark ? DARK_BACKGROUND : LIGHT_BACKGROUND).catch(() => {});
  }, [isDark]);

  useEffect(() => {
    if (!fontsReady) return;
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
  }, [fontsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
    <NavigationThemeProvider value={isDark ? navigationDarkTheme : navigationLightTheme}>
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: isDark ? DARK_BACKGROUND : LIGHT_BACKGROUND } }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <CalendarTraditionProvider>
          <AuthProvider>
            <NotificationProvider>
              <PortalHost>
                <InitialLoadingScreen />
              </PortalHost>
            </NotificationProvider>
          </AuthProvider>
        </CalendarTraditionProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
