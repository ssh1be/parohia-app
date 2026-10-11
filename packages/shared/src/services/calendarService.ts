interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
  };
  location?: string;
}

/** Orthocal lists commemorations under separate `feasts` and `saints` arrays. */
export type CommemorationKind = 'feast' | 'saint';

export interface Commemoration {
  title: string;
  story: string;
  kind: CommemorationKind;
}

export interface OrthodoxCalendarData {
  date: string;
  title: string;
  fasting: string;
  saintsFeasts: string;
  readings: string[];
  readingsFull: { display: string; passage: string }[];
  saintsFull: Commemoration[];
  readingsLink?: string;
  events: CalendarEvent[];
}

export interface ParishEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
}

import { getGoogleCalendarApiKey } from '../client';
import { getParishCalendarId } from './parishService';

export type CalendarTradition = 'greek' | 'slavic';

/** Orthocal path segment for a tradition on the Gregorian (new) calendar. */
export function orthocalTraditionPath(tradition: CalendarTradition): string {
  return tradition === 'greek' ? 'greek/gregorian' : 'slavic/gregorian';
}

/** Turn Orthocal `fast_abstentions` into a short note when no exception text is provided. */
function formatFastAbstentions(raw: unknown): string {
  const items = (Array.isArray(raw) ? raw : typeof raw === 'string' && raw ? [raw] : [])
    .map((item) => String(item).trim().toLowerCase())
    .filter(Boolean);
  if (items.length === 0) return '';
  if (items.length === 1) return `Abstain from ${items[0]}`;
  if (items.length === 2) return `Abstain from ${items[0]} and ${items[1]}`;
  return `Abstain from ${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

const TITLE_STOP_WORDS = new Set([
  'a', 'an', 'and', 'according', 'ever', 'flesh', 'god', 'holy', 'jesus', 'lady',
  'lord', 'most', 'of', 'our', 'savior', 'saviour', 'the', 'to', 'virgin',
]);

function titleTokens(title: string): Set<string> {
  return new Set(
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 1 && !TITLE_STOP_WORDS.has(word)),
  );
}

/** Score how well a story title matches a feast/saint title (Orthocal often rephrases feast names). */
function titleMatchScore(a: string, b: string): number {
  if (a === b) return 1;
  if (a.toLowerCase() === b.toLowerCase()) return 0.99;

  const tokensA = titleTokens(a);
  const tokensB = titleTokens(b);
  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let overlap = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) overlap += 1;
  }
  return overlap / Math.min(tokensA.size, tokensB.size);
}

function findMatchingStory(
  title: string,
  stories: { title: string; story: string }[],
  used: Set<string>,
): string {
  let bestScore = 0;
  let bestStory = '';
  let bestKey = '';

  for (const entry of stories) {
    if (used.has(entry.title)) continue;
    const score = titleMatchScore(title, entry.title);
    if (score > bestScore) {
      bestScore = score;
      bestStory = entry.story;
      bestKey = entry.title;
    }
  }

  // Exact/near-exact, or enough shared significant words (e.g. "Dormition … Theotokos")
  if (bestScore >= 0.6 && bestKey) {
    used.add(bestKey);
    return bestStory;
  }
  return '';
}

function buildCommemorations(
  feastTitles: string[],
  saintTitles: string[],
  rawStories: { title?: string; story?: string }[],
): Commemoration[] {
  const stories = rawStories
    .filter((entry): entry is { title: string; story: string } => !!entry?.title)
    .map((entry) => ({
      title: entry.title,
      story: typeof entry.story === 'string' ? entry.story.replace(/<[^>]*>/g, '').trim() : '',
    }));
  const usedStories = new Set<string>();

  const commemorations: Commemoration[] = [
    ...feastTitles.map((title) => ({
      title,
      kind: 'feast' as const,
      story: findMatchingStory(title, stories, usedStories),
    })),
    ...saintTitles.map((title) => ({
      title,
      kind: 'saint' as const,
      story: findMatchingStory(title, stories, usedStories),
    })),
  ];

  // Leftover stories that didn't match a listed feast/saint
  for (const entry of stories) {
    if (usedStories.has(entry.title)) continue;
    commemorations.push({
      title: entry.title,
      kind: 'saint',
      story: entry.story,
    });
  }

  return commemorations;
}

export const fetchOrthodoxCalendarData = async (
  date: Date,
  tradition: CalendarTradition = 'greek',
): Promise<OrthodoxCalendarData> => {
  try {
    // Format date for Orthocal API
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // JS months are 0-based
    const day = date.getDate();
    const url = `https://orthocal.info/api/${orthocalTraditionPath(tradition)}/${year}/${month}/${day}/`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();

    // Get all readings' display names
    let readings: string[] = [];
    let readingsFull: { display: string; passage: string }[] = [];
    if (data.readings && Array.isArray(data.readings)) {
      readings = data.readings.map((reading: any) => reading.display).filter(Boolean);
      readingsFull = data.readings.map((reading: any) => ({
        display: reading.display,
        passage: Array.isArray(reading.passage) ? reading.passage.map((verse: any) => verse.content).join(' ') : ''
      }));
    }
    
    // Orthocal separates liturgical feasts from saint commemorations
    const feastTitles = (Array.isArray(data.feasts) ? data.feasts : []).filter(Boolean);
    const saintTitles = (Array.isArray(data.saints) ? data.saints : []).filter(Boolean);
    const saintsFeasts = [...feastTitles, ...saintTitles].join(' • ');

    // Fasting: prefer Orthocal's exception text (what's allowed); otherwise list abstentions
    let fasting = '';
    if (data.fast_level_desc) {
      fasting = data.fast_level_desc;
      if (data.fast_exception_desc) {
        fasting += ' — ' + data.fast_exception_desc;
      } else {
        const abstentionNote = formatFastAbstentions(data.fast_abstentions);
        if (abstentionNote) {
          fasting += ' — ' + abstentionNote;
        }
      }
    }

    const saintsFull = buildCommemorations(
      feastTitles,
      saintTitles,
      Array.isArray(data.stories) ? data.stories : [],
    );

    return {
      date: date.toISOString().split('T')[0],
      title: data.titles || '',
      fasting,
      saintsFeasts,
      readings,
      readingsFull,
      saintsFull,
      readingsLink: '',
      events: []
    };
  } catch (error) {
    console.error('Error fetching Orthodox calendar data:', error);
    // Return fallback data
    return {
      date: date.toISOString().split('T')[0],
      title: '',
      fasting: '',
      saintsFeasts: '',
      readings: [],
      readingsFull: [],
      saintsFull: [],
      readingsLink: '',
      events: []
    };
  }
};

