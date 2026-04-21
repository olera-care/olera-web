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

// --- Step 2: resolve slugs → provider_id and pull the directory row ---
//
// olera-providers does not have a "slug" column. Provider pages resolve the
// slug via a combination of provider_name + provider_id suffix, so the
// reliable way to hydrate a candidate is to fetch by provider_id. But the GSC
// CSV only has the URL slug. We use business_profiles.slug (when claimed)
// or the pattern-based match on olera-providers.
//
// The app's slug convention for directory listings is:
//   toSlug(provider_name)-<id-suffix>
// We rely on a name-match lookup per candidate batch. That's imperfect for
// duplicates, so when multiple rows match we keep the one whose generated
// slug matches the GSC slug exactly.
async function hydrateFromSupabase(gscRows) {
  const hydrated = [];
  const missed = [];
  const BATCH = 25;

  for (let i = 0; i < gscRows.length; i += BATCH) {
    const batch = gscRows.slice(i, i + BATCH);
    const results = await Promise.allSettled(
      batch.map((row) => resolveOne(row))
    );
    for (let j = 0; j < results.length; j++) {
      const r = results[j];
      if (r.status === "fulfilled" && r.value) {
        hydrated.push(r.value);
      } else {
        missed.push({ ...batch[j], reason: r.status === "rejected" ? String(r.reason) : "no_match" });
      }
    }
    const progress = Math.min(i + BATCH, gscRows.length);
    process.stdout.write(
      `\r  Hydrating: ${progress}/${gscRows.length} (hit=${hydrated.length} miss=${missed.length})`
    );
  }
  console.log();
  return { hydrated, missed };
}

async function resolveOne(gscRow) {
  // The slug embeds a dash-delimited normalization of provider_name.
  // We reverse-engineer a name search with ILIKE to find likely matches,
  // then pick the one whose generated slug matches.
  // Slug -> name hint: "regency-at-troy" -> "regency at troy"
  const nameHint = gscRow.slug.replace(/-/g, " ");
  const { data, error } = await supabase
    .from("olera-providers")
    .select(
      "provider_id, provider_name, provider_category, main_category, city, state, google_rating, google_reviews_data, ai_trust_signals, lower_price, upper_price, provider_description"
    )
    .not("deleted", "is", true)
    .ilike("provider_name", `%${nameHint.split(" ").slice(0, 3).join(" ")}%`)
    .limit(25);
  if (error || !data || data.length === 0) return null;
  // Pick row whose generated slug matches the GSC slug exactly.
  const match = data.find((row) => toSlug(row.provider_name) === gscRow.slug);
  const chosen = match || data[0];
  if (!chosen.provider_description) return null; // can't rewrite what's empty
  return {
    provider_id: chosen.provider_id,
    provider_name: chosen.provider_name,
    provider_category: chosen.provider_category,
    main_category: chosen.main_category,
    city: chosen.city,
    state: chosen.state,
    google_rating: chosen.google_rating,
    google_review_count: chosen.google_reviews_data?.review_count ?? null,
    lower_price: chosen.lower_price,
    upper_price: chosen.upper_price,
    original_description: chosen.provider_description,
    gsc_slug: gscRow.slug,
    gsc_page: gscRow.page,
    impressions_current: gscRow.impressions_current,
    clicks_current: gscRow.clicks_current,
    position_current: gscRow.position_current,
    ctr_current: gscRow.impressions_current > 0 ? gscRow.clicks_current / gscRow.impressions_current : 0,
    slug_matched_exactly: !!match,
  };
}

// Must mirror the slug-generation convention used by the app for directory
// URLs. If this drifts, we lose candidates. See lib/utils/slug.ts in the
// olera-web repo if you need to cross-reference.
function toSlug(name) {
  return String(name || "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function main() {
  console.log("=== Candidate selection ===");
  console.log(`CSV:             ${CSV_PATH}`);
  console.log(`Min impressions: ${MIN_IMPRESSIONS}`);
  console.log(`Limit:           ${LIMIT}`);
  console.log();

  console.log("1. Reading GSC pages-movement CSV...");
  const gscRows = await readGSCRows();
  console.log(`   ${gscRows.length} /provider/ URLs at >=${MIN_IMPRESSIONS} impressions`);
  const sliced = gscRows.slice(0, LIMIT);
  console.log(`   Taking top ${sliced.length} by impressions`);

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

  const exactSlug = hydrated.filter((h) => h.slug_matched_exactly).length;
  console.log(`   Exact slug match:  ${exactSlug}/${hydrated.length}`);

  writeFileSync(OUTPUT, JSON.stringify(hydrated, null, 2));
  console.log();
  console.log(`Wrote ${hydrated.length} candidates to ${OUTPUT}`);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
