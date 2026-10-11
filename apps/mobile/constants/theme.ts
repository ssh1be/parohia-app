import { FadeInDown, FadeOutDown, LinearTransition, WithSpringConfig, ZoomIn } from 'react-native-reanimated';

export const palette = {
  accent: '#DC2626',
  accentSoft: '#EF4444',
  accentMuted: 'rgba(220, 38, 38, 0.12)',
  blue: '#3B82F6',
  purple: '#A855F7',
  green: '#10B981',
  amber: '#F59E0B',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  gray700: '#374151',
};

export const fonts = {
  display: 'CormorantGaramond_600SemiBold',
  displayBold: 'CormorantGaramond_700Bold',
  displayItalic: 'CormorantGaramond_600SemiBold_Italic',
  serif: 'CormorantGaramond_500Medium',
  sans: 'Manrope_400Regular',
  sansMedium: 'Manrope_500Medium',
  sansSemibold: 'Manrope_600SemiBold',
  sansBold: 'Manrope_700Bold',
};

export const springs = {
  snappy: { damping: 20, stiffness: 380, mass: 0.55 } satisfies WithSpringConfig,
  gentle: { damping: 22, stiffness: 220, mass: 0.65 } satisfies WithSpringConfig,
  sheet: { damping: 28, stiffness: 340, mass: 0.75 } satisfies WithSpringConfig,
};

/** Shared entering animations so card and pop-in motion stays consistent across screens. */
export const entrance = {
  /** Cards and rows rising into place; near-critically damped so they settle without visible bounce. */
  card: (delay = 0) => FadeInDown.delay(delay).springify().damping(24).stiffness(260),
  /** Small elements (selection dots, checkmarks, pills) popping in with a soft overshoot. */
  pop: () => ZoomIn.springify().damping(18).stiffness(320),
  /** Layout shifts when list items are added, removed, or reordered — soft spring to avoid harsh reshuffles. */
  layout: () => LinearTransition.springify().damping(30).stiffness(140).mass(0.9),
  /** Cards leaving on filter/remove — short fade-down so exits aren't instant pops. */
  exit: () => FadeOutDown.duration(180),
};

/** Space the floating tab bar occupies above the bottom safe-area inset. */
export const TAB_BAR_HEIGHT = 64;
export const TAB_BAR_GAP = 12;

export const contentBottomPadding = (bottomInset: number) =>
  bottomInset + TAB_BAR_HEIGHT + TAB_BAR_GAP + 32;

export type EventKind = 'confession' | 'announcement' | 'event' | 'volunteer' | 'parish';

export const eventKindStyle: Record<EventKind, { color: string; icon: string; label: string; tint: string }> = {
  confession: { color: palette.accentSoft, icon: 'person', label: 'Confession', tint: 'rgba(239, 68, 68, 0.14)' },
  announcement: { color: palette.blue, icon: 'megaphone', label: 'Announcement', tint: 'rgba(59, 130, 246, 0.14)' },
  event: { color: palette.purple, icon: 'people', label: 'Event', tint: 'rgba(168, 85, 247, 0.14)' },
  volunteer: { color: palette.green, icon: 'hand-right', label: 'Volunteer', tint: 'rgba(16, 185, 129, 0.14)' },
  parish: { color: palette.gray500, icon: 'calendar', label: 'Parish', tint: 'rgba(107, 114, 128, 0.16)' },
};

export type FastingKind = 'none' | 'fish' | 'wine' | 'strict';

export const getFastingKind = (fastingText?: string): FastingKind => {
  if (!fastingText || fastingText.includes('No Fast')) return 'none';
  if (fastingText.includes('Fish')) return 'fish';
  if (fastingText.includes('Wine')) return 'wine';
  if (fastingText.includes('Fast')) return 'strict';
  return 'none';
};

export const fastingStyle: Record<FastingKind, { icon: string; color: string; label: string }> = {
  none: { icon: 'sunny-outline', color: palette.gray400, label: 'No fast' },
  fish: { icon: 'fish', color: palette.blue, label: 'Fish allowed' },
  wine: { icon: 'wine', color: palette.purple, label: 'Wine & oil' },
  strict: { icon: 'leaf', color: palette.green, label: 'Strict fast' },
};
