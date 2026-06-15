/**
 * Select candidate providers for the SEO description rewrite.
 *
 * Reads a GSC pages-movement CSV (from ~/Desktop/olera-hq/strategy/seo/),
 * filters to /provider/ URLs with >= MIN_IMPRESSIONS, joins against the
 * olera-providers table in Supabase to pull the fields the rewrite prompt
 * needs, and writes the result to a JSON file.
 *
 * Usage:
 *   SUPABASE_KEY=... node scripts/description-rewrite/1_select-candidates.mjs \
 *     --csv ~/Desktop/olera-hq/strategy/seo/2026-04-21_pages-movement.csv \
 *     --limit 500 \
 *     --min-impressions 100 \
 *     --output scripts/description-rewrite/candidates-wave-01.json
 */
import { createClient } from "@supabase/supabase-js";
import { createReadStream } from "node:fs";
import { writeFileSync, readFileSync } from "node:fs";
import { parse } from "csv-parse";

const SUPABASE_URL = "https://ocaabzfiiikjcgqwhbwr.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_KEY) {
  console.error(
    "Error: Set SUPABASE_KEY env var.\n" +
      "Usage: SUPABASE_KEY=... node scripts/description-rewrite/1_select-candidates.mjs --csv <path>"
  );
  process.exit(1);
}

function arg(name, fallback) {
  const i = process.argv.indexOf(name);
  if (i === -1) return fallback;
  return process.argv[i + 1];
}

const CSV_PATH = arg("--csv");
if (!CSV_PATH) {
  console.error("Error: --csv <path> is required");
  process.exit(1);
}
const LIMIT = parseInt(arg("--limit", "500"), 10);
const MIN_IMPRESSIONS = parseInt(arg("--min-impressions", "100"), 10);
// --skip-top N: after sorting /provider/ rows by impressions desc, drop the
// first N before applying --limit. Lets us target a lower-stakes mid/bottom
// tier of the impression cohort for wave 1, so an HCU flag doesn't hit the
// pages that drive our /provider/ traffic today.
const SKIP_TOP = parseInt(arg("--skip-top", "0"), 10);
const OUTPUT = arg("--output", "scripts/description-rewrite/candidates.json");
// Wave 2 additions (all optional, default-off = wave-1 behavior):
// --category-filter "Senior Communities": keep only rows in that main_category
//   group. NULL main_category rows are inferred from provider_category text.
// --exclude-audit <path>: drop any provider_id already present in a prior
//   wave's audit JSON, so we never double-rewrite a page.
// --holdback-pct N + --holdback-output <path>: randomly split N% of the final
//   cohort into a no-touch control group written to a separate file.
const CATEGORY_FILTER = arg("--category-filter", null);
const EXCLUDE_AUDIT = arg("--exclude-audit", null);
const HOLDBACK_PCT = parseInt(arg("--holdback-pct", "0"), 10);
const HOLDBACK_OUTPUT = arg("--holdback-output", null);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Senior Communities inference for rows whose main_category is NULL. Mirrors
// the canonical grouping the measurement script uses (main_category drives the
// cohort; these tokens recover the NULL rows from provider_category text).
const SENIOR_COMMUNITY_TOKENS = [
  "assisted living", "independent living", "nursing home", "skilled nursing",
  "memory care", "continuing care", "ccrc", "retirement community", "senior living",
];
const HOME_CARE_TOKENS = ["home health", "home care", "in-home", "non-medical"];

function inferMainCategory(c) {
  if (c.main_category) return c.main_category;
  const pc = (c.provider_category || "").toLowerCase();
  if (SENIOR_COMMUNITY_TOKENS.some((t) => pc.includes(t))) return "Senior Communities";
  if (HOME_CARE_TOKENS.some((t) => pc.includes(t))) return "Home Care";
  return null; // genuinely unknown — excluded by any category filter
}

