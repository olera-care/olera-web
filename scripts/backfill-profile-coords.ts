/**
 * One-time, idempotent backfill of business_profiles.lat/lng (historically null for
 * every row). Powers the "families near you" catchment + the Near You browse tab.
 *
 *   - Claimed providers (source_provider_id set) → EXACT coords from olera-providers.lat/lon
 *   - Everyone else with a city (care seekers + unlinked/test providers) → city-center coords
 *     resolved from the canonical city dataset (approximate, fine for a ~50mi catchment)
 *
 * Only fills rows whose lat is currently null, so it never clobbers more-precise coords
 * and is safe to re-run. This is a hand-run tool (the safety valve), NOT a scheduled job —
 * new rows get coords at write-time (sync-intent-to-profile, claim-finalize, intake inserts).
 *
 *   npx tsx scripts/backfill-profile-coords.ts          # dry run (counts only)
 *   npx tsx scripts/backfill-profile-coords.ts --apply  # write
 */
import { readFileSync } from "node:fs"; import { homedir } from "node:os"; import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { resolveCity } from "../lib/market-diagnostic/resolve";

for (const l of readFileSync(path.join(homedir(), "Desktop/olera-web/.env.local"), "utf8").split("\n")) {
  const m = l.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/); if (!m) continue; let v = m[2].trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
  if (!(m[1] in process.env)) process.env[m[1]] = v;
}

const APPLY = process.argv.includes("--apply");
type Row = { id: string; type: string; source_provider_id: string | null; city: string | null; state: string | null };

async function main() {
  const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // 1. Page through every profile missing coords.
  const rows: Row[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await db.from("business_profiles")
      .select("id,type,source_provider_id,city,state")
      .is("lat", null).range(from, from + 999);
    if (error) throw new Error(error.message);
    rows.push(...(data as Row[]));
    if (!data || data.length < 1000) break;
  }
  console.log(`Profiles missing coords: ${rows.length}`);

  // 2. Exact coords for linked providers, in one batched pass.
  const srcIds = [...new Set(rows.map((r) => r.source_provider_id).filter(Boolean))] as string[];
  const opCoords = new Map<string, { lat: number; lng: number }>();
  for (let i = 0; i < srcIds.length; i += 500) {
    const { data } = await db.from("olera-providers").select("provider_id,lat,lon").in("provider_id", srcIds.slice(i, i + 500));
    for (const p of (data || []) as { provider_id: string; lat: number | null; lon: number | null }[]) {
      if (p.lat != null && p.lon != null) opCoords.set(p.provider_id, { lat: p.lat, lng: p.lon });
    }
  }

  // 3. Resolve coords per row.
  const updates: { id: string; lat: number; lng: number }[] = [];
  let viaOlera = 0, viaCity = 0, unresolved = 0;
  for (const r of rows) {
    const exact = r.source_provider_id ? opCoords.get(r.source_provider_id) : undefined;
    if (exact) { updates.push({ id: r.id, ...exact }); viaOlera++; continue; }
    const city = r.city && r.state ? resolveCity(r.city, r.state) : null;
    if (city) { updates.push({ id: r.id, lat: city.lat, lng: city.lng }); viaCity++; continue; }
    unresolved++;
  }
  console.log(`Resolvable: ${updates.length}  (exact via olera-providers: ${viaOlera}, city-center: ${viaCity})`);
  console.log(`Unresolvable (no link + no/unknown city): ${unresolved}`);

  if (!APPLY) { console.log("\nDRY RUN — re-run with --apply to write."); return; }

  // 4. Write, in concurrent chunks.
  let done = 0;
  for (let i = 0; i < updates.length; i += 25) {
    await Promise.all(updates.slice(i, i + 25).map((u) =>
      db.from("business_profiles").update({ lat: u.lat, lng: u.lng }).eq("id", u.id)));
    done += Math.min(25, updates.length - i);
    if (done % 200 < 25) console.log(`  ${done}/${updates.length}`);
  }
  console.log(`\nDone — wrote coords to ${updates.length} profiles.`);
}
main().catch((e) => { console.error(e); process.exit(1); });
