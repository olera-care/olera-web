#!/usr/bin/env node
/**
 * One-shot backfill: deactivate business_profiles whose linked
 * olera-providers row is soft-deleted.
 *
 * Run with --dry-run first to preview the change.
 *
 *   node scripts/backfill-deleted-provider-bps.mjs --dry-run
 *   node scripts/backfill-deleted-provider-bps.mjs
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in env.
 * Idempotent: re-running flips nothing if no new deletes happened.
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const DRY_RUN = process.argv.includes("--dry-run");
const db = createClient(url, key, { auth: { persistSession: false } });

// 1. Page through every deleted olera-providers provider_id.
const deletedIds = [];
let from = 0;
const pageSize = 1000;
while (true) {
  const { data, error } = await db
    .from("olera-providers")
    .select("provider_id")
    .eq("deleted", true)
    .order("provider_id", { ascending: true })
    .range(from, from + pageSize - 1);
  if (error) {
    console.error("olera-providers fetch failed:", error);
    process.exit(1);
  }
  if (!data || data.length === 0) break;
  deletedIds.push(...data.map((r) => r.provider_id));
  if (data.length < pageSize) break;
  from += pageSize;
}
console.log(`Found ${deletedIds.length} olera-providers rows with deleted=true`);

// 2. For each batch, find still-active BPs and deactivate.
const batchSize = 500;
let scanned = 0;
let toDeactivate = 0;
let deactivated = 0;
const examples = [];

for (let i = 0; i < deletedIds.length; i += batchSize) {
  const batch = deletedIds.slice(i, i + batchSize);

  const { data: rows, error: scanError } = await db
    .from("business_profiles")
    .select("id, slug, display_name, city, state, claim_state, is_active, source_provider_id")
    .in("source_provider_id", batch)
    .eq("is_active", true);
  if (scanError) {
    console.error("business_profiles scan failed:", scanError);
    process.exit(1);
  }
  scanned += rows?.length ?? 0;
  if (!rows || rows.length === 0) continue;

  toDeactivate += rows.length;
  for (const r of rows) {
    if (examples.length < 20) examples.push(r);
  }

  if (!DRY_RUN) {
    const ids = rows.map((r) => r.id);
    const { error: updateError } = await db
      .from("business_profiles")
      .update({ is_active: false })
      .in("id", ids);
    if (updateError) {
      console.error("business_profiles update failed:", updateError);
      process.exit(1);
    }
    deactivated += ids.length;
  }
}

console.log(`Scanned ${scanned} active business_profiles linked to deleted OPs`);
console.log(`${DRY_RUN ? "Would deactivate" : "Deactivated"}: ${DRY_RUN ? toDeactivate : deactivated}`);
console.log("\nAffected rows (up to 20):");
for (const ex of examples) {
  const claimMarker = ex.claim_state === "claimed" ? " [CLAIMED]" : "";
  console.log(`  ${ex.display_name} — ${ex.city}, ${ex.state} → /provider/${ex.slug}${claimMarker}`);
}
if (DRY_RUN) console.log("\n(dry run — re-run without --dry-run to apply)");
