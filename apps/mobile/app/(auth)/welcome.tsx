import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Linking, Text, View } from 'react-native';
import { AuthScaffold } from '../../components/auth/AuthChrome';
import { WelcomeLogo } from '../../components/auth/WelcomeLogo';
import { Button } from '../../components/ui/Button';
import { Reveal } from '../../components/ui/Reveal';
import { useThemeColors } from '../../components/ui/useThemeColors';

export default function WelcomeScreen() {
  const colors = useThemeColors();

  return (
    <View className="flex-1 bg-gray-50 dark:bg-black">
      <LinearGradient
        colors={colors.isDark ? ['#1C0A0B', '#000000'] : ['#FEF2F2', '#F9FAFB']}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />

      <AuthScaffold
        scroll={false}
        transparent
        bottom={
          <Reveal index={4}>
            <Text className="font-sans text-[12px] leading-[18px] text-gray-400 dark:text-gray-500 text-center px-2">
              By continuing, you agree to our{' '}
              <Text
                className="text-red-600 dark:text-red-400 font-sans-semibold"
                onPress={() => Linking.openURL('https://parohia.app/terms')}
              >
                Terms of Service
              </Text>
              {' '}and{' '}
              <Text
                className="text-red-600 dark:text-red-400 font-sans-semibold"
                onPress={() => Linking.openURL('https://parohia.app/privacy')}
              >
                Privacy Policy
              </Text>
            </Text>
          </Reveal>
        }
      >
        <View className="flex-1 justify-center">
          <Reveal index={0}>
            <View className="items-center mb-12">
              <View className="mb-8">
                <WelcomeLogo size={108} />
              </View>
              <Text className="font-sans-semibold text-[12px] tracking-[1.6px] uppercase text-red-600 dark:text-red-400 mb-2">
                Orthodox life, together
              </Text>
              <Text className="font-display text-[48px] leading-[52px] text-gray-900 dark:text-white text-center">
                Parohia
              </Text>
              <Text className="font-display-italic text-[20px] leading-[28px] text-gray-500 dark:text-gray-400 text-center mt-3 px-4">
                Embrace the Orthodox Faith
              </Text>
            </View>
          </Reveal>

          <Reveal index={2}>
            <View className="w-full">
              <Button
                label="Create Account"
                icon="person-add-outline"
                size="lg"
                fullWidth
                onPress={() => router.push('/(auth)/login?mode=signup')}
              />
              <View className="mt-3">
                <Button
                  label="Sign In"
                  icon="log-in-outline"
                  variant="secondary"
                  size="lg"
                  fullWidth
                  onPress={() => router.push('/(auth)/login')}
                />
              </View>
            </View>
          </Reveal>
        </View>
      </AuthScaffold>
    </View>
  );
}
