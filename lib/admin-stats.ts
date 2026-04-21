export type Bucket = "hour" | "day" | "week" | "month";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Pick a bucket size so the series stays in a readable range.
 *
 * Thresholds are chosen so common presets land cleanly:
 *  - "Today" / "Yesterday" → hour
 *  - "Last 7 / 30 days"    → day
 *  - "Last 90 days"        → week (preset is ~90.6 days past midnight)
 *  - "Last 12 months"      → week
 *  - Custom > ~13 months   → month
 */
export function resolveBucket(from: Date, to: Date): Bucket {
  const days = (to.getTime() - from.getTime()) / DAY_MS;
  if (days <= 2) return "hour";
  if (days <= 45) return "day";
  if (days <= 400) return "week";
  return "month";
}

/** Floor a date to the start of its bucket (in local time). */
function floorTo(date: Date, bucket: Bucket): Date {
  const d = new Date(date);
  d.setMinutes(0, 0, 0);
  if (bucket === "hour") return d;
  d.setHours(0, 0, 0, 0);
  if (bucket === "day") return d;
  if (bucket === "week") {
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    return d;
  }
  // month
  d.setDate(1);
  return d;
}

/** Advance a date to the start of the next bucket. */
function step(date: Date, bucket: Bucket): Date {
  const d = new Date(date);
  if (bucket === "hour") d.setHours(d.getHours() + 1);
  else if (bucket === "day") d.setDate(d.getDate() + 1);
  else if (bucket === "week") d.setDate(d.getDate() + 7);
  else d.setMonth(d.getMonth() + 1);
  return d;
}

/**
 * Bucket timestamps into a zero-filled series between `from` and `to`.
 * Always returns contiguous buckets (zeros included) so the chart is stable.
 */
export function buildSeries(
  timestamps: Date[],
  from: Date,
  to: Date,
  bucket: Bucket,
): { date: string; count: number }[] {
  const start = floorTo(from, bucket);
  const end = floorTo(to, bucket);

  // Pre-fill all buckets with 0
  const buckets: { date: string; count: number }[] = [];
  let cursor = start;
  let safety = 0;
  while (cursor <= end && safety < 10000) {
    buckets.push({ date: cursor.toISOString(), count: 0 });
    cursor = step(cursor, bucket);
    safety++;
  }

  if (buckets.length === 0) return [];

  // Index by ISO for O(1) inserts
  const index = new Map(buckets.map((b, i) => [b.date, i]));
  for (const ts of timestamps) {
    const key = floorTo(ts, bucket).toISOString();
    const i = index.get(key);
    if (i !== undefined) buckets[i].count++;
  }

  return buckets;
}
