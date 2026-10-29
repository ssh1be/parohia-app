import { Ionicons } from '@expo/vector-icons';
import { validateNewPassword } from '@parohia/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { AuthHeader, AuthScaffold } from '../../components/auth/AuthChrome';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
import { Reveal } from '../../components/ui/Reveal';
import { Spinner } from '../../components/ui/Spinner';
import { useThemeColors } from '../../components/ui/useThemeColors';
import { supabase } from '../../config/supabase';
import { useAuth } from '../../contexts/AuthContext';

/** Reached after verifying a recovery code in confirm-otp, which signs the user in. */
export default function ResetPasswordScreen() {
  const { session, loading: authLoading } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldEpoch, setFieldEpoch] = useState(0);
  const [loading, setLoading] = useState(false);
  const colors = useThemeColors();

  const toggleShowPassword = () => {
    setShowPassword((v) => !v);
    // Remount when flipping secureTextEntry — toggling in place freezes after iOS autofill.
    setFieldEpoch((n) => n + 1);
  };

  const handleUpdate = async () => {
    const validationError = validateNewPassword(password, confirm);
    if (validationError) {
      Alert.alert('Error', validationError);
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      Alert.alert('Password updated', 'Your new password is set.', [
        { text: 'Continue', onPress: () => router.replace('/') },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-black justify-center items-center">
        <Spinner size="lg" />
      </View>
    );
  }

  if (!session) {
    return (
      <AuthScaffold>
        <AuthHeader
          eyebrow="Session expired"
          title="Reset Password"
          subtitle="Your reset session has expired. Request a new code to continue."
        />
        <Reveal index={2}>
          <View className="mt-8">
            <Button
              label="Request a New Code"
              icon="refresh-outline"
              size="lg"
              fullWidth
              onPress={() => router.replace('/(auth)/forgot-password')}
            />
            <Button
              label="Back to Sign In"
              variant="ghost"
              size="sm"
              onPress={() => router.replace('/(auth)/login')}
              className="mt-6 self-center"
            />
          </View>
        </Reveal>
      </AuthScaffold>
    );
  }

  return (
    <AuthScaffold>
      <AuthHeader
        eyebrow="Account recovery"
        title="New Password"
        subtitle="Choose a new password for your account."
      />

      <Reveal index={2}>
        <View className="mt-8">
          <Field
            remountKey={`new-${fieldEpoch}`}
            label="New password"
            required
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            autoComplete="new-password"
            textContentType="none"
            autoFocus
            rightAccessory={
              <Pressable
                onPress={toggleShowPassword}
                hitSlop={10}
                accessibilityRole="button"
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={colors.textMuted}
                />
              </Pressable>
            }
          />
          <Field
            remountKey={`confirm-${fieldEpoch}`}
            label="Confirm password"
            required
            placeholder="••••••••"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            autoComplete="new-password"
            textContentType="none"
            onSubmitEditing={handleUpdate}
          />
          <Button
            label="Update Password"
            icon="key-outline"
            size="lg"
            fullWidth
            loading={loading}
            onPress={handleUpdate}
            className="mt-2"
          />
        </View>
      </Reveal>
    </AuthScaffold>
  );
}
