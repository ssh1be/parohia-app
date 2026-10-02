import type { EventKind, FastingKind } from "./tokens";

export const PARISH = {
  name: "St. John's Greek Orthodox",
  fullName: "St. John the Baptist Greek Orthodox Church",
  jurisdiction: "Greek Orthodox Archdiocese of America",
  priest: "Fr. Gabriel Agoston",
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

export const SEPTEMBER_10: LiturgicalDay = {
  year: 2025,
  month: 8,
  day: 10,
  weekday: "Wednesday",
  title: "Wednesday of the 13th Week after Pentecost",
  saints: ["Martyrs Menodora, Metrodora, and Nymphodora at Nicomedia (305-311)", "Apostles Apelles, Lucius, and Clement of the Seventy"],
  fasting: "Fast Day",
  fastingKind: "strict",
  parish: [
    { id: "bible", kind: "parish", title: "Bible Study: Gospel of St. Matthew", time: "10:00 AM - 11:00 AM", meta: "Fellowship Hall", reminder: true },
    { id: "coffee", kind: "parish", title: "Wednesday Coffee Hour", time: "11:00 AM - 12:00 PM", reminder: false },
    { id: "paraklesis", kind: "parish", title: "Paraklesis to St. John the Baptist", time: "6:00 PM - 7:00 PM", meta: "Church", reminder: true },
    { id: "catechism", kind: "parish", title: "Growing in the Faith: \u201cAsk Father\u201d Q&A", time: "7:00 PM - 8:00 PM", reminder: false },
    { id: "philoptochos", kind: "parish", title: "Philoptochos Board Meeting", time: "7:00 PM - 8:30 PM", reminder: false },
  ],
  personal: [],
  readings: [],
};

export const AUGUST_30: LiturgicalDay = {
  year: 2025,
  month: 7,
  day: 30,
  weekday: "Saturday",
  title: "Saturday of the 11th Week after Pentecost",
  saints: ["Sts. Alexander (340), John (595), and Paul the New (784), Patriarchs of Constantinople"],
  fasting: "No Fast",
  fastingKind: "none",
  parish: [
    { id: "vespers", kind: "parish", title: "Great Vespers", time: "5:00 PM - 6:00 PM", meta: "Church", reminder: true },
    { id: "choir", kind: "parish", title: "Choir Rehearsal", time: "6:15 PM - 7:00 PM", meta: "Choir Loft", reminder: false },
  ],
  personal: [
    { id: "confession", kind: "confession", title: "Confession with Fr. Gabriel Agoston", time: "9:00 AM - 9:15 AM" },
    { id: "festival", kind: "volunteer", title: "Help set up for the Greek Festival", time: "Starts at 10:00 AM", meta: "Church Property" },
  ],
  readings: [
    { kind: "Epistle", display: "1 Corinthians 1:26-29" },
    { kind: "Gospel", display: "Matthew 20:29-34" },
  ],
};

/** Approximate fasting rule for the August and September grids the copies display. */
export function fastingFor(month: number, day: number, year: number): FastingKind {
  const date = new Date(year, month, day);
  const weekday = date.getDay();
  if (month === 7 && day === 29) return "strict";
  if (month === 8 && day === 14) return "strict";
  if (month === 7 && day <= 14) return day === 6 ? "fish" : weekday === 0 || weekday === 6 ? "wine" : "strict";
  if (weekday === 3 || weekday === 5) return "strict";
  return "none";
}
