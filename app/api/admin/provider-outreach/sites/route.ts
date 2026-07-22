import { NextRequest, NextResponse } from "next/server";
import { getAuthUser, getAdminUser, getServiceClient } from "@/lib/admin";

/**
 * GET /api/admin/provider-outreach/sites
 *
 * Returns loaded states with city-level breakdown.
 *
 * Query params:
 *   ?loaded=NY,CA          -- which states to include
 *   ?cities_for=CA         -- return city breakdown for this state
 *
 * State-level response:  { rows: SiteRow[] }
 * City-level response:   { cities: CityRow[] }
 */

const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DC: "District of Columbia", DE: "Delaware",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  MA: "Massachusetts", MD: "Maryland", ME: "Maine", MI: "Michigan", MN: "Minnesota",
  MO: "Missouri", MS: "Mississippi", MT: "Montana", NC: "North Carolina",
  ND: "North Dakota", NE: "Nebraska", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NV: "Nevada", NY: "New York", OH: "Ohio", OK: "Oklahoma",
  OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah", VA: "Virginia",
  VT: "Vermont", WA: "Washington", WI: "Wisconsin", WV: "West Virginia", WY: "Wyoming",
};

const IN_SEQUENCE_STATUSES = new Set(["in_sequence", "paused", "send_ready"]);
const CLAIMED_STATUSES = new Set(["claimed"]);

interface Agg {
  total: number;
  has_email: number;
  needs_email: number;
  not_contacted: number;
  in_sequence: number;
  claimed: number;
  needs_human: number;
}

function emptyAgg(): Agg {
  return { total: 0, has_email: 0, needs_email: 0, not_contacted: 0, in_sequence: 0, claimed: 0, needs_human: 0 };
}

