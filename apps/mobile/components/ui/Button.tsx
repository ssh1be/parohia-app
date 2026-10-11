import { Ionicons } from '@expo/vector-icons';
import { StyleProp, Text, View, ViewStyle } from 'react-native';
import { PressableScale } from './PressableScale';
import { Spinner } from './Spinner';
import { useThemeColors } from './useThemeColors';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  /** Layout for the outer wrapper, e.g. `{ flex: 1 }` inside a row. */
  style?: StyleProp<ViewStyle>;
  fullWidth?: boolean;
}

const containerBySize: Record<Size, string> = {
  sm: 'h-9 px-4',
  md: 'h-12 px-5',
  lg: 'h-14 px-6',
};

const textBySize: Record<Size, string> = {
  sm: 'text-[13px]',
  md: 'text-[15px]',
  lg: 'text-base',
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  disabled = false,
  className = '',
  style,
  fullWidth = false,
}: ButtonProps) {
  const colors = useThemeColors();
  const isDisabled = disabled || loading;

  const containerByVariant: Record<Variant, string> = {
    primary: 'bg-red-600',
    secondary: 'bg-gray-200/80 dark:bg-white/10',
    ghost: 'bg-transparent',
    danger: 'bg-red-600/10 dark:bg-red-500/15',
  };
  const textByVariant: Record<Variant, string> = {
    primary: 'text-white',
    secondary: 'text-gray-900 dark:text-white',
    ghost: 'text-gray-700 dark:text-gray-200',
    danger: 'text-red-600 dark:text-red-400',
  };
  const iconColor =
    variant === 'primary' ? '#FFFFFF' : variant === 'danger' ? '#EF4444' : colors.icon;

  return (
    <PressableScale
      onPress={onPress}
      disabled={isDisabled}
      haptic={variant === 'primary'}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={[fullWidth ? { alignSelf: 'stretch' } : null, style]}
      className={`rounded-full flex-row items-center justify-center ${containerBySize[size]} ${containerByVariant[variant]} ${
        isDisabled ? 'opacity-50' : ''
      } ${className}`}
    >
      <View className="flex-row items-center justify-center">
        {loading ? (
          <Spinner size="sm" />
        ) : icon ? (
          <Ionicons name={icon} size={size === 'sm' ? 15 : 18} color={iconColor} />
        ) : null}
        <Text
          numberOfLines={1}
          className={`font-sans-semibold ${textBySize[size]} ${textByVariant[variant]} ${loading || icon ? 'ml-2' : ''}`}
        >
          {label}
        </Text>
      </View>
    </PressableScale>
  );
}
