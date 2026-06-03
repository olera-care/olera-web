/**
 * MedJobs non-medical home care backfill.
 *
 * Discovery found that olera-providers systematically under-captures
 * non-medical home care agencies even in fully-pipelined anchor cities
 * (College Station has ~7 of ~15 real agencies; 10-anchor-city audit
 * showed the DB undercounts non-medical by ~70-120%). The missing rows
 * are the exact MedJobs targets (Home Instead, Comfort Keepers, Visiting
 * Angels, etc.).
 *
 * This is a targeted, leaner alternative to a full city-pipeline re-run:
 *   1. Discover via Google Places (New) text search, home-care queries
 *   2. Filter to non-medical home care candidates (name + type + status)
 *   3. Dedupe against existing olera-providers (place_id, then name+city)
 *      and against each other (collapse franchise multi-listings)
 *   4. Build import-ready rows (provider_id, slug, category, reviews,
 *      lat/lon from Places, description) matching city-pipeline conventions
 *   5. DRY-RUN by default: writes candidates to JSON + prints. Pass
 *      --import to actually insert.
 *
 * Post-import, run the existing enrichment for rigorous entity + trust
 * verification (soft-deletes any false positives):
 *   node scripts/enrich-city.js "College Station" TX --run
 *
 * Usage (run from a checkout with node_modules + .env.local):
 *   node scripts/medjobs-homecare-backfill.js                 # dry-run, default cities
 *   node scripts/medjobs-homecare-backfill.js --import        # insert
 *   node scripts/medjobs-homecare-backfill.js --cities "Katy:TX,Spring:TX"
 */

const path = require("path");
const os = require("os");
const fs = require("fs");
require("dotenv").config({ path: path.join(os.homedir(), "Desktop/olera-web/.env.local") });
const { createClient } = require("@supabase/supabase-js");

const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const KEY = process.env.GOOGLE_PLACES_API_KEY;

// ── CLI ──────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const DO_IMPORT = args.includes("--import");
// Franchise brand-probing is ON by default — it's what makes capture of the
// known national agencies deterministic instead of dependent on text-search
// ranking. Pass --no-brands only to measure raw generic-search coverage.
const USE_BRANDS = !args.includes("--no-brands");
const CANDIDATES_FILE = path.join(os.homedir(), "Desktop/olera-web/homecare-backfill-candidates.json");

// National non-medical home care franchises — probed by name per city so we
// reliably capture them even when generic text search doesn't surface them.
const FRANCHISES = [
  "Home Instead", "Right at Home", "Comfort Keepers", "Visiting Angels",
  "Senior Helpers", "BrightStar Care", "SYNERGY HomeCare", "Homewatch CareGivers",
  "FirstLight Home Care", "Home Helpers Home Care", "Griswold Home Care",
  "Always Best Care", "TheKey", "Assisting Hands", "Amada Senior Care",
  "CareCo", "Senior Care Authority", "ComForCare", "Nurse Next Door",
];
const citiesArg = (() => {
  const i = args.indexOf("--cities");
  return i >= 0 ? args[i + 1] : null;
})();
const TARGETS = citiesArg
  ? citiesArg.split(",").map((s) => { const [c, st] = s.split(":"); return { city: c.trim(), state: st.trim() }; })
  : [
      { city: "College Station", state: "TX" },
      { city: "Bryan", state: "TX" },
      { city: "Houston", state: "TX" },
    ];

// ── State bounding boxes (for geocode sanity) ────────────────────────
const BBOX = { TX: [25.8, 36.6, -106.7, -93.5] }; // [minLat,maxLat,minLon,maxLon]

// ── Classification ───────────────────────────────────────────────────
const INCLUDE = /(home\s*care|homecare|in-?home|companion|caregiv|private\s*duty|personal\s*care|senior\s*care|home\s*instead|visiting\s*angels|comfort\s*keepers|right\s*at\s*home|brightstar|synergy|amada|home\s*helpers|assisting\s*hands|always\s*best\s*care|firstlight|griswold|homewatch|granny\s*nannies|thekey|the\s*key|honor\s*care|caring\s*senior)/i;
const EXCLUDE = /(hospice|home\s*health|skilled|infusion|medical|clinic|hospital|emergency|urgent|rehab|physical\s*therapy|pharmacy|dialysis|nursing\s*home|assisted\s*living|memory\s*care|independent\s*living|agency\s*on\s*aging|staffing|medicaid|wellness|doctor|surgeon|dental|laborator|imaging|supply|university|pregnancy|lice)/i;
const FRANCHISE = /(home\s*instead|visiting\s*angels|comfort\s*keepers|right\s*at\s*home|brightstar|synergy\s*homecare|amada|home\s*helpers|assisting\s*hands|always\s*best\s*care|firstlight|griswold|homewatch|senior\s*helpers|thekey|the\s*key)/i;

