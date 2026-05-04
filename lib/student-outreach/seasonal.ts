/**
 * Active Partner seasonal cadence.
 *
 * Recruiting pushes happen quarterly:
 *   Pre-Fall    — Aug 1
 *   Pre-Winter  — Nov 15
 *   Pre-Spring  — Jan 15
 *   Pre-Summer  — Apr 15
 *
 * Always returns the next push at-or-after `now`. After completing one,
 * call again with `now = lastDueAt + 1 day` to get the following one.
 */

interface SeasonalDate {
  month: number; // 1-12
  day: number;
  label: string;
}

const SEASONAL_DATES: SeasonalDate[] = [
  { month: 1, day: 15, label: "Pre-Spring" },
  { month: 4, day: 15, label: "Pre-Summer" },
  { month: 8, day: 1, label: "Pre-Fall" },
  { month: 11, day: 15, label: "Pre-Winter" },
];

export interface NextSeasonal {
  due_at: Date;
  label: string;
}

export function nextSeasonalDate(now: Date = new Date()): NextSeasonal {
  const year = now.getUTCFullYear();
  const candidates: NextSeasonal[] = [];
  for (const offset of [0, 1]) {
    for (const s of SEASONAL_DATES) {
      // 9am UTC anchor — well clear of midnight TZ edge cases.
      const due = new Date(Date.UTC(year + offset, s.month - 1, s.day, 9, 0, 0));
      if (due.getTime() > now.getTime()) {
        candidates.push({ due_at: due, label: s.label });
      }
    }
  }
  candidates.sort((a, b) => a.due_at.getTime() - b.due_at.getTime());
  // Always at least one candidate within next 365 days.
  return candidates[0];
}
