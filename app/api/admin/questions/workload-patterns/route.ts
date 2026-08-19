import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * GET /api/admin/questions/workload-patterns
 *
 * Returns workload pattern data for bandwidth planning:
 * - weekly_totals: Weekly question/provider counts for the date range
 * - day_of_week: Average questions per day of week (Mon-Sun)
 *
 * Query params:
 * - start_date: ISO date string (optional, defaults to 12 weeks ago)
 * - end_date: ISO date string (optional, defaults to today)
 *
 * This helps admins understand:
 * - Volume trends: "Are things getting busier?"
 * - Day patterns: "Which days need more attention?"
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const admin = await getAdminUser(user.id);
    if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const db = getServiceClient();

    // Parse date range from query params
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("start_date");
    const endDateParam = searchParams.get("end_date");

    // Default: last 12 weeks
    let startDate: Date;
    let endDate: Date;

    if (startDateParam) {
      startDate = new Date(startDateParam);
      startDate.setUTCHours(0, 0, 0, 0);
    } else {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 84); // 12 * 7 = 84 days
      startDate.setUTCHours(0, 0, 0, 0);
    }

    if (endDateParam) {
      endDate = new Date(endDateParam);
      endDate.setUTCHours(23, 59, 59, 999);
    } else {
      endDate = new Date();
      endDate.setUTCHours(23, 59, 59, 999);
    }

    const { data: questions, error } = await db
      .from("provider_question_asks")
      .select("created_at, provider_id")
      .gte("created_at", startDate.toISOString())
      .lte("created_at", endDate.toISOString())
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[workload-patterns] Query error:", error);
      return NextResponse.json({ error: "Failed to load data" }, { status: 500 });
    }

    const rows = questions ?? [];

    // Calculate number of days in range for week count
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const numWeeks = Math.ceil(daysDiff / 7);

    // Build weekly totals
    // Week starts on Monday (ISO standard)
    const weeklyMap = new Map<string, { questions: number; providers: Set<string> }>();

    // Initialize all weeks in range (even if empty)
    const startOfRange = getWeekStart(startDate);
    for (let i = 0; i < numWeeks; i++) {
      const weekStart = new Date(startOfRange.getTime() + i * 7 * 24 * 60 * 60 * 1000);
      // Don't include weeks beyond endDate
      if (weekStart > endDate) break;
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
    // Count how many of each day-of-week occurred in our date range
    const dayOfWeekCounts = [0, 0, 0, 0, 0, 0, 0];
    for (let i = 0; i < daysDiff; i++) {
      const d = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      if (d <= endDate) {
        dayOfWeekCounts[d.getUTCDay()]++;
      }
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
