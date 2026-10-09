import { useScrollToTop } from 'expo-router';
import { RefObject } from 'react';

/**
 * Scroll the primary tab ScrollView to top when its tab is pressed again.
 * Works with React Native and Reanimated ScrollViews that expose scrollTo.
 */
export function useTabScrollToTop(ref: RefObject<{ scrollTo: (opts: { y: number; animated?: boolean }) => void } | null>) {
  useScrollToTop(ref as RefObject<any>);
}
