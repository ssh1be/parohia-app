import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Linking, Text, View } from 'react-native';
import { AuthHeader, AuthScaffold, OnboardingProgress } from '../../../components/auth/AuthChrome';
import { Button } from '../../../components/ui/Button';
import { Field } from '../../../components/ui/Field';
import { PressableScale } from '../../../components/ui/PressableScale';
import { Reveal } from '../../../components/ui/Reveal';
import { useOnboarding } from '../../../contexts/OnboardingContext';

export default function UserInfoScreen() {
  const { data, updateData, nextStep, previousStep } = useOnboarding();
  const [fullName, setFullName] = useState(data.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(data.phoneNumber || '');
  const [termsAccepted, setTermsAccepted] = useState(data.termsAccepted || false);

  const handleContinue = () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }

    if (!termsAccepted) {
      Alert.alert('Error', 'Please accept the Terms of Service and Privacy Policy');
      return;
    }

    updateData({
      fullName: fullName.trim(),
      phoneNumber: phoneNumber.trim(),
      termsAccepted,
    });

    nextStep();
  };

  return (
    <AuthScaffold>
      <AuthHeader
        eyebrow="Step 2 of 3"
        title="Your Information"
        subtitle="Tell us a little about yourself."
        onBack={previousStep}
      />

      <OnboardingProgress step={2} />

      <Reveal index={2}>
        <Field
          label="Full Name"
          required
          placeholder="John Doe"
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
          autoCorrect={false}
          textContentType="name"
        />

        <Field
          label="Phone Number"
          helper="Optional — used by your parish if they need to reach you."
          placeholder="(503) 123-4567"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
        />

        <PressableScale
          onPress={() => setTermsAccepted((v) => !v)}
          haptic
          className="flex-row items-start mb-6 mt-1"
          accessibilityRole="checkbox"
          accessibilityState={{ checked: termsAccepted }}
        >
          <View
            className={`h-6 w-6 rounded-lg items-center justify-center mr-3 mt-0.5 border ${
              termsAccepted
                ? 'bg-red-600 border-red-600'
                : 'bg-gray-100 dark:bg-white/5 border-gray-300 dark:border-white/15'
            }`}
          >
            {termsAccepted ? <Ionicons name="checkmark" size={16} color="#FFFFFF" /> : null}
          </View>
          <Text className="flex-1 font-sans text-[13px] leading-[20px] text-gray-600 dark:text-gray-300">
            I agree to the{' '}
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
        </PressableScale>

        <Button label="Continue" icon="arrow-forward" size="lg" fullWidth onPress={handleContinue} />
      </Reveal>
    </AuthScaffold>
  );
}
