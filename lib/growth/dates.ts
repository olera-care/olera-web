import { GROWTH_TIMEZONE } from "./types";

const DAY_MS = 86_400_000;

export function addDays(isoDate: string, days: number): string {
  const date = new Date(`${isoDate}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function zonedToday(timeZone = GROWTH_TIMEZONE): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

export function mostRecentCompleteWeek(today = zonedToday()): { weekStart: string; weekEnd: string } {
  const completeThrough = addDays(today, -3);
  const weekday = new Date(`${completeThrough}T12:00:00Z`).getUTCDay();
  const daysSinceSaturday = (weekday - 6 + 7) % 7;
  const weekEnd = addDays(completeThrough, -daysSinceSaturday);
  return { weekStart: addDays(weekEnd, -6), weekEnd };
}

export function validateCompleteWeek(weekStart: string, weekEnd: string): void {
  const start = new Date(`${weekStart}T12:00:00Z`);
  const end = new Date(`${weekEnd}T12:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error("Growth reporting dates must use YYYY-MM-DD.");
  }
  if (start.getUTCDay() !== 0 || end.getUTCDay() !== 6) {
    throw new Error("Growth reporting windows must run Sunday through Saturday.");
  }
  if ((end.getTime() - start.getTime()) / DAY_MS !== 6) {
    throw new Error("Growth reporting windows must be exactly seven days.");
  }
  if (weekEnd >= zonedToday()) {
    throw new Error("The growth reporting week must be complete.");
  }
}

function partsAt(date: Date, timeZone: string): Record<string, number> {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  return Object.fromEntries(
    parts.filter((part) => part.type !== "literal").map((part) => [part.type, Number(part.value)]),
  );
}

/** Convert local midnight in an IANA timezone to an exact UTC ISO instant. */
export function zonedMidnightUtc(isoDate: string, timeZone = GROWTH_TIMEZONE): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  const guess = Date.UTC(year, month - 1, day, 0, 0, 0);
  const local = partsAt(new Date(guess), timeZone);
  const renderedAsUtc = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute, local.second);
  const offset = renderedAsUtc - guess;
  return new Date(guess - offset).toISOString();
}

export function reportingWindowUtc(weekStart: string, weekEnd: string) {
  return {
    from: zonedMidnightUtc(weekStart),
    to: zonedMidnightUtc(addDays(weekEnd, 1)),
  };
}
