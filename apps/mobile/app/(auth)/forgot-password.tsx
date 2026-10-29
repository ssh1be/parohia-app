import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, View } from 'react-native';
import { AuthHeader, AuthScaffold } from '../../components/auth/AuthChrome';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
import { Reveal } from '../../components/ui/Reveal';
import { useAuth } from '../../contexts/AuthContext';

export default function ForgotPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? '');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSend = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    setLoading(true);
    try {
      if (await resetPassword(trimmed)) {
        router.push(`/(auth)/confirm-otp?type=recovery&email=${encodeURIComponent(trimmed)}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScaffold>
      <AuthHeader
        eyebrow="Account recovery"
        title="Reset Password"
        subtitle="We'll email you a 6-digit code to choose a new password."
        onBack={() => router.back()}
      />

      <Reveal index={2}>
        <View className="mt-8">
          <Field
            label="Email"
            required
            placeholder="your-email@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            autoFocus={!params.email}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <Button
            label="Send Reset Code"
            icon="mail-outline"
            size="lg"
            fullWidth
            loading={loading}
            onPress={handleSend}
            className="mt-2"
          />
        </View>
      </Reveal>
    </AuthScaffold>
  );
}
