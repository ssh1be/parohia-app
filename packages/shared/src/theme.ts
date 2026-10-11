/** Design tokens shared by mobile and web. Plain data only: no Reanimated, NativeWind, or CSS-in-JS. */

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

export const brand = {
  red: '#FA433F',
  dark: '#8D0300',
  ink: '#050505',
  gradient: 'linear-gradient(135deg, #FA433F 0%, #8D0300 100%)',
};

export type EventKind = 'confession' | 'announcement' | 'event' | 'volunteer' | 'parish';

/** Icon values are Ionicons names, which both apps render. */
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
