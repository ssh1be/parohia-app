import { Ionicons } from '@expo/vector-icons';
import { Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { palette } from '../../constants/theme';
import { EmptyState } from '../ui/EmptyState';
import { PressableScale } from '../ui/PressableScale';
import { Skeleton } from '../ui/Skeleton';

type Reading = { display: string; passage: string };

const GOSPELS = ['Matthew', 'Mark', 'Luke', 'John'];
const NEW_TESTAMENT = [
  'Acts', 'Romans', 'Corinthians', 'Galatians', 'Ephesians', 'Philippians', 'Colossians', 'Thessalonians',
  'Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', 'Peter', 'Jude', 'Revelation',
];

function readingKind(display: string) {
  if (/\b[1-3]\s*John\b/.test(display)) return 'Epistle';
  if (GOSPELS.some((book) => display.includes(book))) return 'Gospel';
  if (NEW_TESTAMENT.some((book) => display.includes(book))) return 'Epistle';
  return 'Old Testament';
}

interface ReadingsCarouselProps {
  readings?: Reading[];
  readingsLink?: string;
  loading?: boolean;
  error?: string | null;
  onSelect: (reading: Reading) => void;
}

const CARD_WIDTH = 210;

export function ReadingsCarousel({ readings, readingsLink, loading, error, onSelect }: ReadingsCarouselProps) {
  if (loading) {
    return (
      <View className="flex-row px-6">
        {[0, 1].map((i) => (
          <View key={i} className="mr-3 rounded-3xl p-5 bg-white dark:bg-white/[0.04]" style={{ width: CARD_WIDTH }}>
            <Skeleton width={60} height={10} />
            <Skeleton width="85%" height={22} className="mt-4" />
            <Skeleton width="50%" height={11} className="mt-6" />
          </View>
        ))}
      </View>
    );
  }

  if (error) {
    return (
      <View className="px-6">
        <EmptyState compact icon="cloud-offline-outline" title="Readings unavailable" message="Pull down to try again." />
      </View>
    );
  }

  if (!readings || readings.length === 0) {
    return (
      <View className="px-6">
        <EmptyState compact icon="book-outline" title="No readings appointed" message="There are no scripture readings listed for this day." />
      </View>
    );
  }

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + 12}
        decelerationRate="fast"
        contentContainerStyle={{ paddingHorizontal: 24 }}
      >
        {readings.map((reading, idx) => {
          const kind = readingKind(reading.display);
          const isGospel = kind === 'Gospel';
          return (
            <PressableScale
              key={`${reading.display}-${idx}`}
              onPress={() => onSelect(reading)}
              accessibilityRole="button"
              accessibilityLabel={`Read ${reading.display}`}
              style={{ width: CARD_WIDTH, marginRight: 12 }}
              className={`rounded-3xl p-5 min-h-[148px] justify-between border ${
                isGospel
                  ? 'bg-red-600 border-red-600'
                  : 'bg-white dark:bg-white/[0.04] border-gray-100 dark:border-white/[0.06]'
              }`}
            >
              <View className="flex-row items-center justify-between">
                <Text
                  className={`font-sans-bold text-[11px] tracking-[1.4px] uppercase ${
                    isGospel ? 'text-white/80' : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {kind}
                </Text>
                <Ionicons name="book" size={15} color={isGospel ? 'rgba(255,255,255,0.85)' : palette.gray400} />
              </View>
              <Text
                className={`font-display text-[24px] leading-[27px] mt-3 ${isGospel ? 'text-white' : 'text-gray-900 dark:text-white'}`}
                numberOfLines={2}
              >
                {reading.display}
              </Text>
              <View className="flex-row items-center mt-4">
                <Text className={`font-sans-semibold text-xs ${isGospel ? 'text-white/90' : 'text-gray-500 dark:text-gray-400'}`}>
                  Read passage
                </Text>
                <Ionicons
                  name="arrow-forward"
                  size={12}
                  color={isGospel ? 'rgba(255,255,255,0.9)' : palette.gray400}
                  style={{ marginLeft: 4 }}
                />
              </View>
            </PressableScale>
          );
        })}
      </ScrollView>

      {readingsLink && (
        <Pressable
          onPress={() => Linking.openURL(readingsLink)}
          accessibilityRole="link"
          className="flex-row items-center self-start mx-6 mt-4 active:opacity-60"
        >
          <Text className="font-sans-semibold text-[13px] text-red-600 dark:text-red-400">Full readings</Text>
          <Ionicons name="open-outline" size={13} color={palette.accentSoft} style={{ marginLeft: 4 }} />
        </Pressable>
      )}
    </View>
  );
}
