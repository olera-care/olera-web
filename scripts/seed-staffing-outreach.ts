/**
 * Seed Staffing Outreach Campaign
 *
 * Pulls home care providers from a partner university's catchment cities
 * and queues them into the staffing outreach pipeline so the admin team
 * can start working through them in /admin/staffing-outreach.
 *
 * Usage:
 *   npx tsx scripts/seed-staffing-outreach.ts --list                          # list available universities
 *   npx tsx scripts/seed-staffing-outreach.ts --university texas-am           # dry run
 *   npx tsx scripts/seed-staffing-outreach.ts --university texas-am --apply   # write to DB
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";
import {
  PARTNER_UNIVERSITIES,
  getUniversityBySlug,
  type PartnerUniversity,
} from "../lib/staffing-outreach/partner-universities";

// ── Env loading (no dotenv dependency, matches other scripts) ────────────

const envPath = resolve(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed
    .slice(eqIdx + 1)
    .trim()
    .replace(/^["']|["']$/g, "");
  if (!process.env[key]) process.env[key] = val;
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SERVICE_KEY);

// ── CLI args ─────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const apply = args.includes("--apply");
const list = args.includes("--list");
const universityIdx = args.indexOf("--university");
const universitySlug = universityIdx >= 0 ? args[universityIdx + 1] : null;

const CATEGORY = "Home Care (Non-medical)";
const PROFILE_COMPLETENESS_THRESHOLD = 0.8;

interface ProviderRow {
  provider_id: string;
  provider_name: string;
  slug: string | null;
  provider_description: string | null;
  website: string | null;
}

interface CityResult {
  city: string;
  state: string;
  count: number;
  providers: ProviderRow[];
  error?: string;
}

async function main() {
  if (list) {
    console.log("\nAvailable partner universities:\n");
    for (const u of PARTNER_UNIVERSITIES) {
      console.log(
        `  ${u.slug.padEnd(26)} ${u.name} (${u.city}, ${u.state})`,
      );
    }
    console.log("");
    return;
  }

  if (!universitySlug) {
    console.error(
      "Usage: npx tsx scripts/seed-staffing-outreach.ts --university <slug> [--apply]",
    );
    console.error("       npx tsx scripts/seed-staffing-outreach.ts --list");
    process.exit(1);
  }

  const university = getUniversityBySlug(universitySlug);
  if (!university) {
    console.error(`Unknown university slug: ${universitySlug}`);
    console.error("Run with --list to see available universities.");
    process.exit(1);
  }

  console.log(
    `\n=== Seed Staffing Outreach: ${university.name} ${apply ? "(APPLYING)" : "(DRY RUN)"} ===\n`,
  );
  console.log(`Catchment: ${university.catchment.length} cities`);
  console.log(`Category:  ${CATEGORY}\n`);

  // Step 1: Validate each catchment city has providers
  const cityResults = await fetchCityResults(university);
  const totalFound = cityResults.reduce((sum, r) => sum + r.count, 0);
  const citiesWithHits = cityResults.filter((r) => r.count > 0).length;

  console.log(
    `\nTotal: ${totalFound} providers found across ${citiesWithHits}/${cityResults.length} cities\n`,
  );

  if (totalFound === 0) {
    console.error(
      "No providers found. Check that TJ's enrichment pipeline has run for this catchment.",
    );
    process.exit(1);
  }

  // Step 2: Profile completeness sanity check
  const allProviders = cityResults.flatMap((r) => r.providers);
  const missingSlug = allProviders.filter((p) => !p.slug).length;
  const missingDescription = allProviders.filter(
    (p) => !p.provider_description,
  ).length;
  const completionPct = Math.round(
    (1 - Math.max(missingSlug, missingDescription) / totalFound) * 100,
  );

  console.log(`Profile completeness: ${completionPct}%`);
  if (missingSlug > 0) console.log(`  ${missingSlug} providers missing slug`);
  if (missingDescription > 0)
    console.log(`  ${missingDescription} providers missing description`);

  if (completionPct < PROFILE_COMPLETENESS_THRESHOLD * 100) {
    console.warn(
      `\n⚠ Less than ${PROFILE_COMPLETENESS_THRESHOLD * 100}% of providers have complete profiles.`,
    );
    console.warn(
      `  TJ's enrichment pipeline may not have finished for this catchment.`,
    );
    if (apply) {
      console.error(`  Aborting --apply. Re-run after enrichment completes.\n`);
      process.exit(1);
    }
    console.warn(`  Continuing in dry-run mode for visibility.\n`);
  }

  // Step 3: Existing-batch check
  const { data: existing } = await db
    .from("staffing_batches")
    .select("id, status, created_at")
    .eq("university_slug", university.slug)
    .eq("category", CATEGORY)
    .neq("status", "completed")
    .limit(1);

  if (existing && existing.length > 0) {
    console.warn(
      `\n⚠ An active batch already exists for this university+category: ${existing[0].id}`,
    );
    console.warn(`  Created ${existing[0].created_at}, status ${existing[0].status}.`);
    if (apply) {
      console.error(
        `  Aborting --apply. Mark the existing batch as completed (or paused) first.\n`,
      );
      process.exit(1);
    }
  }

  if (!apply) {
    console.log(
      `\nDry run complete. Re-run with --apply to write the batch.\n`,
    );
    return;
  }

  // Step 4: Create the batch
  const { data: batch, error: batchErr } = await db
    .from("staffing_batches")
    .insert({
      university_slug: university.slug,
      university_name: university.name,
      category: CATEGORY,
      catchment_cities: university.catchment,
      total_providers: totalFound,
    })
    .select("id")
    .single();

  if (batchErr || !batch) {
    console.error(`Failed to create batch: ${batchErr?.message ?? "no row returned"}`);
    process.exit(1);
  }

  console.log(`\nCreated batch ${batch.id}\n`);

  // Step 5: Queue all providers
  const now = new Date().toISOString();
  const rows = allProviders.map((p) => ({
    batch_id: batch.id,
    provider_id: p.provider_id,
    status: "queued",
    next_action_due_at: now,
  }));

  const CHUNK = 500;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK);
    const { error } = await db.from("staffing_outreach").insert(chunk);
    if (error) {
      console.error(`Insert failed at chunk ${i}: ${error.message}`);
      process.exit(1);
    }
    inserted += chunk.length;
    console.log(`  Queued ${inserted}/${rows.length}`);
  }

  console.log(`\n✓ Queued ${inserted} providers under batch ${batch.id}.`);
  console.log(`  University: ${university.name}`);
  console.log(
    `  Open /admin/staffing-outreach and pick "${university.name}" from the dropdown.\n`,
  );
}

async function fetchCityResults(
  university: PartnerUniversity,
): Promise<CityResult[]> {
  const results: CityResult[] = [];

  for (const { city, state } of university.catchment) {
    const { data, error } = await db
      .from("olera-providers")
      .select("provider_id, provider_name, slug, provider_description, website")
      .ilike("city", city)
      .ilike("state", state)
      .ilike("provider_category", CATEGORY)
      .or("deleted.is.null,deleted.eq.false");

    if (error) {
      console.error(`  ${city}, ${state}: ERROR — ${error.message}`);
      results.push({ city, state, count: 0, providers: [], error: error.message });
      continue;
    }

    const providers = (data ?? []) as ProviderRow[];
    const count = providers.length;
    results.push({ city, state, count, providers });

    const flag = count === 0 ? " ⚠ check spelling" : "";
    console.log(
      `  ${city.padEnd(24)} ${state}  ${String(count).padStart(4)} providers${flag}`,
    );
  }

  return results;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
