import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { AuthHeader, AuthScaffold } from '../../components/auth/AuthChrome';
import { Button } from '../../components/ui/Button';
import { Field } from '../../components/ui/Field';
import { Reveal } from '../../components/ui/Reveal';
import { useThemeColors } from '../../components/ui/useThemeColors';
import { useAuth } from '../../contexts/AuthContext';
import { resolveAuthDestination } from '@parohia/shared';

export default function LoginScreen() {
  const params = useLocalSearchParams();
  const [isSignUp, setIsSignUp] = useState(params.mode === 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  // Remount native TextInputs to clear stuck iOS Password Autofill / yellow lock state.
  const [fieldEpoch, setFieldEpoch] = useState(0);
  const { signIn, signUp, resetPassword, user } = useAuth();
  const colors = useThemeColors();

  useEffect(() => {
    setIsSignUp(params.mode === 'signup');
  }, [params.mode]);

  // Only auto-redirect while this screen is focused. After OTP verify the session
  // lands while login is still mounted underneath confirm-otp; redirecting then
  // stacks a second role-selection screen on top of confirm-otp's own navigate.
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      const checkAndRedirect = async () => {
        if (!user) return;
        const destination = await resolveAuthDestination(user.id);
        if (!isMounted) return;
        if (destination === 'tabs') {
          router.replace('/');
        } else if (destination === 'parish-selection') {
          router.replace('/(auth)/onboarding/parish-selection');
        } else {
          router.replace('/(auth)/onboarding/user-type');
        }
      };
      checkAndRedirect();
      return () => {
        isMounted = false;
        setShowPassword(false);
        setFieldEpoch((n) => n + 1);
      };
    }, [user]),
  );

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const result = await signUp(email, password);
        if (result === 'needs_otp') {
          router.push(`/(auth)/confirm-otp?email=${encodeURIComponent(email.trim())}`);
        } else if (result === 'needs_onboarding') {
          router.push('/(auth)/onboarding/user-type');
        } else if (result === 'already_complete') {
          router.replace('/');
        } else if (result === 'already_registered') {
          // Stay on this screen; switch to sign-in so they can continue easily.
          setIsSignUp(false);
          setShowPassword(false);
          setFieldEpoch((n) => n + 1);
        }
      } else {
        await signIn(email, password);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    await resetPassword(email);
  };

  const toggleShowPassword = () => {
    setShowPassword((v) => !v);
    // Remount when flipping secureTextEntry — toggling in place freezes after iOS autofill.
    setFieldEpoch((n) => n + 1);
  };

  const switchMode = () => {
    setIsSignUp((v) => !v);
    setShowPassword(false);
    setFieldEpoch((n) => n + 1);
  };

  // Sign-in: username + password pairs with Keychain autofill.
  // Sign-up: avoid textContentType="newPassword" — it triggers iOS Strong Password
  // which can lock the field yellow and leak that state to later screens (RN Fabric).
  const emailContentType = isSignUp ? 'emailAddress' : 'username';
  const passwordContentType = isSignUp ? 'none' : 'password';
  const emailAutoComplete = isSignUp ? 'email' : 'username';
  const passwordAutoComplete = isSignUp ? 'new-password' : 'password';

  return (
    <AuthScaffold
      bottom={
        <Reveal index={5}>
          <View className="flex-row justify-center items-center">
            <Text className="font-sans text-[14px] text-gray-500 dark:text-gray-400">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            </Text>
            <Pressable className="ml-1.5 active:opacity-70" onPress={switchMode}>
              <Text className="font-sans-semibold text-[14px] text-red-600 dark:text-red-400">
                {isSignUp ? 'Sign In' : 'Create One'}
              </Text>
            </Pressable>
          </View>
        </Reveal>
      }
    >
      <AuthHeader
        eyebrow={isSignUp ? 'Join Parohia' : 'Welcome back'}
        title={isSignUp ? 'Create Account' : 'Sign In'}
        subtitle={
          isSignUp
            ? 'Enter your email and a password to begin.'
            : 'Sign in to continue to your parish.'
        }
        onBack={() => router.back()}
      />

      <Reveal index={2}>
        <View className="mt-8">
          <Field
            remountKey={`email-${fieldEpoch}-${isSignUp ? 'up' : 'in'}`}
            label="Email"
            required
            placeholder="your-email@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete={emailAutoComplete}
            textContentType={emailContentType}
          />

          <View>
            {!isSignUp && (
              <Pressable
                className="absolute right-0 top-0 z-10 active:opacity-70"
                onPress={handleResetPassword}
                hitSlop={8}
              >
                <Text className="font-sans-semibold text-[12px] text-red-600 dark:text-red-400">
                  Forgot Password?
                </Text>
              </Pressable>
            )}
            <Field
              remountKey={`password-${fieldEpoch}-${showPassword ? 'shown' : 'hidden'}`}
              label="Password"
              required
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              spellCheck={false}
              autoComplete={passwordAutoComplete}
              textContentType={passwordContentType}
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
          </View>

          <Button
            label={isSignUp ? 'Create Account' : 'Sign In'}
            icon={isSignUp ? 'person-add-outline' : 'log-in-outline'}
            size="lg"
            fullWidth
            loading={loading}
            onPress={handleAuth}
            className="mt-2"
          />
        </View>
      </Reveal>
    </AuthScaffold>
  );
}
