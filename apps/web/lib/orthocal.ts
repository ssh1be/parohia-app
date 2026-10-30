"use client";

import {
  fetchOrthodoxCalendarData,
  type CalendarSystem,
  type CalendarTradition,
  type OrthodoxCalendarData,
} from "@parohia/shared";
import { useEffect, useState } from "react";
import { localDateKey } from "./format";

const cache = new Map<string, Promise<OrthodoxCalendarData>>();

/** Cached per tradition + calendar system + day; failed lookups are evicted so they retry. */
export function getOrthodoxDay(
  date: Date,
  tradition: CalendarTradition,
  system: CalendarSystem = "gregorian"
): Promise<OrthodoxCalendarData> {
  const key = `${tradition}:${system}:${localDateKey(date)}`;
  let pending = cache.get(key);
  if (!pending) {
    pending = fetchOrthodoxCalendarData(date, tradition, system).then((data) => {
      if (!data.title && !data.fasting && data.saintsFull.length === 0) cache.delete(key);
      return data;
    });
    cache.set(key, pending);
  }
  return pending;
}

/** Fasting text keyed by local date for every day passed in. */
export function useFastingForDays(
  days: Date[],
  tradition: CalendarTradition,
  system: CalendarSystem = "gregorian"
) {
  const [fasting, setFasting] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      days.map((day) =>
        getOrthodoxDay(day, tradition, system).then((data) => [localDateKey(day), data.fasting] as const)
      )
    ).then((rows) => {
      if (!cancelled) setFasting(Object.fromEntries(rows));
    });
    return () => {
      cancelled = true;
    };
  }, [days, tradition, system]);

  return fasting;
}
