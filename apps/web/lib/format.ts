/** `YYYY-MM-DD` in local time (database date columns are local calendar days). */
export const localDateKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export const parseLocalDate = (value: string) => {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
};

export const startOfDay = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

export const addDays = (date: Date, days: number) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
};

export const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

/** `HH:MM[:SS]` → `6:30 PM`. */
export const formatClockTime = (value?: string | null) => {
  if (!value || !value.includes(":")) return value ?? "";
  const [h, m] = value.split(":").map((part) => parseInt(part, 10));
  const period = h >= 12 ? "PM" : "AM";
  const hour = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${hour}:${String(m).padStart(2, "0")} ${period}`;
};

/** Confession slots are 15 minutes long. */
export const formatConfessionRange = (timeSlot?: string | null) => {
  if (!timeSlot) return "";
  const [h, m] = timeSlot.split(":").map((part) => parseInt(part, 10));
  const end = new Date(2000, 0, 1, h, m + 15);
  return `${formatClockTime(timeSlot)} – ${formatClockTime(`${end.getHours()}:${end.getMinutes()}`)}`;
};

const timeFormatter = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" });

/** Google Calendar start/end → `9:00 AM – 10:30 AM`, or `All day` for date-only events. */
export const formatEventRange = (start: string, end?: string) => {
  if (!start.includes("T")) return "All day";
  const startText = timeFormatter.format(new Date(start));
  if (!end || !end.includes("T")) return startText;
  return `${startText} – ${timeFormatter.format(new Date(end))}`;
};

export const eventStartDate = (start: string) => (start.includes("T") ? new Date(start) : parseLocalDate(start));

export const formatRelativeTime = (value: string) => {
  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 28) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
};

export const formatLongDate = (date: Date) =>
  date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

export const formatPhone = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  if (digits.length === 11 && digits.startsWith("1"))
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  return value;
};

export const firstName = (fullName?: string | null) => fullName?.trim().split(/\s+/)[0] ?? "";
