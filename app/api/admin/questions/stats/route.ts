import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { buildSeries, resolveBucket, type Bucket } from "@/lib/admin-stats";

/**
 * GET /api/admin/questions/stats
 *
 * Returns stats for the PulseHeader. Two metrics from one query:
 *  - `total` / `delta`: needs-email backlog in the range (KPI)
 *  - `series`: ALL question creations per bucket (platform pulse chart)
 *  - `summary`: { new_today, answered_today } for stat boxes
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

    // Pull ALL questions for the series chart
    let allQ = db
      .from("provider_questions")
      .select("created_at, provider_id")
      .order("created_at", { ascending: true })
      .limit(50000);
    if (queryStart) allQ = allQ.gte("created_at", queryStart.toISOString());
    if (dateTo) allQ = allQ.lt("created_at", dateTo);

    // Pull needs_email questions using SAME filters as getTabCounts (Supabase filters, not JS)
    // This ensures the KPI matches the tab count exactly
    let needsEmailQ = db
      .from("provider_questions")
      .select("created_at, provider_id")
      .contains("metadata", { needs_provider_email: true })
      .not("metadata", "cs", '{"email_dead":true}')
      .not("metadata", "cs", '{"provider_not_interested":true}')
      .not("metadata", "cs", '{"provider_no_contact":true}')
      .neq("status", "archived")
      .neq("status", "rejected")
      .order("created_at", { ascending: true })
      .limit(50000);
    if (queryStart) needsEmailQ = needsEmailQ.gte("created_at", queryStart.toISOString());
    if (dateTo) needsEmailQ = needsEmailQ.lt("created_at", dateTo);

    const [allResult, needsEmailResult] = await Promise.all([allQ, needsEmailQ]);

    if (allResult.error) {
      console.error("Admin questions stats error:", allResult.error);
      return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
    }

    const allRows = allResult.data ?? [];
    const needsEmailRows = needsEmailResult.data ?? [];

    const providerIds = [...new Set(needsEmailRows.map((r) => r.provider_id).filter(Boolean))];

    // Batch provider lookups to avoid URL length limits (50 IDs per batch)
    // Run bp and olera queries in parallel within each batch for speed
    const BATCH_SIZE = 50;
    const bpProviders: { slug: string | null; email: string | null; is_active: boolean | null; source_provider_id: string | null; account_id: string | null }[] = [];
    const oleraProviders: { slug: string | null; email: string | null; provider_id: string | null }[] = [];

    const statsBatchPromises = [];
    for (let i = 0; i < providerIds.length; i += BATCH_SIZE) {
      const batch = providerIds.slice(i, i + BATCH_SIZE);
      const bpOrConditions = [
        `slug.in.(${batch.map(s => `"${s}"`).join(',')})`,
        `source_provider_id.in.(${batch.map(s => `"${s}"`).join(',')})`
      ];
      const oleraOrConditions = [
        `slug.in.(${batch.map(s => `"${s}"`).join(',')})`,
        `provider_id.in.(${batch.map(s => `"${s}"`).join(',')})`
      ];
      statsBatchPromises.push(
        Promise.all([
          db.from("business_profiles").select("slug, email, is_active, source_provider_id, account_id").or(bpOrConditions.join(',')),
          db.from("olera-providers").select("slug, email, provider_id").or(oleraOrConditions.join(',')).not("deleted", "is", true)
        ])
      );
    }
    const statsBatchResults = await Promise.all(statsBatchPromises);
    for (const [bpResult, oleraResult] of statsBatchResults) {
      if (bpResult.data) bpProviders.push(...bpResult.data);
      if (oleraResult.data) oleraProviders.push(...oleraResult.data);
    }

    // Build olera email lookup by provider_id
    const oleraEmailByProviderId = new Map<string, string>();
    for (const p of oleraProviders ?? []) {
      if (p.provider_id && p.email) oleraEmailByProviderId.set(p.provider_id, p.email);
    }

    // Reverse lookup: find business_profiles linked via source_provider_id for claim status (batched)
    const oleraProviderIdsToCheck = (oleraProviders ?? [])
      .map(p => p.provider_id)
      .filter((id): id is string => !!id);
    const linkedBpForStats: { source_provider_id: string | null; email: string | null; account_id: string | null }[] = [];
    for (let i = 0; i < oleraProviderIdsToCheck.length; i += BATCH_SIZE) {
      const batch = oleraProviderIdsToCheck.slice(i, i + BATCH_SIZE);
      const { data } = await db
        .from("business_profiles")
        .select("source_provider_id, email, account_id")
        .in("source_provider_id", batch);
      if (data) linkedBpForStats.push(...data);
    }
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

    // Check if a provider passes the status filters
    // (metadata filters already applied by Supabase query)
    const isProviderValid = (providerId: string) => {
      const status = providerStatus.get(providerId);
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
    // Use needsEmailRows (already filtered by Supabase) instead of allRows
    const kpiCurrentProviders = new Set<string>();
    const kpiPriorProviders = new Set<string>();
    for (const r of needsEmailRows) {
      if (!isProviderValid(r.provider_id)) continue;
      const t = new Date(r.created_at);
      if (inRange(t)) kpiCurrentProviders.add(r.provider_id);
      else if (inPrior(t)) kpiPriorProviders.add(r.provider_id);
    }
    const kpiCurrent = kpiCurrentProviders.size;
    const kpiPrior = kpiPriorProviders.size;

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

    // Summary stats: new_today and answered_today
    // Use UTC midnight to avoid timezone drift between server and database
    const todayStart = new Date(now);
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayIso = todayStart.toISOString();

    // Questions created today (regardless of status)
    const { count: newTodayCount } = await db
      .from("provider_questions")
      .select("id", { count: "exact", head: true })
      .gte("created_at", todayIso);

    // Questions answered today (approximation using updated_at)
    // Note: updated_at changes on ANY edit, not just when answered. Without an
    // answered_at timestamp, this is the best approximation. May slightly
    // overcount if answered questions are edited after the fact.
    const { count: answeredTodayCount } = await db
      .from("provider_questions")
      .select("id", { count: "exact", head: true })
      .eq("status", "answered")
      .not("answer", "is", null)
      .gte("updated_at", todayIso);

    const summary = {
      new_today: newTodayCount ?? 0,
      answered_today: answeredTodayCount ?? 0,
    };

    return NextResponse.json({ total: kpiCurrent, delta, series, bucket, summary });
  } catch (err) {
    console.error("Admin questions stats fatal:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
