// ── US Eastern scheduling helpers ───────────────────────────────────────
// Shared by the admin surfaces that let the operator schedule a send
// (benefits navigator letters, Ad Boost launch emails). Scheduled sends are
// anchored to US Eastern Time, NOT the admin's browser timezone — TJ
// schedules from anywhere in the world (Thailand, 2026-08), but every
// recipient is in the US and the cron/quiet-hours conventions in this
// codebase are already documented in ET. Flip SCHEDULE_TZ to
// "America/Chicago" if the anchor should ever move to Central.

export const SCHEDULE_TZ = "America/New_York";

/** Wall-clock parts of a UTC instant in the schedule timezone. */
function tzWallClock(at: Date): { y: number; m: number; d: number; h: number; min: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SCHEDULE_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(at);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  // Some engines render midnight as "24" with hour12: false.
  return { y: get("year"), m: get("month"), d: get("day"), h: get("hour") % 24, min: get("minute") };
}

/** datetime-local input (interpreted as ET wall-clock) → UTC ISO. The loop
 *  converges on the right DST offset in 1-2 passes. */
export function etInputToUtcIso(input: string): string | null {
  const m = input.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return null;
  const [y, mo, d, h, min] = m.slice(1).map(Number);
  const target = Date.UTC(y, mo - 1, d, h, min);
  let utc = target;
  for (let i = 0; i < 3; i++) {
    const w = tzWallClock(new Date(utc));
    const cur = Date.UTC(w.y, w.m - 1, w.d, w.h, w.min);
    if (cur === target) break;
    utc += target - cur;
  }
  return new Date(utc).toISOString();
}

/** UTC instant → datetime-local input string in ET wall-clock. */
export function toEtInputValue(at: Date): string {
  const w = tzWallClock(at);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${w.y}-${pad(w.m)}-${pad(w.d)}T${pad(w.h)}:${pad(w.min)}`;
}

/** Display a stored UTC ISO in ET, labeled so no one mistakes it for local. */
export function formatEt(iso: string): string {
  return (
    new Date(iso).toLocaleString("en-US", {
      timeZone: SCHEDULE_TZ,
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }) + " ET"
  );
}
