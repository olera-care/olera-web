/**
 * Local warmer for the market-diagnostic cache — mirrors app/api/admin/market-backfill
 * (warm branch) but runs from the CLI so we can warm a few real cities and watch
 * cost/quality without the deployed route's admin-session / WAF friction.
 *
 * Writes to the SAME shared Supabase `market_diagnostics` table the live serve route reads
 * (single instance for staging+prod), so warmed cities are immediately cache-hits in prod.
 *
 * Usage:
 *   npx tsx scripts/market-diagnostic/warm-cities.ts --dry "Round Rock,TX" "Naperville,IL"
 *   npx tsx scripts/market-diagnostic/warm-cities.ts "Round Rock,TX,homecare"
 * Each positional arg = "City,ST" or "City,ST,careType" (careType default homecare).
 */
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { resolveCity, normCareType } from "../../lib/market-diagnostic/resolve";
import { computeMarket } from "../../lib/market-diagnostic/compute";

// --- load env from the canonical .env.local (memory: reference_supabase_credentials) ---
const ENV_PATH = path.join(homedir(), "Desktop/olera-web/.env.local");
for (const line of readFileSync(ENV_PATH, "utf8").split("\n")) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (!m) continue;
  let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  if (!(m[1] in process.env)) process.env[m[1]] = v;
}

const MONTHLY_CAP_USD = 300;

function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key);
}

async function monthSpendUsd(client: ReturnType<typeof db>): Promise<number> {
  const now = new Date();
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
  const { data, error } = await client.from("market_diagnostics").select("cost_estimate").gte("generated_at", monthStart);
  if (error) { console.error("[warm] monthSpend:", error.message); return 0; }
  return (data || []).reduce((s: number, r: { cost_estimate: number | null }) => s + (Number(r.cost_estimate) || 0), 0);
}

function parseArg(a: string): { city: string; state: string; careType: string | null } {
  const parts = a.split(",").map((s) => s.trim());
  return { city: parts[0], state: parts[1], careType: parts[2] || null };
}

async function main() {
  const args = process.argv.slice(2);
  const dry = args.includes("--dry");
  const cities = args.filter((a) => !a.startsWith("--")).map(parseArg);
  if (!cities.length) { console.error("no cities given"); process.exit(1); }

  const client = db();

  console.log(`\n=== ${dry ? "DRY RESOLVE" : "WARM"} ${cities.length} cities ===`);
  for (const { city, state, careType } of cities) {
    const resolved = resolveCity(city, state);
    if (!resolved) { console.log(`✗ ${city}, ${state} — NOT RESOLVABLE`); continue; }
    const ct = normCareType(careType);
    if (dry) {
      console.log(`✓ ${city}, ${resolved.state} [${ct}] — lat ${resolved.lat.toFixed(3)} lng ${resolved.lng.toFixed(3)}, pop ${resolved.population ?? "?"}, ${resolved.zctas.length} ZCTAs`);
      continue;
    }

    const spend = await monthSpendUsd(client);
    if (spend >= MONTHLY_CAP_USD) { console.log(`✗ budget reached ($${spend.toFixed(2)}/$${MONTHLY_CAP_USD}) — stopping`); break; }

    const key = { city: city.trim().toLowerCase(), state: state.trim().toUpperCase(), careType: ct };
    await client.from("market_diagnostics").upsert(
      { city: key.city, state: key.state, care_type: key.careType, status: "pending", claimed_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { onConflict: "city,state,care_type" },
    );

    const t0 = Date.now();
    try {
      const { analysis, costEstimate } = await computeMarket(city, state, careType);
      await client.from("market_diagnostics").update({
        status: "ready", data: analysis, error: null, cost_estimate: costEstimate,
        generated_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      }).eq("city", key.city).eq("state", key.state).eq("care_type", key.careType);
      const a = analysis as { competitorLandscape?: { count?: number; topShareOfVoice?: { name?: string; sharePct?: number } }; referralGraph?: { totalViableSources?: number }; demand?: unknown };
      const cl = a.competitorLandscape;
      const top = cl?.topShareOfVoice;
      console.log(
        `✓ ${city}, ${resolved.state} [${ct}] — ${((Date.now() - t0) / 1000).toFixed(0)}s, $${costEstimate.toFixed(2)}, ` +
        `${cl?.count ?? "?"} competitors${top?.name ? ` (top: ${top.name} ${top.sharePct ?? "?"}%)` : ""}, ${a.referralGraph?.totalViableSources ?? "?"} referral sources`,
      );
    } catch (e) {
      const msg = (e as Error).message;
      await client.from("market_diagnostics").update({ status: "failed", error: msg.slice(0, 500), updated_at: new Date().toISOString() })
        .eq("city", key.city).eq("state", key.state).eq("care_type", key.careType);
      console.log(`✗ ${city}, ${state} [${ct}] — FAILED: ${msg}`);
    }
  }

  const spend = await monthSpendUsd(client);
  console.log(`\nMonth-to-date compute spend: $${spend.toFixed(2)} / $${MONTHLY_CAP_USD}\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
