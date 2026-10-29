import { Ionicons } from '@expo/vector-icons';
import { createContext, ReactNode, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  BackHandler,
  Keyboard,
  KeyboardEvent,
  Platform,
  Pressable,
  ScrollView as RNScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ScrollViewInstance,
  type ViewInstance,
} from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
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

type SheetScrollContextValue = {
  /** Scroll a focused field into view inside the sheet body. */
  ensureVisible: (node: ViewInstance | null) => void;
};

const SheetScrollContext = createContext<SheetScrollContextValue | null>(null);

/** Used by Field (and similar) to keep focused inputs above the keyboard/footer. */
export function useSheetScroll() {
  return useContext(SheetScrollContext);
}

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
/** Shared so callers can wait for dismiss to finish before clearing selection. */
export const SHEET_EXIT_DURATION = 620;
const EXIT_DURATION = SHEET_EXIT_DURATION;
const SHEET_EASING = Easing.bezier(0.32, 0.72, 0, 1);
const SHEET_MOTION = ReduceMotion.Never;
const TOP_GAP = 24;

function keyboardTiming(event: KeyboardEvent) {
  const duration = Platform.OS === 'ios' ? Math.max(event.duration ?? 250, 1) : 220;
  return {
    duration,
    easing: Platform.OS === 'ios' ? Easing.bezier(0.17, 0.59, 0.4, 0.77) : Easing.out(Easing.cubic),
    reduceMotion: SHEET_MOTION,
  } as const;
}

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
  const [keyboardDocked, setKeyboardDocked] = useState(false);
  const translateY = useSharedValue(height);
  const backdrop = useSharedValue(0);
  const keyboardHeight = useSharedValue(0);
  const scrollRef = useRef<ScrollViewInstance>(null);
  const scrollOffsetRef = useRef(0);

  const pendingEnter = useRef(false);
  const visibleRef = useRef(visible);
  const unmountTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollFocusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  visibleRef.current = visible;

  const clearUnmountTimer = () => {
    if (unmountTimer.current) {
      clearTimeout(unmountTimer.current);
      unmountTimer.current = null;
    }
  };

  const finishUnmount = () => {
    clearUnmountTimer();
    // Skip if the sheet was reopened while the exit animation was in flight.
    if (visibleRef.current) return;
    setMounted(false);
  };

  const enter = () => {
    clearUnmountTimer();
    translateY.value = withTiming(0, { duration: ENTER_DURATION, easing: SHEET_EASING, reduceMotion: SHEET_MOTION });
    backdrop.value = withTiming(1, { duration: 320, reduceMotion: SHEET_MOTION });
  };

  const handleSheetLayout = () => {
    if (!pendingEnter.current) return;
    pendingEnter.current = false;
    requestAnimationFrame(enter);
  };

  const ensureVisible = useCallback((node: ViewInstance | null) => {
    if (!node || !scrollRef.current) return;
    if (scrollFocusTimer.current) clearTimeout(scrollFocusTimer.current);

    // Wait for keyboard dock + layout, then keep the focused field in the visible viewport.
    scrollFocusTimer.current = setTimeout(() => {
      node.measureInWindow((_x, y, _w, h) => {
        scrollRef.current?.measureInWindow((_sx, sy, _sw, sh) => {
          const pad = 20;
          const fieldTop = y;
          const fieldBottom = y + h;
          const viewTop = sy + pad;
          const viewBottom = sy + sh - pad;
          let delta = 0;
          if (fieldBottom > viewBottom) delta = fieldBottom - viewBottom;
          else if (fieldTop < viewTop) delta = fieldTop - viewTop;
          if (Math.abs(delta) < 2) return;
          scrollRef.current?.scrollTo({
            y: Math.max(0, scrollOffsetRef.current + delta),
            animated: true,
          });
        });
      });
    }, Platform.OS === 'ios' ? 300 : 140);
  }, []);

  useEffect(() => {
    if (visible) {
      if (mounted) {
        enter();
      } else {
        translateY.value = height;
        backdrop.value = 0;
        keyboardHeight.value = 0;
        setKeyboardDocked(false);
        pendingEnter.current = true;
        setMounted(true);
      }
    } else if (mounted) {
      Keyboard.dismiss();
      setKeyboardDocked(false);
      keyboardHeight.value = withTiming(0, { duration: 180, reduceMotion: SHEET_MOTION });
      backdrop.value = withTiming(0, { duration: 240, reduceMotion: SHEET_MOTION });
      translateY.value = withTiming(
        height,
        { duration: EXIT_DURATION, easing: SHEET_EASING, reduceMotion: SHEET_MOTION },
        (finished) => {
          if (finished) runOnJS(finishUnmount)();
        },
      );
      // Backup if the animation callback never fires (common after ScrollView + gesture interaction).
      clearUnmountTimer();
      unmountTimer.current = setTimeout(finishUnmount, EXIT_DURATION + 80);
    }
    return () => clearUnmountTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    if (!mounted) return;

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (event: KeyboardEvent) => {
      const next = Math.max(0, event.endCoordinates.height);
      setKeyboardDocked(true);
      keyboardHeight.value = withTiming(next, keyboardTiming(event));
    };
    const onHide = (event: KeyboardEvent) => {
      setKeyboardDocked(false);
      keyboardHeight.value = withTiming(0, keyboardTiming(event));
      if (scrollFocusTimer.current) {
        clearTimeout(scrollFocusTimer.current);
        scrollFocusTimer.current = null;
      }
    };

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
      if (scrollFocusTimer.current) clearTimeout(scrollFocusTimer.current);
    };
  }, [mounted, keyboardHeight]);

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
    .enabled(dismissible && visible && !keyboardDocked)
    .activeOffsetY(8)
    .failOffsetX([-24, 24])
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

  // Only animate margin/maxHeight — never force height:'auto' (collapses ScrollView children).
  // When keyboard is up, minHeight expands the sheet to fill space above it.
  const sheetStyle = useAnimatedStyle(() => {
    const kb = Math.max(0, keyboardHeight.value);
    const maxH = Math.max(280, height - insets.top - TOP_GAP - kb);
    return {
      transform: [{ translateY: translateY.value }],
      marginBottom: kb,
      maxHeight: maxH,
      minHeight: kb > 8 ? maxH : 0,
    };
  });

  const footerPadStyle = useAnimatedStyle(() => ({
    paddingBottom: keyboardHeight.value > 8 ? 12 : Math.max(insets.bottom, 16),
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdrop.value * interpolate(translateY.value, [0, height * 0.6], [1, 0], Extrapolation.CLAMP),
  }));

  const hasHeader = !!(title || subtitle || eyebrow);
  const restingMaxHeight = height - insets.top - TOP_GAP;
  const scrollBottomPad = footer
    ? keyboardDocked
      ? 28
      : 20
    : Math.max(insets.bottom, 16) + 16;

  return (
    <Portal>
      {mounted && (
        // Portals need their own GH root or scroll/pan can leave the overlay eating touches after dismiss.
        <GestureHandlerRootView style={StyleSheet.absoluteFill} pointerEvents={visible ? 'auto' : 'box-none'}>
          <View
            style={[StyleSheet.absoluteFill, styles.host]}
            pointerEvents={visible ? 'auto' : 'none'}
          >
            <Animated.View
              style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}
              pointerEvents={visible ? 'auto' : 'none'}
            >
              <Pressable
                style={StyleSheet.absoluteFill}
                onPress={() => {
                  Keyboard.dismiss();
                  requestClose();
                }}
                accessibilityLabel="Dismiss"
              />
            </Animated.View>

            <Animated.View
              onLayout={handleSheetLayout}
              accessibilityViewIsModal
              pointerEvents={visible ? 'auto' : 'none'}
              style={[
                styles.sheet,
                {
                  maxHeight: restingMaxHeight,
                  backgroundColor: colors.isDark ? '#0B0F17' : '#FFFFFF',
                },
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

              <SheetScrollContext.Provider value={{ ensureVisible }}>
                {scrollable ? (
                  <RNScrollView
                    ref={scrollRef}
                    // flex:1 only when sheet has a definite expanded height; otherwise it collapses to 0.
                    style={keyboardDocked ? { flex: 1 } : undefined}
                    keyboardShouldPersistTaps="always"
                    keyboardDismissMode="on-drag"
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                    nestedScrollEnabled
                    onScroll={(e) => {
                      scrollOffsetRef.current = e.nativeEvent.contentOffset.y;
                    }}
                    scrollEventThrottle={16}
                    contentContainerStyle={{
                      paddingHorizontal: 24,
                      paddingTop: 4,
                      paddingBottom: scrollBottomPad,
                      flexGrow: keyboardDocked ? 1 : undefined,
                    }}
                  >
                    {children}
                  </RNScrollView>
                ) : (
                  <View
                    style={{
                      flexGrow: keyboardDocked ? 1 : undefined,
                      paddingHorizontal: 24,
                      paddingBottom: scrollBottomPad,
                    }}
                  >
                    {children}
                  </View>
                )}
              </SheetScrollContext.Provider>

              {footer && (
                <Animated.View
                  className="px-6 pt-3 border-t border-gray-100 dark:border-white/5"
                  style={footerPadStyle}
                >
                  {footer}
                </Animated.View>
              )}
            </Animated.View>
          </View>
        </GestureHandlerRootView>
      )}
    </Portal>
  );
}

const styles = StyleSheet.create({
  host: {
    justifyContent: 'flex-end',
  },
  backdrop: {
    backgroundColor: 'rgba(3, 7, 18, 0.55)',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    width: '100%',
  },
});
