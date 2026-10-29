import { Image } from 'expo-image';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { areBrandAssetsReady, PAROHIA_SPLASH_ICON, preloadBrandAssets } from '../../constants/assets';
import { Spinner } from './Spinner';

/** Matches native splash (`app.json`: #DC2626 + Splash.png @ imageWidth 200). */
export const LOADING_SCREEN_BG = '#DC2626';
const ICON_SIZE = 200;

type LoadingScreenProps = {
  caption?: string;
  /** Fired once the loader has laid out (use to dismiss native splash). */
  onReady?: () => void;
};

/**
 * Full-screen boot loader — icon dead-centered like native splash;
 * spinner pinned near the bottom so it can't shove the mark off-center.
 */
export function LoadingScreen({ onReady }: LoadingScreenProps) {
  const ready = useSharedValue(areBrandAssetsReady() ? 1 : 0);
  const pulse = useSharedValue(1);

  useEffect(() => {
    let mounted = true;
    if (!areBrandAssetsReady()) {
      preloadBrandAssets()
        .catch(() => {})
        .finally(() => {
          if (mounted) ready.value = 1;
        });
    }

    pulse.value = withRepeat(
      withTiming(1.05, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );

    return () => {
      mounted = false;
    };
  }, [pulse, ready]);

  const iconStyle = useAnimatedStyle(() => ({
    opacity: ready.value,
    transform: [{ scale: pulse.value }],
  }));

  return (
    <View style={styles.root} onLayout={() => onReady?.()}>
      <Animated.View style={[styles.iconWrap, iconStyle]}>
        <Image
          source={PAROHIA_SPLASH_ICON}
          style={styles.icon}
          contentFit="contain"
          transition={0}
          cachePolicy="memory-disk"
          accessibilityLabel="Parohia"
        />
      </Animated.View>
      <View style={styles.spinner} pointerEvents="none">
        <Spinner size="sm" color="#FFFFFF" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    ...StyleSheet.absoluteFill,
    backgroundColor: LOADING_SCREEN_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrap: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: ICON_SIZE,
    height: ICON_SIZE,
  },
  spinner: {
    position: 'absolute',
    bottom: 96,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
});
