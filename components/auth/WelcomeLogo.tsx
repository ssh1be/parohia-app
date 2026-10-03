import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { areBrandAssetsReady, PAROHIA_ICON, preloadBrandAssets } from '../../constants/assets';

interface WelcomeLogoProps {
  /** Mark size in px. Default 100. */
  size?: number;
}

/**
 * Brand mark for the welcome screen — church PNG on a soft red plate.
 * Waits for the asset to be preloaded before revealing so the icon never flashes empty.
 */
export function WelcomeLogo({ size = 100 }: WelcomeLogoProps) {
  const [ready, setReady] = useState(areBrandAssetsReady);

  useEffect(() => {
    if (ready) return;

    let mounted = true;
    preloadBrandAssets()
      .then(() => {
        if (mounted) setReady(true);
      })
      .catch(() => {
        if (mounted) setReady(true);
      });
    return () => {
      mounted = false;
    };
  }, [ready]);

  const icon = Math.round(size * 0.78);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {ready ? (
        <Animated.View entering={FadeIn.duration(420)}>
          <View
            style={{
              width: size,
              height: size,
              borderRadius: Math.round(size * 0.32),
              overflow: 'hidden',
              shadowColor: '#DC2626',
              shadowOpacity: 0.28,
              shadowRadius: 16,
              shadowOffset: { width: 0, height: 8 },
              elevation: 8,
            }}
          >
            <LinearGradient
              colors={['#EF4444', '#DC2626', '#991B1B']}
              start={{ x: 0.15, y: 0 }}
              end={{ x: 0.85, y: 1 }}
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <LinearGradient
                colors={['rgba(255,255,255,0.22)', 'rgba(255,255,255,0)']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 0.55 }}
                style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
                pointerEvents="none"
              />
              <Image
                source={PAROHIA_ICON}
                style={{ width: icon, height: icon }}
                contentFit="contain"
                tintColor="#FFFFFF"
                transition={0}
                cachePolicy="memory-disk"
                accessibilityLabel="Parohia"
              />
            </LinearGradient>
          </View>
        </Animated.View>
      ) : (
        <View style={{ width: size, height: size }} />
      )}
    </View>
  );
}
