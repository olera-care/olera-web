import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";
import { PARTNER_UNIVERSITIES } from "@/lib/staffing-outreach/partner-universities";

/**
 * GET /api/admin/medjobs/campuses
 *
 * Returns every campus with derived operational state. Powers the
 * Campuses tab — the single place where campus research lives in v9.0.
 *
 * Each row carries:
 *   - stage: 'provider_prospecting' | 'stakeholder_prospecting' | 'active'
 *   - research_complete: boolean (controls 'active' transition)
 *   - client_count: providers in catchment that are clients (in pilot
 *     or subscribed) — gates the Stage 1 → Stage 2 unlock
 *   - stakeholder_count: stakeholders in research stage for this campus
 *   - last_added_at: most recent stakeholder created_at, for sort
 *
 * Stage semantics (monotonic — once unlocked, doesn't revert):
 *   provider_prospecting:    no clients in catchment yet
 *   stakeholder_prospecting: ≥1 client; research_complete=false
 *   active:                  research_complete=true
 */
export async function GET(_request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    const adminUser = await getAdminUser(user.id);
    if (!adminUser) return NextResponse.json({ error: "Access denied" }, { status: 403 });

    const db = getServiceClient();

    const [{ data: campuses }, { data: providers }, { data: stakeholders }] =
      await Promise.all([
        db
          .from("student_outreach_campuses")
          .select("id, slug, name, state, city, research_complete, is_active")
          .eq("is_active", true)
          .order("name", { ascending: true }),
        db
          .from("business_profiles")
          .select("city, state, metadata")
          .in("type", ["organization", "caregiver"]),
        db
          .from("student_outreach")
          .select("campus_id, status, created_at"),
      ]);

    type ProviderLite = {
      city: string | null;
      state: string | null;
      metadata: Record<string, unknown> | null;
    };
    const providerIndex = new Map<string, ProviderLite[]>();
    for (const p of (providers ?? []) as ProviderLite[]) {
      if (!p.city || !p.state) continue;
      const key = `${p.city.toLowerCase()}|${p.state}`;
      if (!providerIndex.has(key)) providerIndex.set(key, []);
      providerIndex.get(key)!.push(p);
    }

    const PILOT_MS = 90 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const isClientMeta = (m: Record<string, unknown> | null): boolean => {
      if (!m) return false;
      if (m.medjobs_subscription_active === true) return true;
      const accepted = m.interview_terms_accepted_at;
      if (typeof accepted !== "string") return false;
      const t = new Date(accepted).getTime();
      return !isNaN(t) && now - t < PILOT_MS;
    };

    const RESEARCH_STAGE = new Set(["prospect", "researched"]);
    const stakeholderCountByCampus = new Map<string, number>();
    const lastAddedByCampus = new Map<string, string>();
    for (const s of (stakeholders ?? []) as Array<{
      campus_id: string;
      status: string;
      created_at: string;
    }>) {
      if (RESEARCH_STAGE.has(s.status)) {
        stakeholderCountByCampus.set(
          s.campus_id,
          (stakeholderCountByCampus.get(s.campus_id) ?? 0) + 1,
        );
      }
      const cur = lastAddedByCampus.get(s.campus_id);
      if (!cur || s.created_at > cur) lastAddedByCampus.set(s.campus_id, s.created_at);
    }

    const rows = ((campuses ?? []) as Array<{
      id: string;
      slug: string;
      name: string;
      state: string | null;
      city: string | null;
      research_complete: boolean;
      is_active: boolean;
    }>).map((c) => {
      const uni = PARTNER_UNIVERSITIES.find((u) => u.slug === c.slug);
      let clientCount = 0;
      if (uni) {
        for (const cc of uni.catchment) {
          const key = `${cc.city.toLowerCase()}|${cc.state}`;
          for (const p of providerIndex.get(key) ?? []) {
            if (isClientMeta(p.metadata)) clientCount += 1;
          }
        }
      }
      const stakeholderCount = stakeholderCountByCampus.get(c.id) ?? 0;
      const lastAddedAt = lastAddedByCampus.get(c.id) ?? null;

      const stage: "provider_prospecting" | "stakeholder_prospecting" | "active" =
        c.research_complete
          ? "active"
          : clientCount > 0
            ? "stakeholder_prospecting"
            : "provider_prospecting";

      return {
        id: c.id,
        slug: c.slug,
        name: c.name,
        city: c.city,
        state: c.state,
        research_complete: c.research_complete,
        stage,
        client_count: clientCount,
        stakeholder_count: stakeholderCount,
        last_added_at: lastAddedAt,
      };
    });

    // Sort: research-needed first (Stage 2 unlocked, no stakeholders),
    // then in-progress research, then provider_prospecting, then active.
    const stagePriority: Record<string, number> = {
      stakeholder_prospecting_empty: 0,
      stakeholder_prospecting_progress: 1,
      provider_prospecting: 2,
      active: 3,
    };
    rows.sort((a, b) => {
      const akey =
        a.stage === "stakeholder_prospecting" && a.stakeholder_count === 0
          ? "stakeholder_prospecting_empty"
          : a.stage === "stakeholder_prospecting"
            ? "stakeholder_prospecting_progress"
            : a.stage;
      const bkey =
        b.stage === "stakeholder_prospecting" && b.stakeholder_count === 0
          ? "stakeholder_prospecting_empty"
          : b.stage === "stakeholder_prospecting"
            ? "stakeholder_prospecting_progress"
            : b.stage;
      const r = (stagePriority[akey] ?? 99) - (stagePriority[bkey] ?? 99);
      if (r !== 0) return r;
      return a.name.localeCompare(b.name);
    });

    return NextResponse.json({ rows, total: rows.length });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Internal error";
    console.error("[admin/medjobs/campuses] error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
