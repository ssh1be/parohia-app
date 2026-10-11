import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';
import { supabase } from '../../config/supabase';
import { palette } from '../../constants/theme';
import { Button } from '../ui/Button';
import { Sheet } from '../ui/Sheet';

const OTP_LENGTH = 6;

interface OtpSheetProps {
  visible: boolean;
  email: string;
  onClose: () => void;
  onVerified: () => void;
}

export function OtpSheet({ visible, email, onClose, onVerified }: OtpSheetProps) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (!visible) {
      setOtp('');
      setLoading(false);
      setResendLoading(false);
      setCountdown(0);
      setFocused(false);
    }
  }, [visible]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleConfirmOTP = async () => {
    if (!otp || otp.length < OTP_LENGTH) {
      Alert.alert('Error', 'Please enter the 6-digit OTP code');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'signup',
      });

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      onClose();
      onVerified();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0 || !email) return;

    setResendLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });

      if (error) throw error;

      setCountdown(60);
      Alert.alert('Success!', 'A new OTP code has been sent to your email.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to resend OTP');
    } finally {
      setResendLoading(false);
    }
  };

  const digits = Array.from({ length: OTP_LENGTH }, (_, i) => otp[i] ?? '');

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      dismissible={!loading}
      eyebrow="Almost there"
      title="Verify Email"
      subtitle="Enter the 6-digit code we sent to your inbox."
      footer={
        <View>
          <Button
            label="Verify Email"
            icon="checkmark-circle-outline"
            size="lg"
            fullWidth
            loading={loading}
            onPress={handleConfirmOTP}
            disabled={otp.length < OTP_LENGTH}
          />
          <View className="items-center mt-3">
            <Text className="font-sans text-[13px] text-gray-500 dark:text-gray-400 mb-1">
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
      }
    >
      <View className="items-center mb-6">
        <View className="h-14 w-14 rounded-[20px] bg-red-600/10 dark:bg-red-500/15 items-center justify-center mb-4">
          <Ionicons name="mail-outline" size={24} color={palette.accent} />
        </View>
        <Text className="font-sans text-[13px] text-gray-500 dark:text-gray-400 text-center">
          Code sent to
        </Text>
        <Text className="font-sans-semibold text-[15px] text-gray-900 dark:text-white text-center mt-1">
          {email}
        </Text>
      </View>

      <Pressable
        className="w-full flex-row justify-between mb-2"
        onPress={() => inputRef.current?.focus()}
        accessibilityRole="none"
      >
        {digits.map((digit, i) => {
          const isActive =
            focused && (otp.length === i || (otp.length === OTP_LENGTH && i === OTP_LENGTH - 1));
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
              <Text className="font-sans-bold text-[22px] text-gray-900 dark:text-white">{digit}</Text>
            </View>
          );
        })}
      </Pressable>

      <TextInput
        ref={inputRef}
        value={otp}
        onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={OTP_LENGTH}
        autoFocus={visible}
        onSubmitEditing={handleConfirmOTP}
        style={{ position: 'absolute', opacity: 0, height: 1, width: 1 }}
        caretHidden
      />
    </Sheet>
  );
}
