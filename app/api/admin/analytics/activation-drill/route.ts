import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { resolveCanonicalProviderKeys } from "@/lib/provider-id-variants";

/**
 * GET /api/admin/analytics/activation-drill
 *
 * The cohort-study drill behind the Provider Activation panel's 4 KPI
 * tiles. Returns the distinct providers behind one metric over a chosen
 * range — for understanding *who* and *what they did*, not an outbound
 * list. The summary panel stays a fixed-30d health read; THIS endpoint is
 * the flexible-range one (deliberate separation — they never share a
 * window).
 *
 * Query params:
 *   metric    claimed | profile_edits | answered | owner_story  (required)
 *   date_from ISO, inclusive. Omit (with date_to) for all-time.
 *   date_to   ISO, exclusive.
 *   offset    list pagination offset (default 0)
 *   limit     page size (default 50, max 200)
 *
 * Returns: { metric, total, has_more, providers: [{ provider_id,
 *   provider_name, last_at, count, sections }] }
 *
 * provider_id is canonicalized (olera-providers.slug space) so a provider
 * isn't split across id formats — same helper the summary + comms funnel
 * use post-#834.
 */
const METRICS = ["claimed", "profile_edits", "answered", "owner_story"] as const;
type Metric = (typeof METRICS)[number];

const EVENT_FOR: Record<Metric, string> = {
  claimed: "claim_completed",
  profile_edits: "provider_profile_edited",
  owner_story: "provider_profile_edited",
  answered: "question_responded",
};

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const admin = await getAdminUser(user.id);
    if (!admin) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const metric = searchParams.get("metric") as Metric | null;
    if (!metric || !(METRICS as readonly string[]).includes(metric)) {
      return NextResponse.json(
        { error: `metric must be one of: ${METRICS.join(", ")}` },
        { status: 400 },
      );
    }
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10) || 0);
    const limit = Math.min(
      200,
      Math.max(1, parseInt(searchParams.get("limit") || "50", 10) || 50),
    );

    const db = getServiceClient();
    const eventType = EVENT_FOR[metric];
    const ownerOnly = metric === "owner_story";

    // Paginated row scan, bounded so an all-time range can't run away.
    // Page size == the PostgREST max-rows ceiling; MAX caps the worst case
    // (the views/stats lesson). count of *distinct* providers comes from
    // the aggregation below, not a row count, so the cap never distorts
    // the headline — only the deepest tail of a pathological all-time pull.
    const PAGE = 10000;
    const MAX_ROWS = 200000;
    type Row = { provider_id: string | null; metadata: Record<string, unknown> | null; created_at: string };
    const rows: Row[] = [];
    for (let off = 0; off < MAX_ROWS; off += PAGE) {
      let q = db
        .from("provider_activity")
        .select("provider_id, metadata, created_at")
        .eq("event_type", eventType)
        .order("created_at", { ascending: false })
        .range(off, off + PAGE - 1);
      if (dateFrom) q = q.gte("created_at", dateFrom);
      if (dateTo) q = q.lt("created_at", dateTo);
      const { data, error } = await q;
      if (error) {
        console.error("[activation-drill] scan error:", error);
        return NextResponse.json({ error: "Failed to load drill" }, { status: 500 });
      }
      const batch = (data ?? []) as Row[];
      rows.push(...batch);
      if (batch.length < PAGE) break;
    }

    const rawIds = new Set<string>();
    for (const r of rows) if (r.provider_id) rawIds.add(r.provider_id);
    const canonMap = await resolveCanonicalProviderKeys(db, rawIds);
    const canon = (id: string): string => canonMap.get(id) ?? id;

    type Agg = { last_at: string; count: number; sections: Set<string> };
    const byProvider = new Map<string, Agg>();
    for (const r of rows) {
      if (!r.provider_id) continue;
      const section =
        typeof r.metadata?.section === "string" ? (r.metadata.section as string) : null;
      if (ownerOnly && section !== "owner") continue;
      const pid = canon(r.provider_id);
      const a = byProvider.get(pid);
      if (a) {
        a.count += 1;
        if (r.created_at > a.last_at) a.last_at = r.created_at;
        if (section) a.sections.add(section);
      } else {
        byProvider.set(pid, {
          last_at: r.created_at,
          count: 1,
          sections: new Set(section ? [section] : []),
        });
      }
    }

    const sorted = [...byProvider.entries()].sort((x, y) =>
      y[1].last_at.localeCompare(x[1].last_at),
    );
    const total = sorted.length;
    const pageEntries = sorted.slice(offset, offset + limit);

    // Names for the page slice only (cheap — ≤limit providers).
    const pageIds = pageEntries.map(([pid]) => pid);
    const nameByPid = new Map<string, string>();
    for (let i = 0; i < pageIds.length; i += 200) {
      const chunk = pageIds.slice(i, i + 200);
      const { data: opn } = await db
        .from("olera-providers")
        .select("slug, provider_name")
        .in("slug", chunk);
      for (const n of (opn ?? []) as Array<{ slug: string | null; provider_name: string | null }>) {
        if (n.slug && n.provider_name) nameByPid.set(n.slug, n.provider_name);
      }
    }
    const stillUnnamed = pageIds.filter((p) => !nameByPid.has(p));
    for (let i = 0; i < stillUnnamed.length; i += 200) {
      const chunk = stillUnnamed.slice(i, i + 200);
      const { data: bpn } = await db
        .from("business_profiles")
        .select("slug, display_name")
        .in("slug", chunk);
      for (const b of (bpn ?? []) as Array<{ slug: string | null; display_name: string | null }>) {
        if (b.slug && b.display_name) nameByPid.set(b.slug, b.display_name);
      }
    }

    const providers = pageEntries.map(([pid, a]) => ({
      provider_id: pid,
      provider_name: nameByPid.get(pid) ?? null,
      last_at: a.last_at,
      count: a.count,
      sections: [...a.sections].sort(),
    }));

    return NextResponse.json({
      metric,
      total,
      has_more: offset + limit < total,
      providers,
    });
  } catch (err) {
    console.error("[activation-drill] fatal:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
