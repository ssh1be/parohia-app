import { useEffect } from 'react';
import { DimensionValue, View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useThemeColors } from './useThemeColors';

interface SkeletonProps {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  className?: string;
}

export function Skeleton({ width = '100%', height = 14, radius = 8, className = '' }: SkeletonProps) {
  const { isDark } = useThemeColors();
  const reduceMotion = useReducedMotion();
  const pulse = useSharedValue(0.55);

  useEffect(() => {
    if (reduceMotion) return;
    pulse.value = withRepeat(withTiming(1, { duration: 900 }), -1, true);
    return () => cancelAnimation(pulse);
  }, [reduceMotion]);

  const style = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <View className={className}>
      <Animated.View
        style={[
          { width, height, borderRadius: radius, backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(17,24,39,0.07)' },
          style,
        ]}
      />
    </View>
  );
}

export function SkeletonRows({ rows = 3 }: { rows?: number }) {
  return (
    <View>
      {Array.from({ length: rows }).map((_, i) => (
        <View key={i} className="flex-row items-center mb-4">
          <Skeleton width={40} height={40} radius={14} />
          <View className="flex-1 ml-3">
            <Skeleton width={i % 2 ? '55%' : '70%'} height={14} />
            <Skeleton width="40%" height={11} className="mt-2" />
          </View>
        </View>
      ))}
    </View>
  );
}
