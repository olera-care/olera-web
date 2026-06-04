import { NextRequest, NextResponse } from "next/server";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { getServiceClient, getAuthUser, isMasterAdmin } from "@/lib/admin";
import { resolveCity } from "@/lib/market-diagnostic/resolve";
import { computeMarket } from "@/lib/market-diagnostic/compute";
import { normalizeKey, monthSpendUsd, MONTHLY_CAP_USD } from "@/lib/market-diagnostic/cache";

/**
 * Admin tool for the market-diagnostic cache (table: market_diagnostics).
 * Browser-triggerable (GET) per TJ's workflow — sign in as admin, hit the URL.
 *
 *   ?status                       — show cache contents + month-to-date compute spend (default)
 *   ?seed                         — upsert all committed data/market-diagnostic/*.analysis.json (College Station) as ready
 *   ?city=Round+Rock&state=TX&careType=homecare  — compute ONE city synchronously and cache it (warming)
 *   ?city=...&state=...&dry=true  — just resolve the geo (no spend), to sanity-check a city is known
 *
 * Synchronous compute is ~60-90s; the route allows up to 300s.
 */
export const maxDuration = 300;

export async function GET(req: NextRequest) { return handler(req); }
export async function POST(req: NextRequest) { return handler(req); }

const DIR = path.join(process.cwd(), "data/market-diagnostic");

async function handler(req: NextRequest) {
  const user = await getAuthUser();
  if (!user || !(await isMasterAdmin(user.id))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = getServiceClient();
  const url = new URL(req.url);
  const city = (url.searchParams.get("city") || "").trim();
  const state = (url.searchParams.get("state") || "").trim();
  const careType = url.searchParams.get("careType");
  const dry = url.searchParams.get("dry") === "true";

  // --- Seed committed snapshots (College Station) into the table ---
  if (url.searchParams.has("seed")) {
    let files: string[] = [];
    try { files = readdirSync(DIR).filter((f) => f.endsWith(".analysis.json")); } catch { /* none */ }
    const seeded: string[] = [];
    for (const f of files) {
      try {
        const data = JSON.parse(readFileSync(path.join(DIR, f), "utf8"));
        const m = data?.meta;
        if (!m?.city || !m?.state) continue;
        const key = normalizeKey(m.city, m.state, m.careType);
        const { error } = await db.from("market_diagnostics").upsert({
          city: key.city, state: key.state, care_type: key.careType,
          status: "ready", data, error: null, cost_estimate: 0,
          generated_at: m.generatedAt || new Date().toISOString(), updated_at: new Date().toISOString(),
        }, { onConflict: "city,state,care_type" });
        if (error) seeded.push(`${m.city}: ERR ${error.message}`);
        else seeded.push(`${m.city}, ${m.state} (${key.careType})`);
      } catch (e) { seeded.push(`${f}: ${(e as Error).message}`); }
    }
    return NextResponse.json({ ok: true, action: "seed", seeded });
  }

  // --- Warm a single city (compute now) ---
  if (city && state) {
    const resolved = resolveCity(city, state);
    if (!resolved) return NextResponse.json({ ok: false, error: `city not resolvable: ${city}, ${state}` }, { status: 422 });
    if (dry) return NextResponse.json({ ok: true, action: "dry", resolved });

    const spend = await monthSpendUsd(db);
    if (spend >= MONTHLY_CAP_USD) {
      return NextResponse.json({ ok: false, error: `monthly budget reached ($${spend.toFixed(2)}/$${MONTHLY_CAP_USD})` }, { status: 429 });
    }
    const key = normalizeKey(city, state, careType);
    // mark pending so the live serve route doesn't also start one
    await db.from("market_diagnostics").upsert({
      city: key.city, state: key.state, care_type: key.careType,
      status: "pending", claimed_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }, { onConflict: "city,state,care_type" });
    try {
      const { analysis, costEstimate } = await computeMarket(city, state, careType);
      await db.from("market_diagnostics").update({
        status: "ready", data: analysis, error: null, cost_estimate: costEstimate,
        generated_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      }).eq("city", key.city).eq("state", key.state).eq("care_type", key.careType);
      const cl = analysis.competitorLandscape as { count?: number };
      const rg = analysis.referralGraph as { totalViableSources?: number };
      return NextResponse.json({
        ok: true, action: "warm", city: `${city}, ${resolved.state}`, careType: key.careType,
        costEstimate, competitors: cl?.count, referralSources: rg?.totalViableSources,
      });
    } catch (e) {
      await db.from("market_diagnostics").update({ status: "failed", error: (e as Error).message.slice(0, 500), updated_at: new Date().toISOString() })
        .eq("city", key.city).eq("state", key.state).eq("care_type", key.careType);
      return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
    }
  }

  // --- Default: status report ---
  const { data: rows } = await db.from("market_diagnostics")
    .select("city,state,care_type,status,cost_estimate,generated_at,attempts,error")
    .order("updated_at", { ascending: false }).limit(200);
  const spend = await monthSpendUsd(db);
  const byStatus = (rows || []).reduce((a: Record<string, number>, r: { status: string }) => { a[r.status] = (a[r.status] || 0) + 1; return a; }, {});
  return NextResponse.json({
    ok: true, action: "status",
    monthSpend: `$${spend.toFixed(2)} / $${MONTHLY_CAP_USD}`,
    counts: byStatus, total: rows?.length || 0, rows,
  });
}