export const fetchParishEventsForToday = async (date: Date, userId?: string): Promise<ParishEvent[]> => {
  try {
    // Get parish calendar ID for the user
    let calendarId: string | null = null;
    
    if (userId) {
      try {
        calendarId = await getParishCalendarId(userId);
      } catch (error) {
        console.error('Error getting parish calendar ID:', error);
        return [];
      }
    }

    // If no calendar ID is set up, return empty events
    if (!calendarId) {
      console.log('No parish calendar ID found, returning empty events');
      return [];
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    const timeMin = startOfDay.toISOString();
    const timeMax = endOfDay.toISOString();
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?key=${getGoogleCalendarApiKey()}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`;
    
    console.log('Fetching parish events for today from:', url);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
    
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP error! status: ${response.status}, response: ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const events = data.items || [];
      console.log(`Successfully fetched ${events.length} parish events for today`);
      
      return events.map((event: any) => ({
        id: event.id,
        title: event.summary,
        description: event.description,
        startTime: event.start?.dateTime || event.start?.date || '',
        endTime: event.end?.dateTime || event.end?.date || '',
        location: event.location,
      }));
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    console.error('Error fetching parish events:', error);
    
    // Check if it's a network error
    if (error instanceof TypeError && error.message.includes('Network request failed')) {
      console.error('Network connectivity issue detected');
    }
    
    return [];
  }
};

export const fetchParishEventsForMultipleDays = async (startDate: Date, numberOfDays: number, userId?: string): Promise<ParishEvent[]> => {
  try {
    // Get parish calendar ID for the user
    let calendarId: string | null = null;
    
    if (userId) {
      try {
        calendarId = await getParishCalendarId(userId);
      } catch (error) {
        console.error('Error getting parish calendar ID:', error);
        return [];
      }
    }

    // If no calendar ID is set up, return empty events
    if (!calendarId) {
      console.log('No parish calendar ID found, returning empty events');
      return [];
    }

    const startOfFirstDay = new Date(startDate);
    startOfFirstDay.setHours(0, 0, 0, 0);
    
    const endOfLastDay = new Date(startDate);
    endOfLastDay.setDate(endOfLastDay.getDate() + numberOfDays - 1);
    endOfLastDay.setHours(23, 59, 59, 999);
    
    const timeMin = startOfFirstDay.toISOString();
    const timeMax = endOfLastDay.toISOString();
    
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?key=${getGoogleCalendarApiKey()}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`;
    
    console.log('Fetching parish events from:', url);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
    
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP error! status: ${response.status}, response: ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      const events = data.items || [];
      console.log(`Successfully fetched ${events.length} parish events`);
      
      return events.map((event: any) => ({
        id: event.id,
        title: event.summary,
        description: event.description,
        startTime: event.start?.dateTime || event.start?.date || '',
        endTime: event.end?.dateTime || event.end?.date || '',
        location: event.location,
      }));
    } catch (fetchError) {
      clearTimeout(timeoutId);
      throw fetchError;
    }
  } catch (error) {
    console.error('Error fetching parish events for multiple days:', error);
    
    // Check if it's a network error
    if (error instanceof TypeError && error.message.includes('Network request failed')) {
      console.error('Network connectivity issue detected');
    }
    
    return [];
  }
}; 