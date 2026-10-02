import * as Haptics from 'expo-haptics';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { springs } from '../../constants/theme';

export type PressableScaleProps = Omit<PressableProps, 'style'> & {
  /** Visual classes, applied to the inner Pressable. */
  className?: string;
  /** Layout style for the animated wrapper (flex, width, margins). NativeWind classes can't go here. */
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  haptic?: boolean;
};

export function PressableScale({
  scaleTo = 0.97,
  haptic = false,
  onPressIn,
  onPressOut,
  onPress,
  style,
  className,
  children,
  ...rest
}: PressableScaleProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[style, animatedStyle]}>
      <Pressable
        {...rest}
        className={className}
        onPressIn={(e) => {
          scale.value = withSpring(scaleTo, springs.snappy);
          onPressIn?.(e);
        }}
        onPressOut={(e) => {
          scale.value = withSpring(1, springs.snappy);
          onPressOut?.(e);
        }}
        onPress={(e) => {
          if (haptic) Haptics.selectionAsync().catch(() => {});
          onPress?.(e);
        }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
