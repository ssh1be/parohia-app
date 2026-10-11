import { Ionicons } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { EventKind, eventKindStyle } from '../../constants/theme';
import { PressableScale } from '../ui/PressableScale';

interface TimelineItemProps {
  kind: EventKind;
  title: string;
  time?: string;
  meta?: string;
  isLast?: boolean;
  right?: ReactNode;
  onPress?: () => void;
}

const TIME_PATTERN = /(\d{1,2}(?::\d{2})?\s*(?:AM|PM))/i;

/** Pulls the leading clock time out of a display string so the rail can show it; falls back to "All day". */
export function leadingTime(time?: string) {
  const match = time?.match(TIME_PATTERN);
  return match ? match[1].replace(/\s+/, ' ') : 'All day';
}

export function TimelineItem({ kind, title, time, meta, isLast = false, right, onPress }: TimelineItemProps) {
  const style = eventKindStyle[kind];
  const lead = leadingTime(time);
  const [clock, period] = lead.split(' ');

  return (
    <View className="flex-row">
      <View className="w-[58px] pt-[18px] pr-2 items-end">
        <Text className="font-sans-bold text-[13px] text-gray-900 dark:text-white">{clock}</Text>
        {period && <Text className="font-sans-medium text-[10px] text-gray-500 dark:text-gray-400 -mt-0.5">{period}</Text>}
      </View>

      <View className="items-center w-5">
        <View
          className="h-3 w-3 rounded-full mt-[21px] border-2"
          style={{ borderColor: style.color, backgroundColor: `${style.color}33` }}
        />
        {!isLast && <View className="flex-1 w-px bg-gray-200 dark:bg-white/10 mt-1" />}
      </View>

      <PressableScale
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole={onPress ? 'button' : undefined}
        accessibilityLabel={onPress ? `${title}${time ? `, ${time}` : ''}` : undefined}
        scaleTo={0.98}
        style={{ flex: 1 }}
        className="ml-2 mb-3 rounded-2xl p-4 bg-white dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06]"
      >
        <View className="flex-row items-start">
          <View className="flex-1 pr-2">
            <Text className="font-sans-semibold text-[15px] leading-5 text-gray-900 dark:text-white">{title}</Text>
            {!!time && <Text className="font-sans text-[13px] text-gray-500 dark:text-gray-400 mt-1">{time}</Text>}
            {!!meta && (
              <View className="flex-row items-center mt-1.5">
                <Ionicons name="location-outline" size={12} color="#9CA3AF" />
                <Text className="font-sans text-xs text-gray-500 dark:text-gray-400 ml-1 flex-shrink" numberOfLines={1}>
                  {meta}
                </Text>
              </View>
            )}
          </View>
          {right ?? (
            <View className="h-8 w-8 rounded-xl items-center justify-center" style={{ backgroundColor: style.tint }}>
              <Ionicons name={style.icon as keyof typeof Ionicons.glyphMap} size={15} color={style.color} />
            </View>
          )}
        </View>
      </PressableScale>
    </View>
  );
}