const norm = (s) =>
  (s || "").toLowerCase()
    .replace(/\b(llc|inc|corp|ltd|co|of|the|services?|agency|care|homecare|senior|home|in-?home)\b/g, "")
    .replace(/[^a-z0-9]/g, "").trim();

// Brand-only key: strip the city/state words AND every generic descriptor
// so "Comfort Keepers of College Station, TX" and "Comfort Keepers" collapse
// to the same key. Robust against verbose legacy names with no place_id.
function brandNorm(name, city, state) {
  let s = (name || "").toLowerCase();
  const esc = (city || "").toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (esc) s = s.replace(new RegExp("\\b" + esc + "\\b", "g"), " ");
  s = s.replace(/\b(tx|texas|fl|florida|ga|georgia)\b/g, " ");
  s = s.replace(/\b(non-?medical|home|in-?home|care|homecare|senior|services?|service|agency|of|the|llc|inc|corp|ltd|co|and|providers?|provider|company|companies|solutions?|group|inc\.?)\b/g, " ");
  return s.replace(/[^a-z0-9]/g, "");
}
const phoneNorm = (p) => (p || "").replace(/\D/g, "").slice(-10);

const slugify = (s) =>
  (s || "").toLowerCase().trim().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

function classify(name, types) {
  if (FRANCHISE.test(name)) return "high";
  if (!INCLUDE.test(name)) return "skip";
  if (EXCLUDE.test(name)) return "skip";
  if (/health/i.test(name)) return "low"; // "X Health Home Care" — could be medical
  return "high";
}

// ── Google Places (New) text search ──────────────────────────────────
async function textSearch(q, pages = 3) {
  const out = [];
  let token = null;
  for (let i = 0; i < pages; i++) {
    const body = { textQuery: q, maxResultCount: 20 };
    if (token) body.pageToken = token;
    const r = await fetch("https://places.googleapis.com/v1/places:searchText", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": KEY,
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.addressComponents,places.location,places.websiteUri,places.nationalPhoneNumber,places.rating,places.userRatingCount,places.businessStatus,places.primaryType,places.types,nextPageToken",
      },
      body: JSON.stringify(body),
    });
    const j = await r.json();
    if (j.error) { console.error("  Places error:", j.error.message); break; }
    for (const p of j.places || []) out.push(p);
    if (!j.nextPageToken) break;
    token = j.nextPageToken;
    await new Promise((res) => setTimeout(res, 2200));
  }
  return out;
}

function comp(place, type) {
  const c = (place.addressComponents || []).find((a) => (a.types || []).includes(type));
  return c ? { long: c.longText, short: c.shortText } : null;
}

