import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { Platform, Pressable, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette } from '../../constants/theme';
import { useThemeColors } from './useThemeColors';

type IconName = keyof typeof Ionicons.glyphMap;

/** Header for settings screens presented as modals; iOS page sheets already sit below the status bar. */
export function SettingsHeader({ eyebrow, title, onClose }: { eyebrow?: string; title: string; onClose?: () => void }) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();

  return (
    <View
      className="flex-row items-end justify-between px-6 pb-2"
      style={{ paddingTop: Platform.OS === 'ios' ? 24 : insets.top + 16 }}
    >
      <View className="flex-1 pr-3">
        {!!eyebrow && (
          <Text className="font-sans-semibold text-[12px] tracking-[1.4px] uppercase text-red-600 dark:text-red-400 mb-1">
            {eyebrow}
          </Text>
        )}
        <Text className="font-display text-[36px] leading-[40px] text-gray-900 dark:text-white" accessibilityRole="header">
          {title}
        </Text>
      </View>
      {onClose && (
        <Pressable
          onPress={onClose}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Close"
          className="h-9 w-9 mb-1 rounded-full bg-gray-200/80 dark:bg-white/10 items-center justify-center active:opacity-70"
        >
          <Ionicons name="close" size={18} color={colors.icon} />
        </Pressable>
      )}
    </View>
  );
}

export function SettingsGroup({ title, footer, children }: { title?: string; footer?: string; children: ReactNode }) {
  return (
    <View className="mt-7">
      {!!title && (
        <Text className="font-sans-bold text-[11px] tracking-[1.2px] uppercase text-gray-500 dark:text-gray-400 px-1 mb-2">
          {title}
        </Text>
      )}
      <View className="rounded-3xl bg-white dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06] overflow-hidden">
        {children}
      </View>
      {!!footer && (
        <Text className="font-sans text-xs leading-[18px] text-gray-500 dark:text-gray-400 px-1 mt-2">{footer}</Text>
      )}
    </View>
  );
}

interface SettingsRowProps {
  icon?: IconName;
  iconColor?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onPress?: () => void;
  first?: boolean;
  children?: ReactNode;
}

export function SettingsRow({ icon, iconColor, title, subtitle, right, onPress, first = false, children }: SettingsRowProps) {
  const colors = useThemeColors();
  const tint = iconColor ?? colors.icon;

  const body = (
    <>
      <View className="flex-row items-center">
        {icon && (
          <View className="h-9 w-9 rounded-xl items-center justify-center mr-3" style={{ backgroundColor: `${tint}1F` }}>
            <Ionicons name={icon} size={17} color={tint} />
          </View>
        )}
        <View className="flex-1 pr-3">
          <Text className="font-sans-semibold text-[15px] text-gray-900 dark:text-white">{title}</Text>
          {!!subtitle && (
            <Text className="font-sans text-[12.5px] leading-[17px] text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</Text>
          )}
        </View>
        {right}
      </View>
      {children}
    </>
  );

  const className = `px-4 py-3.5 ${first ? '' : 'border-t border-gray-100 dark:border-white/[0.06]'}`;

  return onPress ? (
    <Pressable onPress={onPress} accessibilityRole="button" className={`${className} active:bg-gray-50 dark:active:bg-white/5`}>
      {body}
    </Pressable>
  ) : (
    <View className={className}>{body}</View>
  );
}

export function SettingsSwitch({ value, onValueChange, disabled }: { value: boolean; onValueChange: (value: boolean) => void; disabled?: boolean }) {
  const colors = useThemeColors();
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ false: colors.isDark ? '#374151' : '#D1D5DB', true: palette.green }}
      thumbColor={Platform.OS === 'android' ? '#FFFFFF' : undefined}
      ios_backgroundColor={colors.isDark ? '#374151' : '#D1D5DB'}
    />
  );
}
