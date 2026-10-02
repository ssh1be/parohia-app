import type { IconName } from "../Icon";

export const CHAPTERS: { id: string; label: string; summary: string; icon: IconName }[] = [
  { id: "calendar-schedule", label: "Calendar", summary: "Feasts, fasts, and services", icon: "calendar-outline" },
  { id: "notifications", label: "Reminders", summary: "Notifications on your terms", icon: "notifications-outline" },
  { id: "announcements-events", label: "Bulletin board", summary: "Parish news and RSVPs", icon: "newspaper-outline" },
  { id: "volunteering-confessions", label: "Volunteering & confession", summary: "Help out or book a time", icon: "hand-left-outline" },
];

/** Viewport width where tours pin while scrolling and the floating chapter nav appears. */
export const PINNED_QUERY = "(min-width: 1280px)";