// Deterministic-ish shuffle seeded off provider_id so re-runs are stable for a
// given cohort (no Math.random nondeterminism between dry-run and live).
function seededShuffle(arr) {
  const withKey = arr.map((x) => {
    let h = 0;
    const s = String(x.provider_id);
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return { x, h };
  });
  withKey.sort((a, b) => a.h - b.h);
  return withKey.map((w) => w.x);
}

// --- Step 1: read the GSC CSV, filter to /provider/ rows ---
async function readGSCRows() {
  const rows = [];
  const parser = createReadStream(CSV_PATH).pipe(
    parse({ columns: true, skip_empty_lines: true, bom: true })
  );
  for await (const r of parser) {
    if (!r.page.includes("/provider/")) continue;
    const imp = parseInt(r.impressions_current || "0", 10);
    if (imp < MIN_IMPRESSIONS) continue;
    rows.push({
      page: r.page,
      slug: r.page.split("/provider/")[1].replace(/\/$/, ""),
      impressions_current: imp,
      clicks_current: parseInt(r.clicks_current || "0", 10),
      position_current: r.position_current ? parseFloat(r.position_current) : null,
    });
  }
  rows.sort((a, b) => b.impressions_current - a.impressions_current);
  return rows;
}

// --- Step 2: resolve slugs → provider_id via the slug column ---
//
// olera-providers has a `slug` column that the app already uses for URL
// resolution (see app/provider/[slug]/page.tsx). Every GSC /provider/ URL
// corresponds to exactly one row by slug. No fuzzy matching, no franchise
// ambiguity.
async function hydrateFromSupabase(gscRows) {
  const hydrated = [];
  const missed = [];
  const slugToGsc = new Map(gscRows.map((r) => [r.slug, r]));
  const slugs = Array.from(slugToGsc.keys());

  const BATCH = 200;
  for (let i = 0; i < slugs.length; i += BATCH) {
    const batch = slugs.slice(i, i + BATCH);
    const { data, error } = await supabase
      .from("olera-providers")
      .select(
        "provider_id, slug, provider_name, provider_category, main_category, city, state, google_rating, google_reviews_data, ai_trust_signals, lower_price, upper_price, provider_description"
      )
      .in("slug", batch)
      .not("deleted", "is", true);
    if (error) throw new Error(`Supabase query failed: ${error.message}`);
    const found = new Set();
    for (const row of data || []) {
      found.add(row.slug);
      const gscRow = slugToGsc.get(row.slug);
      if (!row.provider_description) {
        missed.push({ ...gscRow, reason: "empty_description" });
        continue;
      }
      hydrated.push({
        provider_id: row.provider_id,
        slug: row.slug,
        provider_name: row.provider_name,
        provider_category: row.provider_category,
        main_category: row.main_category,
        city: row.city,
        state: row.state,
        google_rating: row.google_rating,
        google_review_count: row.google_reviews_data?.review_count ?? null,
        lower_price: row.lower_price,
        upper_price: row.upper_price,
        original_description: row.provider_description,
        gsc_slug: gscRow.slug,
        gsc_page: gscRow.page,
        impressions_current: gscRow.impressions_current,
        clicks_current: gscRow.clicks_current,
        position_current: gscRow.position_current,
        ctr_current:
          gscRow.impressions_current > 0 ? gscRow.clicks_current / gscRow.impressions_current : 0,
      });
    }
    for (const s of batch) {
      if (!found.has(s)) {
        missed.push({ ...slugToGsc.get(s), reason: "slug_not_in_directory" });
      }
    }
    const progress = Math.min(i + BATCH, slugs.length);
    process.stdout.write(
      `\r  Hydrating: ${progress}/${slugs.length} (hit=${hydrated.length} miss=${missed.length})`
    );
  }
  console.log();
  return { hydrated, missed };
}

