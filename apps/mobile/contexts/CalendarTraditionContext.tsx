import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { CalendarSystem, CalendarTradition } from '@parohia/shared';

export type { CalendarSystem, CalendarTradition };

interface CalendarTraditionContextType {
  tradition: CalendarTradition;
  setTradition: (tradition: CalendarTradition) => void;
  calendarSystem: CalendarSystem;
  setCalendarSystem: (system: CalendarSystem) => void;
  ready: boolean;
}

const CalendarTraditionContext = createContext<CalendarTraditionContextType>({
  tradition: 'greek',
  setTradition: () => {},
  calendarSystem: 'gregorian',
  setCalendarSystem: () => {},
  ready: false,
});

const TRADITION_KEY = '@calendar_tradition';
const SYSTEM_KEY = '@calendar_system';

export function CalendarTraditionProvider({ children }: { children: React.ReactNode }) {
  const [tradition, setTraditionState] = useState<CalendarTradition>('greek');
  const [calendarSystem, setCalendarSystemState] = useState<CalendarSystem>('gregorian');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([AsyncStorage.getItem(TRADITION_KEY), AsyncStorage.getItem(SYSTEM_KEY)])
      .then(([savedTradition, savedSystem]) => {
        if (savedTradition === 'greek' || savedTradition === 'slavic') {
          setTraditionState(savedTradition);
        }
        if (savedSystem === 'gregorian' || savedSystem === 'julian') {
          setCalendarSystemState(savedSystem);
        }
      })
      .finally(() => setReady(true));
  }, []);

  const setTradition = (next: CalendarTradition) => {
    setTraditionState(next);
    AsyncStorage.setItem(TRADITION_KEY, next);
  };

  const setCalendarSystem = (next: CalendarSystem) => {
    setCalendarSystemState(next);
    AsyncStorage.setItem(SYSTEM_KEY, next);
  };

  return (
    <CalendarTraditionContext.Provider
      value={{ tradition, setTradition, calendarSystem, setCalendarSystem, ready }}
    >
      {children}
    </CalendarTraditionContext.Provider>
  );
}

export const useCalendarTradition = () => useContext(CalendarTraditionContext);
