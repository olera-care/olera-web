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
import { writeFileSync } from "node:fs";
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

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
  const sliced = gscRows.slice(SKIP_TOP, SKIP_TOP + LIMIT);
  const impRange =
    sliced.length > 0
      ? `${sliced[sliced.length - 1].impressions_current}-${sliced[0].impressions_current} impressions`
      : "empty";
  console.log(`   Taking rank ${SKIP_TOP + 1}-${SKIP_TOP + sliced.length} (${impRange})`);

  console.log();
  console.log("2. Hydrating from Supabase olera-providers...");
  const { hydrated, missed } = await hydrateFromSupabase(sliced);
  console.log();
  console.log(`   Hydrated:      ${hydrated.length}`);
  console.log(`   Unresolved:    ${missed.length}`);
  if (missed.length > 0) {
    console.log(`   Sample misses:`);
    for (const m of missed.slice(0, 5)) {
      console.log(`     ${m.slug}  — ${m.reason || "no description"}`);
    }
  }

  writeFileSync(OUTPUT, JSON.stringify(hydrated, null, 2));
  console.log();
  console.log(`Wrote ${hydrated.length} candidates to ${OUTPUT}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
