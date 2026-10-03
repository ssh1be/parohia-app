import { ReactNode, useState } from 'react';
import { Platform, Text, TextInput, TextInputProps, View } from 'react-native';
import { palette } from '../../constants/theme';
import { useThemeColors } from './useThemeColors';

interface FieldProps extends TextInputProps {
  label: string;
  helper?: string;
  required?: boolean;
  containerClassName?: string;
  /** Optional trailing control inside the input (e.g. show/hide password). */
  rightAccessory?: ReactNode;
  /** Bump to force a native TextInput remount (clears stuck iOS autofill state). */
  remountKey?: string | number;
}

export function Field({
  label,
  helper,
  required,
  containerClassName = '',
  multiline,
  style,
  onFocus,
  onBlur,
  rightAccessory,
  remountKey,
  ...rest
}: FieldProps) {
  const [focused, setFocused] = useState(false);
  const colors = useThemeColors();
  // Explicit background beats iOS autofill's yellow fill; className alone does not.
  const fill = colors.isDark ? 'rgba(255,255,255,0.05)' : '#F3F4F6';

  return (
    <View className={`mb-4 ${containerClassName}`}>
      <Text className="font-sans-semibold text-[13px] text-gray-700 dark:text-gray-300 mb-2">
        {label}
        {required ? <Text className="text-red-600 dark:text-red-400"> *</Text> : null}
      </Text>
      <View className="relative">
        <TextInput
          key={remountKey}
          {...rest}
          multiline={multiline}
          placeholderTextColor={palette.gray400}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          className={`font-sans text-[15px] text-gray-900 dark:text-white rounded-2xl px-4 border ${
            focused ? 'border-red-500/70' : 'border-transparent dark:border-white/5'
          } ${multiline ? 'py-3 min-h-[88px]' : 'h-12'} ${rightAccessory ? 'pr-12' : ''}`}
          style={[
            { backgroundColor: fill },
            multiline ? { textAlignVertical: 'top' as const } : null,
            // iOS sometimes keeps autofill chrome unless we also pin color.
            Platform.OS === 'ios' ? { color: colors.text } : null,
            style,
          ]}
        />
        {rightAccessory ? (
          <View className="absolute right-3 top-0 bottom-0 justify-center" pointerEvents="box-none">
            {rightAccessory}
          </View>
        ) : null}
      </View>
      {helper && (
        <Text className="font-sans text-xs text-gray-500 dark:text-gray-400 mt-1.5">{helper}</Text>
      )}
    </View>
  );
}
