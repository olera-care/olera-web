// ── Civil send windows for scheduled provider email ─────────────────────
//
// Some emails are triggered by a clock rather than by a person: the Ad Boost
// wrap-up fires when a flight's end date passes, and that moment is whenever
// the hourly cron happens to notice — 3 AM on a Sunday, as often as not. This
// module turns "it is now due" into "send it at the next hour a business
// would actually read it," anchored to US Eastern.
//
// Two decisions are baked in, both deliberate:
//
//   1. ET, not the recipient's timezone. Every Ad Boost provider is in the US
//      and the operator (TJ) schedules from abroad, so the codebase already
//      anchors operator-scheduled sends to ET — see lib/eastern-time.ts. A
//      10:15 AM ET send reaches California at 7:15 AM, which is early but not
//      rude. The recipient-timezone machinery in lib/sms/quiet-hours.ts is the
//      alternative if that ever stops being good enough.
//   2. Business days only. These messages carry an ask (subscribe, reply,
//      report an outcome). A weekend or holiday send is a wasted ask, so the
//      slot rolls forward past both.

import { isBusinessDayET } from "./business-day";
import { etInputToUtcIso, toEtInputValue } from "./eastern-time";

/**
 * The default send slot: 10:15 AM ET.
 *
 * Late enough that the recipient's inbox has been triaged for the day, and
 * off the top of the hour so it doesn't compete with everything else in the
 * ecosystem that fires at :00.
 */
export const MORNING_SLOT_HOUR_ET = 10;
export const MORNING_SLOT_MINUTE_ET = 15;

/** How far ahead to hunt for a business day before giving up. A Thanksgiving
 *  or Christmas run is at most 4 days; 14 is slack for a stale holiday list. */
const MAX_LOOKAHEAD_DAYS = 14;

const pad = (n: number) => String(n).padStart(2, "0");

/** YYYY-MM-DD for an instant in Eastern Time. */
export function etCalendarDate(at: Date): string {
  return toEtInputValue(at).slice(0, 10);
}

/**
 * Shift a YYYY-MM-DD calendar date by N days. Pure calendar arithmetic done
 * in UTC — only Y/M/D are ever read back out, so DST never enters into it.
 */
export function shiftCalendarDate(ymd: string, days: number): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/**
 * The next civil send slot as a UTC ISO string: `hour:minute` Eastern on a
 * weekday that is not an observed US federal holiday, at or after `notBefore`.
 *
 * Today's slot is used when it hasn't passed yet; otherwise it walks forward a
 * day at a time. Because the candidate is built as ET wall-clock, the returned
 * instant is DST-correct on both sides of a transition.
 *
 * Falls back to the first future slot regardless of weekday if the holiday set
 * ever goes pathological — a send at a slightly wrong time beats no send.
 */
export function nextBusinessSlotEt(
  notBefore: Date = new Date(),
  hour: number = MORNING_SLOT_HOUR_ET,
  minute: number = MORNING_SLOT_MINUTE_ET,
): string {
  const startYmd = etCalendarDate(notBefore);
  let firstFuture: string | null = null;

  for (let i = 0; i < MAX_LOOKAHEAD_DAYS; i++) {
    const iso = etInputToUtcIso(`${shiftCalendarDate(startYmd, i)}T${pad(hour)}:${pad(minute)}`);
    if (!iso) continue;
    const at = new Date(iso);
    if (at.getTime() < notBefore.getTime()) continue;
    if (!firstFuture) firstFuture = iso;
    if (isBusinessDayET(at)) return iso;
  }

  return firstFuture ?? new Date(notBefore.getTime() + 24 * 60 * 60 * 1000).toISOString();
}
