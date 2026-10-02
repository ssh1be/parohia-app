import { useState } from 'react';
import { Text, TextInput, TextInputProps, View } from 'react-native';
import { palette } from '../../constants/theme';

interface FieldProps extends TextInputProps {
  label: string;
  helper?: string;
  required?: boolean;
  containerClassName?: string;
}

export function Field({ label, helper, required, containerClassName = '', multiline, style, onFocus, onBlur, ...rest }: FieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View className={`mb-4 ${containerClassName}`}>
      <Text className="font-sans-semibold text-[13px] text-gray-700 dark:text-gray-300 mb-2">
        {label}
        {required ? <Text className="text-red-600 dark:text-red-400"> *</Text> : null}
      </Text>
      <TextInput
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
        className={`font-sans text-[15px] text-gray-900 dark:text-white bg-gray-100 dark:bg-white/5 rounded-2xl px-4 border ${
          focused ? 'border-red-500/70' : 'border-transparent dark:border-white/5'
        } ${multiline ? 'py-3 min-h-[88px]' : 'h-12'}`}
        style={[multiline ? { textAlignVertical: 'top' } : null, style]}
      />
      {helper && <Text className="font-sans text-xs text-gray-500 dark:text-gray-400 mt-1.5">{helper}</Text>}
    </View>
  );
}
