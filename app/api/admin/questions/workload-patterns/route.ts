import { NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * GET /api/admin/questions/workload-patterns
 *
 * Returns workload pattern data for bandwidth planning:
 * - weekly_totals: Last 12 weeks of question/provider counts
 * - day_of_week: Average questions per day of week (Mon-Sun)
 *
 * This helps admins understand:
 * - Volume trends: "Are things getting busier?"
 * - Day patterns: "Which days need more attention?"
 */
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const admin = await getAdminUser(user.id);
    if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const db = getServiceClient();

    // Get questions from last 12 weeks
    const twelveWeeksAgo = new Date();
    twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84); // 12 * 7 = 84 days
    twelveWeeksAgo.setUTCHours(0, 0, 0, 0);

    const { data: questions, error } = await db
      .from("provider_questions")
      .select("created_at, provider_id")
      .gte("created_at", twelveWeeksAgo.toISOString())
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[workload-patterns] Query error:", error);
      return NextResponse.json({ error: "Failed to load data" }, { status: 500 });
    }

    const rows = questions ?? [];

    // Build weekly totals (last 12 weeks)
    // Week starts on Monday (ISO standard)
    const weeklyMap = new Map<string, { questions: number; providers: Set<string> }>();

    // Initialize all 12 weeks (even if empty)
    // Use 12 iterations starting from the Monday of 12 weeks ago
    const startOfTwelveWeeksAgo = getWeekStart(twelveWeeksAgo);
    for (let i = 0; i < 12; i++) {
      const weekStart = new Date(startOfTwelveWeeksAgo.getTime() + i * 7 * 24 * 60 * 60 * 1000);
      const weekKey = weekStart.toISOString().split("T")[0];
      weeklyMap.set(weekKey, { questions: 0, providers: new Set() });
    }

    // Build day-of-week totals
    // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const dayOfWeekTotals = [0, 0, 0, 0, 0, 0, 0];

    for (const row of rows) {
      const date = new Date(row.created_at);

      // Weekly aggregation
      const weekStart = getWeekStart(date);
      const weekKey = weekStart.toISOString().split("T")[0];
      const weekData = weeklyMap.get(weekKey);
      if (weekData) {
        weekData.questions++;
        if (row.provider_id) weekData.providers.add(row.provider_id);
      }

      // Day-of-week aggregation
      const dayOfWeek = date.getUTCDay();
      dayOfWeekTotals[dayOfWeek]++;
    }

    // Convert weekly map to sorted array
    const weeklyTotals = Array.from(weeklyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([weekStart, data]) => ({
        week_start: weekStart,
        questions: data.questions,
        providers: data.providers.size,
      }));

    // Calculate day-of-week averages
    // Count how many of each day-of-week occurred in our 12-week window
    const dayOfWeekCounts = [0, 0, 0, 0, 0, 0, 0];
    const now = new Date();
    for (let i = 0; i < 84; i++) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      dayOfWeekCounts[d.getUTCDay()]++;
    }

    // Day names starting from Monday (more intuitive for work planning)
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const dayIndices = [1, 2, 3, 4, 5, 6, 0]; // Mon=1, ..., Sun=0

    const dayOfWeek = dayIndices.map((idx, i) => ({
      day: dayNames[i],
      day_index: idx,
      total: dayOfWeekTotals[idx],
      avg: dayOfWeekCounts[idx] > 0
        ? Math.round((dayOfWeekTotals[idx] / dayOfWeekCounts[idx]) * 10) / 10
        : 0,
    }));

    return NextResponse.json({
      weekly_totals: weeklyTotals,
      day_of_week: dayOfWeek,
    });
  } catch (err) {
    console.error("[workload-patterns] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Get the Monday of the week containing the given date (ISO week)
 */
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  const day = d.getUTCDay();
  // Adjust to Monday (day 1). If Sunday (0), go back 6 days.
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  return d;
}
