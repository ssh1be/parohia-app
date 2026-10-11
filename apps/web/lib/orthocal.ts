"use client";

import { fetchOrthodoxCalendarData, type CalendarTradition, type OrthodoxCalendarData } from "@parohia/shared";
import { useEffect, useState } from "react";
import { localDateKey } from "./format";

const cache = new Map<string, Promise<OrthodoxCalendarData>>();

/** Cached per tradition + day; failed lookups (empty fallback data) are evicted so they retry. */
export function getOrthodoxDay(date: Date, tradition: CalendarTradition): Promise<OrthodoxCalendarData> {
  const key = `${tradition}:${localDateKey(date)}`;
  let pending = cache.get(key);
  if (!pending) {
    pending = fetchOrthodoxCalendarData(date, tradition).then((data) => {
      if (!data.title && !data.fasting && data.saintsFull.length === 0) cache.delete(key);
      return data;
    });
    cache.set(key, pending);
  }
  return pending;
}

/** Fasting text keyed by local date for every day passed in. */
export function useFastingForDays(days: Date[], tradition: CalendarTradition) {
  const [fasting, setFasting] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    Promise.all(days.map((day) => getOrthodoxDay(day, tradition).then((data) => [localDateKey(day), data.fasting] as const))).then(
      (rows) => {
        if (!cancelled) setFasting(Object.fromEntries(rows));
      }
    );
    return () => {
      cancelled = true;
    };
  }, [days, tradition]);

  return fasting;
}
