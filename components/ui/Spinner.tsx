import { useEffect } from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

type SpinnerSize = 'sm' | 'md' | 'lg';

const SIZE_PX: Record<SpinnerSize, number> = {
  sm: 18,
  md: 24,
  lg: 36,
};

const STROKE: Record<SpinnerSize, number> = {
  sm: 2,
  md: 2.5,
  lg: 3,
};

interface SpinnerProps {
  size?: SpinnerSize;
  /** Defaults to white for brand loaders; override for contrast on light surfaces. */
  color?: string;
  /** Full rotation period in ms. Default 480; use ~1800 for a slow idle/pull spin. */
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Custom rotating arc spinner — replaces React Native's ActivityIndicator.
 */
export function Spinner({ size = 'sm', color = '#FFFFFF', duration = 480, style }: SpinnerProps) {
  const rotation = useSharedValue(0);
  const dim = SIZE_PX[size];
  const stroke = STROKE[size];

  useEffect(() => {
    cancelAnimation(rotation);
    const start = rotation.value % 360;
    rotation.value = start;
    rotation.value = withRepeat(
      withTiming(start + 360, { duration, easing: Easing.linear }),
      -1,
      false,
    );
  }, [rotation, duration]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <View
      accessibilityRole="progressbar"
      style={[{ width: dim, height: dim }, style]}
    >
      {/* Soft track so a white arc stays visible on light surfaces */}
      <View
        style={{
          position: 'absolute',
          width: dim,
          height: dim,
          borderRadius: dim / 2,
          borderWidth: stroke,
          borderColor: 'rgba(0,0,0,0.12)',
        }}
      />
      <Animated.View style={[{ width: dim, height: dim }, spinStyle]}>
        <View
          style={{
            width: dim,
            height: dim,
            borderRadius: dim / 2,
            borderWidth: stroke,
            borderColor: 'transparent',
            borderTopColor: color,
            borderRightColor: color,
          }}
        />
      </Animated.View>
    </View>
  );
}
