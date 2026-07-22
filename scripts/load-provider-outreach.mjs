/**
 * Load providers into the provider_outreach pipeline.
 *
 * Usage:
 *   node scripts/load-provider-outreach.mjs --state NY
 *
 * Prerequisites: run migration 131_provider_outreach.sql first.
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const db = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const state = process.argv.includes("--state")
  ? process.argv[process.argv.indexOf("--state") + 1]
  : null;

if (!state) {
  console.error("Usage: node scripts/load-provider-outreach.mjs --state NY");
  process.exit(1);
}

async function run() {
  console.log(`Loading ${state} providers into provider_outreach...`);

  // 1. Fetch all active providers for this state
  const { data: providers, error: fetchErr } = await db
    .from("olera-providers")
    .select("provider_id, provider_name, provider_category, city, state, phone, email, website")
    .eq("deleted", false)
    .eq("state", state);

  if (fetchErr) {
    console.error("Failed to fetch providers:", fetchErr.message);
    process.exit(1);
  }

  console.log(`Found ${providers.length} active providers in ${state}`);

  // 2. Check which are already loaded (idempotent)
  const { data: existing } = await db
    .from("provider_outreach")
    .select("provider_id")
    .eq("state", state);

  const existingIds = new Set((existing || []).map((r) => r.provider_id));
  const toInsert = providers.filter((p) => !existingIds.has(p.provider_id));

  if (toInsert.length === 0) {
    console.log("All providers already loaded. Nothing to do.");
    return;
  }

  console.log(`${existingIds.size} already loaded, inserting ${toInsert.length} new rows...`);

  // 3. Insert in batches of 500
  const BATCH_SIZE = 500;
  let inserted = 0;

  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const batch = toInsert.slice(i, i + BATCH_SIZE).map((p) => ({
      provider_id: p.provider_id,
      provider_name: p.provider_name,
      provider_category: p.provider_category,
      city: p.city,
      state: p.state,
      phone: p.phone,
      email: p.email,
      website: p.website,
      status: "queued",
    }));

    const { error: insertErr } = await db
      .from("provider_outreach")
      .insert(batch);

    if (insertErr) {
      console.error(`Batch insert failed at offset ${i}:`, insertErr.message);
      process.exit(1);
    }

    inserted += batch.length;
    console.log(`  Inserted ${inserted}/${toInsert.length}`);
  }

  // 4. Summary
  const { count } = await db
    .from("provider_outreach")
    .select("id", { count: "exact", head: true })
    .eq("state", state);

  console.log(`\nDone. ${count} total ${state} providers in pipeline.`);

  // Category breakdown
  const { data: rows } = await db
    .from("provider_outreach")
    .select("provider_category")
    .eq("state", state);

  const cats = {};
  for (const r of rows || []) {
    cats[r.provider_category || "(none)"] = (cats[r.provider_category || "(none)"] || 0) + 1;
  }
  console.log("\nBy category:");
  for (const [cat, n] of Object.entries(cats).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat}: ${n}`);
  }
}

run().catch((e) => console.error(e));
