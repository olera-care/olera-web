/**
 * Business-day scheduling for cadence CALL tasks.
 *
 * Cadence calls are CRM tasks whose due date is computed as "launch moment +
 * N days". Left raw, a call can land on a weekend or holiday — when the office
 * is closed and the rep is prompted to call no one. This module rolls such a
 * due date FORWARD to the next business day, evaluated in Eastern Time (the
 * team's timezone).
 *
 * Scope: calls only. Emails are weekday-gated by Smartlead's send window and
 * are intentionally left untouched.
 *
 * Timezone: all weekend/holiday decisions are made in America/New_York via the
 * platform's built-in Intl support, so EST/EDT (daylight saving) is handled
 * automatically — no date library required.
 *
 * HOLIDAY UPKEEP: US_FEDERAL_HOLIDAYS_ET below lists the *observed* federal
 * holiday dates (the business day that is actually off) for 2026–2027. This
 * list must be refreshed roughly once a year — add the next year's observed
 * dates before the current list runs out, or calls will start landing on
 * future holidays again. Last updated: 2026-06-22 (covers 2026–2027).
 */

const DAY_MS = 86_400_000;

/**
 * Observed US federal holidays in Eastern Time, as YYYY-MM-DD strings.
 *
 * "Observed" means the business day that is off: when a holiday falls on a
 * Saturday it's observed the prior Friday; on a Sunday, the following Monday.
 * Holidays that already fall on a weekend need no entry (the weekend rule
 * skips them); only the observed business day matters here.
 */
export const US_FEDERAL_HOLIDAYS_ET: ReadonlySet<string> = new Set([
  // 2026
  "2026-01-01", // New Year's Day
  "2026-01-19", // MLK Jr. Day
  "2026-02-16", // Presidents' Day
  "2026-05-25", // Memorial Day
  "2026-06-19", // Juneteenth
  "2026-07-03", // Independence Day (observed; Jul 4 is a Saturday)
  "2026-09-07", // Labor Day
  "2026-10-12", // Columbus Day
  "2026-11-11", // Veterans Day
  "2026-11-26", // Thanksgiving
  "2026-12-25", // Christmas Day
  // 2027
  "2027-01-01", // New Year's Day
  "2027-01-18", // MLK Jr. Day
  "2027-02-15", // Presidents' Day
  "2027-05-31", // Memorial Day
  "2027-06-18", // Juneteenth (observed; Jun 19 is a Saturday)
  "2027-07-05", // Independence Day (observed; Jul 4 is a Sunday)
  "2027-09-06", // Labor Day
  "2027-10-11", // Columbus Day
  "2027-11-11", // Veterans Day
  "2027-11-25", // Thanksgiving
  "2027-12-24", // Christmas Day (observed; Dec 25 is a Saturday)
]);

/** YYYY-MM-DD for the given instant in Eastern Time (en-CA renders ISO order). */
function easternYmd(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** Short weekday name ("Mon"…"Sun") for the given instant in Eastern Time. */
function easternWeekday(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
  }).format(date);
}

/** True when the instant falls on a Mon–Fri, non-holiday day in Eastern Time. */
export function isBusinessDayET(date: Date): boolean {
  const wd = easternWeekday(date);
  if (wd === "Sat" || wd === "Sun") return false;
  return !US_FEDERAL_HOLIDAYS_ET.has(easternYmd(date));
}

/**
 * Roll a due date forward to the next business day in Eastern Time, skipping
 * weekends and observed US federal holidays. A date already on a business day
 * is returned unchanged. Time-of-day is preserved (advanced in whole days).
 */
export function nextBusinessDayET(date: Date): Date {
  let d = date;
  // Bounded loop: at most a few days of skipping (a long weekend + holiday).
  while (!isBusinessDayET(d)) {
    d = new Date(d.getTime() + DAY_MS);
  }
  return d;
}
