import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';
import { RefreshControl as RNRefreshControl, RefreshControlProps, StyleSheet, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { Spinner } from './Spinner';

const PULL_DISTANCE = 72;
const SLOW_SPIN_MS = 1800;
const FAST_SPIN_MS = 480;

/**
 * Native RefreshControl with an invisible system spinner —
 * pair with {@link RefreshSpinnerOverlay} for the branded white loader.
 */
export function AppRefreshControl({
  tintColor: _tintColor,
  colors: _colors,
  progressBackgroundColor: _progressBackgroundColor,
  ...props
}: RefreshControlProps) {
  return (
    <RNRefreshControl
      {...props}
      tintColor="transparent"
      colors={['transparent']}
      progressBackgroundColor="transparent"
    />
  );
}

type RefreshSpinnerOverlayProps = {
  refreshing: boolean;
  scrollY: SharedValue<number>;
  /** Distance from top of screen (usually safe-area inset). */
  top?: number;
};

function fireArmHaptic() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

function fireRefreshHaptic() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}

/** Custom white spinner that follows pull-to-refresh progress. */
export function RefreshSpinnerOverlay({
  refreshing,
  scrollY,
  top = 0,
}: RefreshSpinnerOverlayProps) {
  const armed = useSharedValue(false);

  // Haptic when pull crosses the refresh threshold (before release).
  useAnimatedReaction(
    () => Math.max(0, -scrollY.value) >= PULL_DISTANCE,
    (atThreshold, wasAtThreshold) => {
      if (atThreshold && !wasAtThreshold && !armed.value) {
        armed.value = true;
        runOnJS(fireArmHaptic)();
      } else if (!atThreshold && !refreshing) {
        armed.value = false;
      }
    },
    [refreshing],
  );

  // Haptic when refresh actually starts.
  useEffect(() => {
    if (refreshing) {
      fireRefreshHaptic();
      armed.value = true;
    } else {
      armed.value = false;
    }
  }, [refreshing, armed]);

  const style = useAnimatedStyle(() => {
    const pull = Math.max(0, -scrollY.value);
    const progress = interpolate(pull, [0, PULL_DISTANCE], [0, 1], Extrapolation.CLAMP);

    if (refreshing) {
      return {
        opacity: 1,
        transform: [{ translateY: 10 }, { scale: 1 }],
      };
    }

    return {
      opacity: progress,
      transform: [
        {
          translateY: interpolate(pull, [0, PULL_DISTANCE], [-4, 10], Extrapolation.CLAMP),
        },
        {
          scale: interpolate(progress, [0, 1], [0.65, 1], Extrapolation.CLAMP),
        },
      ],
    };
  });

  return (
    <View pointerEvents="none" style={[styles.host, { top: top + 4 }]}>
      <Animated.View style={style}>
        <Spinner size="md" duration={refreshing ? FAST_SPIN_MS : SLOW_SPIN_MS} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 30,
    alignItems: 'center',
  },
});
