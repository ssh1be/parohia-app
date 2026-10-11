import { FadeInDown, FadeOutDown, LinearTransition, WithSpringConfig, ZoomIn } from 'react-native-reanimated';

export {
  eventKindStyle,
  fastingStyle,
  getFastingKind,
  palette,
  type EventKind,
  type FastingKind,
} from '@parohia/shared';

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