async function main() {
  console.log("=== Candidate selection ===");
  console.log(`CSV:             ${CSV_PATH}`);
  console.log(`Min impressions: ${MIN_IMPRESSIONS}`);
  console.log(`Skip top:        ${SKIP_TOP}`);
  console.log(`Limit:           ${LIMIT}`);
  console.log();

  console.log("1. Reading GSC pages-movement CSV...");
  const gscRows = await readGSCRows();
  console.log(`   ${gscRows.length} /provider/ URLs at >=${MIN_IMPRESSIONS} impressions`);

  // When filtering by category we don't know up front how many of the top rows
  // belong to the target group, so hydrate a larger pool and trim after the
  // filter. Without a category filter, behaviour is unchanged from wave 1.
  const POOL = CATEGORY_FILTER ? Math.min(gscRows.length, (SKIP_TOP + LIMIT) * 8) : SKIP_TOP + LIMIT;
  const sliced = gscRows.slice(SKIP_TOP, POOL);
  const impRange =
    sliced.length > 0
      ? `${sliced[sliced.length - 1].impressions_current}-${sliced[0].impressions_current} impressions`
      : "empty";
  console.log(`   Hydration pool: rank ${SKIP_TOP + 1}-${SKIP_TOP + sliced.length} (${impRange})`);

  console.log();
  console.log("2. Hydrating from Supabase olera-providers...");
  let { hydrated, missed } = await hydrateFromSupabase(sliced);
  console.log();
  console.log(`   Hydrated:      ${hydrated.length}`);
  console.log(`   Unresolved:    ${missed.length}`);

  // --- Wave 2 filters ---
  if (CATEGORY_FILTER) {
    const before = hydrated.length;
    hydrated = hydrated.filter((c) => inferMainCategory(c) === CATEGORY_FILTER);
    const inferred = hydrated.filter((c) => !c.main_category).length;
    console.log(
      `   Category filter "${CATEGORY_FILTER}": ${hydrated.length}/${before} kept ` +
        `(${inferred} recovered from NULL main_category via provider_category)`
    );
  }

  if (EXCLUDE_AUDIT) {
    const prior = JSON.parse(readFileSync(EXCLUDE_AUDIT, "utf8"));
    const priorIds = new Set(prior.map((r) => r.provider_id));
    const before = hydrated.length;
    hydrated = hydrated.filter((c) => !priorIds.has(c.provider_id));
    console.log(`   Excluded ${before - hydrated.length} provider_ids already in ${EXCLUDE_AUDIT}`);
  }

  // Supabase batch hydration returns rows in DB order, not impression order —
  // re-sort by impressions desc so the trim keeps the genuine top cohort.
  hydrated.sort((a, b) => b.impressions_current - a.impressions_current);
  if (hydrated.length > LIMIT) {
    hydrated = hydrated.slice(0, LIMIT);
    console.log(`   Trimmed to top ${LIMIT} by impressions`);
  }
  const cohortRange =
    hydrated.length > 0
      ? `${hydrated[hydrated.length - 1].impressions_current}-${hydrated[0].impressions_current} impressions`
      : "empty";
  console.log(`   Final cohort: ${hydrated.length} (${cohortRange})`);

  // --- Hold-back split ---
  let applyCohort = hydrated;
  let holdback = [];
  if (HOLDBACK_PCT > 0) {
    const shuffled = seededShuffle(hydrated);
    const nHold = Math.round((hydrated.length * HOLDBACK_PCT) / 100);
    holdback = shuffled.slice(0, nHold).map((c) => ({ ...c, holdback: true }));
    const holdIds = new Set(holdback.map((c) => c.provider_id));
    applyCohort = hydrated.filter((c) => !holdIds.has(c.provider_id));
    console.log(`   Hold-back split: ${applyCohort.length} apply / ${holdback.length} control (${HOLDBACK_PCT}%)`);
  }

  writeFileSync(OUTPUT, JSON.stringify(applyCohort, null, 2));
  console.log();
  console.log(`Wrote ${applyCohort.length} apply candidates to ${OUTPUT}`);
  if (HOLDBACK_OUTPUT && holdback.length > 0) {
    writeFileSync(HOLDBACK_OUTPUT, JSON.stringify(holdback, null, 2));
    console.log(`Wrote ${holdback.length} hold-back control rows to ${HOLDBACK_OUTPUT}`);
  }
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
