import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { eventKindStyle, palette, TAB_BAR_GAP, TAB_BAR_HEIGHT } from '../constants/theme';
import { BulletinChannel } from '../services/channelService';
import { Portal } from './ui/Portal';
import { PressableScale } from './ui/PressableScale';
import { Sheet } from './ui/Sheet';
import { useThemeColors } from './ui/useThemeColors';

export type BulletinTypeFilter = 'all' | 'announcement' | 'event' | 'volunteer';
export type BulletinChannelFilter = 'all' | string;
export type BulletinTimeFilter = '90d' | '6m' | '1y' | 'all';

type TypeFilterOption = {
  key: BulletinTypeFilter;
  label: string;
  countSingular: string;
  countPlural: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
};

type TimeFilterOption = {
  key: BulletinTimeFilter;
  label: string;
  shortLabel: string;
};

export const TYPE_FILTERS: TypeFilterOption[] = [
  {
    key: 'all',
    label: 'All posts',
    countSingular: 'post',
    countPlural: 'posts',
    icon: 'layers-outline',
    color: palette.accent,
  },
  {
    key: 'announcement',
    label: 'Announcements',
    countSingular: 'announcement',
    countPlural: 'announcements',
    icon: eventKindStyle.announcement.icon as keyof typeof Ionicons.glyphMap,
    color: eventKindStyle.announcement.color,
  },
  {
    key: 'event',
    label: 'Events',
    countSingular: 'event',
    countPlural: 'events',
    icon: eventKindStyle.event.icon as keyof typeof Ionicons.glyphMap,
    color: eventKindStyle.event.color,
  },
  {
    key: 'volunteer',
    label: 'Volunteer',
    countSingular: 'volunteering opportunity',
    countPlural: 'volunteering opportunities',
    icon: eventKindStyle.volunteer.icon as keyof typeof Ionicons.glyphMap,
    color: eventKindStyle.volunteer.color,
  },
];

export const TIME_FILTERS: TimeFilterOption[] = [
  { key: 'all', label: 'All time', shortLabel: 'All time' },
  { key: '1y', label: 'Last year', shortLabel: '1 year' },
  { key: '6m', label: 'Last 6 months', shortLabel: '6 months' },
  { key: '90d', label: 'Last 90 days', shortLabel: '90 days' },
];

export function isWithinBulletinTimeRange(createdAt: string, range: BulletinTimeFilter): boolean {
  if (range === 'all') return true;
  const created = new Date(createdAt);
  if (Number.isNaN(created.getTime())) return true;

  const cutoff = new Date();
  if (range === '90d') cutoff.setDate(cutoff.getDate() - 90);
  else if (range === '6m') cutoff.setMonth(cutoff.getMonth() - 6);
  else if (range === '1y') cutoff.setFullYear(cutoff.getFullYear() - 1);

  return created >= cutoff;
}

interface BulletinFeedHeaderProps {
  channels: BulletinChannel[];
  channelFilter: BulletinChannelFilter;
  onChannelChange: (id: BulletinChannelFilter) => void;
  typeFilter: BulletinTypeFilter;
  onTypeChange: (key: BulletinTypeFilter) => void;
  timeFilter: BulletinTimeFilter;
  onTimeChange: (key: BulletinTimeFilter) => void;
  countsByChannel: Record<string, number>;
  visibleCount: number;
  totalCount: number;
  isParishAdmin: boolean;
  onOpenChannels: () => void;
  /** Only show the floating helper while the bulletin tab is active. */
  floatingEnabled: boolean;
}

function channelIcon(channel: BulletinChannel | { id: 'all' }): keyof typeof Ionicons.glyphMap {
  if (channel.id === 'all') return 'apps-outline';
  if ('is_default' in channel && channel.is_default) return 'home';
  return 'radio-outline';
}

function OptionRow({
  label,
  icon,
  iconColor,
  selected,
  onPress,
}: {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      className={`flex-row items-center rounded-2xl px-3.5 py-3.5 mb-2 border ${
        selected
          ? 'bg-red-600/10 border-red-600/25'
          : 'bg-gray-50 dark:bg-white/[0.04] border-transparent'
      }`}
    >
      {icon && (
        <View className="h-9 w-9 rounded-xl items-center justify-center mr-3 bg-white dark:bg-white/10">
          <Ionicons name={icon} size={16} color={iconColor || palette.gray500} />
        </View>
      )}
      <Text
        className={`flex-1 font-sans-semibold text-[15px] ${
          selected ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'
        }`}
      >
        {label}
      </Text>
      {selected && <Ionicons name="checkmark-circle" size={20} color={palette.accent} />}
    </Pressable>
  );
}

