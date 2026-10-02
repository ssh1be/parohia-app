import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useState } from 'react';
import { LayoutChangeEvent, Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { palette, springs } from '../../constants/theme';
import { useThemeColors } from './useThemeColors';

export interface Segment<T extends string> {
  key: T;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
}

interface SegmentedControlProps<T extends string> {
  segments: Segment<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

const PADDING = 4;

export function SegmentedControl<T extends string>({ segments, value, onChange, className = '' }: SegmentedControlProps<T>) {
  const colors = useThemeColors();
  const [width, setWidth] = useState(0);
  const index = Math.max(0, segments.findIndex((s) => s.key === value));
  const segmentWidth = width > 0 ? (width - PADDING * 2) / segments.length : 0;
  const translateX = useSharedValue(0);

  useEffect(() => {
    translateX.value = withSpring(index * segmentWidth, springs.snappy);
  }, [index, segmentWidth]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      className={`flex-row h-11 rounded-full bg-gray-200/70 dark:bg-white/[0.07] ${className}`}
      style={{ padding: PADDING }}
      accessibilityRole="tablist"
    >
      {segmentWidth > 0 && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: PADDING,
              bottom: PADDING,
              left: PADDING,
              width: segmentWidth,
              borderRadius: 999,
              backgroundColor: colors.isDark ? '#1F2937' : '#FFFFFF',
              shadowColor: '#111827',
              shadowOpacity: colors.isDark ? 0 : 0.08,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            },
            indicatorStyle,
          ]}
        />
      )}
      {segments.map((segment) => {
        const active = segment.key === value;
        return (
          <Pressable
            key={segment.key}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => {
              if (!active) {
                Haptics.selectionAsync().catch(() => {});
                onChange(segment.key);
              }
            }}
            className="flex-1 flex-row items-center justify-center"
          >
            {segment.icon && (
              <Ionicons
                name={segment.icon}
                size={15}
                color={active ? palette.accent : colors.textMuted}
                style={{ marginRight: 6 }}
              />
            )}
            <Text
              className={`font-sans-semibold text-[13px] ${
                active ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              {segment.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
