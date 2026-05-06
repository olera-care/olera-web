import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * v9.0 Phase 7 Commit E: In Basket hero stats.
 *
 * Three KPIs powering the In Basket hero panel:
 *   - in_basket_cleared_pct: of all the operational work that came
 *     through today, what % has been logged. Formula:
 *       cleared_today / (cleared_today + remaining_in_basket)
 *     where cleared_today = touchpoint + entity-task completions today
 *     and remaining_in_basket = current pending count across In Basket
 *     tabs.
 *   - logs_today: count of touchpoints + entity-task completions today.
 *   - streak_days: consecutive business days (Mon-Fri) ending today,
 *     where each day has ≥1 log. Option A — weekends are skipped, not
 *     streak-breaking.
 *
 * Single endpoint, returns all three in one call so the hero doesn't
 * need to coordinate three fetches.
 *
 * Endpoint name uses "in-basket" to match the UI surface name (the
 * v9.0 Phase 7 Commit E rename of "Inbox" → "In Basket"). Gmail's
 * inbox is a different surface and the prior "/inbox-stats" path
 * created semantic drift.
 */

const STREAK_LOOKBACK_DAYS = 60;

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

  // Lookback log dates: union of touchpoints + entity-task completions
  // within the streak window. Group by UTC date in JS — small enough.
  const [
    { data: touchpointDates },
    { data: bpTaskDates },
    { data: siteTaskDates },
    { count: openOutreachCount },
    { count: pendingBpTasks },
    { count: pendingSiteTasks },
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
    // Approximate "remaining In Basket": rows still un-archived. The
    // queue endpoint computes per-tab counts; here we just want the
    // denominator size for the cleared %, and total pending entity
    // tasks. Not perfect, but close enough for the hero KPI.
    db
      .from("student_outreach")
      .select("id", { count: "exact", head: true })
      .not("status", "in", '("no_response_closed","not_interested","do_not_contact","wrong_contact")'),
    db
      .from("business_profile_tasks")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    db
      .from("site_tasks")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
  ]);

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
  // Today contributes only if there's a log today. If not, the streak
  // is whatever the previous business day's run is.
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

  // Cleared %: cleared_today / (cleared_today + in_basket_size).
  const inBasketSize =
    (openOutreachCount ?? 0) + (pendingBpTasks ?? 0) + (pendingSiteTasks ?? 0);
  const denom = logsToday + inBasketSize;
  const clearedPct = denom > 0 ? Math.round((logsToday / denom) * 100) : 0;

  return NextResponse.json({
    in_basket_cleared_pct: clearedPct,
    logs_today: logsToday,
    streak_days: streakDays,
  });
}