export function BulletinFeedHeader({
  channels,
  channelFilter,
  onChannelChange,
  typeFilter,
  onTypeChange,
  timeFilter,
  onTimeChange,
  countsByChannel,
  visibleCount,
  totalCount,
  isParishAdmin,
  onOpenChannels,
  floatingEnabled,
}: BulletinFeedHeaderProps) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const [showFiltersSheet, setShowFiltersSheet] = useState(false);
  const [filterPicker, setFilterPicker] = useState<'type' | 'time'>('type');

  const channelItems: Array<BulletinChannel | { id: 'all'; name: string; is_default?: boolean }> = [
    { id: 'all', name: 'All' },
    ...channels,
  ];

  const activeChannel =
    channelFilter === 'all' ? null : channels.find((c) => c.id === channelFilter) ?? null;
  const activeType = TYPE_FILTERS.find((f) => f.key === typeFilter)!;
  const activeTime = TIME_FILTERS.find((f) => f.key === timeFilter)!;

  const filtersActive =
    channelFilter !== 'all' || typeFilter !== 'all' || timeFilter !== 'all';
  const typeOrTimeActive = typeFilter !== 'all' || timeFilter !== 'all';

  const countLabel =
    visibleCount === 0
      ? `No ${activeType.countPlural} here`
      : `${visibleCount} ${visibleCount === 1 ? activeType.countSingular : activeType.countPlural}${
          channelFilter === 'all' ? '' : ` in ${activeChannel?.name ?? 'channel'}`
        }`;

  // Sit just above the tab bar; the New post FAB (when present) floats above this row.
  const helperBottom = Math.max(insets.bottom, TAB_BAR_GAP) + TAB_BAR_HEIGHT + 16;

  const openFilters = () => {
    Haptics.selectionAsync().catch(() => {});
    setFilterPicker('type');
    setShowFiltersSheet(true);
  };

  return (
    <View className="pb-1">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16 }}
      >
        {channelItems.map((channel) => {
          const active = channelFilter === channel.id;
          const count =
            channel.id === 'all' ? totalCount : countsByChannel[channel.id] ?? 0;
          const icon = channelIcon(channel);

          return (
            <Pressable
              key={channel.id}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                onChannelChange(channel.id);
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              className={`h-10 pl-3.5 pr-4 mr-2 rounded-full flex-row items-center border ${
                active
                  ? 'bg-gray-900 dark:bg-white border-gray-900 dark:border-white'
                  : 'bg-white dark:bg-white/[0.05] border-gray-200 dark:border-white/10'
              }`}
            >
              <Ionicons
                name={icon}
                size={14}
                color={active ? (colors.isDark ? '#111827' : '#FFFFFF') : palette.gray500}
              />
              <Text
                className={`font-sans-semibold text-[13px] ml-1.5 ${
                  active ? 'text-white dark:text-gray-900' : 'text-gray-700 dark:text-gray-300'
                }`}
                numberOfLines={1}
              >
                {channel.name}
              </Text>
              <Text
                className={`font-sans-semibold text-[12px] ml-1.5 ${
                  active ? 'text-white/55 dark:text-gray-500' : 'text-gray-400'
                }`}
              >
                {count}
              </Text>
            </Pressable>
          );
        })}

        <Pressable
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            onOpenChannels();
          }}
          accessibilityRole="button"
          accessibilityLabel={isParishAdmin ? 'Manage channels' : 'Discover channels'}
          className="h-10 pl-3.5 pr-4 rounded-full flex-row items-center border border-dashed border-gray-300 dark:border-white/20 bg-transparent"
        >
          <Ionicons
            name={isParishAdmin ? 'settings-outline' : 'compass-outline'}
            size={14}
            color={palette.gray500}
          />
          <Text className="font-sans-semibold text-[13px] text-gray-500 dark:text-gray-400 ml-1.5">
            {isParishAdmin ? 'Manage' : 'Discover'}
          </Text>
        </Pressable>
      </ScrollView>

      {/* Floating filter helper — always present on bulletin; hidden under sheets */}
      {floatingEnabled && !showFiltersSheet && (
        <Portal>
          <Animated.View
            entering={FadeInDown.duration(220)}
            exiting={FadeOutDown.duration(80)}
            pointerEvents="box-none"
            style={[styles.helperHost, { bottom: helperBottom }]}
          >
            <View
              className="mx-4 overflow-hidden rounded-full border border-gray-200/80 dark:border-white/10"
              style={{
                shadowColor: '#111827',
                shadowOpacity: colors.isDark ? 0.35 : 0.12,
                shadowRadius: 14,
                shadowOffset: { width: 0, height: 6 },
                elevation: 6,
              }}
            >
              {Platform.OS === 'ios' ? (
                <BlurView
                  intensity={colors.isDark ? 40 : 55}
                  tint={colors.isDark ? 'systemUltraThinMaterialDark' : 'systemUltraThinMaterialLight'}
                  style={StyleSheet.absoluteFill}
                />
              ) : (
                <View
                  style={[
                    StyleSheet.absoluteFill,
                    { backgroundColor: colors.isDark ? 'rgba(17,24,39,0.92)' : 'rgba(255,255,255,0.94)' },
                  ]}
                />
              )}
              <View className="h-11 px-3.5 flex-row items-center">
                <Text
                  className="flex-1 font-sans-medium text-[13px] text-gray-600 dark:text-gray-300 pr-2"
                  numberOfLines={1}
                >
                  {countLabel}
                </Text>

                {filtersActive && (
                  <Pressable
                    onPress={() => {
                      Haptics.selectionAsync().catch(() => {});
                      onChannelChange('all');
                      onTypeChange('all');
                      onTimeChange('all');
                    }}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Clear filters"
                    className="mr-2"
                  >
                    <Text className="font-sans-bold text-[12px] text-red-600 dark:text-red-400">Clear</Text>
                  </Pressable>
                )}

                <PressableScale
                  onPress={openFilters}
                  accessibilityRole="button"
                  accessibilityLabel={`Filters: ${activeType.label}, ${activeTime.label}`}
                  scaleTo={0.97}
                  className={`h-8 pl-2.5 pr-2 rounded-full flex-row items-center border ${
                    typeOrTimeActive
                      ? 'bg-red-600/15 border-red-600/25'
                      : 'bg-gray-100/80 dark:bg-white/10 border-transparent'
                  }`}
                >
                  <Ionicons
                    name="options-outline"
                    size={13}
                    color={typeOrTimeActive ? palette.accent : palette.gray500}
                  />
                  <Text
                    className={`font-sans-bold text-[12px] ml-1 ${
                      typeOrTimeActive
                        ? 'text-red-700 dark:text-red-300'
                        : 'text-gray-700 dark:text-gray-300'
                    }`}
                    numberOfLines={1}
                  >
                    Filter
                  </Text>
                  <Ionicons
                    name="chevron-down"
                    size={12}
                    color={typeOrTimeActive ? palette.accent : colors.textMuted}
                    style={{ marginLeft: 1 }}
                  />
                </PressableScale>
              </View>
            </View>
          </Animated.View>
        </Portal>
      )}

      <Sheet
        visible={showFiltersSheet}
        onClose={() => setShowFiltersSheet(false)}
        eyebrow="Filter posts"
        title="Filters"
        scrollable
      >
        <View className="pt-4">
          <View className="flex-row mb-4">
            <PressableScale
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setFilterPicker('type');
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: filterPicker === 'type' }}
              scaleTo={0.98}
              style={{ flex: 1, marginRight: 8 }}
              className={`h-11 px-3 rounded-2xl flex-row items-center border ${
                filterPicker === 'type'
                  ? 'bg-red-600/10 border-red-600/25'
                  : 'bg-gray-50 dark:bg-white/[0.04] border-transparent'
              }`}
            >
              <Ionicons name={activeType.icon} size={15} color={activeType.color} />
              <Text
                className="flex-1 font-sans-bold text-[13px] text-gray-900 dark:text-white ml-2"
                numberOfLines={1}
              >
                {activeType.label}
              </Text>
              <Ionicons
                name={filterPicker === 'type' ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={colors.textMuted}
              />
            </PressableScale>

            <PressableScale
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setFilterPicker('time');
              }}
              accessibilityRole="button"
              accessibilityState={{ selected: filterPicker === 'time' }}
              scaleTo={0.98}
              style={{ flex: 1 }}
              className={`h-11 px-3 rounded-2xl flex-row items-center border ${
                filterPicker === 'time'
                  ? 'bg-red-600/10 border-red-600/25'
                  : 'bg-gray-50 dark:bg-white/[0.04] border-transparent'
              }`}
            >
              <Ionicons name="calendar-outline" size={15} color={palette.gray500} />
              <Text
                className="flex-1 font-sans-bold text-[13px] text-gray-900 dark:text-white ml-2"
                numberOfLines={1}
              >
                {activeTime.shortLabel}
              </Text>
              <Ionicons
                name={filterPicker === 'time' ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={colors.textMuted}
              />
            </PressableScale>
          </View>

          {filterPicker === 'type'
            ? TYPE_FILTERS.map((filter) => (
                <OptionRow
                  key={filter.key}
                  label={filter.label}
                  icon={filter.icon}
                  iconColor={filter.color}
                  selected={typeFilter === filter.key}
                  onPress={() => onTypeChange(filter.key)}
                />
              ))
            : TIME_FILTERS.map((filter) => (
                <OptionRow
                  key={filter.key}
                  label={filter.label}
                  icon="calendar-outline"
                  iconColor={palette.gray500}
                  selected={timeFilter === filter.key}
                  onPress={() => onTimeChange(filter.key)}
                />
              ))}
        </View>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  helperHost: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9,
  },
});

/** Keep in sync with Events FAB stack offset above this helper. */
export const BULLETIN_FILTER_HELPER_HEIGHT = 44;

