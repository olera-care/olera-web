import { NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * GET /api/admin/analytics/enrichment-funnel
 *
 * Returns enrichment funnel analytics showing drop-off rates per step.
 * Optionally filter by CTA variant to compare enrichment completion across variants.
 *
 * Query params:
 * - variant: Filter by CTA variant (legacy, compare, guide)
 * - from_date: Start date (ISO string)
 * - to_date: End date (ISO string)
 */

interface EnrichmentEvent {
  event_type: string;
  metadata: {
    step?: number;
    step_name?: string;
    completed_steps?: number[];
    completed_count?: number;
    ctaVariant?: string;
    cta_variant?: string;
    session_id?: string;
  } | null;
  created_at: string;
}

const ENRICHMENT_EVENT_TYPES = [
  "enrichment_started",
  "enrichment_step_completed",
  "enrichment_step_skipped",
  "enrichment_completed",
];

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await getAdminUser(user.id);
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = getServiceClient();
  const { searchParams } = new URL(request.url);
  const variant = searchParams.get("variant");
  const fromDate = searchParams.get("from_date");
  const toDate = searchParams.get("to_date");

  // Default to last 30 days
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const startDate = fromDate || thirtyDaysAgo.toISOString();
  const endDate = toDate || now.toISOString();

  try {
    // Query all enrichment events
    let query = db
      .from("provider_activity")
      .select("event_type, metadata, created_at")
      .in("event_type", ENRICHMENT_EVENT_TYPES)
      .gte("created_at", startDate)
      .lte("created_at", endDate)
      .order("created_at", { ascending: true })
      .limit(10000);

    const { data: events, error } = await query;

    if (error) {
      console.error("[enrichment-funnel] Query error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    const allEvents = (events || []) as EnrichmentEvent[];

    // Filter by variant if specified
    const filteredEvents = variant
      ? allEvents.filter((e) => {
          const v = e.metadata?.ctaVariant || e.metadata?.cta_variant;
          return v === variant;
        })
      : allEvents;

    // Calculate funnel metrics
    const funnel = calculateEnrichmentFunnel(filteredEvents);

    // Calculate by variant breakdown (if not already filtered)
    const byVariant = variant ? null : calculateByVariant(allEvents);

    // Calculate weekly trend
    const trend = calculateWeeklyTrend(filteredEvents);

    return NextResponse.json({
      funnel,
      byVariant,
      trend,
      dateRange: { from: startDate, to: endDate },
      variant: variant || "all",
    });
  } catch (err) {
    console.error("[enrichment-funnel] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

interface FunnelMetrics {
  started: number;
  step1_completed: number;  // recipient
  step2_completed: number;  // timeline
  step3_completed: number;  // careType
  step4_completed: number;  // careNeed
  step5_completed: number;  // payment
  step6_completed: number;  // details
  completed: number;        // finished all 6
  skipped: number;          // skipped at any point
  skipsByStep: Record<number, number>;  // count of skips per step
  rates: {
    step1Rate: number;
    step2Rate: number;
    step3Rate: number;
    step4Rate: number;
    step5Rate: number;
    step6Rate: number;
    completionRate: number;
  };
}

function calculateEnrichmentFunnel(events: EnrichmentEvent[]): FunnelMetrics {
  // Group events by session to track unique user journeys
  const sessionMap = new Map<string, EnrichmentEvent[]>();

  for (const event of events) {
    const sessionId = event.metadata?.session_id;
    if (!sessionId) continue;

    if (!sessionMap.has(sessionId)) {
      sessionMap.set(sessionId, []);
    }
    sessionMap.get(sessionId)!.push(event);
  }

  let started = 0;
  const stepCompleted = [0, 0, 0, 0, 0, 0]; // steps 1-6
  let completed = 0;
  let skipped = 0;
  const skipsByStep: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };

  for (const [, sessionEvents] of sessionMap) {
    // Check what events this session has
    const hasStarted = sessionEvents.some((e) => e.event_type === "enrichment_started");
    const hasCompleted = sessionEvents.some((e) => e.event_type === "enrichment_completed");
    const hasSkipped = sessionEvents.some((e) => e.event_type === "enrichment_step_skipped");

    if (hasStarted) started++;
    if (hasCompleted) completed++;
    if (hasSkipped) skipped++;

    // Count step completions
    for (const event of sessionEvents) {
      if (event.event_type === "enrichment_step_completed") {
        const step = event.metadata?.step;
        if (step && step >= 1 && step <= 6) {
          stepCompleted[step - 1]++;
        }
      }

      // Track which step they skipped at
      if (event.event_type === "enrichment_step_skipped") {
        const step = event.metadata?.step;
        if (step && step >= 1 && step <= 6) {
          skipsByStep[step]++;
        }
      }
    }
  }

  // Calculate rates (percentage of started that completed each step)
  const rates = {
    step1Rate: started > 0 ? Math.round((stepCompleted[0] / started) * 100) : 0,
    step2Rate: started > 0 ? Math.round((stepCompleted[1] / started) * 100) : 0,
    step3Rate: started > 0 ? Math.round((stepCompleted[2] / started) * 100) : 0,
    step4Rate: started > 0 ? Math.round((stepCompleted[3] / started) * 100) : 0,
    step5Rate: started > 0 ? Math.round((stepCompleted[4] / started) * 100) : 0,
    step6Rate: started > 0 ? Math.round((stepCompleted[5] / started) * 100) : 0,
    completionRate: started > 0 ? Math.round((completed / started) * 100) : 0,
  };

  return {
    started,
    step1_completed: stepCompleted[0],
    step2_completed: stepCompleted[1],
    step3_completed: stepCompleted[2],
    step4_completed: stepCompleted[3],
    step5_completed: stepCompleted[4],
    step6_completed: stepCompleted[5],
    completed,
    skipped,
    skipsByStep,
    rates,
  };
}

function calculateByVariant(events: EnrichmentEvent[]): Record<string, FunnelMetrics> {
  const variants = ["legacy", "compare", "guide"];
  const result: Record<string, FunnelMetrics> = {};

  for (const variant of variants) {
    const variantEvents = events.filter((e) => {
      const v = e.metadata?.ctaVariant || e.metadata?.cta_variant;
      return v === variant;
    });
    result[variant] = calculateEnrichmentFunnel(variantEvents);
  }

  // Also include events with no variant (unknown/null)
  const unknownEvents = events.filter((e) => {
    const v = e.metadata?.ctaVariant || e.metadata?.cta_variant;
    return !v;
  });
  if (unknownEvents.length > 0) {
    result["unknown"] = calculateEnrichmentFunnel(unknownEvents);
  }

  return result;
}

interface WeeklyData {
  week: string;
  started: number;
  completed: number;
  completionRate: number;
}

function calculateWeeklyTrend(events: EnrichmentEvent[]): WeeklyData[] {
  // Group events by week
  const weekMap = new Map<string, EnrichmentEvent[]>();

  for (const event of events) {
    const weekKey = getWeekStart(event.created_at);
    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, []);
    }
    weekMap.get(weekKey)!.push(event);
  }

  // Calculate funnel for each week
  const weeks = Array.from(weekMap.keys()).sort().reverse().slice(0, 4);

  return weeks.map((week) => {
    const weekEvents = weekMap.get(week) || [];
    const funnel = calculateEnrichmentFunnel(weekEvents);

    return {
      week,
      started: funnel.started,
      completed: funnel.completed,
      completionRate: funnel.rates.completionRate,
    };
  });
}

function getWeekStart(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(date);
  monday.setUTCDate(date.getUTCDate() + diff);
  monday.setUTCHours(0, 0, 0, 0);
  return monday.toISOString().split("T")[0];
}
