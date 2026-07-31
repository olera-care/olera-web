import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * GET /api/admin/provider-outreach/email-stats
 *
 * Returns email performance metrics for provider outreach emails.
 * Aggregates data from both SmartLead (touchpoints) and Resend (email_log).
 *
 * Query params:
 *   - days: number (default: 30) - Look back period in days
 *
 * Returns:
 *   - templates: Array of { template_key, name, sent, opened, open_rate, clicked, click_rate }
 *   - totals: { sent, opened, open_rate, clicked, click_rate }
 *   - period_days: number
 */

interface TemplateStats {
  template_key: string;
  name: string;
  sequence_step: number | null; // 1-4 for sequence, null for nudge
  sent: number;
  opened: number;
  open_rate: number;
  clicked: number;
  click_rate: number;
}

// Map sequence_step to template info
const SEQUENCE_STEP_MAP: Record<number, { template_key: string; name: string }> = {
  1: { template_key: "intro", name: "Day 0 — Introduction" },
  2: { template_key: "followup", name: "Day 3 — Profile Gaps" },
  3: { template_key: "demand_loss", name: "Day 7 — Demand Loss" },
  4: { template_key: "final", name: "Day 14 — Verified Badge" },
};

// Template key to display info
const TEMPLATE_INFO: Record<string, { name: string; sequence_step: number | null }> = {
  intro: { name: "Day 0 — Introduction", sequence_step: 1 },
  followup: { name: "Day 3 — Profile Gaps", sequence_step: 2 },
  demand_loss: { name: "Day 7 — Demand Loss", sequence_step: 3 },
  final: { name: "Day 14 — Verified Badge", sequence_step: 4 },
  nudge: { name: "Follow-up Nudge", sequence_step: null },
};

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
    const days = parseInt(searchParams.get("days") ?? "30", 10);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffIso = cutoffDate.toISOString();

    const db = getServiceClient();

    // Initialize stats for all templates
    const statsMap: Record<string, TemplateStats> = {};
    for (const [key, info] of Object.entries(TEMPLATE_INFO)) {
      statsMap[key] = {
        template_key: key,
        name: info.name,
        sequence_step: info.sequence_step,
        sent: 0,
        opened: 0,
        open_rate: 0,
        clicked: 0,
        click_rate: 0,
      };
    }

    // 1. Query SmartLead touchpoints for email_sent events
    // These have source='smartlead' and sequence_step in details
    // Filter by source in the query for efficiency
    const { data: smartleadSent } = await db
      .from("provider_outreach_touchpoints")
      .select("details")
      .eq("touchpoint_type", "email_sent")
      .eq("details->>source", "smartlead")
      .gte("created_at", cutoffIso);

    if (smartleadSent) {
      for (const row of smartleadSent) {
        const details = row.details as Record<string, unknown> | null;
        if (!details) continue;

        const seqStep = details.sequence_step as number | undefined;
        // Default to step 1 (intro) if sequence_step is missing
        const effectiveStep = seqStep && SEQUENCE_STEP_MAP[seqStep] ? seqStep : 1;

        const templateKey = SEQUENCE_STEP_MAP[effectiveStep].template_key;
        statsMap[templateKey].sent += 1;

        // Check for opens/clicks in the details (updated by webhook)
        const openCount = Number(details.open_count ?? 0);
        const clickCount = Number(details.click_count ?? 0);

        if (openCount > 0) statsMap[templateKey].opened += 1;
        if (clickCount > 0) statsMap[templateKey].clicked += 1;
      }
    }

    // 2. Query Resend email_log for provider_outreach emails
    // These have template_key in metadata
    const { data: resendEmails } = await db
      .from("email_log")
      .select("metadata, first_opened_at, first_clicked_at")
      .eq("email_type", "provider_outreach")
      .gte("created_at", cutoffIso);

    if (resendEmails) {
      for (const row of resendEmails) {
        const metadata = row.metadata as Record<string, unknown> | null;
        const templateKey = (metadata?.template_key as string) ?? "";

        if (!templateKey || !statsMap[templateKey]) continue;

        statsMap[templateKey].sent += 1;
        if (row.first_opened_at) statsMap[templateKey].opened += 1;
        if (row.first_clicked_at) statsMap[templateKey].clicked += 1;
      }
    }

    // 3. Calculate rates and build response
    const templates: TemplateStats[] = [];
    let totalSent = 0;
    let totalOpened = 0;
    let totalClicked = 0;

    // Sort by sequence_step (null last for nudge)
    const sortedKeys = Object.keys(statsMap).sort((a, b) => {
      const aStep = statsMap[a].sequence_step ?? 99;
      const bStep = statsMap[b].sequence_step ?? 99;
      return aStep - bStep;
    });

    for (const key of sortedKeys) {
      const stat = statsMap[key];
      stat.open_rate = stat.sent > 0 ? Math.round((stat.opened / stat.sent) * 1000) / 10 : 0;
      stat.click_rate = stat.sent > 0 ? Math.round((stat.clicked / stat.sent) * 1000) / 10 : 0;
      templates.push(stat);

      totalSent += stat.sent;
      totalOpened += stat.opened;
      totalClicked += stat.clicked;
    }

    const totals = {
      sent: totalSent,
      opened: totalOpened,
      open_rate: totalSent > 0 ? Math.round((totalOpened / totalSent) * 1000) / 10 : 0,
      clicked: totalClicked,
      click_rate: totalSent > 0 ? Math.round((totalClicked / totalSent) * 1000) / 10 : 0,
    };

    return NextResponse.json({
      templates,
      totals,
      period_days: days,
    });
  } catch (error) {
    console.error("Error in email-stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
