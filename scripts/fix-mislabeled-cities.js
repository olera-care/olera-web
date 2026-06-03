/**
 * Fix mislabeled city/state on olera-providers rows.
 *
 * A legacy import batch wrote wrong city/state on a swath of rows (the
 * "Navasota, TX" bucket actually contains Bryan/College Station agencies,
 * out-of-area TX rows, and even Florida ones). lat/lon are accurate; city/
 * state are not. This reverse-geocodes lat/lon → true city/state and fixes
 * mismatches.
 *
 * Usage (run from a checkout with node_modules + .env.local):
 *   node scripts/fix-mislabeled-cities.js --city "Navasota" --state TX          # dry-run
 *   node scripts/fix-mislabeled-cities.js --city "Navasota" --state TX --apply  # write
 */

const path = require("path");
const os = require("os");
require("dotenv").config({ path: path.join(os.homedir(), "Desktop/olera-web/.env.local") });
const { createClient } = require("@supabase/supabase-js");

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const KEY = process.env.GOOGLE_PLACES_API_KEY;

const fs = require("fs");
const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const AUDIT = args.includes("--audit");
const AUDIT_FIX = args.includes("--audit-fix");
const arg = (f) => { const i = args.indexOf(f); return i >= 0 ? args[i + 1] : null; };
const CITY = arg("--city");
const STATE = arg("--state");
const TOP = arg("--top") ? parseInt(arg("--top"), 10) : null;
const KM = (lat1, lon1, lat2, lon2) => {
  const R = 6371, d = Math.PI / 180;
  const a = Math.sin((lat2 - lat1) * d / 2) ** 2 +
    Math.cos(lat1 * d) * Math.cos(lat2 * d) * Math.sin((lon2 - lon1) * d / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

// Directory-wide audit: flag rows whose lat/lon is far from their STATED
// city's true location (reference: public/data/cities-tier2.json). Free —
// no per-row geocoding. Sizes the city/state mislabel corruption.
async function runAudit() {
  const THRESH_KM = 50;
  const ref = new Map(); // "city|ST" -> [lat, lon]
  const cities = JSON.parse(fs.readFileSync(path.join(__dirname, "../public/data/cities-tier2.json"), "utf8"));
  for (const [name, st, , lat, lon] of cities) ref.set(`${name.toLowerCase()}|${st}`, [lat, lon]);
  console.log(`Reference cities: ${ref.size}. Threshold: ${THRESH_KM}km.\n`);

  let total = 0, noCoord = 0, noRef = 0, okRows = 0;
  const flaggedByCity = new Map();
  let from = 0;
  for (;;) {
    const { data, error } = await db
      .from("olera-providers")
      .select("provider_id, city, state, lat, lon")
      .or("deleted.is.null,deleted.eq.false")
      .order("provider_id", { ascending: true })
      .range(from, from + 999);
    if (error) { console.error("DB error:", error.message); break; }
    for (const r of data) {
      total++;
      if (r.lat == null || r.lon == null) { noCoord++; continue; }
      const k = `${(r.city || "").toLowerCase()}|${r.state}`;
      const c = ref.get(k);
      if (!c) { noRef++; continue; }
      const dist = KM(r.lat, r.lon, c[0], c[1]);
      if (dist > THRESH_KM) {
        const key = `${r.city}, ${r.state}`;
        flaggedByCity.set(key, (flaggedByCity.get(key) || 0) + 1);
      } else okRows++;
    }
    if (!data || data.length < 1000) break;
    from += 1000;
  }
  const flaggedTotal = [...flaggedByCity.values()].reduce((a, b) => a + b, 0);
  console.log(`Rows scanned: ${total}`);
  console.log(`  in-place (≤${THRESH_KM}km from stated city): ${okRows}`);
  console.log(`  MISLABELED (>${THRESH_KM}km): ${flaggedTotal}  across ${flaggedByCity.size} city buckets`);
  console.log(`  no coords: ${noCoord}   city not in reference (unchecked): ${noRef}`);
  console.log(`\nTop mislabeled buckets (stated city → # rows actually elsewhere):`);
  for (const [city, n] of [...flaggedByCity.entries()].sort((a, b) => b[1] - a[1]).slice(0, 30)) {
    console.log(`  ${String(n).padStart(4)}  ${city}`);
  }
  process.exit(0);
}

async function revGeo(lat, lon) {
  const r = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lon}&key=${KEY}`);
  const j = await r.json();
  if (j.status !== "OK" || !(j.results || []).length) return { error: j.status || "no result" };
  for (const res of j.results) {
    const c = res.address_components || [];
    const loc = c.find((x) => x.types.includes("locality"))
      || c.find((x) => x.types.includes("postal_town"))
      || c.find((x) => x.types.includes("administrative_area_level_3"));
    const st = c.find((x) => x.types.includes("administrative_area_level_1"));
    const zip = c.find((x) => x.types.includes("postal_code"));
    if (loc && st) return { city: loc.long_name, state: st.short_name, zip: zip ? zip.long_name : null };
  }
  return { error: "no locality" };
}

// Directory-wide repair: reverse-geocode ONLY the audit-flagged rows (those
// >50km from their stated city) to their true city/state. Coordinate-
// authoritative — a row only changes to where its coords actually resolve, so
// false-flagged buckets (e.g. duplicate PA township names) self-correct to
// no-ops. --top N restricts to the N worst buckets (for staged runs).
async function runAuditFix() {
  const THRESH_KM = 50;
  const ref = new Map();
  const cities = JSON.parse(fs.readFileSync(path.join(__dirname, "../public/data/cities-tier2.json"), "utf8"));
  for (const [name, st, , lat, lon] of cities) ref.set(`${name.toLowerCase()}|${st}`, [lat, lon]);

  // Scan all active rows, collect flagged ones grouped by stated bucket.
  const flaggedByBucket = new Map(); // "City|ST" -> [rows]
  let from = 0;
  for (;;) {
    const { data, error } = await db
      .from("olera-providers")
      .select("provider_id, provider_name, city, state, lat, lon")
      .or("deleted.is.null,deleted.eq.false")
      .order("provider_id", { ascending: true })
      .range(from, from + 999);
    if (error) { console.error("DB error:", error.message); process.exit(1); }
    for (const r of data) {
      if (r.lat == null || r.lon == null) continue;
      const c = ref.get(`${(r.city || "").toLowerCase()}|${r.state}`);
      if (!c) continue;
      if (KM(r.lat, r.lon, c[0], c[1]) > THRESH_KM) {
        const k = `${r.city}|${r.state}`;
        if (!flaggedByBucket.has(k)) flaggedByBucket.set(k, []);
        flaggedByBucket.get(k).push(r);
      }
    }
    if (!data || data.length < 1000) break;
    from += 1000;
  }

  let buckets = [...flaggedByBucket.entries()].sort((a, b) => b[1].length - a[1].length);
  if (TOP) buckets = buckets.slice(0, TOP);
  const totalRows = buckets.reduce((n, [, rows]) => n + rows.length, 0);
  console.log(`Audit-fix — ${APPLY ? "APPLY" : "DRY RUN"} — ${buckets.length} bucket(s), ${totalRows} flagged rows${TOP ? ` (top ${TOP})` : ""}\n`);

  let fixed = 0, noChange = 0, geoErr = 0, applied = 0;
  for (const [bucket, rows] of buckets) {
    console.log(`── ${bucket.replace("|", ", ")} (${rows.length} flagged) ──`);
    for (const r of rows) {
      const g = await revGeo(r.lat, r.lon);
      await new Promise((res) => setTimeout(res, 110));
      if (g.error) { geoErr++; console.log(`   ! geo ${g.error}: ${r.provider_name}`); continue; }
      const changed = g.city.toLowerCase() !== (r.city || "").toLowerCase() || g.state !== r.state;
      if (!changed) { noChange++; continue; }
      fixed++;
      console.log(`   → ${r.provider_name}: ${r.city}, ${r.state} ⇒ ${g.city}, ${g.state}`);
      if (APPLY) {
        const patch = { city: g.city, state: g.state };
        // zipcode is a bigint column — only write all-digit (US) zips; skip
        // alphanumeric foreign postcodes so the city/state still get corrected.
        if (g.zip && /^\d+$/.test(g.zip)) patch.zipcode = g.zip;
        const { error: uerr } = await db.from("olera-providers").update(patch).eq("provider_id", r.provider_id);
        if (uerr) console.log(`     ✗ ${uerr.message}`); else applied++;
      }
    }
  }
  console.log(`\n── ${totalRows} flagged: ${fixed} relabeled${APPLY ? ` (${applied} written)` : " (dry run)"}, ${noChange} already-correct (false flags), ${geoErr} geocode errors`);
  if (!APPLY) console.log(`DRY RUN — re-run with --apply to write.`);
  process.exit(0);
}

(async () => {
  if (AUDIT) return runAudit();
  if (AUDIT_FIX) return runAuditFix();
  if (!CITY || !STATE) { console.error("Usage: --city <City> --state <ST> [--apply]  |  --audit  |  --audit-fix [--top N] [--apply]"); process.exit(1); }
  console.log(`Fix mislabeled cities — bucket "${CITY}, ${STATE}" — ${APPLY ? "APPLY" : "DRY RUN"}\n`);

  const { data, error } = await db
    .from("olera-providers")
    .select("provider_id, provider_name, city, state, lat, lon, zipcode")
    .eq("state", STATE)
    .eq("city", CITY)
    .or("deleted.is.null,deleted.eq.false");
  if (error) { console.error("DB error:", error.message); process.exit(1); }

  let fix = 0, ok = 0, noCoord = 0, geoErr = 0, applied = 0;
  for (const r of data) {
    if (r.lat == null || r.lon == null) { noCoord++; console.log(`  ? NO COORDS  ${r.provider_name}`); continue; }
    const g = await revGeo(r.lat, r.lon);
    await new Promise((res) => setTimeout(res, 120));
    if (g.error) { geoErr++; console.log(`  ! GEO ${g.error}  ${r.provider_name}`); continue; }
    const changed = g.city.toLowerCase() !== (r.city || "").toLowerCase() || g.state !== r.state;
    if (!changed) { ok++; continue; }
    fix++;
    console.log(`  → ${r.provider_name}`);
    console.log(`      ${r.city}, ${r.state}  ⇒  ${g.city}, ${g.state}${g.zip ? " " + g.zip : ""}   (${r.lat},${r.lon})`);
    if (APPLY) {
      const patch = { city: g.city, state: g.state };
      if (g.zip) patch.zipcode = g.zip;
      const { error: uerr } = await db.from("olera-providers").update(patch).eq("provider_id", r.provider_id);
      if (uerr) console.log(`      ✗ update failed: ${uerr.message}`);
      else applied++;
    }
  }

  console.log(`\n── ${data.length} rows: ${fix} mislabeled, ${ok} already correct, ${noCoord} no coords, ${geoErr} geocode errors`);
  if (APPLY) console.log(`Applied ${applied} corrections.`);
  else console.log(`DRY RUN — re-run with --apply to write.`);
  process.exit(0);
})();
