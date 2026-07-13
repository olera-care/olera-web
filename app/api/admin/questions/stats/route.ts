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

    // Get unique provider IDs from questions that might need email
    const potentialNeedsEmail = allRows.filter((r) => {
      const meta = r.metadata as Record<string, unknown> | null | undefined;
      return meta?.needs_provider_email === true && r.status !== "archived" && r.status !== "rejected";
    });
    const providerIds = [...new Set(potentialNeedsEmail.map((r) => r.provider_id).filter(Boolean))];

    // Build map of provider status: { exists, hasEmail, isArchived }
    const providerStatus = new Map<string, { exists: boolean; hasEmail: boolean; isArchived: boolean }>();

    // Initialize all as non-existent
    for (const id of providerIds) {
      providerStatus.set(id, { exists: false, hasEmail: false, isArchived: false });
    }

    // Only query if we have provider IDs to look up
    if (providerIds.length > 0) {
      // Look up providers in business_profiles by slug OR source_provider_id
      // Questions may use slugs OR alphanumeric provider_ids (which are source_provider_id)
      const bpOrConditions: string[] = [
        `slug.in.(${providerIds.map(s => `"${s}"`).join(',')})`,
        `source_provider_id.in.(${providerIds.map(s => `"${s}"`).join(',')})`,
      ];
      const { data: bpProviders } = await db
        .from("business_profiles")
        .select("slug, email, is_active, source_provider_id")
        .or(bpOrConditions.join(','));

      // Collect source_provider_ids for fallback email lookup (providers without email on business_profiles)
      const sourceProviderIds = (bpProviders ?? [])
        .filter((p) => p.source_provider_id && !p.email)
        .map((p) => p.source_provider_id as string);

      // Build OR conditions for olera-providers query
      // We need to look up by:
      // 1. slug IN providerIds (for providers where question.provider_id is a slug)
      // 2. provider_id IN providerIds (for providers where question.provider_id is an alphanumeric ID)
      // 3. provider_id IN sourceProviderIds (for fallback email lookup via business_profiles link)
      const orConditions: string[] = [];
      if (providerIds.length > 0) {
        orConditions.push(`slug.in.(${providerIds.map(s => `"${s}"`).join(',')})`);
        orConditions.push(`provider_id.in.(${providerIds.map(s => `"${s}"`).join(',')})`);
      }
      if (sourceProviderIds.length > 0) {
        orConditions.push(`provider_id.in.(${sourceProviderIds.map(s => `"${s}"`).join(',')})`);
      }

      // Look up providers in olera-providers
      const { data: oleraProviders } = orConditions.length > 0
        ? await db
            .from("olera-providers")
            .select("slug, email, provider_id")
            .or(orConditions.join(','))
            .not("deleted", "is", true)
        : { data: [] };

      // Build olera email lookup by provider_id for fallback
      const oleraEmailByProviderId = new Map<string, string>();
      for (const p of oleraProviders ?? []) {
        if (p.provider_id && p.email) oleraEmailByProviderId.set(p.provider_id, p.email);
      }

      // Update from business_profiles - update BOTH by slug AND source_provider_id
      // Questions may use either as provider_id
      for (const p of bpProviders ?? []) {
        const hasEmail = !!p.email || (p.source_provider_id ? !!oleraEmailByProviderId.get(p.source_provider_id) : false);
        const status = { exists: true, hasEmail, isArchived: p.is_active === false };
        if (p.slug) {
          providerStatus.set(p.slug, status);
        }
        if (p.source_provider_id && p.source_provider_id !== p.slug) {
          providerStatus.set(p.source_provider_id, status);
        }
      }

      // Update from olera-providers (only if not already found via business_profiles)
      // We need to update BOTH by slug AND by provider_id, because questions may reference
      // providers using either value
      for (const p of oleraProviders ?? []) {
        const status = { exists: true, hasEmail: !!p.email, isArchived: false };

        // Update by slug if present and not already found
        if (p.slug && !providerStatus.get(p.slug)?.exists) {
          providerStatus.set(p.slug, status);
        }

        // Also update by provider_id if different from slug and not already found
        // This handles cases where question.provider_id is the alphanumeric ID, not the slug
        if (p.provider_id && p.provider_id !== p.slug && !providerStatus.get(p.provider_id)?.exists) {
          providerStatus.set(p.provider_id, status);
        }
      }
    }

    // A question truly needs email if:
    // 1. metadata.needs_provider_email === true
    // 2. metadata.email_dead !== true (belongs in Delivery Issues)
    // 3. metadata.provider_not_interested !== true (belongs in Not Interested)
    // 4. question status is not archived/rejected
    // 5. provider exists
    // 6. provider is not archived
    // 7. provider doesn't already have email
    const isNeedsEmail = (r: (typeof allRows)[number]) => {
      const meta = r.metadata as Record<string, unknown> | null | undefined;
      if (meta?.needs_provider_email !== true) return false;
      if (meta?.email_dead === true) return false; // Belongs in Delivery Issues
      if (meta?.provider_not_interested === true) return false; // Belongs in Not Interested
      if (r.status === "archived" || r.status === "rejected") return false;

      const status = providerStatus.get(r.provider_id);
      if (!status?.exists) return false; // Provider doesn't exist
      if (status.isArchived) return false; // Provider is archived
      if (status.hasEmail) return false; // Provider already has email

      return true;
    };

    const inRange = (t: Date) => (from ? t >= from : true) && (dateTo ? t < to : true);
    const inPrior = (t: Date) => !!priorFrom && !!from && t >= priorFrom && t < from;

    // KPI: needs-email PROVIDER count (unique) in the current range + prior window for delta
    // We count providers, not questions, since the questions page operates at provider level
    const currentProviders = new Set<string>();
    const priorProviders = new Set<string>();
    for (const r of allRows) {
      if (!isNeedsEmail(r)) continue;
      const t = new Date(r.created_at);
      if (inRange(t)) currentProviders.add(r.provider_id);
      else if (inPrior(t)) priorProviders.add(r.provider_id);
    }
    const kpiCurrent = currentProviders.size;
    const kpiPrior = priorProviders.size;

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
