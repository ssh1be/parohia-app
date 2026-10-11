import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useThemeColors } from './useThemeColors';

interface SectionHeaderProps {
  title: string;
  caption?: string;
  actionLabel?: string;
  actionIcon?: keyof typeof Ionicons.glyphMap;
  actionIconColor?: string;
  onAction?: () => void;
  right?: ReactNode;
  className?: string;
}

export function SectionHeader({
  title,
  caption,
  actionLabel,
  actionIcon,
  actionIconColor,
  onAction,
  right,
  className = '',
}: SectionHeaderProps) {
  const colors = useThemeColors();
  return (
    <View className={`flex-row items-end justify-between mb-3 ${className}`}>
      <View className="flex-1 pr-3">
        <Text className="font-display text-[24px] leading-[28px] text-gray-900 dark:text-white">{title}</Text>
        {caption && <Text className="font-sans text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">{caption}</Text>}
      </View>
      {right}
      {onAction && (actionLabel || actionIcon) && (
        <Pressable
          onPress={onAction}
          hitSlop={8}
          accessibilityRole="button"
          className="flex-row items-center rounded-full px-3 h-8 bg-gray-200/70 dark:bg-white/10 active:opacity-70"
        >
          {actionIcon && <Ionicons name={actionIcon} size={14} color={actionIconColor ?? colors.icon} />}
          {actionLabel && (
            <Text className={`font-sans-semibold text-xs text-gray-800 dark:text-gray-100 ${actionIcon ? 'ml-1.5' : ''}`}>
              {actionLabel}
            </Text>
          )}
        </Pressable>
      )}
    </View>
  );
}
