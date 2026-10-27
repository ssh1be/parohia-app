import type { EventKind, FastingKind } from "./tokens";

export const PARISH = {
  name: "St. John's Greek Orthodox",
  fullName: "St. John the Baptist Greek Orthodox Church",
  jurisdiction: "Greek Orthodox Archdiocese of America",
  priest: "Fr. Nicholas Andreas",
  priestShort: "Fr. Nicholas",
  priestInitials: "NA",
  address: "2350 Dunn Ave, Portland, OR 97210",
  phone: "(503) 555-0148",
  website: "stjohnsportland.org",
};

export interface ScheduleItem {
  id: string;
  kind: EventKind;
  title: string;
  time?: string;
  meta?: string;
  reminder?: boolean;
}

export interface LiturgicalDay {
  /** Local calendar date (month is 0-based). */
  year: number;
  month: number;
  day: number;
  weekday: string;
  title: string;
  saints: string[];
  fasting: string;
  fastingKind: FastingKind;
  parish: ScheduleItem[];
  personal: ScheduleItem[];
  readings: { kind: "Epistle" | "Gospel"; display: string }[];
}

/**
 * Liturgical fields (title, saints, fasting, readings) come from Orthocal's
 * public MCP `get_day` tool (https://orthocal.info/mcp), Greek tradition,
 * Gregorian calendar, KJV displays. Parish and personal schedule stay as
 * demo content for St. John's.
 */
export const SEPTEMBER_10: LiturgicalDay = {
  year: 2025,
  month: 8,
  day: 10,
  weekday: "Wednesday",
  title: "Wednesday of the 14th week after Pentecost",
  saints: ["Martyrs Menodora, Metrodora, Nymphodora", "Poulcheria the Empress"],
  fasting: "Fast - Abstain from meat, fish, dairy, eggs, wine, and oil",
  fastingKind: "strict",
  parish: [
    { id: "bible", kind: "parish", title: "Bible Study: Gospel of St. Matthew", time: "10:00 AM - 11:00 AM", meta: "Fellowship Hall", reminder: true },
    { id: "coffee", kind: "parish", title: "Wednesday Coffee Hour", time: "11:00 AM - 12:00 PM", reminder: false },
    { id: "paraklesis", kind: "parish", title: "Paraklesis to St. John the Baptist", time: "6:00 PM - 7:00 PM", meta: "Church", reminder: true },
    { id: "catechism", kind: "parish", title: "Growing in the Faith: \u201cAsk Father\u201d Q&A", time: "7:00 PM - 8:00 PM", reminder: false },
  ],
  personal: [],
  readings: [
    { kind: "Epistle", display: "2 Corinthians 13:3-14" },
    { kind: "Gospel", display: "Mark 4:35-41" },
  ],
};

export const AUGUST_30: LiturgicalDay = {
  year: 2025,
  month: 7,
  day: 30,
  weekday: "Saturday",
  title: "Saturday of the 12th week after Pentecost",
  saints: [
    "Ss Alexander, John, Paul, Pats. Constantinople",
    "Trans. Rel. St Alexander Nevsky",
    "Synaxis of Serbian Hierarchs",
  ],
  fasting: "No Fast",
  fastingKind: "none",
  parish: [
    { id: "vespers", kind: "parish", title: "Great Vespers", time: "5:00 PM - 6:00 PM", meta: "Church", reminder: true },
    { id: "choir", kind: "parish", title: "Choir Rehearsal", time: "6:15 PM - 7:00 PM", meta: "Choir Loft", reminder: false },
  ],
  personal: [
    { id: "confession", kind: "confession", title: `Confession with ${PARISH.priest}`, time: "9:00 AM - 9:15 AM" },
    { id: "festival", kind: "volunteer", title: "Help set up for the Greek Festival", time: "Starts at 10:00 AM", meta: "Church Property" },
  ],
  readings: [
    { kind: "Epistle", display: "1 Corinthians 1:26-29" },
    { kind: "Gospel", display: "Matthew 20:29-34" },
  ],
};

/** Exaltation of the Cross; parish schedule reused from the Wednesday demo day. */
export const SEPTEMBER_14: LiturgicalDay = {
  ...SEPTEMBER_10,
  day: 14,
  weekday: "Sunday",
  title: "Exaltation (Elevation) of the Precious Cross",
  saints: [
    "Commemoration of the 6th Ecumenical Council",
    "St Placilla the Empress (385 or 386)",
    "Holy New Martyr Macarius of Thessalonica (1527)",
  ],
  fasting: "Fast Day (Wine and Oil Allowed)",
  fastingKind: "wine",
  readings: [
    { kind: "Epistle", display: "1 Corinthians 1:18-24" },
    { kind: "Gospel", display: "John 19:6-11, 13-20, 25-28, 30-35" },
  ],
};

/** Approximate fasting rule for the August and September grids the copies display. */
export function fastingFor(month: number, day: number, year: number): FastingKind {
  const date = new Date(year, month, day);
  const weekday = date.getDay();
  if (month === 7 && day === 29) return "strict";
  if (month === 8 && day === 14) return "wine";
  if (month === 7 && day <= 14) return day === 6 ? "fish" : weekday === 0 || weekday === 6 ? "wine" : "strict";
  if (weekday === 3 || weekday === 5) return "strict";
  return "none";
}
