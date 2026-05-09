import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { CTA_VARIANTS } from "@/lib/analytics/cta-variant";

// One row in the drill-in table — the journey of a single session through
// the CTA funnel for one A/B arm. Stages:
//   impression → user saw the CTA on a provider page
//   clicked    → user clicked the CTA to open the form/sheet
//   converted  → user submitted the lead form (lead_received)
export type CTASessionRow = {
  session_id: string;
  furthest_stage: "impression" | "clicked" | "converted";
  provider_id: string | null;
  first_seen: string;            // ISO timestamp of the earliest event in window
  submitter: string | null;      // email address when converted
};

export type CTASessionsResponse = {
  variant: string;
  total: number;
  sessions: CTASessionRow[];
};

const VALID_VARIANTS = new Set(CTA_VARIANTS);

const STAGE_RANK: Record<CTASessionRow["furthest_stage"], number> = {
  impression: 0,
  clicked: 1,
  converted: 2,
};

function parseLimit(raw: string | null): number {
  const n = raw ? parseInt(raw, 10) : 50;
  if (!Number.isFinite(n)) return 50;
  return Math.max(1, Math.min(200, n));
}

function parseOffset(raw: string | null): number {
  const n = raw ? parseInt(raw, 10) : 0;
  if (!Number.isFinite(n) || n < 0) return 0;
  return n;
}

/**
 * GET /api/admin/analytics/cta-variant-sessions
 *
 * Drill-in for one A/B arm in the CTA funnel. Returns up to
 * `limit` sessions (most recent first) bucketed into the variant, with
 * the furthest funnel stage each session reached and — when available —
 * the email collected at conversion.
 *
 * Query params:
 *   variant   one of legacy (more in future)
 *   date_from ISO timestamp (inclusive). Omit for all-time.
 *   date_to   ISO timestamp (exclusive). Omit for "up to now."
 *   limit     1-200, default 50
 *   offset    >= 0, default 0 (pagination cursor)
 *
 * Returns: { variant, total, sessions: CTASessionRow[] }
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const admin = await getAdminUser(user.id);
    if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const sp = request.nextUrl.searchParams;
    const variant = sp.get("variant") || "";
    if (!VALID_VARIANTS.has(variant as typeof CTA_VARIANTS[number])) {
      return NextResponse.json({ error: "Invalid variant" }, { status: 400 });
    }
    const from = sp.get("date_from");
    const to = sp.get("date_to");
    const limit = parseLimit(sp.get("limit"));
    const offset = parseOffset(sp.get("offset"));
    const stageFilter = sp.get("stage") as CTASessionRow["furthest_stage"] | null;

    const db = getServiceClient();

    // Per-session aggregator. Each session_id collapses across all its
    // events into one row carrying the furthest stage reached + earliest
    // timestamp.
    const sessions = new Map<string, CTASessionRow>();

    const upgrade = (
      sid: string,
      stage: CTASessionRow["furthest_stage"],
      created_at: string,
      providerId: string | null,
      email: string | null,
    ) => {
      const existing = sessions.get(sid);
      if (!existing) {
        sessions.set(sid, {
          session_id: sid,
          furthest_stage: stage,
          provider_id: providerId,
          first_seen: created_at,
          submitter: email,
        });
        return;
      }
      if (STAGE_RANK[stage] > STAGE_RANK[existing.furthest_stage]) {
        existing.furthest_stage = stage;
      }
      if (created_at < existing.first_seen) existing.first_seen = created_at;
      // Backfill provider_id / submitter from whichever event carries it.
      if (!existing.provider_id && providerId) existing.provider_id = providerId;
      if (!existing.submitter && email) existing.submitter = email;
    };

    // Query cta_variant_impression and cta_variant_clicked from provider_activity
    let impressionClickQuery = db
      .from("provider_activity")
      .select("event_type, metadata, created_at, provider_id")
      .in("event_type", ["cta_variant_impression", "cta_variant_clicked"])
      .order("created_at", { ascending: false })
      .limit(20000);
    if (from) impressionClickQuery = impressionClickQuery.gte("created_at", from);
    if (to) impressionClickQuery = impressionClickQuery.lt("created_at", to);

    const icRes = await impressionClickQuery;
    if (icRes.error) {
      console.error("[cta-variant-sessions] impression/click query failed:", icRes.error);
      return NextResponse.json({ error: "Query failed" }, { status: 500 });
    }

    for (const row of (icRes.data ?? []) as Array<{
      event_type: string;
      metadata: Record<string, unknown> | null;
      created_at: string;
      provider_id: string | null;
    }>) {
      const sid = row.metadata?.session_id;
      if (typeof sid !== "string" || !sid) continue;
      // Filter to this variant's events only.
      if (row.metadata?.variant !== variant) continue;

      const stage: CTASessionRow["furthest_stage"] | null =
        row.event_type === "cta_variant_impression" ? "impression"
        : row.event_type === "cta_variant_clicked" ? "clicked"
        : null;
      if (!stage) continue;
      upgrade(sid, stage, row.created_at, row.provider_id ?? null, null);
    }

    // Query lead_received events that have cta_variant in metadata for conversion
    let leadQuery = db
      .from("provider_activity")
      .select("event_type, metadata, created_at, provider_id")
      .eq("event_type", "lead_received")
      .order("created_at", { ascending: false })
      .limit(20000);
    if (from) leadQuery = leadQuery.gte("created_at", from);
    if (to) leadQuery = leadQuery.lt("created_at", to);

    const leadRes = await leadQuery;
    if (leadRes.error) {
      console.error("[cta-variant-sessions] lead_received query failed:", leadRes.error);
      return NextResponse.json({ error: "Query failed" }, { status: 500 });
    }

    for (const row of (leadRes.data ?? []) as Array<{
      event_type: string;
      metadata: Record<string, unknown> | null;
      created_at: string;
      provider_id: string | null;
    }>) {
      // Only count leads that came from the CTA variant system
      const ctaVariant = row.metadata?.cta_variant;
      if (ctaVariant !== variant) continue;

      const sid = row.metadata?.session_id;
      if (typeof sid !== "string" || !sid) continue;

      const email = typeof row.metadata?.email === "string" ? row.metadata.email : null;
      upgrade(sid, "converted", row.created_at, row.provider_id ?? null, email);
    }

    // Sort newest-first by first_seen, then paginate.
    let all = [...sessions.values()].sort((a, b) =>
      a.first_seen < b.first_seen ? 1 : a.first_seen > b.first_seen ? -1 : 0,
    );
    // Apply stage filter if provided. Uses "at least this stage" logic so
    // filter counts match the cumulative header counts.
    if (stageFilter && ["impression", "clicked", "converted"].includes(stageFilter)) {
      const minRank = STAGE_RANK[stageFilter as CTASessionRow["furthest_stage"]];
      all = all.filter((s) => STAGE_RANK[s.furthest_stage] >= minRank);
    }
    const total = all.length;
    const slice = all.slice(offset, offset + limit);

    const response: CTASessionsResponse = {
      variant,
      total,
      sessions: slice,
    };
    return NextResponse.json(response);
  } catch (err) {
    console.error("[admin/analytics/cta-variant-sessions] uncaught:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
