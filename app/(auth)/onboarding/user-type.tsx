import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { AuthHeader, AuthScaffold, OnboardingProgress } from '../../../components/auth/AuthChrome';
import { Button } from '../../../components/ui/Button';
import { PressableScale } from '../../../components/ui/PressableScale';
import { Reveal } from '../../../components/ui/Reveal';
import { PAROHIA_ICON } from '../../../constants/assets';
import { palette } from '../../../constants/theme';
import { useAuth } from '../../../contexts/AuthContext';
import { useOnboarding, UserType } from '../../../contexts/OnboardingContext';

const OPTIONS: {
  type: UserType;
  title: string;
  description: string;
  icon?: keyof typeof Ionicons.glyphMap;
  brandIcon?: boolean;
}[] = [
  {
    type: 'regular_user',
    title: 'Parishioner',
    description: 'Connect with your parish and community',
    icon: 'person',
  },
  {
    type: 'parish_admin',
    title: 'Parish Administrator',
    description: 'Create and manage a parish on Parohia',
    brandIcon: true,
  },
];

export default function UserTypeScreen() {
  const { updateData, nextStep } = useOnboarding();
  const { signOut } = useAuth();

  const handleUserTypeSelect = (userType: UserType) => {
    updateData({ userType });
    nextStep(userType);
  };

  return (
    <AuthScaffold
      scroll={false}
      bottom={
        <Reveal index={5}>
          <Text className="font-sans text-[12px] leading-[18px] text-gray-400 dark:text-gray-500 text-center mb-4 px-2">
            Select the option that best describes how you plan to use Parohia
          </Text>
          <Button label="Sign Out" variant="secondary" fullWidth onPress={signOut} />
        </Reveal>
      }
    >
      <AuthHeader
        eyebrow="Step 1 of 3"
        title="I am a…"
        subtitle="Choose how you'll use Parohia."
        onBack={() => router.push('/(auth)/welcome')}
      />

      <OnboardingProgress step={1} />

      <View>
        {OPTIONS.map((option, index) => (
          <Reveal key={option.type} index={index + 2}>
            <PressableScale
              onPress={() => handleUserTypeSelect(option.type)}
              haptic
              className="mb-3 rounded-3xl bg-white dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06] p-4"
            >
              <View className="flex-row items-center">
                <View className="h-14 w-14 rounded-[18px] bg-red-600 items-center justify-center mr-4">
                  {option.brandIcon ? (
                    <Image
                      source={PAROHIA_ICON}
                      style={{ width: 40, height: 40 }}
                      contentFit="contain"
                      tintColor="#FFFFFF"
                      accessibilityLabel="Parish"
                    />
                  ) : (
                    <Ionicons name={option.icon!} size={24} color="#FFFFFF" />
                  )}
                </View>
                <View className="flex-1 pr-2">
                  <Text className="font-sans-semibold text-[16px] text-gray-900 dark:text-white">
                    {option.title}
                  </Text>
                  <Text className="font-sans text-[13px] leading-[18px] text-gray-500 dark:text-gray-400 mt-0.5">
                    {option.description}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={palette.gray400} />
              </View>
            </PressableScale>
          </Reveal>
        ))}
      </View>
    </AuthScaffold>
  );
}
