/**
 * Yelp Fusion API Coverage Test for Senior Care Providers
 *
 * PURPOSE: Test how well Yelp covers our provider categories
 * USAGE:  npx tsx scripts/test-yelp-coverage.ts
 *
 * PREREQUISITES:
 *   1. Add YELP_API_KEY to .env.local
 *   2. Get a key at https://www.yelp.com/developers/v3/manage_app
 *
 * NOTE: Starter plan = 300 calls/day. This script makes ~50 calls.
 */

import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const YELP_API_KEY = process.env.YELP_API_KEY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const CATEGORIES_TO_TEST = [
  "Home Care (Non-medical)",
  "Assisted Living Facility",
  "Memory Care Facility",
  "Nursing Home",
];

const SAMPLE_PER_CATEGORY = 13; // ~50 total (13 * 4 = 52)

const YELP_MATCH_URL = "https://api.yelp.com/v3/businesses/matches";
const YELP_SEARCH_URL = "https://api.yelp.com/v3/businesses/search";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ProviderSample {
  provider_id: string;
  provider_name: string;
  provider_category: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zipcode: number | null;
  phone: string | null;
  google_rating: number | null;
}

interface YelpBusiness {
  id: string;
  name: string;
  rating: number;
  review_count: number;
  url: string;
  categories: { alias: string; title: string }[];
}

interface MatchResult {
  provider: ProviderSample;
  matched: boolean;
  method: "business_match" | "search_fallback" | "none";
  yelp?: YelpBusiness;
}

// ---------------------------------------------------------------------------
// Yelp API helpers
// ---------------------------------------------------------------------------

