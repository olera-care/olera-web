import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { buildSeries, resolveBucket, type Bucket } from "@/lib/admin-stats";

/**
 * GET /api/admin/questions/stats
 *
 * Returns stats for the PulseHeader. Two metrics from one query:
 *  - `total` / `delta`: needs-email backlog in the range (KPI)
 *  - `series`: ALL question creations per bucket (platform pulse chart)
 *
 * The KPI and the chart are intentionally different metrics. Needs-email is
 * the operator action queue; the pulse chart shows overall platform activity
 * so you can spot volume spikes that may precede the backlog growing.
 *
 * Query params:
 *  - `date_from` (ISO, inclusive). Omit for all-time.
 *  - `date_to`   (ISO, exclusive).
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const admin = await getAdminUser(user.id);
    if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");

    const db = getServiceClient();

    const now = new Date();
    const from = dateFrom ? new Date(dateFrom) : null;
    const to = dateTo ? new Date(dateTo) : now;
    const priorFrom = from ? new Date(from.getTime() - (to.getTime() - from.getTime())) : null;
    const queryStart = priorFrom ?? from ?? null;

    // Pull questions with provider_id so we can verify provider existence
    let q = db
      .from("provider_questions")
      .select("created_at, status, metadata, provider_id")
      .order("created_at", { ascending: true })
      .limit(50000);
    if (queryStart) q = q.gte("created_at", queryStart.toISOString());
    if (dateTo) q = q.lt("created_at", dateTo);

    const { data: rows, error } = await q;
    if (error) {
      console.error("Admin questions stats error:", error);
      return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
    }

    const allRows = rows ?? [];

    // DEBUG: Log total rows fetched
    console.log("[stats-debug] Total rows fetched:", allRows.length);

    // Get unique provider IDs from questions that might need email
    // Exclude questions that have moved to other tabs (Delivery Issues, No Contact, Not Interested)
    const potentialNeedsEmail = allRows.filter((r) => {
      const meta = r.metadata as Record<string, unknown> | null | undefined;
      if (meta?.needs_provider_email !== true) return false;
      if (r.status === "archived" || r.status === "rejected") return false;
      // Exclude questions belonging to other tabs
      if (meta?.email_dead === true) return false;  // → Delivery Issues tab
      if (meta?.provider_not_interested === true) return false;  // → Not Interested tab
      if (meta?.provider_no_contact === true) return false;  // → No Contact tab
      return true;
    });
    const providerIds = [...new Set(potentialNeedsEmail.map((r) => r.provider_id).filter(Boolean))];

    // DEBUG: Log filtered counts
    console.log("[stats-debug] potentialNeedsEmail count:", potentialNeedsEmail.length);
    console.log("[stats-debug] Unique provider IDs:", providerIds.length);

    // Look up providers in business_profiles (check email, is_active, and account_id for claimed status)
    // Look up by BOTH slug AND source_provider_id to handle legacy provider IDs
    const bpOrConditions: string[] = [];
    if (providerIds.length > 0) {
      bpOrConditions.push(`slug.in.(${providerIds.map(s => `"${s}"`).join(',')})`);
      bpOrConditions.push(`source_provider_id.in.(${providerIds.map(s => `"${s}"`).join(',')})`);
    }
    const { data: bpProviders } = bpOrConditions.length > 0
      ? await db
          .from("business_profiles")
          .select("slug, email, is_active, source_provider_id, account_id")
          .or(bpOrConditions.join(','))
      : { data: [] };

    // Look up providers in olera-providers (legacy)
    // Include provider_id lookups for cases where question.provider_id is alphanumeric ID
    const oleraOrConditions: string[] = [];
    if (providerIds.length > 0) {
      oleraOrConditions.push(`slug.in.(${providerIds.map(s => `"${s}"`).join(',')})`);
      oleraOrConditions.push(`provider_id.in.(${providerIds.map(s => `"${s}"`).join(',')})`);
    }
    const { data: oleraProviders } = oleraOrConditions.length > 0
      ? await db
          .from("olera-providers")
          .select("slug, email, provider_id")
          .or(oleraOrConditions.join(','))
          .not("deleted", "is", true)
      : { data: [] };

    // DEBUG: Log lookup results
    console.log("[stats-debug] business_profiles found:", bpProviders?.length ?? 0);
    console.log("[stats-debug] olera-providers found:", oleraProviders?.length ?? 0);

    // Build olera email lookup by provider_id
    const oleraEmailByProviderId = new Map<string, string>();
    for (const p of oleraProviders ?? []) {
      if (p.provider_id && p.email) oleraEmailByProviderId.set(p.provider_id, p.email);
    }

    // Reverse lookup: find business_profiles linked via source_provider_id for claim status
    const oleraProviderIdsToCheck = (oleraProviders ?? [])
      .map(p => p.provider_id)
      .filter((id): id is string => !!id);
    const { data: linkedBpForStats } = oleraProviderIdsToCheck.length > 0
      ? await db
          .from("business_profiles")
          .select("source_provider_id, email, account_id")
          .in("source_provider_id", oleraProviderIdsToCheck)
      : { data: [] };
    const bpBySourceIdForStats = new Map<string, { email: string | null; account_id: string | null }>();
    for (const bp of linkedBpForStats ?? []) {
      if (bp.source_provider_id) {
        bpBySourceIdForStats.set(bp.source_provider_id, { email: bp.email, account_id: bp.account_id });
      }
    }

    // Build map of provider status: { exists, hasEmail, isArchived, isClaimed }
    const providerStatus = new Map<string, { exists: boolean; hasEmail: boolean; isArchived: boolean; isClaimed: boolean }>();

    // Initialize all as non-existent
    for (const id of providerIds) {
      providerStatus.set(id, { exists: false, hasEmail: false, isArchived: false, isClaimed: false });
    }

    // Update from business_profiles (takes precedence)
    for (const p of bpProviders ?? []) {
      // Check business_profiles email first, then fallback to olera-providers via source_provider_id
      const hasEmail = !!p.email || (p.source_provider_id ? !!oleraEmailByProviderId.get(p.source_provider_id) : false);
      const isClaimed = !!p.account_id;
      const status = {
        exists: true,
        hasEmail,
        isArchived: p.is_active === false,
        isClaimed,
      };
      // Set status for both slug and source_provider_id to handle legacy lookups
      if (p.slug) {
        providerStatus.set(p.slug, status);
      }
      if (p.source_provider_id) {
        providerStatus.set(p.source_provider_id, status);
      }
    }

    // Update from olera-providers (only if not already in business_profiles)
    for (const p of oleraProviders ?? []) {
      // Check if this olera-provider has a linked business_profile (for claim status and email)
      const linkedBp = p.provider_id ? bpBySourceIdForStats.get(p.provider_id) : null;
      const hasEmail = !!p.email || !!linkedBp?.email;
      const isClaimed = !!linkedBp?.account_id;

      // Set status using slug if not already set
      if (p.slug && !providerStatus.get(p.slug)?.exists) {
        providerStatus.set(p.slug, {
          exists: true,
          hasEmail,
          isArchived: false, // olera-providers uses "deleted" which we already filtered
          isClaimed,
        });
      }
      // Also set status using provider_id for legacy lookups
      if (p.provider_id && !providerStatus.get(p.provider_id)?.exists) {
        providerStatus.set(p.provider_id, {
          exists: true,
          hasEmail,
          isArchived: false,
          isClaimed,
        });
      }
    }

    // DEBUG: Summarize provider status
    let debugExists = 0, debugClaimed = 0, debugHasEmail = 0, debugArchived = 0;
    for (const [, status] of providerStatus) {
      if (status.exists) debugExists++;
      if (status.isClaimed) debugClaimed++;
      if (status.hasEmail) debugHasEmail++;
      if (status.isArchived) debugArchived++;
    }
    console.log("[stats-debug] Provider status summary:", {
      total: providerStatus.size,
      exists: debugExists,
      claimed: debugClaimed,
      hasEmail: debugHasEmail,
      archived: debugArchived,
    });

    // A question truly needs email if:
    // 1. metadata.needs_provider_email === true
    // 2. question status is not archived/rejected
    // 3. question doesn't belong to another tab (Delivery Issues, Not Interested, No Contact)
    // 4. provider exists
    // 5. provider is not archived
    // 6. provider is not claimed (claimed providers have email from claiming)
    // 7. provider doesn't already have email
    const isNeedsEmail = (r: (typeof allRows)[number]) => {
      const meta = r.metadata as Record<string, unknown> | null | undefined;
      if (meta?.needs_provider_email !== true) return false;
      if (r.status === "archived" || r.status === "rejected") return false;
      // Exclude questions belonging to other tabs (must match potentialNeedsEmail filter)
      if (meta?.email_dead === true) return false;  // → Delivery Issues tab
      if (meta?.provider_not_interested === true) return false;  // → Not Interested tab
      if (meta?.provider_no_contact === true) return false;  // → No Contact tab

      const status = providerStatus.get(r.provider_id);
      if (!status?.exists) return false; // Provider doesn't exist
      if (status.isArchived) return false; // Provider is archived
      if (status.isClaimed) return false; // Provider is claimed
      if (status.hasEmail) return false; // Provider already has email

      return true;
    };

    const inRange = (t: Date) => (from ? t >= from : true) && (dateTo ? t < to : true);
    const inPrior = (t: Date) => !!priorFrom && !!from && t >= priorFrom && t < from;

    // KPI: needs-email count in the current range + prior window for delta
    // Count UNIQUE PROVIDERS (not questions) to match tab count behavior
    const kpiCurrentProviders = new Set<string>();
    const kpiPriorProviders = new Set<string>();
    for (const r of allRows) {
      if (!isNeedsEmail(r)) continue;
      const t = new Date(r.created_at);
      if (inRange(t)) kpiCurrentProviders.add(r.provider_id);
      else if (inPrior(t)) kpiPriorProviders.add(r.provider_id);
    }
    const kpiCurrent = kpiCurrentProviders.size;
    const kpiPrior = kpiPriorProviders.size;

    // DEBUG: Final KPI results
    console.log("[stats-debug] Final KPI:", { kpiCurrent, kpiPrior });

    let delta: number | null = null;
    if (from) {
      if (kpiPrior === 0) delta = kpiCurrent > 0 ? 100 : 0;
      else delta = Math.round(((kpiCurrent - kpiPrior) / kpiPrior) * 100);
    }

    // Series: ALL questions per bucket in the current range
    const seriesTimestamps = allRows.map((r) => new Date(r.created_at)).filter(inRange);
    const bucket: Bucket = from
      ? resolveBucket(from, to)
      : resolveBucket(seriesTimestamps[0] ?? now, now);
    const seriesStart = from ?? seriesTimestamps[0] ?? now;
    const series = buildSeries(seriesTimestamps, seriesStart, to, bucket);

    return NextResponse.json({ total: kpiCurrent, delta, series, bucket });
  } catch (err) {
    console.error("Admin questions stats fatal:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
