import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useThemeColors } from './useThemeColors';

interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  action?: ReactNode;
  compact?: boolean;
}

export function EmptyState({ icon, title, message, action, compact = false }: EmptyStateProps) {
  const colors = useThemeColors();
  return (
    <View
      className={`items-center rounded-3xl border border-dashed border-gray-300 dark:border-white/10 ${
        compact ? 'py-6 px-5' : 'py-10 px-6'
      }`}
    >
      <View className="h-11 w-11 rounded-2xl bg-gray-200/70 dark:bg-white/5 items-center justify-center mb-3">
        <Ionicons name={icon} size={20} color={colors.textMuted} />
      </View>
      <Text className="font-sans-semibold text-[15px] text-gray-900 dark:text-white text-center">{title}</Text>
      {message && (
        <Text className="font-sans text-[13px] leading-5 text-gray-500 dark:text-gray-400 text-center mt-1 max-w-[280px]">
          {message}
        </Text>
      )}
      {action && <View className="mt-4">{action}</View>}
    </View>
  );
}
