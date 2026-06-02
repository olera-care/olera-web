#!/usr/bin/env node
/**
 * Market-Diagnostic data pull — "SEMrush for senior-care client acquisition."
 *
 * Pulls REAL data for a provider's local market and writes a single JSON snapshot:
 *   1. Competitor landscape  (Google Places — same care type, ratings + review volume)
 *   2. Referral-source graph  (Google Places — hospitals, SNF, ALF, hospice, home health,
 *                              senior centers, elder-law attorneys, geriatric care mgrs)
 *   3. Demographic demand     (Census ACS5 — 65+, 75+, pop, median income across catchment ZCTAs)
 *   4. Olera captured demand  (Supabase — families/questions in this city, our proprietary signal)
 *
 * Usage:
 *   node scripts/market-diagnostic/fetch-diagnostic.mjs \
 *     --city "College Station" --state TX --lat 30.6280 --lng -96.3344 \
 *     --radius 32000 --caretype homecare \
 *     --zctas 77840,77845,77801,77802,77803,77807,77808 \
 *     --out data/market-diagnostic/college-station.json
 *
 * caretype: homecare | assisted_living
 */
import { readFileSync, writeFileSync } from "node:fs";

// ---------- env ----------
function loadEnv() {
  try {
    const raw = readFileSync(new URL("../../.env.local", import.meta.url), "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {}
}
loadEnv();

const GOOGLE_KEY = process.env.GOOGLE_PLACES_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const CENSUS_KEY = process.env.CENSUS_API_KEY; // optional

// ---------- args ----------
function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : def;
}
const CITY = arg("city", "College Station");
const STATE = arg("state", "TX");
const LAT = parseFloat(arg("lat", "30.6280"));
const LNG = parseFloat(arg("lng", "-96.3344"));
const RADIUS = parseInt(arg("radius", "32000"), 10); // meters; <=50000
const CARETYPE = arg("caretype", "homecare");
const ZCTAS = arg("zctas", "77840,77845,77801,77802,77803,77807,77808").split(",").map((s) => s.trim());
const OUT = arg("out", "data/market-diagnostic/college-station.json");

// ---------- query sets ----------
const COMPETITOR_QUERIES = {
  homecare: ["home care agency", "in-home senior care", "home health care", "senior home care", "non-medical home care"],
  assisted_living: ["assisted living facility", "assisted living community", "memory care", "senior living community", "residential care home"],
};

// Referral graph — where home-care / AL clients actually originate (discharge + care-management ecosystem)
const REFERRAL_QUERIES = [
  { role: "hospital", queries: ["hospital", "medical center"] },
  { role: "skilled_nursing", queries: ["skilled nursing facility", "nursing home", "rehabilitation center"] },
  { role: "assisted_living", queries: ["assisted living facility", "memory care community"] },
  { role: "hospice", queries: ["hospice", "hospice care"] },
  { role: "home_health", queries: ["home health agency", "medicare home health"] },
  { role: "senior_resources", queries: ["senior center", "area agency on aging", "council on aging"] },
  { role: "professional", queries: ["elder law attorney", "estate planning attorney", "geriatric care manager", "financial advisor retirement"] },
  { role: "faith_community", queries: ["senior living ministry", "church senior ministry"] },
];

const PLACES_FIELD_MASK = [
  "places.id", "places.displayName", "places.formattedAddress", "places.rating",
  "places.userRatingCount", "places.location", "places.types", "places.businessStatus",
  "places.websiteUri", "places.nationalPhoneNumber", "places.primaryType", "nextPageToken",
].join(",");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function placesTextSearch(textQuery, { maxPages = 2 } = {}) {
  const out = [];
  let pageToken;
  for (let page = 0; page < maxPages; page++) {
    const body = {
      textQuery,
      pageSize: 20,
      locationBias: { circle: { center: { latitude: LAT, longitude: LNG }, radius: RADIUS } },
    };
    if (pageToken) body.pageToken = pageToken;
    let res, json;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        res = await fetch("https://places.googleapis.com/v1/places:searchText", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": GOOGLE_KEY,
            "X-Goog-FieldMask": PLACES_FIELD_MASK,
          },
          body: JSON.stringify(body),
        });
        json = await res.json();
        break;
      } catch (e) {
        if (attempt === 2) { console.error(`  ! ${textQuery}: ${e.message}`); return out; }
        await sleep(1500 * (attempt + 1));
      }
    }
    if (json?.error) { console.error(`  ! ${textQuery}: ${json.error.message}`); return out; }
    for (const p of json.places || []) out.push(p);
    pageToken = json.nextPageToken;
    if (!pageToken) break;
    await sleep(2200); // next_page_token needs a short delay to become valid
  }
  return out;
}

