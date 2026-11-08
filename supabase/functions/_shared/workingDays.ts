/** Date-only business calendar. UTC is used for arithmetic, Warsaw for the current day. */
export const TIME_ZONE = "Europe/Warsaw";
export const CONTACT_PROMISE = "Odezwiemy się w dni robocze, 9:00 do 17:00";

export function warsawToday(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(now);
  const part = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

export function calendarDate(value: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return warsawToday(new Date(value));
}

export function addCalendarDays(value: string, count: number): string {
  const date = new Date(`${calendarDate(value)}T12:00:00Z`);
  if (!Number.isFinite(date.getTime())) throw new Error("Nieprawidłowa data");
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}

export function easterSunday(year: number): string {
  const a = year % 19, b = Math.floor(year / 100), c = year % 100;
  const d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = (h + l - 7 * m + 114) % 31 + 1;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function isWorkingDay(value: string): boolean {
  const day = calendarDate(value);
  const date = new Date(`${day}T12:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== day) return false;
  if ([0, 6].includes(date.getUTCDay())) return false;
  const holidays = ["01-01", "01-06", "05-01", "05-03", "08-15", "11-01", "11-11", "12-24", "12-25", "12-26"];
  if (holidays.includes(day.slice(5))) return false;
  const easter = easterSunday(date.getUTCFullYear());
  return day !== addCalendarDays(easter, 1) && day !== addCalendarDays(easter, 60);
}

/** Strictly after the supplied date. */
export function nextWorkingDay(value = warsawToday()): string {
  let day = addCalendarDays(value, 1);
  while (!isWorkingDay(day)) day = addCalendarDays(day, 1);
  return day;
}

/** Same date when working, otherwise the next working date. */
export function onOrNextWorkingDay(value = warsawToday()): string {
  const day = calendarDate(value);
  return isWorkingDay(day) ? day : nextWorkingDay(day);
}

export function addWorkingDays(value: string, count: number): string {
  if (!Number.isInteger(count) || count < 0) throw new Error("Nieprawidłowa liczba dni");
  let day = calendarDate(value);
  for (let i = 0; i < count; i++) day = nextWorkingDay(day);
  return day;
}

export function isContactTime(now = new Date()): boolean {
  const hour = Number(new Intl.DateTimeFormat("en-GB", {
    timeZone: TIME_ZONE, hour: "2-digit", hourCycle: "h23",
  }).format(now));
  return isWorkingDay(warsawToday(now)) && hour >= 9 && hour < 17;
}

export function dateShortcut(kind: "tomorrow" | "two" | "five" | "week", today = warsawToday()): string {
  if (kind === "week") return onOrNextWorkingDay(addCalendarDays(today, 7));
  return addWorkingDays(today, kind === "tomorrow" ? 1 : kind === "two" ? 2 : 5);
}