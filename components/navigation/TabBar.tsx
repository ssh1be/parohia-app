import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomTabBarProps } from 'expo-router/tabs';
import { useEffect, useState } from 'react';
import { LayoutChangeEvent, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { palette, springs, TAB_BAR_GAP, TAB_BAR_HEIGHT } from '../../constants/theme';
import { useThemeColors } from '../ui/useThemeColors';

type IconName = keyof typeof Ionicons.glyphMap;

const ICONS: Record<string, { active: IconName; inactive: IconName }> = {
  index: { active: 'home', inactive: 'home-outline' },
  calendar: { active: 'calendar', inactive: 'calendar-outline' },
  events: { active: 'newspaper', inactive: 'newspaper-outline' },
  parish: { active: 'location', inactive: 'location-outline' },
};

const INSET = 6;

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const [width, setWidth] = useState(0);
  const count = state.routes.length;
  const itemWidth = width > 0 ? (width - INSET * 2) / count : 0;
  const translateX = useSharedValue(0);

  useEffect(() => {
    translateX.value = withSpring(state.index * itemWidth, springs.snappy);
  }, [state.index, itemWidth]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        { bottom: Math.max(insets.bottom, TAB_BAR_GAP), shadowOpacity: colors.isDark ? 0.35 : 0.08 },
        Platform.OS === 'android' && { elevation: 0 },
      ]}
    >
      <View
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
        style={[styles.bar, { borderColor: colors.isDark ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.7)' }]}
      >
        {Platform.OS === 'ios' ? (
          <BlurView
            intensity={colors.isDark ? 40 : 50}
            tint={colors.isDark ? 'systemUltraThinMaterialDark' : 'systemUltraThinMaterialLight'}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <View
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: colors.isDark ? 'rgba(17,24,39,0.82)' : 'rgba(255,255,255,0.86)' },
            ]}
          />
        )}
        <LinearGradient
          pointerEvents="none"
          colors={
            colors.isDark
              ? ['rgba(255,255,255,0.10)', 'rgba(255,255,255,0.02)', 'rgba(255,255,255,0)']
              : ['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.12)', 'rgba(255,255,255,0.04)']
          }
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View
          pointerEvents="none"
          style={[styles.edge, { borderColor: colors.isDark ? 'rgba(0,0,0,0.35)' : 'rgba(17,24,39,0.06)' }]}
        />

        {itemWidth > 0 && (
          <Animated.View
            style={[
              styles.indicator,
              { width: itemWidth, backgroundColor: palette.accentMuted },
              indicatorStyle,
            ]}
          />
        )}

        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const label = typeof options.title === 'string' ? options.title : route.name;
          const icon = ICONS[route.name] ?? { active: 'ellipse', inactive: 'ellipse-outline' };
          const tint = focused ? palette.accent : colors.textMuted;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              Haptics.selectionAsync().catch(() => {});
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key });
          };

          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
              testID={options.tabBarButtonTestID}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.item}
            >
              <TabIcon name={focused ? icon.active : icon.inactive} color={tint} focused={focused} />
              <Text
                numberOfLines={1}
                style={{ color: tint }}
                className={`text-[10.5px] mt-0.5 ${focused ? 'font-sans-bold' : 'font-sans-medium'}`}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function TabIcon({ name, color, focused }: { name: IconName; color: string; focused: boolean }) {
  const scale = useSharedValue(focused ? 1 : 0.92);

  useEffect(() => {
    scale.value = withSpring(focused ? 1 : 0.92, { damping: 12, stiffness: 320 });
  }, [focused]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={style}>
      <Ionicons name={name} size={22} color={color} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 26,
    shadowColor: '#030712',
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  bar: {
    height: TAB_BAR_HEIGHT,
    borderRadius: 26,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    paddingHorizontal: INSET,
    overflow: 'hidden',
  },
  edge: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 26,
    borderWidth: StyleSheet.hairlineWidth,
  },
  indicator: {
    position: 'absolute',
    top: INSET,
    bottom: INSET,
    left: INSET,
    borderRadius: 20,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
