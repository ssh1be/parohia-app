import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { fastingStyle, getFastingKind } from '../../constants/theme';

export function FastingBadge({ fasting, className = '' }: { fasting?: string; className?: string }) {
  if (!fasting) return null;
  const style = fastingStyle[getFastingKind(fasting)];
  return (
    <View
      className={`flex-row items-center self-start rounded-full pl-2 pr-3 py-1.5 bg-gray-900/[0.05] dark:bg-white/[0.07] ${className}`}
      accessibilityLabel={`Fasting: ${fasting}`}
    >
      <View className="h-5 w-5 rounded-full items-center justify-center" style={{ backgroundColor: `${style.color}22` }}>
        <Ionicons name={style.icon as keyof typeof Ionicons.glyphMap} size={11} color={style.color} />
      </View>
      <Text className="font-sans-semibold text-xs text-gray-800 dark:text-gray-200 ml-1.5 flex-shrink" numberOfLines={2}>
        {fasting}
      </Text>
    </View>
  );
}
