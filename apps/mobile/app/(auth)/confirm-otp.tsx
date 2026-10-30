import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  Pressable,
  Text,
  TextInput,
  View,
  type TextInputInstance,
} from 'react-native';
import { AuthHeader, AuthScaffold } from '../../components/auth/AuthChrome';
import { Button } from '../../components/ui/Button';
import { Reveal } from '../../components/ui/Reveal';
import { Spinner } from '../../components/ui/Spinner';
import { palette } from '../../constants/theme';
import { supabase } from '../../config/supabase';

const OTP_LENGTH = 6;

export default function ConfirmOTPScreen() {
  const params = useLocalSearchParams();
  const email = (params.email as string) || '';
  const isRecovery = params.type === 'recovery';
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInputInstance>(null);
  const verifyingRef = useRef(false);

  useEffect(() => {
    if (!email) {
      router.replace('/(auth)/login');
    }
  }, [email]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleConfirmOTP = async (code = otp) => {
    if (!code || code.length < OTP_LENGTH || verifyingRef.current) {
      if (!code || code.length < OTP_LENGTH) {
        Alert.alert('Error', 'Please enter the 6-digit OTP code');
      }
      return;
    }

    verifyingRef.current = true;
    Keyboard.dismiss();
    inputRef.current?.blur();
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: isRecovery ? 'recovery' : 'signup',
      });

      if (error) throw error;

      router.replace(isRecovery ? '/(auth)/reset-password' : '/(auth)/onboarding/user-type');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to verify OTP');
      verifyingRef.current = false;
      setLoading(false);
    }
  };

  const handleOtpChange = (text: string) => {
    const next = text.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH);
    setOtp(next);
    if (next.length === OTP_LENGTH) {
      handleConfirmOTP(next);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;

    setResendLoading(true);
    try {
      const { error } = isRecovery
        ? await supabase.auth.resetPasswordForEmail(email)
        : await supabase.auth.resend({ type: 'signup', email });

      if (error) throw error;

      setCountdown(60);
      Alert.alert('Success!', 'A new OTP code has been sent to your email.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  if (!email) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-black justify-center items-center">
        <Spinner size="sm" />
      </View>
    );
  }

  const digits = Array.from({ length: OTP_LENGTH }, (_, i) => otp[i] ?? '');

  return (
    <AuthScaffold>
      <AuthHeader
        eyebrow={isRecovery ? 'Account recovery' : 'Almost there'}
        title={isRecovery ? 'Enter Reset Code' : 'Verify Email'}
        subtitle="Enter the 6-digit code we sent to your inbox."
        onBack={() => router.back()}
      />

      <Reveal index={2}>
        <View className="mt-8 items-center">
          <View className="h-16 w-16 rounded-[22px] bg-red-600/10 dark:bg-red-500/15 items-center justify-center mb-6">
            <Ionicons name="mail-outline" size={28} color={palette.accent} />
          </View>

          <Text className="font-sans text-[14px] text-gray-500 dark:text-gray-400 text-center">
            Code sent to
          </Text>
          <Text className="font-sans-semibold text-[15px] text-gray-900 dark:text-white text-center mt-1 mb-8">
            {email}
          </Text>

          <Pressable
            className="w-full flex-row justify-between mb-8"
            onPress={() => inputRef.current?.focus()}
            accessibilityRole="none"
          >
            {digits.map((digit, i) => {
              const isActive = focused && (otp.length === i || (otp.length === OTP_LENGTH && i === OTP_LENGTH - 1));
              return (
                <View
                  key={i}
                  className={`h-14 w-[14%] max-w-[52px] rounded-2xl items-center justify-center bg-gray-100 dark:bg-white/5 border ${
                    isActive
                      ? 'border-red-500/70'
                      : digit
                        ? 'border-red-600/30 dark:border-red-500/25'
                        : 'border-transparent dark:border-white/5'
                  }`}
                >
                  <Text className="font-sans-bold text-[22px] text-gray-900 dark:text-white">
                    {digit}
                  </Text>
                </View>
              );
            })}
          </Pressable>

          <TextInput
            ref={inputRef}
            value={otp}
            onChangeText={handleOtpChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="sms-otp"
            autoFocus
            editable={!loading}
            onSubmitEditing={() => handleConfirmOTP()}
            style={{ position: 'absolute', opacity: 0, height: 1, width: 1 }}
            caretHidden
          />

          <Button
            label={isRecovery ? 'Continue' : 'Verify Email'}
            icon="checkmark-circle-outline"
            size="lg"
            fullWidth
            loading={loading}
            onPress={() => handleConfirmOTP()}
            disabled={otp.length < OTP_LENGTH}
          />

          <View className="items-center mt-8">
            <Text className="font-sans text-[13px] text-gray-500 dark:text-gray-400 mb-3">
              Didn't receive the code?
            </Text>
            <Button
              label={countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
              variant="ghost"
              size="sm"
              loading={resendLoading}
              disabled={countdown > 0}
              onPress={handleResendOTP}
            />
          </View>
        </View>
      </Reveal>
    </AuthScaffold>
  );
}
