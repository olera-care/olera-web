import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { getProviderProspectsInCatchment } from "@/lib/medjobs/catchment";
import { getClientStatus } from "@/lib/medjobs/clients";

/**
 * GET /api/admin/medjobs/provider-prospects?campus=<slug>
 *
 * Returns virtual provider prospects for a campus — providers that:
 *   - Live in the campus's catchment (matched by city + state)
 *   - Are NOT yet clients (no active pilot, no Stripe subscription)
 *   - Are NOT yet materialized in student_outreach (no kind='provider'
 *     row already exists for this provider × campus pair)
 *
 * Virtual rows are computed at-query-time and not stored. When admin
 * starts outreach on one (Phase 2 Tier 3.5 — deferred), a new
 * student_outreach row materializes with kind='provider' and the
 * provider drops off this list.
 *
 * If campus param is omitted, returns prospects across ALL campuses
 * (used by the dedicated /admin/medjobs/prospects page when no
 * campus filter is active). Cap at 200 rows to keep the response
 * lean.
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const adminUser = await getAdminUser(user.id);
    if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const campusSlug = searchParams.get("campus")?.trim() || null;

    const db = getServiceClient();

    // Resolve which campuses to scan.
    type CampusRow = { id: string; slug: string; name: string; state: string | null; city: string | null };
    let campuses: CampusRow[] = [];
    if (campusSlug) {
      const { data } = await db
        .from("student_outreach_campuses")
        .select("id, slug, name, state, city")
        .eq("slug", campusSlug)
        .eq("is_active", true)
        .maybeSingle();
      if (data) campuses = [data as CampusRow];
    } else {
      const { data } = await db
        .from("student_outreach_campuses")
        .select("id, slug, name, state, city")
        .eq("is_active", true);
      campuses = (data ?? []) as CampusRow[];
    }

    if (campuses.length === 0) {
      return NextResponse.json({ rows: [], total: 0 });
    }

    // Existing student_outreach rows with kind='provider' — these
    // providers have already been materialized for some campus and
    // shouldn't appear as virtual prospects again.
    // Check both provider_business_profile_id (legacy) and
    // research_data->olera_provider_id (new olera-providers based).
    const { data: existing } = await db
      .from("student_outreach")
      .select("provider_business_profile_id, campus_id, research_data")
      .eq("kind", "provider");
    const existingPairs = new Set<string>();
    for (const r of (existing ?? []) as Array<{
      provider_business_profile_id: string | null;
      campus_id: string;
      research_data: { olera_provider_id?: string } | null;
    }>) {
      // Support both legacy (provider_business_profile_id) and new (olera_provider_id)
      if (r.provider_business_profile_id) {
        existingPairs.add(`${r.provider_business_profile_id}|${r.campus_id}`);
      }
      if (r.research_data?.olera_provider_id) {
        existingPairs.add(`${r.research_data.olera_provider_id}|${r.campus_id}`);
      }
    }

    // Walk each campus, gather catchment providers, filter to non-clients
    // and non-materialized.
    type Row = {
      id: string;                  // virtual row id (provider_id|campus_id)
      provider_id: string;
      provider_name: string;
      city: string | null;
      state: string | null;
      campus_id: string;
      campus_slug: string;
      campus_name: string;
      created_at: string;          // provider's created_at
    };
    const rows: Row[] = [];

    for (const c of campuses) {
      const providers = await getProviderProspectsInCatchment(c.slug);
      for (const p of providers) {
        const status = getClientStatus(p.metadata);
        if (status.isClient) continue; // already a client
        if (existingPairs.has(`${p.id}|${c.id}`)) continue; // already materialized
        rows.push({
          id: `${p.id}|${c.id}`,
          provider_id: p.id,
          provider_name: p.display_name || "(unnamed provider)",
          city: p.city,
          state: p.state,
          campus_id: c.id,
          campus_slug: c.slug,
          campus_name: c.name,
          created_at: p.created_at,
        });
        if (rows.length >= 200) break;
      }
      if (rows.length >= 200) break;
    }

    // Sort: most recent provider creation first (newest agencies
    // surface to the top — likeliest to need outreach soon).
    rows.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({ rows, total: rows.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    console.error("[admin/medjobs/provider-prospects] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
