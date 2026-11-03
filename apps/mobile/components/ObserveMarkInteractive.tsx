import { useObserve } from 'expo-observe';
import { useEffect } from 'react';

/** Records time-to-interactive for the current Expo Router screen (first call wins per session). */
export function ObserveMarkInteractive() {
  const { markInteractive } = useObserve();
  useEffect(() => {
    markInteractive();
  }, [markInteractive]);
  return null;
}