function normPlace(p) {
  return {
    id: p.id,
    name: p.displayName?.text || "",
    address: p.formattedAddress || "",
    rating: p.rating ?? null,
    reviews: p.userRatingCount ?? 0,
    lat: p.location?.latitude ?? null,
    lng: p.location?.longitude ?? null,
    types: p.types || [],
    primaryType: p.primaryType || null,
    status: p.businessStatus || null,
    website: p.websiteUri || null,
    phone: p.nationalPhoneNumber || null,
  };
}

function haversineMiles(lat1, lng1, lat2, lng2) {
  if ([lat1, lng1, lat2, lng2].some((v) => v == null)) return null;
  const R = 3958.8, toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return +(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1);
}

async function gatherDeduped(queries, role) {
  const byId = new Map();
  for (const q of queries) {
    const results = await placesTextSearch(q);
    for (const p of results) {
      if (!p.id || byId.has(p.id)) continue;
      if (p.businessStatus && p.businessStatus !== "OPERATIONAL") continue;
      const np = normPlace(p);
      np.distanceMiles = haversineMiles(LAT, LNG, np.lat, np.lng);
      if (role) np.role = role;
      byId.set(p.id, np);
    }
    await sleep(250);
  }
  return [...byId.values()];
}

// ---------- Census ACS5 ----------
// B01001 stable variable codes. 65+ = M(65-66,67-69,70-74,75-79,80-84,85+) + F(...).
const ACS_65PLUS = ["B01001_020E","B01001_021E","B01001_022E","B01001_023E","B01001_024E","B01001_025E",
                    "B01001_044E","B01001_045E","B01001_046E","B01001_047E","B01001_048E","B01001_049E"];
const ACS_75PLUS = ["B01001_023E","B01001_024E","B01001_025E","B01001_047E","B01001_048E","B01001_049E"];
const ACS_TOTAL = "B01001_001E";
const ACS_MEDINC = "B19013_001E"; // median household income

async function fetchCensus(year = 2022) {
  const vars = [...new Set([ACS_TOTAL, ACS_MEDINC, ...ACS_65PLUS])];
  const perZcta = [];
  for (const z of ZCTAS) {
    const url = new URL(`https://api.census.gov/data/${year}/acs/acs5`);
    url.searchParams.set("get", `NAME,${vars.join(",")}`);
    url.searchParams.set("for", `zip code tabulation area:${z}`);
    if (CENSUS_KEY) url.searchParams.set("key", CENSUS_KEY);
    try {
      const res = await fetch(url);
      if (!res.ok) { console.error(`  ! census ${z}: HTTP ${res.status}`); continue; }
      const data = await res.json();
      if (!Array.isArray(data) || data.length < 2) continue;
      const header = data[0], row = data[1];
      const get = (code) => { const i = header.indexOf(code); const v = i > -1 ? parseInt(row[i], 10) : NaN; return Number.isFinite(v) && v >= 0 ? v : 0; };
      const pop = get(ACS_TOTAL);
      const seniors = ACS_65PLUS.reduce((s, c) => s + get(c), 0);
      const medinc = get(ACS_MEDINC) || null;
      perZcta.push({ zcta: z, population: pop, seniors65plus: seniors, medianIncome: medinc });
    } catch (e) { console.error(`  ! census ${z}: ${e.message}`); }
    await sleep(150);
  }
  const totals = perZcta.reduce((a, z) => ({ population: a.population + z.population, seniors65plus: a.seniors65plus + z.seniors65plus }), { population: 0, seniors65plus: 0 });
  const incomes = perZcta.map((z) => z.medianIncome).filter(Boolean);
  return {
    year, zctas: perZcta, totals,
    seniorSharePct: totals.population ? +((totals.seniors65plus / totals.population) * 100).toFixed(1) : null,
    medianIncomeRange: incomes.length ? { min: Math.min(...incomes), max: Math.max(...incomes) } : null,
  };
}

