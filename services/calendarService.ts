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

export interface OrthodoxCalendarData {
  date: string;
  title: string;
  fasting: string;
  saintsFeasts: string;
  readings: string[];
  readingsFull: { display: string; passage: string }[];
  saintsFull: { title: string; story: string }[];
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

import { CALENDAR_CONFIG } from '../config/calendarConfig';
import { getParishCalendarId } from './parishService';

// Use configuration from config file
const GOOGLE_CALENDAR_API_KEY = CALENDAR_CONFIG.API_KEY;

export const fetchOrthodoxCalendarData = async (date: Date): Promise<OrthodoxCalendarData> => {
  try {
    // Format date for Orthocal API
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // JS months are 0-based
    const day = date.getDate();
    const url = `https://orthocal.info/api/gregorian/${year}/${month}/${day}/`;
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
    
    // Get saints/feasts titles
    const feastTitles = Array.isArray(data.feasts) ? data.feasts : [];
    const saintTitles = Array.isArray(data.saints) ? data.saints : [];
    const combinedSaintsFeasts = [...feastTitles, ...saintTitles].filter(Boolean);
    const saintsFeasts = combinedSaintsFeasts.join(' • ');

    // Get fasting description (fast_level_desc + fast_exception_desc)
    let fasting = '';
    if (data.fast_level_desc) {
      fasting = data.fast_level_desc;
      if (data.fast_exception_desc) {
        fasting += ' — ' + data.fast_exception_desc;
      }
    }

    let saintsFull: { title: string; story: string }[] = [];
    if (data.stories && Array.isArray(data.stories)) {
      saintsFull = data.stories.map((story: any) => ({
        title: story.title,
        story: story.story.replace(/<[^>]*>/g, '').trim()
      }));
    }

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
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?key=${GOOGLE_CALENDAR_API_KEY}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`;
    
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
    
    const url = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?key=${GOOGLE_CALENDAR_API_KEY}&timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`;
    
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