export async function GET(_req: NextRequest) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = await getAdminUser(user.id);
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const url = new URL(_req.url);
  const citiesFor = url.searchParams.get("cities_for")?.toUpperCase();
  const providersFor = url.searchParams.get("providers_for"); // all | called | claimed | left_to_call
  const db = getServiceClient();

  // ── Provider-level list for stat card drilldowns ────────────────────────
  if (providersFor) {
    // Try provider_outreach first
    const { data: poRows, error: poErr } = await db
      .from("provider_outreach")
      .select("provider_id, provider_name, provider_category, city, state, email, phone, status, sequence_status")
      .order("provider_name", { ascending: true });

    if (!poErr && poRows && poRows.length > 0) {
      type ProvRow = { provider_id: string; provider_name: string; provider_category: string | null; city: string | null; state: string | null; email: string | null; phone: string | null; status: string; sequence_status: string };
      let filtered = poRows as unknown as ProvRow[];

      if (providersFor === "called") {
        filtered = filtered.filter((r) => IN_SEQUENCE_STATUSES.has(r.status));
      } else if (providersFor === "claimed") {
        filtered = filtered.filter((r) => CLAIMED_STATUSES.has(r.status));
      } else if (providersFor === "left_to_call") {
        filtered = filtered.filter((r) => !IN_SEQUENCE_STATUSES.has(r.status) && !CLAIMED_STATUSES.has(r.status));
      }
      // "all" returns everything

      return NextResponse.json({
        providers: filtered.map((r) => ({
          provider_id: r.provider_id,
          name: r.provider_name,
          category: r.provider_category,
          city: r.city,
          state: r.state,
          email: r.email,
          phone: r.phone,
          status: r.status,
        })),
      });
    }

    // Fallback: olera-providers (no status tracking, so only "all" and "left_to_call" make sense)
    let allRows: Array<{ provider_id: string; provider_name: string; provider_category: string | null; city: string | null; state: string | null; email: string | null; phone: string | null }> = [];
    let offset = 0;
    while (true) {
      const { data: batch, error: bErr } = await db
        .from("olera-providers")
        .select("provider_id, provider_name, provider_category, city, state, email, phone")
        .eq("deleted", false)
        .order("provider_name", { ascending: true })
        .range(offset, offset + 999);
      if (bErr || !batch || batch.length === 0) break;
      allRows = allRows.concat(batch as typeof allRows);
      if (batch.length < 1000) break;
      offset += 1000;
    }

    return NextResponse.json({
      providers: allRows.map((r) => ({
        provider_id: r.provider_id,
        name: r.provider_name,
        category: r.provider_category,
        city: r.city,
        state: r.state,
        email: r.email,
        phone: r.phone,
        status: "not_contacted",
      })),
      fallback: true,
    });
  }

  // ── City breakdown for a single state ─────────────────────────────────
  if (citiesFor) {
    // Try provider_outreach first
    const { data: poRows, error: poErr } = await db
      .from("provider_outreach")
      .select("city, state, status, email")
      .eq("state", citiesFor);

    if (!poErr && poRows && poRows.length > 0) {
      const byCity: Record<string, { city: string; state: string; total: number; has_email: number; in_sequence: number; claimed: number }> = {};

      for (const r of poRows as Array<{ city: string | null; state: string; status: string; email: string | null }>) {
        const c = r.city || "(unknown)";
        if (!byCity[c]) byCity[c] = { city: c, state: citiesFor, total: 0, has_email: 0, in_sequence: 0, claimed: 0 };
        byCity[c].total++;
        if (r.email) byCity[c].has_email++;
        if (IN_SEQUENCE_STATUSES.has(r.status)) byCity[c].in_sequence++;
        if (CLAIMED_STATUSES.has(r.status)) byCity[c].claimed++;
      }

      return NextResponse.json({
        cities: Object.values(byCity).sort((a, b) => b.total - a.total),
      });
    }

    // Fallback: olera-providers
    let allRows: Array<{ city: string | null; state: string; email: string | null }> = [];
    let offset = 0;
    while (true) {
      const { data: batch, error: bErr } = await db
        .from("olera-providers")
        .select("city, state, email")
        .eq("deleted", false)
        .eq("state", citiesFor)
        .range(offset, offset + 999);
      if (bErr || !batch || batch.length === 0) break;
      allRows = allRows.concat(batch as Array<{ city: string | null; state: string; email: string | null }>);
      if (batch.length < 1000) break;
      offset += 1000;
    }

    const byCity: Record<string, { city: string; state: string; total: number; has_email: number; in_sequence: number; claimed: number }> = {};
    for (const r of allRows) {
      const c = r.city || "(unknown)";
      if (!byCity[c]) byCity[c] = { city: c, state: citiesFor, total: 0, has_email: 0, in_sequence: 0, claimed: 0 };
      byCity[c].total++;
      if (r.email) byCity[c].has_email++;
    }

    return NextResponse.json({
      cities: Object.values(byCity).sort((a, b) => b.total - a.total),
    });
  }

  // ── State-level summary ───────────────────────────────────────────────

  // Try provider_outreach first
  const { data: poRows, error: poErr } = await db
    .from("provider_outreach")
    .select("state, status, email");

  if (!poErr && poRows && poRows.length > 0) {
    const byState: Record<string, Agg> = {};

    for (const r of poRows as Array<{ state: string | null; status: string; email: string | null }>) {
      const s = r.state || "(unknown)";
      if (!byState[s]) byState[s] = emptyAgg();
      const agg = byState[s];
      agg.total++;
      if (r.email) agg.has_email++; else agg.needs_email++;
      if (CLAIMED_STATUSES.has(r.status)) agg.claimed++;
      else if (IN_SEQUENCE_STATUSES.has(r.status)) agg.in_sequence++;
      else agg.not_contacted++;
    }

    const sites = Object.entries(byState)
      .map(([state, data]) => ({ state, name: STATE_NAMES[state] || state, ...data }))
      .sort((a, b) => b.total - a.total);

    return NextResponse.json({ rows: sites });
  }

  // Fallback: read from olera-providers
  const loadedParam = url.searchParams.get("loaded");
  const loadedStates = loadedParam ? loadedParam.split(",").map((s) => s.trim().toUpperCase()) : [];

  if (loadedStates.length === 0) {
    return NextResponse.json({ rows: [], fallback: true });
  }

  const { data: dirRows, error: dirErr } = await db
    .from("olera-providers")
    .select("state, email")
    .eq("deleted", false)
    .in("state", loadedStates);

  if (dirErr) {
    return NextResponse.json({ error: dirErr.message }, { status: 500 });
  }

  const byState: Record<string, Agg> = {};

  for (const r of dirRows || []) {
    const s = (r as { state: string | null }).state || "(unknown)";
    if (!byState[s]) byState[s] = emptyAgg();
    const agg = byState[s];
    agg.total++;
    if ((r as { email: string | null }).email) agg.has_email++; else agg.needs_email++;
    agg.not_contacted++;
  }

  const sites = Object.entries(byState)
    .map(([state, data]) => ({ state, name: STATE_NAMES[state] || state, ...data }))
    .sort((a, b) => b.total - a.total);

  return NextResponse.json({ rows: sites, fallback: true });
}