// ---------- Olera captured demand (raw Supabase REST — no SDK) ----------
async function sbCount(table, query) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?${query}`;
  const res = await fetch(url, {
    method: "HEAD",
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, Prefer: "count=exact" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const cr = res.headers.get("content-range") || ""; // "0-24/137" or "*/137"
  const total = cr.split("/")[1];
  return total ? parseInt(total, 10) : null;
}

async function sbGet(table, query) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
    headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
  });
  return res.ok ? res.json() : [];
}

async function fetchOleraDemand() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return { error: "no supabase creds" };
  const out = {};
  const cityIlike = `city=ilike.*${encodeURIComponent(CITY)}*`;
  // Registered family seekers in this city (business_profiles, type=family) — the proprietary demand signal
  try { out.familiesInCity = await sbCount("business_profiles", `type=eq.family&${cityIlike}&select=id`); }
  catch (e) { out.familiesInCity = `err: ${e.message}`; }
  try { out.familiesTotalAllCities = await sbCount("business_profiles", `type=eq.family&select=id`); }
  catch (e) { out.familiesTotalAllCities = `err: ${e.message}`; }
  // Providers Olera already lists locally (the supply on our shelf)
  try {
    out.providersListed = await sbCount("olera-providers",
      `${cityIlike}&state=ilike.*${encodeURIComponent(STATE)}*&or=(deleted.is.null,deleted.eq.false)&select=provider_id`);
  } catch (e) { out.providersListed = `err: ${e.message}`; }
  // Questions families asked of local providers (engagement) — provider_questions has no city col, join via provider_id
  try {
    const providers = await sbGet("olera-providers",
      `${cityIlike}&state=ilike.*${encodeURIComponent(STATE)}*&or=(deleted.is.null,deleted.eq.false)&select=provider_id&limit=300`);
    const ids = providers.map((p) => p.provider_id).filter(Boolean);
    if (ids.length) {
      const list = ids.map((id) => `"${id}"`).join(",");
      out.questionsInCity = await sbCount("provider_questions", `provider_id=in.(${encodeURIComponent(list)})&select=id`);
    } else out.questionsInCity = 0;
  } catch (e) { out.questionsInCity = `err: ${e.message}`; }
  return out;
}

// ---------- main ----------
(async () => {
  console.log(`\nMarket diagnostic — ${CITY}, ${STATE}  (${CARETYPE})  radius ${RADIUS / 1000}km`);
  if (!GOOGLE_KEY) { console.error("FATAL: no GOOGLE_PLACES_API_KEY"); process.exit(1); }

  console.log("→ competitors…");
  const competitors = await gatherDeduped(COMPETITOR_QUERIES[CARETYPE] || COMPETITOR_QUERIES.homecare);
  competitors.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
  console.log(`  ${competitors.length} competitors`);

  console.log("→ referral graph…");
  const referrals = [];
  for (const grp of REFERRAL_QUERIES) {
    const found = await gatherDeduped(grp.queries, grp.role);
    referrals.push(...found);
    console.log(`  ${grp.role}: ${found.length}`);
  }
  // dedupe across roles (a place can match multiple queries)
  const refById = new Map();
  for (const r of referrals) if (!refById.has(r.id)) refById.set(r.id, r);
  const referralGraph = [...refById.values()];

  console.log("→ census demographics…");
  const demographics = await fetchCensus();
  console.log(`  pop ${demographics.totals.population.toLocaleString()}, 65+ ${demographics.totals.seniors65plus.toLocaleString()} (${demographics.seniorSharePct}%)`);

  console.log("→ olera captured demand…");
  const oleraDemand = await fetchOleraDemand();
  console.log(`  ${JSON.stringify(oleraDemand)}`);

  const snapshot = {
    meta: { city: CITY, state: STATE, careType: CARETYPE, center: { lat: LAT, lng: LNG }, radiusMeters: RADIUS, zctas: ZCTAS, generatedAt: new Date().toISOString() },
    competitors,
    referralGraph,
    demographics,
    oleraDemand,
  };
  writeFileSync(OUT, JSON.stringify(snapshot, null, 2));
  console.log(`\n✓ wrote ${OUT}\n  competitors=${competitors.length} referrals=${referralGraph.length}\n`);
})();
