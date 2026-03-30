#!/usr/bin/env node

/**
 * Backfill source_provider_id for business_profiles records
 *
 * Finds business_profiles with source_provider_id IS NULL and type IN ('organization', 'caregiver')
 * and attempts to link them to olera-providers records by:
 *   1. Exact slug match
 *   2. Name + city + state match (case-insensitive)
 *
 * Usage:
 *   node scripts/backfill-source-provider-id.js          # Dry run (default)
 *   node scripts/backfill-source-provider-id.js --apply   # Apply changes
 */

require("dotenv").config({ path: ".env.local" });
const { createClient } = require("@supabase/supabase-js");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SERVICE_KEY in .env.local");
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SERVICE_KEY);
const dryRun = !process.argv.includes("--apply");

async function main() {
  console.log(`\n=== Backfill source_provider_id ${dryRun ? "(DRY RUN)" : "(APPLYING)"} ===\n`);

  // Fetch all unlinked provider profiles
  const { data: profiles, error } = await db
    .from("business_profiles")
    .select("id, slug, display_name, city, state, source_provider_id, account_id")
    .is("source_provider_id", null)
    .in("type", ["organization", "caregiver"])
    .not("account_id", "is", null);  // Only profiles with accounts (real users)

  if (error) {
    console.error("Failed to fetch profiles:", error.message);
    process.exit(1);
  }

  console.log(`Found ${profiles.length} unlinked business_profiles with accounts\n`);

  let matched = 0;
  let skippedNoMatch = 0;
  let skippedMultiMatch = 0;
  let errors = 0;

  for (const profile of profiles) {
    const { id, slug, display_name, city, state } = profile;

    // Strategy 1: Exact slug match
    const { data: slugMatch } = await db
      .from("olera-providers")
      .select("provider_id, provider_name")
      .eq("slug", slug)
      .is("deleted", null)
      .limit(2);

    if (slugMatch && slugMatch.length === 1) {
      matched++;
      console.log(`  MATCH (slug): "${display_name}" → ${slugMatch[0].provider_id} ("${slugMatch[0].provider_name}")`);
      if (!dryRun) {
        const { error: updateErr } = await db
          .from("business_profiles")
          .update({ source_provider_id: slugMatch[0].provider_id })
          .eq("id", id);
        if (updateErr) {
          console.error(`    ERROR updating: ${updateErr.message}`);
          errors++;
        }
      }
      continue;
    }

    // Strategy 2: Name + city + state match
    if (!display_name || !city || !state) {
      skippedNoMatch++;
      console.log(`  SKIP (no name/city/state): "${display_name}" [${city}, ${state}]`);
      continue;
    }

    const { data: nameMatch } = await db
      .from("olera-providers")
      .select("provider_id, provider_name")
      .ilike("provider_name", display_name)
      .ilike("city", city)
      .ilike("state", state)
      .is("deleted", null)
      .limit(3);

    if (!nameMatch || nameMatch.length === 0) {
      skippedNoMatch++;
      console.log(`  SKIP (0 matches): "${display_name}" [${city}, ${state}]`);
      continue;
    }

    if (nameMatch.length > 1) {
      skippedMultiMatch++;
      console.log(`  SKIP (${nameMatch.length} matches): "${display_name}" [${city}, ${state}]`);
      continue;
    }

    matched++;
    console.log(`  MATCH (name+city): "${display_name}" → ${nameMatch[0].provider_id} ("${nameMatch[0].provider_name}")`);
    if (!dryRun) {
      const { error: updateErr } = await db
        .from("business_profiles")
        .update({ source_provider_id: nameMatch[0].provider_id })
        .eq("id", id);
      if (updateErr) {
        console.error(`    ERROR updating: ${updateErr.message}`);
        errors++;
      }
    }
  }

  console.log(`\n=== Results ===`);
  console.log(`  Matched:           ${matched}`);
  console.log(`  Skipped (0 match): ${skippedNoMatch}`);
  console.log(`  Skipped (>1 match):${skippedMultiMatch}`);
  console.log(`  Errors:            ${errors}`);
  console.log(`  Total:             ${profiles.length}`);

  if (dryRun && matched > 0) {
    console.log(`\nRun with --apply to update ${matched} records.`);
  }
}

main().catch(console.error);