async function yelpFetch(url: string, params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`${url}?${qs}`, {
    headers: { Authorization: `Bearer ${YELP_API_KEY}` },
  });

  // Log rate-limit headers
  const remaining = res.headers.get("RateLimit-Remaining");
  if (remaining) {
    console.log(`  [rate-limit] ${remaining} calls remaining today`);
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Yelp API ${res.status}: ${body}`);
  }
  return res.json();
}

/**
 * Try Business Match first (exact name+address match).
 * If no match, fall back to Business Search (fuzzy term+location).
 */
async function findOnYelp(p: ProviderSample): Promise<MatchResult> {
  // --- Attempt 1: Business Match ---
  if (p.address && p.city && p.state) {
    try {
      const data = await yelpFetch(YELP_MATCH_URL, {
        name: p.provider_name,
        address1: p.address,
        city: p.city,
        state: p.state,
        country: "US",
        ...(p.zipcode ? { zip_code: String(p.zipcode) } : {}),
        ...(p.phone ? { phone: p.phone } : {}),
      });

      if (data.businesses?.length > 0) {
        return {
          provider: p,
          matched: true,
          method: "business_match",
          yelp: data.businesses[0],
        };
      }
    } catch (err) {
      console.warn(`  Match API error for "${p.provider_name}":`, (err as Error).message);
    }
  }

  // --- Attempt 2: Search fallback ---
  const location = [p.city, p.state].filter(Boolean).join(", ");
  if (location) {
    try {
      // Throttle slightly to stay under QPS limits
      await sleep(200);

      const data = await yelpFetch(YELP_SEARCH_URL, {
        term: p.provider_name,
        location,
        limit: "3",
        categories: "seniorcare,assistedliving,homecare,nursinghomes",
      });

      if (data.businesses?.length > 0) {
        // Check if top result name is a reasonable match
        const topName = data.businesses[0].name.toLowerCase();
        const queryName = p.provider_name.toLowerCase();
        if (
          topName.includes(queryName.slice(0, 15)) ||
          queryName.includes(topName.slice(0, 15))
        ) {
          return {
            provider: p,
            matched: true,
            method: "search_fallback",
            yelp: data.businesses[0],
          };
        }
      }
    } catch (err) {
      console.warn(`  Search API error for "${p.provider_name}":`, (err as Error).message);
    }
  }

  return { provider: p, matched: false, method: "none" };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  if (!YELP_API_KEY) {
    console.error("Missing YELP_API_KEY in .env.local");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  console.log("=== Yelp Fusion API Coverage Test ===\n");

  // Pull sample providers from each category
  const allSamples: ProviderSample[] = [];

  for (const category of CATEGORIES_TO_TEST) {
    const { data, error } = await supabase
      .from("olera-providers")
      .select("provider_id, provider_name, provider_category, address, city, state, zipcode, phone, google_rating")
      .eq("provider_category", category)
      .eq("deleted", false)
      .not("city", "is", null)
      .not("state", "is", null)
      .limit(SAMPLE_PER_CATEGORY);

    if (error) {
      console.error(`DB error for ${category}:`, error.message);
      continue;
    }

    console.log(`Sampled ${data.length} providers from "${category}"`);
    allSamples.push(...(data as ProviderSample[]));
  }

  console.log(`\nTotal sample size: ${allSamples.length}\n`);

  // Test each provider against Yelp
  const results: MatchResult[] = [];

  for (let i = 0; i < allSamples.length; i++) {
    const p = allSamples[i];
    console.log(`[${i + 1}/${allSamples.length}] ${p.provider_name} (${p.city}, ${p.state})`);

    const result = await findOnYelp(p);
    results.push(result);

    if (result.matched) {
      console.log(`  ✓ Matched via ${result.method} — rating: ${result.yelp!.rating}, reviews: ${result.yelp!.review_count}`);
    } else {
      console.log(`  ✗ No match`);
    }

    // Throttle to avoid QPS limits
    await sleep(300);
  }

  // ---------------------------------------------------------------------------
  // Report
  // ---------------------------------------------------------------------------

  console.log("\n" + "=".repeat(60));
  console.log("RESULTS SUMMARY");
  console.log("=".repeat(60));

  const matched = results.filter((r) => r.matched);
  const matchRate = ((matched.length / results.length) * 100).toFixed(1);

  console.log(`\nOverall match rate: ${matched.length}/${results.length} (${matchRate}%)`);

  if (matched.length > 0) {
    const avgRating = matched.reduce((sum, r) => sum + r.yelp!.rating, 0) / matched.length;
    const avgReviews = matched.reduce((sum, r) => sum + r.yelp!.review_count, 0) / matched.length;
    console.log(`Average Yelp rating: ${avgRating.toFixed(2)}`);
    console.log(`Average review count: ${avgReviews.toFixed(0)}`);
  }

  // Breakdown by category
  console.log("\n--- By Category ---");

  for (const category of CATEGORIES_TO_TEST) {
    const catResults = results.filter((r) => r.provider.provider_category === category);
    const catMatched = catResults.filter((r) => r.matched);

    if (catResults.length === 0) continue;

    const rate = ((catMatched.length / catResults.length) * 100).toFixed(0);
    const avgR = catMatched.length > 0
      ? (catMatched.reduce((s, r) => s + r.yelp!.rating, 0) / catMatched.length).toFixed(2)
      : "n/a";
    const avgC = catMatched.length > 0
      ? (catMatched.reduce((s, r) => s + r.yelp!.review_count, 0) / catMatched.length).toFixed(0)
      : "n/a";

    console.log(`  ${category}: ${catMatched.length}/${catResults.length} (${rate}%) — avg rating: ${avgR}, avg reviews: ${avgC}`);
  }

  // Breakdown by match method
  console.log("\n--- By Match Method ---");
  const byMatch = matched.filter((r) => r.method === "business_match").length;
  const bySearch = matched.filter((r) => r.method === "search_fallback").length;
  console.log(`  Business Match (exact): ${byMatch}`);
  console.log(`  Search fallback (fuzzy): ${bySearch}`);

  // Write raw results to JSON for further analysis
  const outPath = path.resolve(__dirname, "../tmp/yelp-coverage-results.json");
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`\nRaw results written to: ${outPath}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
