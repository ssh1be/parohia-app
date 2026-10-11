import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { CalendarTradition } from '@parohia/shared';

export type { CalendarTradition };

interface CalendarTraditionContextType {
  tradition: CalendarTradition;
  setTradition: (tradition: CalendarTradition) => void;
  ready: boolean;
}

const CalendarTraditionContext = createContext<CalendarTraditionContextType>({
  tradition: 'greek',
  setTradition: () => {},
  ready: false,
});

const TRADITION_KEY = '@calendar_tradition';

export function CalendarTraditionProvider({ children }: { children: React.ReactNode }) {
  const [tradition, setTraditionState] = useState<CalendarTradition>('greek');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(TRADITION_KEY)
      .then((saved) => {
        if (saved === 'greek' || saved === 'slavic') {
          setTraditionState(saved);
        }
      })
      .finally(() => setReady(true));
  }, []);

  const setTradition = (next: CalendarTradition) => {
    setTraditionState(next);
    AsyncStorage.setItem(TRADITION_KEY, next);
  };

  return (
    <CalendarTraditionContext.Provider value={{ tradition, setTradition, ready }}>
      {children}
    </CalendarTraditionContext.Provider>
  );
}

export const useCalendarTradition = () => useContext(CalendarTraditionContext);
