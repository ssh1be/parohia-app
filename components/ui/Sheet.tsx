import { Ionicons } from '@expo/vector-icons';
import { ReactNode, useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { springs } from '../../constants/theme';
import { Portal } from './Portal';
import { useThemeColors } from './useThemeColors';

interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  children: ReactNode;
  footer?: ReactNode;
  scrollable?: boolean;
  dismissible?: boolean;
}

const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 900;
const ENTER_DURATION = 500;
const EXIT_DURATION = 300;
// Approximates the iOS sheet presentation curve: quick departure, long gentle settle.
const SHEET_EASING = Easing.bezier(0.32, 0.72, 0, 1);
// iOS keeps sheet presentation motion under Reduce Motion, so these do too; Reanimated would otherwise jump to the end.
const SHEET_MOTION = ReduceMotion.Never;

export function Sheet({
  visible,
  onClose,
  title,
  subtitle,
  eyebrow,
  children,
  footer,
  scrollable = true,
  dismissible = true,
}: SheetProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const colors = useThemeColors();
  const [mounted, setMounted] = useState(visible);
  const translateY = useSharedValue(height);
  const backdrop = useSharedValue(0);

  const pendingEnter = useRef(false);

  const enter = () => {
    translateY.value = withTiming(0, { duration: ENTER_DURATION, easing: SHEET_EASING, reduceMotion: SHEET_MOTION });
    backdrop.value = withTiming(1, { duration: 320, reduceMotion: SHEET_MOTION });
  };

  // Portaled content mounts a commit after `mounted` flips (later when the parent is busy),
  // so the entrance waits for the sheet's first layout instead of starting before it exists.
  const handleSheetLayout = () => {
    if (!pendingEnter.current) return;
    pendingEnter.current = false;
    requestAnimationFrame(enter);
  };

  useEffect(() => {
    if (visible) {
      if (mounted) {
        enter();
      } else {
        translateY.value = height;
        backdrop.value = 0;
        pendingEnter.current = true;
        setMounted(true);
      }
    } else if (mounted) {
      backdrop.value = withTiming(0, { duration: 240, reduceMotion: SHEET_MOTION });
      translateY.value = withTiming(height, { duration: EXIT_DURATION, easing: SHEET_EASING, reduceMotion: SHEET_MOTION }, (finished) => {
        if (finished) runOnJS(setMounted)(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const requestClose = () => {
    if (dismissible) onClose();
  };

  useEffect(() => {
    if (!visible) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      requestClose();
      return true;
    });
    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, dismissible, onClose]);

  const pan = Gesture.Pan()
    .enabled(dismissible)
    .onUpdate((e) => {
      translateY.value = Math.max(0, e.translationY);
    })
    .onEnd((e) => {
      if (e.translationY > DISMISS_DISTANCE || e.velocityY > DISMISS_VELOCITY) {
        runOnJS(onClose)();
      } else {
        translateY.value = withSpring(0, { ...springs.sheet, reduceMotion: SHEET_MOTION });
      }
    });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdrop.value * interpolate(translateY.value, [0, height * 0.6], [1, 0], Extrapolation.CLAMP),
  }));

  const hasHeader = !!(title || subtitle || eyebrow);

  return (
    <Portal>
      {mounted && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[StyleSheet.absoluteFill, { justifyContent: 'flex-end' }]}
          pointerEvents={visible ? 'auto' : 'none'}
        >
          <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={requestClose} accessibilityLabel="Dismiss" />
          </Animated.View>

          <Animated.View
            onLayout={handleSheetLayout}
            accessibilityViewIsModal
            style={[
              styles.sheet,
              { maxHeight: height - insets.top - 24, backgroundColor: colors.isDark ? '#0B0F17' : '#FFFFFF' },
              sheetStyle,
            ]}
          >
            <GestureDetector gesture={pan}>
              <View className="px-6 pt-3 pb-3">
                <View className="self-center h-1 w-10 rounded-full bg-gray-300 dark:bg-white/20 mb-4" />
                {hasHeader && (
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-4">
                      {eyebrow && (
                        <Text className="font-sans-semibold text-[11px] tracking-[1.6px] uppercase text-red-600 dark:text-red-400 mb-1">
                          {eyebrow}
                        </Text>
                      )}
                      {title && (
                        <Text className="font-display text-[28px] leading-[32px] text-gray-900 dark:text-white">
                          {title}
                        </Text>
                      )}
                      {subtitle && (
                        <Text className="font-sans text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</Text>
                      )}
                    </View>
                    {dismissible && (
                      <Pressable
                        onPress={requestClose}
                        hitSlop={12}
                        accessibilityRole="button"
                        accessibilityLabel="Close"
                        className="h-9 w-9 rounded-full bg-gray-100 dark:bg-white/10 items-center justify-center active:opacity-70"
                      >
                        <Ionicons name="close" size={18} color={colors.icon} />
                      </Pressable>
                    )}
                  </View>
                )}
              </View>
            </GestureDetector>

            {scrollable ? (
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{
                  paddingHorizontal: 24,
                  paddingTop: 4,
                  paddingBottom: footer ? 16 : Math.max(insets.bottom, 16) + 16,
                }}
              >
                {children}
              </ScrollView>
            ) : (
              <View
                style={{ paddingHorizontal: 24, paddingBottom: footer ? 16 : Math.max(insets.bottom, 16) + 16 }}
              >
                {children}
              </View>
            )}

            {footer && (
              <View
                className="px-6 pt-3 border-t border-gray-100 dark:border-white/5"
                style={{ paddingBottom: Math.max(insets.bottom, 16) }}
              >
                {footer}
              </View>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      )}
    </Portal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    backgroundColor: 'rgba(3, 7, 18, 0.55)',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
});
