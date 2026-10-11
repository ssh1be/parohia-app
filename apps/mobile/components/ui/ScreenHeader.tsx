import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from './useThemeColors';

const COLLAPSE_START = 24;
const COLLAPSE_END = 72;

export function useScrollHeader() {
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  return { scrollY, onScroll };
}

interface LargeHeaderProps {
  title: string;
  eyebrow?: string;
  subtitle?: ReactNode;
  right?: ReactNode;
  scrollY: SharedValue<number>;
}

/** Large serif title that drifts and fades as the page scrolls under the compact bar. */
export function LargeHeader({ title, eyebrow, subtitle, right, scrollY }: LargeHeaderProps) {
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, COLLAPSE_END], [1, 0], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(scrollY.value, [-100, 0, COLLAPSE_END], [12, 0, -8], Extrapolation.CLAMP) },
      { scale: interpolate(scrollY.value, [-100, 0], [1.04, 1], Extrapolation.CLAMP) },
    ],
  }));

  return (
    <Animated.View style={[styles.large, style]}>
      <View className="flex-row items-end justify-between">
        <View className="flex-1 pr-3">
          {eyebrow && (
            <Text className="font-sans-semibold text-[12px] tracking-[1.4px] uppercase text-red-600 dark:text-red-400 mb-1">
              {eyebrow}
            </Text>
          )}
          <Text
            className="font-display text-[40px] leading-[44px] text-gray-900 dark:text-white"
            accessibilityRole="header"
            numberOfLines={2}
          >
            {title}
          </Text>
        </View>
        {right}
      </View>
      {subtitle ? (
        typeof subtitle === 'string' ? (
          <Text className="font-sans text-[15px] text-gray-500 dark:text-gray-400 mt-1">{subtitle}</Text>
        ) : (
          <View className="mt-1">{subtitle}</View>
        )
      ) : null}
    </Animated.View>
  );
}

/** Frosted compact bar that fades in once the large title has scrolled away. */
export function CompactHeader({ title, scrollY }: { title: string; scrollY: SharedValue<number> }) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();

  const containerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [COLLAPSE_START, COLLAPSE_END], [0, 1], Extrapolation.CLAMP),
  }));
  const titleStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(scrollY.value, [COLLAPSE_START, COLLAPSE_END + 16], [8, 0], Extrapolation.CLAMP) },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.compact, { height: insets.top + 48 }, containerStyle]}
    >
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={colors.isDark ? 45 : 55}
          tint={colors.isDark ? 'systemUltraThinMaterialDark' : 'systemUltraThinMaterialLight'}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.isDark ? 'rgba(0,0,0,0.82)' : 'rgba(249,250,251,0.86)' }]} />
      )}
      <LinearGradient
        colors={
          colors.isDark
            ? ['rgba(0,0,0,0.35)', 'rgba(0,0,0,0)']
            : ['rgba(249,250,251,0.45)', 'rgba(249,250,251,0)']
        }
        style={StyleSheet.absoluteFill}
      />
      <View style={[StyleSheet.absoluteFill, { top: insets.top }]} className="items-center justify-center">
        <Animated.View style={titleStyle}>
          <Text className="font-sans-bold text-[16px] text-gray-900 dark:text-white">{title}</Text>
        </Animated.View>
      </View>
      <View style={[styles.hairline, { backgroundColor: colors.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(17,24,39,0.06)' }]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  large: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  compact: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  hairline: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
  },
});