// ── Main ─────────────────────────────────────────────────────────────
(async () => {
  // IMPORT mode reads the reviewed candidates JSON and inserts it — it does
  // NOT re-run discovery, so you import exactly what you reviewed.
  if (DO_IMPORT) {
    const cand = JSON.parse(fs.readFileSync(CANDIDATES_FILE, "utf8"));
    const clean = cand.map(({ _confidence, ...r }) => r);
    console.log(`IMPORT — inserting ${clean.length} reviewed rows from ${CANDIDATES_FILE}\n`);
    let ok = 0;
    for (let i = 0; i < clean.length; i += 100) {
      const batch = clean.slice(i, i + 100);
      const { error } = await db.from("olera-providers").insert(batch);
      if (error) { console.error("Insert error:", error.message); break; }
      ok += batch.length;
      batch.forEach((r) => console.log(`  inserted ${r.provider_id}  ${r.provider_name} [${r.city}]`));
    }
    console.log(`\nInserted ${ok}/${clean.length}. Next: enrich-city.js for entity+trust verify & review snippets.`);
    process.exit(0);
  }

  console.log(`MedJobs home-care backfill — DRY RUN${USE_BRANDS ? " (+franchise probes)" : ""}`);
  console.log(`Targets: ${TARGETS.map((t) => `${t.city}, ${t.state}`).join(" | ")}\n`);

  const states = [...new Set(TARGETS.map((t) => t.state))];

  // Load existing rows for dedup (all rows incl. deleted) + provider_id prefixes/max.
  // Per-city indexes: place_ids, phones, and brand-normalized names.
  const existingByPlaceId = new Set();
  const cityIndex = new Map(); // city.toLowerCase() -> { phones:Set, brands:[] }
  const maxNumByPrefix = {};
  const existingSlugs = new Set();
  const ci = (city) => {
    const k = (city || "").toLowerCase();
    if (!cityIndex.has(k)) cityIndex.set(k, { phones: new Set(), brands: [] });
    return cityIndex.get(k);
  };
  for (const st of states) {
    let from = 0;
    for (;;) {
      const { data, error } = await db
        .from("olera-providers")
        .select("provider_id, provider_name, city, place_id, slug, phone")
        .eq("state", st)
        .order("provider_id", { ascending: true })
        .range(from, from + 999);
      if (error) { console.error("DB load error:", error.message); process.exit(1); }
      for (const r of data || []) {
        if (r.place_id) existingByPlaceId.add(r.place_id);
        if (r.slug) existingSlugs.add(r.slug);
        if (r.city) {
          const idx = ci(r.city);
          const ph = phoneNorm(r.phone);
          if (ph.length === 10) idx.phones.add(ph);
          const b = brandNorm(r.provider_name, r.city, st);
          if (b.length >= 4) idx.brands.push(b);
        }
        const m = (r.provider_id || "").match(/^(.*)-(\d{4})$/);
        if (m) {
          const prefix = m[1], n = parseInt(m[2], 10);
          if (!(prefix in maxNumByPrefix) || n > maxNumByPrefix[prefix]) maxNumByPrefix[prefix] = n;
        }
      }
      if (!data || data.length < 1000) break;
      from += 1000;
    }
  }

  // Returns true if a candidate (brand, phone) duplicates something already
  // present in `city` — checks place_id (caller), phone, and brand containment.
  const isDup = (city, brand, phone) => {
    const idx = cityIndex.get((city || "").toLowerCase());
    if (!idx) return false;
    const ph = phoneNorm(phone);
    if (ph.length === 10 && idx.phones.has(ph)) return true;
    if (brand.length >= 4) {
      for (const b of idx.brands) {
        if (b === brand) return true;
        if (b.length >= 5 && brand.length >= 5 && (b.includes(brand) || brand.includes(b))) return true;
      }
    }
    return false;
  };

  const QUERIES = (city, st) => [
    `non-medical home care ${city} ${st}`,
    `in-home senior care ${city} ${st}`,
    `home care agency ${city} ${st}`,
    `senior caregiver agency ${city} ${st}`,
    `companion care for seniors ${city} ${st}`,
    `private duty home care ${city} ${st}`,
    `senior home care ${city} ${st}`,
    `home care assistance ${city} ${st}`,
    `elderly home care ${city} ${st}`,
  ];

  const rowsToImport = [];
  const skipped = { notHomeCare: 0, notOperational: 0, dupExisting: 0, dupBatch: 0, outOfMetro: 0, lowConf: [] };
  const seenBatch = new Set();
  const targetSet = new Set(TARGETS.map((t) => `${t.city.toLowerCase()}|${t.state}`));

  // ── Phase A: discover across the whole metro ────────────────────────────
  // All target cities' queries + franchise brand-probes flow into ONE global
  // place map. A "College Station" probe surfaces Bryan-addressed agencies and
  // vice-versa; we keep them all and assign each to its REAL locality in Phase
  // B. This captures the metro as a unit instead of brittle exact-city slicing.
  const placesAll = new Map();
  for (const { city, state } of TARGETS) {
    const plan = QUERIES(city, state).map((q) => ({ q, pages: 2 }));
    if (USE_BRANDS) for (const f of FRANCHISES) plan.push({ q: `${f} ${city} ${state}`, pages: 1 });
    for (const { q, pages } of plan) {
      const res = await textSearch(q, pages);
      for (const p of res) if (p.id && !placesAll.has(p.id)) placesAll.set(p.id, p);
      await new Promise((r) => setTimeout(r, 250));
    }
    process.stdout.write(`  ${placesAll.size} unique places after ${city}…\r`);
  }
  console.log(`\nDiscovered ${placesAll.size} unique businesses across the metro.\n`);

  // ── Phase B: process each unique place once, assign to its real locality ──
  const marketByCity = new Map(); // "City|ST" -> [{name,rating,reviewCount,status}]
  const prefixFor = (cityVal, st) => {
    const guess = `${slugify(cityVal)}-${st.toLowerCase()}`;
    return Object.keys(maxNumByPrefix).find((p) => p === guess) || guess;
  };
  for (const p of placesAll.values()) {
    const name = p.displayName?.text || "";
    const conf = classify(name, p.types || []);
    if (conf === "skip") { skipped.notHomeCare++; continue; }
    if (p.businessStatus && p.businessStatus !== "OPERATIONAL") { skipped.notOperational++; continue; }

    const locality = comp(p, "locality")?.long || comp(p, "sublocality")?.long || comp(p, "postal_town")?.long;
    const stateShort = comp(p, "administrative_area_level_1")?.short || null;
    if (!locality || !stateShort) { skipped.outOfMetro++; continue; }
    const cityVal = locality;
    if (!targetSet.has(`${cityVal.toLowerCase()}|${stateShort}`)) { skipped.outOfMetro++; continue; }

    const lat = p.location?.latitude ?? null;
    const lon = p.location?.longitude ?? null;
    if (lat != null && BBOX[stateShort]) {
      const [mnLat, mxLat, mnLon, mxLon] = BBOX[stateShort];
      if (lat < mnLat || lat > mxLat || lon < mnLon || lon > mxLon) { skipped.outOfMetro++; continue; }
    }

    const brand = brandNorm(name, cityVal, stateShort);
    const phone = p.nationalPhoneNumber || null;
    const rating = typeof p.rating === "number" ? p.rating : null;
    const reviewCount = typeof p.userRatingCount === "number" ? p.userRatingCount : 0;
    const bkey = `${brand}|${cityVal.toLowerCase()}`;

    let status;
    if (existingByPlaceId.has(p.id) || isDup(cityVal, brand, phone)) status = "HAVE";
    else if (seenBatch.has(bkey)) status = "DUP";
    else status = "NEW";

    const mk = `${cityVal}|${stateShort}`;
    if (!marketByCity.has(mk)) marketByCity.set(mk, []);
    marketByCity.get(mk).push({ name, rating, reviewCount, status });

    if (status === "HAVE") { skipped.dupExisting++; continue; }
    if (status === "DUP") { skipped.dupBatch++; continue; }

    seenBatch.add(bkey);
    { const idx = ci(cityVal); const ph = phoneNorm(phone); if (ph.length === 10) idx.phones.add(ph); if (brand.length >= 4) idx.brands.push(brand); }

    const prefix = prefixFor(cityVal, stateShort);
    const next = (maxNumByPrefix[prefix] || 0) + 1;
    maxNumByPrefix[prefix] = next;
    const provider_id = `${prefix}-${String(next).padStart(4, "0")}`;
    let slug = `${slugify(name)}-${stateShort.toLowerCase()}`;
    let s = slug, k = 2;
    while (existingSlugs.has(s)) { s = `${slug}-${k++}`; }
    slug = s; existingSlugs.add(slug);

    rowsToImport.push({
      provider_id,
      provider_name: name.replace(/\s*\b(LLC|Inc\.?|Corp\.?|Ltd\.?)\b\.?$/i, "").trim(),
      provider_category: "Home Care (Non-medical)",
      provider_description: `${name} is a non-medical home care provider offering companionship, personal care, and daily living support located in ${cityVal}, ${stateShort}.`,
      address: p.formattedAddress?.replace(/, USA$/, "") || null,
      city: cityVal,
      state: stateShort,
      zipcode: comp(p, "postal_code")?.long || null,
      phone,
      website: p.websiteUri || null,
      lat,
      lon,
      place_id: p.id,
      slug,
      google_rating: rating,
      google_reviews_data: rating != null ? { rating, review_count: reviewCount, reviews: [], last_synced: new Date().toISOString() } : null,
      deleted: false,
      _confidence: conf,
    });
    if (conf === "low") skipped.lowConf.push(`${name} (${cityVal})`);
  }

  // ── Coverage proof: rank each city's discovered market by Google reviews.
  // Every high-review agency must read ✓have or +NEW — never absent. ────────
  for (const [mk, market] of [...marketByCity.entries()].sort()) {
    market.sort((a, b) => b.reviewCount - a.reviewCount);
    const top = market.slice(0, 12);
    const newCount = market.filter((m) => m.status === "NEW").length;
    console.log(`── ${mk.replace("|", ", ")} — top ${top.length} of ${market.length} by Google reviews ──`);
    for (const m of top) {
      const tag = m.status === "NEW" ? "+NEW " : m.status === "HAVE" ? "✓have" : " dup ";
      console.log(`    [${tag}] ★${m.rating ?? "—"} (${String(m.reviewCount).padStart(3)})  ${m.name}`);
    }
    console.log(`    → ${newCount} net-new in ${mk.split("|")[0]}\n`);
  }

  console.log(`\n══ SUMMARY ══`);
  console.log(`Net-new candidates: ${rowsToImport.length}`);
  const high = rowsToImport.filter((r) => r._confidence === "high").length;
  console.log(`  high-confidence: ${high}   low-confidence(review): ${rowsToImport.length - high}`);
  console.log(`Skipped — not home care: ${skipped.notHomeCare}, not operational: ${skipped.notOperational}, already in DB: ${skipped.dupExisting}, dup in-batch: ${skipped.dupBatch}, outside target cities: ${skipped.outOfMetro}`);
  if (skipped.lowConf.length) console.log(`Low-confidence (verify before trusting): ${skipped.lowConf.join(" | ")}`);

  fs.writeFileSync(CANDIDATES_FILE, JSON.stringify(rowsToImport, null, 2));
  console.log(`\nCandidates written to: ${CANDIDATES_FILE}`);
  console.log(`DRY RUN — nothing inserted. Review/trim the JSON, then re-run with --import.`);
  process.exit(0);
})();
