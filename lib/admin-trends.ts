export type TrendBucket = "hour" | "day" | "week" | "month";

export type TrendPoint = {
  date: string;
  count: number;
};

export const ADMIN_TREND_TIME_ZONE = "America/Chicago";

type CalendarDateTime = {
  year: number;
  month: number;
  day: number;
  hour: number;
};

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

export function resolveTrendBucket(from: Date, to: Date): TrendBucket {
  const days = (to.getTime() - from.getTime()) / DAY_MS;
  if (days <= 2) return "hour";
  if (days <= 45) return "day";
  if (days <= 180) return "week";
  return "month";
}

function calendarParts(date: Date, timeZone: string): CalendarDateTime {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((value) => value.type === type)?.value);
  return {
    year: part("year"),
    month: part("month"),
    day: part("day"),
    hour: part("hour"),
  };
}

function calendarToInstant(value: CalendarDateTime, timeZone: string): Date {
  const wallClockUtc = Date.UTC(value.year, value.month - 1, value.day, value.hour);
  let candidate = wallClockUtc;
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  for (let iteration = 0; iteration < 3; iteration += 1) {
    const parts = formatter.formatToParts(new Date(candidate));
    const part = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((item) => item.type === type)?.value);
    const representedAsUtc = Date.UTC(
      part("year"),
      part("month") - 1,
      part("day"),
      part("hour"),
      part("minute"),
      part("second"),
    );
    const next = wallClockUtc - (representedAsUtc - candidate);
    if (next === candidate) break;
    candidate = next;
  }

  return new Date(candidate);
}

function shiftCalendar(value: CalendarDateTime, days: number): CalendarDateTime {
  const shifted = new Date(Date.UTC(value.year, value.month - 1, value.day + days, value.hour));
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
  };
}

function floorCalendar(value: CalendarDateTime, bucket: Exclude<TrendBucket, "hour">): CalendarDateTime {
  const floored = { ...value, hour: 0 };
  if (bucket === "day") return floored;
  if (bucket === "month") return { ...floored, day: 1 };

  const dayOfWeek = new Date(Date.UTC(floored.year, floored.month - 1, floored.day)).getUTCDay();
  return shiftCalendar(floored, -dayOfWeek);
}

function nextCalendar(value: CalendarDateTime, bucket: Exclude<TrendBucket, "hour">): CalendarDateTime {
  if (bucket === "day") return shiftCalendar(value, 1);
  if (bucket === "week") return shiftCalendar(value, 7);
  const next = new Date(Date.UTC(value.year, value.month, 1));
  return {
    year: next.getUTCFullYear(),
    month: next.getUTCMonth() + 1,
    day: 1,
    hour: 0,
  };
}

export function createZonedBucketStarts(
  from: Date,
  to: Date,
  bucket: TrendBucket,
  timeZone: string,
): Date[] {
  if (bucket === "hour") {
    const start = new Date(from);
    start.setUTCMinutes(0, 0, 0);
    const buckets: Date[] = [];
    for (let cursor = start.getTime(); cursor < to.getTime(); cursor += HOUR_MS) {
      buckets.push(new Date(cursor));
    }
    return buckets;
  }

  const buckets: Date[] = [];
  let cursor = floorCalendar(calendarParts(from, timeZone), bucket);
  let safety = 0;
  while (safety < 10000) {
    const instant = calendarToInstant(cursor, timeZone);
    if (instant >= to) break;
    buckets.push(instant);
    cursor = nextCalendar(cursor, bucket);
    safety += 1;
  }
  return buckets;
}

function bucketIndex(starts: Date[], timestamp: number): number {
  let low = 0;
  let high = starts.length - 1;
  let match = -1;
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    if (starts[middle].getTime() <= timestamp) {
      match = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }
  return match;
}

export function buildZonedCountSeries(
  timestamps: Date[],
  from: Date,
  to: Date,
  bucket: TrendBucket,
  timeZone: string,
): TrendPoint[] {
  const starts = createZonedBucketStarts(from, to, bucket, timeZone);
  const counts = starts.map(() => 0);
  for (const timestamp of timestamps) {
    const value = timestamp.getTime();
    if (value < from.getTime() || value >= to.getTime()) continue;
    const index = bucketIndex(starts, value);
    if (index >= 0) counts[index] += 1;
  }
  return starts.map((date, index) => ({ date: date.toISOString(), count: counts[index] }));
}

export function buildZonedDistinctSeries(
  rows: Array<{ timestamp: Date; key: string }>,
  from: Date,
  to: Date,
  bucket: TrendBucket,
  timeZone: string,
): TrendPoint[] {
  const starts = createZonedBucketStarts(from, to, bucket, timeZone);
  const distinct = starts.map(() => new Set<string>());
  for (const row of rows) {
    const value = row.timestamp.getTime();
    if (value < from.getTime() || value >= to.getTime()) continue;
    const index = bucketIndex(starts, value);
    if (index >= 0) distinct[index].add(row.key);
  }
  return starts.map((date, index) => ({ date: date.toISOString(), count: distinct[index].size }));
}

export function isPartialLastBucket(
  to: Date,
  bucket: TrendBucket,
  timeZone: string,
): boolean {
  if (bucket === "hour") {
    return to.getUTCMinutes() !== 0 || to.getUTCSeconds() !== 0 || to.getUTCMilliseconds() !== 0;
  }
  const current = floorCalendar(calendarParts(to, timeZone), bucket);
  const boundary = calendarToInstant(current, timeZone);
  return boundary.getTime() !== to.getTime();
}

export function percentageDelta(current: number, prior: number): number | null {
  if (prior === 0) return current === 0 ? 0 : null;
  return Math.round(((current - prior) / prior) * 100);
}
