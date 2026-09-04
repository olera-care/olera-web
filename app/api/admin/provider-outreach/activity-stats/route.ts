import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * GET /api/admin/provider-outreach/activity-stats
 *
 * Fetch daily activity stats for provider outreach.
 * Query params:
 *   - date: ISO date string (YYYY-MM-DD), defaults to today
 *   - days: number of days for the daily series (default 7)
 *
 * Returns call counts by status, email counts, and daily series for sparkline.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);

    // Target date (defaults to today in CT timezone)
    const dateParam = searchParams.get("date");
    const targetDate = dateParam || new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" });

    // Days for daily series (defaults to 7)
    const daysParam = searchParams.get("days");
    const seriesDays = Math.min(Math.max(parseInt(daysParam || "7", 10) || 7, 1), 30);

    const db = getServiceClient();

    // Calculate date range for the target date (full day in CT)
    // Use a wider UTC range and filter by CT date in the aggregation
    // This avoids issues with DST (CDT is -05:00, CST is -06:00)
    const dayStart = `${targetDate}T00:00:00-06:00`; // Earliest possible CT start
    const dayEndPlusBuffer = `${targetDate}T23:59:59-05:00`; // Latest possible CT end (CDT)

    // Fetch call touchpoints for the target date (include admin_user_id for per-admin breakdown)
    const { data: callTouchpoints, error: callError } = await db
      .from("provider_outreach_touchpoints")
      .select("details, created_at, admin_user_id")
      .eq("touchpoint_type", "call_attempted")
      .gte("created_at", dayStart)
      .lte("created_at", dayEndPlusBuffer);

    if (callError) {
      console.error("[activity-stats] Call query error:", callError);
      return NextResponse.json({ error: "Failed to fetch call stats" }, { status: 500 });
    }

    // Count calls by status (filter to exact CT date)
    const callsByStatus: Record<string, number> = {
      voicemail: 0,
      no_answer: 0,
      hung_up: 0,
      callback: 0,
      new_email: 0,
      resend: 0,
      spoke_with: 0,
      note: 0,
    };
    let totalCalls = 0;

    // Track calls by admin for per-admin breakdown
    const callsByAdmin: Record<string, { total: number; voicemail: number; no_answer: number; hung_up: number; callback: number; spoke_with: number; new_email: number; resend: number; note: number }> = {};

    for (const tp of callTouchpoints || []) {
      // Verify this touchpoint is actually on the target date in CT
      const tpDate = new Date(tp.created_at).toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
      if (tpDate !== targetDate) continue;

      const details = tp.details as { status?: string } | null;
      const status = details?.status || "unknown";
      totalCalls++;
      if (status in callsByStatus) {
        callsByStatus[status]++;
      }

      // Track per-admin stats
      const adminId = tp.admin_user_id || "unknown";
      if (!callsByAdmin[adminId]) {
        callsByAdmin[adminId] = { total: 0, voicemail: 0, no_answer: 0, hung_up: 0, callback: 0, spoke_with: 0, new_email: 0, resend: 0, note: 0 };
      }
      callsByAdmin[adminId].total++;
      if (status in callsByAdmin[adminId]) {
        (callsByAdmin[adminId] as Record<string, number>)[status]++;
      }
    }

    // Fetch email touchpoints for the target date
    const { data: emailTouchpoints, error: emailError } = await db
      .from("provider_outreach_touchpoints")
      .select("details, created_at")
      .eq("touchpoint_type", "email_sent")
      .gte("created_at", dayStart)
      .lte("created_at", dayEndPlusBuffer);

    if (emailError) {
      console.error("[activity-stats] Email query error:", emailError);
      return NextResponse.json({ error: "Failed to fetch email stats" }, { status: 500 });
    }

    // Count emails by template (filter to exact CT date)
    const emailsByTemplate: Record<string, number> = {
      intro: 0,
      followup: 0,
      demand_loss: 0,
      final: 0,
      nudge: 0,
    };
    let totalEmails = 0;

    for (const tp of emailTouchpoints || []) {
      // Verify this touchpoint is actually on the target date in CT
      const tpDate = new Date(tp.created_at).toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
      if (tpDate !== targetDate) continue;

      const details = tp.details as { template_key?: string; sequence_step?: number } | null;
      let templateKey = details?.template_key;

      // Derive from sequence_step if template_key not present (SmartLead)
      if (!templateKey && details?.sequence_step != null) {
        const stepToTemplate: Record<number, string> = {
          1: "intro",
          2: "followup",
          3: "demand_loss",
          4: "final",
        };
        templateKey = stepToTemplate[details.sequence_step];
      }

      totalEmails++;
      if (templateKey && templateKey in emailsByTemplate) {
        emailsByTemplate[templateKey]++;
      }
    }

    // Fetch sequence_launched touchpoints for the target date
    const { data: sequenceTouchpoints, error: sequenceError } = await db
      .from("provider_outreach_touchpoints")
      .select("created_at")
      .eq("touchpoint_type", "sequence_launched")
      .gte("created_at", dayStart)
      .lte("created_at", dayEndPlusBuffer);

    if (sequenceError) {
      console.error("[activity-stats] Sequence query error:", sequenceError);
    }

    // Count sequences started (filter to exact CT date)
    let sequencesStarted = 0;
    for (const tp of sequenceTouchpoints || []) {
      const tpDate = new Date(tp.created_at).toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
      if (tpDate === targetDate) {
        sequencesStarted++;
      }
    }

    // Fetch admin display names for per-admin breakdown
    const adminIds = Object.keys(callsByAdmin).filter(id => id !== "unknown");
    let adminNameMap = new Map<string, string>();
    if (adminIds.length > 0) {
      const { data: admins } = await db
        .from("admin_users")
        .select("id, display_name")
        .in("id", adminIds);
      adminNameMap = new Map((admins || []).map(a => [a.id, a.display_name || "Unknown"]));
    }

    // Build calls_by_admin array sorted by total calls descending
    const callsByAdminArray = Object.entries(callsByAdmin)
      .filter(([adminId]) => adminId !== "unknown")
      .map(([adminId, stats]) => ({
        admin_id: adminId,
        display_name: adminNameMap.get(adminId) || "Unknown",
        ...stats,
      }))
      .sort((a, b) => b.total - a.total);

    // Fetch daily series for sparkline (last N days)
    // Generate date strings in CT timezone
    const generateCTDates = (endDate: string, days: number): string[] => {
      const dates: string[] = [];
      const end = new Date(endDate + "T12:00:00-06:00"); // Noon CT to avoid DST edge cases
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date(end);
        d.setDate(end.getDate() - i);
        dates.push(d.toLocaleDateString("en-CA", { timeZone: "America/Chicago" }));
      }
      return dates;
    };
    const seriesDates = generateCTDates(targetDate, seriesDays);
    const seriesStart = seriesDates[0];

    // Get daily call counts
    const { data: dailyCalls, error: dailyCallError } = await db
      .from("provider_outreach_touchpoints")
      .select("created_at")
      .eq("touchpoint_type", "call_attempted")
      .gte("created_at", `${seriesStart}T00:00:00-06:00`)
      .lte("created_at", dayEndPlusBuffer);

    if (dailyCallError) {
      console.error("[activity-stats] Daily calls query error:", dailyCallError);
    }

    // Get daily email counts
    const { data: dailyEmails, error: dailyEmailError } = await db
      .from("provider_outreach_touchpoints")
      .select("created_at")
      .eq("touchpoint_type", "email_sent")
      .gte("created_at", `${seriesStart}T00:00:00-06:00`)
      .lte("created_at", dayEndPlusBuffer);

    if (dailyEmailError) {
      console.error("[activity-stats] Daily emails query error:", dailyEmailError);
    }

    // Build daily series
    const dailySeries: Array<{ date: string; calls: number; emails: number }> = [];
    const callCountsByDate: Record<string, number> = {};
    const emailCountsByDate: Record<string, number> = {};

    for (const tp of dailyCalls || []) {
      const date = new Date(tp.created_at).toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
      callCountsByDate[date] = (callCountsByDate[date] || 0) + 1;
    }

    for (const tp of dailyEmails || []) {
      const date = new Date(tp.created_at).toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
      emailCountsByDate[date] = (emailCountsByDate[date] || 0) + 1;
    }

    // Fill in all dates in the series using the CT date strings
    for (const dateStr of seriesDates) {
      dailySeries.push({
        date: dateStr,
        calls: callCountsByDate[dateStr] || 0,
        emails: emailCountsByDate[dateStr] || 0,
      });
    }

    return NextResponse.json({
      date: targetDate,
      calls: {
        total: totalCalls,
        ...callsByStatus,
      },
      calls_by_admin: callsByAdminArray,
      emails: {
        total: totalEmails,
        ...emailsByTemplate,
      },
      sequences_started: sequencesStarted,
      daily_series: dailySeries,
    });
  } catch (err) {
    console.error("[activity-stats] Error:", err);
    return NextResponse.json(
      { error: `Internal server error: ${err instanceof Error ? err.message : String(err)}` },
      { status: 500 }
    );
  }
}
