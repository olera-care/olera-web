import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * v9.0 Phase 7 Commit J: In Basket hero stats.
 *
 * Three KPIs powering the In Basket hero panel:
 *   - queued_logs_unread / queued_logs_read: active items still in
 *     queue, split by unread state. Replaces the previous
 *     in_basket_cleared_pct — percent-cleared framed the system as
 *     inbox-zero work, but the operational philosophy is queue
 *     health, not elimination. "Queued Logs" frames the same data
 *     as a continuous backlog (unread first, then read-but-undone).
 *   - logs_today: count of touchpoints + entity-task completions
 *     logged today.
 *   - streak_days: consecutive business days (Mon-Fri) ending today,
 *     where each day has ≥1 log. Option A — weekends skipped, not
 *     streak-breaking.
 *
 * Single endpoint, returns all three in one call so the hero doesn't
 * need to coordinate multiple fetches.
 */

const STREAK_LOOKBACK_DAYS = 60;

// Active student_outreach statuses — the rows that count as "in the
// queue". Closed states (no_response_closed, not_interested,
// do_not_contact, wrong_contact) are out of the active inbox.
const CLOSED_STATUSES = [
  "no_response_closed",
  "not_interested",
  "do_not_contact",
  "wrong_contact",
];

function startOfDayUTC(d: Date): Date {
  const x = new Date(d);
  x.setUTCHours(0, 0, 0, 0);
  return x;
}

function isWeekend(d: Date): boolean {
  const day = d.getUTCDay();
  return day === 0 || day === 6;
}

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export async function GET(_req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const db = getServiceClient();

  const now = new Date();
  const todayStart = startOfDayUTC(now);
  const lookbackStart = new Date(todayStart.getTime() - STREAK_LOOKBACK_DAYS * 86400_000);

  const [
    { data: touchpointDates },
    { data: bpTaskDates },
    { data: siteTaskDates },
    { data: activeOutreach },
  ] = await Promise.all([
    db
      .from("student_outreach_touchpoints")
      .select("created_at")
      .gte("created_at", lookbackStart.toISOString())
      .order("created_at", { ascending: false })
      .limit(5000),
    db
      .from("business_profile_tasks")
      .select("completed_at")
      .eq("status", "completed")
      .gte("completed_at", lookbackStart.toISOString())
      .limit(5000),
    db
      .from("site_tasks")
      .select("completed_at")
      .eq("status", "completed")
      .gte("completed_at", lookbackStart.toISOString())
      .limit(5000),
    // Active In Basket queue: student_outreach rows not in a closed
    // state. Pull viewed_at so we can split unread vs. read.
    db
      .from("student_outreach")
      .select("viewed_at")
      .not("status", "in", `(${CLOSED_STATUSES.map((s) => `"${s}"`).join(",")})`),
  ]);

  // Queued Logs: split by unread state.
  let queuedUnread = 0;
  let queuedRead = 0;
  for (const row of (activeOutreach ?? []) as Array<{ viewed_at: string | null }>) {
    if (row.viewed_at == null) queuedUnread += 1;
    else queuedRead += 1;
  }

  // Build a set of UTC dates with at least one log.
  const datesWithLogs = new Set<string>();
  let logsToday = 0;
  const todayKey = dateKey(todayStart);

  const noteDate = (iso: string | null) => {
    if (!iso) return;
    const d = new Date(iso);
    if (isNaN(d.getTime())) return;
    const k = dateKey(startOfDayUTC(d));
    datesWithLogs.add(k);
    if (k === todayKey) logsToday += 1;
  };

  for (const row of (touchpointDates ?? []) as Array<{ created_at: string }>) {
    noteDate(row.created_at);
  }
  for (const row of (bpTaskDates ?? []) as Array<{ completed_at: string | null }>) {
    noteDate(row.completed_at);
  }
  for (const row of (siteTaskDates ?? []) as Array<{ completed_at: string | null }>) {
    noteDate(row.completed_at);
  }

  // Streak: walk back from today. Skip weekends. Stop at first
  // business day with no log. Today only counts if it has a log.
  let streakDays = 0;
  let cursor = new Date(todayStart);
  if (!datesWithLogs.has(todayKey) && !isWeekend(cursor)) {
    cursor = new Date(cursor.getTime() - 86400_000);
  }
  for (let i = 0; i < STREAK_LOOKBACK_DAYS; i++) {
    if (isWeekend(cursor)) {
      cursor = new Date(cursor.getTime() - 86400_000);
      continue;
    }
    if (datesWithLogs.has(dateKey(cursor))) {
      streakDays += 1;
      cursor = new Date(cursor.getTime() - 86400_000);
    } else {
      break;
    }
  }

  return NextResponse.json({
    queued_logs_unread: queuedUnread,
    queued_logs_read: queuedRead,
    logs_today: logsToday,
    streak_days: streakDays,
  });
}
